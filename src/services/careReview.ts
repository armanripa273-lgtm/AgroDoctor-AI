import { File } from 'expo-file-system';
import { Observation, Plant, PlantCareInsight, PlantCareReview } from '../types';
import { getCareReview, saveCareReview } from './storage';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
const MODEL = 'gemini-3.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const responseSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    insights: { type: 'array', items: {
      type: 'object',
      properties: {
        plantId: { type: 'string' },
        plantName: { type: 'string' },
        status: { type: 'string', enum: ['ok', 'watch', 'attention'] },
        observationDate: { type: 'string' },
        explanation: { type: 'string' },
        recommendation: { type: 'string' },
      },
      required: ['plantId', 'plantName', 'status', 'observationDate', 'explanation', 'recommendation'],
    } },
  },
  required: ['summary', 'insights'],
};

const systemInstruction = `Ты AgroDoctor AI и автоматически проверяешь новые наблюдения за растениями. Используй только факты из переданных карточек, заметок, состояний и фотографий. Не выдумывай поливы, даты, сухость почвы, симптомы и историю.
Если в записях или на снимке есть явные признаки увядания вместе с сухой почвой/упоминанием пропущенного полива, можешь осторожно сказать, что растению может требоваться полив. Не советуй поливать только из-за прошедшего времени: сначала попроси проверить влажность почвы. Если данных мало — скажи это открыто.
Для каждого растения верни status ok, watch (нужно наблюдать/уточнить) или attention (есть конкретный симптом, требующий скорой проверки). Давай безопасные бытовые рекомендации, не назначай химикаты и не утверждай диагноз. Ответ должен быть кратким и на русском языке.`;

function validInsight(value: unknown, plants: Plant[]): PlantCareInsight | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const plant = plants.find(candidate => candidate.id === item.plantId);
  if (!plant || !['ok', 'watch', 'attention'].includes(String(item.status))) return null;
  return {
    plantId: plant.id,
    plantName: plant.name,
    status: item.status as PlantCareInsight['status'],
    observationDate: typeof item.observationDate === 'string' ? item.observationDate : '',
    explanation: typeof item.explanation === 'string' ? item.explanation.slice(0, 360) : '',
    recommendation: typeof item.recommendation === 'string' ? item.recommendation.slice(0, 360) : '',
  };
}

export async function reviewPlantObservations(plants: Plant[], observations: Observation[]): Promise<PlantCareReview> {
  if (!API_KEY) throw new Error('Gemini не настроен. Добавь ключ в .env.local.');
  const sorted = [...observations].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
  const plantIds = new Set(sorted.map(item => item.plantId));
  const relevantPlants = plants.filter(item => plantIds.has(item.id));
  const snapshot = {
    currentLocalTime: new Date().toLocaleString('ru-RU'),
    plants: relevantPlants.map(({ id, name, species }) => ({ id, name, species })),
    observations: sorted.map(({ id, plantId, date, note, condition }) => ({ id, plantId, date, note: note.slice(0, 500), condition })),
  };

  // Send up to two of the newest saved observation photos. GPS and account data are deliberately excluded.
  const photoObservations = sorted.filter(item => !!item.imageUri).slice(0, 2);
  const parts: Array<Record<string, unknown>> = [{ text: `Сделай проактивную сводку по состоянию растений по этим наблюдениям. Верни один короткий вывод и отдельную карточку для каждого растения с наблюдениями. Никаких действий с данными не выполняй.\n${JSON.stringify(snapshot)}` }];
  for (const observation of photoObservations) {
    try {
      const file = new File(observation.imageUri!);
      const base64 = await file.base64();
      if (!base64 || file.size > 6_000_000) continue;
      const mimeType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ? file.type : 'image/jpeg';
      parts.push({ text: `Фото наблюдения от ${observation.date} для растения ${plants.find(item => item.id === observation.plantId)?.name ?? 'без названия'}:` });
      parts.push({ inlineData: { mimeType, data: base64 } });
    } catch {
      // Some old gallery URIs may no longer be readable; the written observation remains usable.
    }
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1000, responseMimeType: 'application/json', responseJsonSchema: responseSchema },
    }),
  });
  if (!response.ok) {
    if (response.status === 429) throw new Error('Лимит запросов Gemini достигнут. Повтори проверку позже.');
    if ([400, 401, 403].includes(response.status)) throw new Error('Gemini отклонил запрос. Проверь ключ API и подключение.');
    throw new Error(`Gemini сейчас недоступен (HTTP ${response.status}).`);
  }
  const payload: any = await response.json();
  const output = payload.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? '').join('').trim();
  if (!output) throw new Error('Gemini не вернул сводку. Повтори проверку позже.');
  const parsed = JSON.parse(output) as { summary?: unknown; insights?: unknown };
  const insights = Array.isArray(parsed.insights) ? parsed.insights.map(item => validInsight(item, relevantPlants)).filter((item): item is PlantCareInsight => item !== null) : [];
  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 600) : 'Сводка по наблюдениям готова.',
    insights,
  };
}

const pendingReviews = new Map<string, Promise<PlantCareReview | null>>();

export function refreshPlantCareReview(plants: Plant[], observations: Observation[], force = false): Promise<PlantCareReview | null> {
  if (!plants.length || !observations.length) return Promise.resolve(null);
  const signature = JSON.stringify({ plants: plants.map(plant => [plant.id, plant.name, plant.species]), observations: observations.slice(0, 15).map(item => [item.id, item.date, item.note, item.condition]) });
  const pending = pendingReviews.get(signature);
  if (pending) return pending;
  const task = (async () => {
    const cached = await getCareReview();
    const isFresh = cached?.signature === signature && Date.now() - new Date(cached.checkedAt).getTime() < 12 * 60 * 60 * 1000;
    if (!force && isFresh && cached) return cached.review;
    const review = await reviewPlantObservations(plants, observations);
    await saveCareReview({ signature, checkedAt: new Date().toISOString(), review });
    return review;
  })();
  pendingReviews.set(signature, task);
  void task.finally(() => pendingReviews.delete(signature)).catch(() => undefined);
  return task;
}
