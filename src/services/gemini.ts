export type PlantAnalysis = {
  isPlant: boolean;
  summary: string;
  visibleSigns: string[];
  possibleCauses: string[];
  recommendations: string[];
};

const MODEL = 'gemini-3.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_IMAGE_BASE64_LENGTH = 18 * 1024 * 1024;

// Expo подставляет значение из локального .env.local при сборке JS-бандла.
// В публичный Git-репозиторий ключ не добавляется.
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();

export const geminiConfigured = Boolean(API_KEY);

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean)
    : [];
}

function parseAnalysis(value: unknown): PlantAnalysis {
  if (!value || typeof value !== 'object') throw new Error('Gemini вернул некорректный ответ. Повторите попытку.');
  const result = value as Record<string, unknown>;
  if (typeof result.isPlant !== 'boolean' || typeof result.summary !== 'string') {
    throw new Error('Gemini вернул неполный ответ. Повторите попытку.');
  }
  return {
    isPlant: result.isPlant,
    summary: result.summary.trim(),
    visibleSigns: stringList(result.visibleSigns),
    possibleCauses: stringList(result.possibleCauses),
    recommendations: stringList(result.recommendations),
  };
}

export async function analyzePlantPhoto(imageBase64: string, notes: string): Promise<PlantAnalysis> {
  if (!API_KEY) throw new Error('Ключ Gemini не настроен. Добавьте EXPO_PUBLIC_GEMINI_API_KEY в .env.local и перезапустите Expo.');
  if (!imageBase64) throw new Error('Сначала выберите фотографию растения.');
  if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) throw new Error('Фотография слишком большая. Выберите снимок меньшего размера.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [
          { text: `Ты помощник по уходу за растениями. Проанализируй видимые признаки на фотографии. Заметки пользователя: ${notes.trim() || 'нет'}. Не выдумывай признаки, которых не видно. Если на фото нет растения, установи isPlant=false. Возможные причины перечисляй только как гипотезы, не ставь окончательный диагноз. Дай безопасные, практичные следующие шаги. Ответь по-русски.` },
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
        ] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 700,
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            properties: {
              isPlant: { type: 'boolean' },
              summary: { type: 'string' },
              visibleSigns: { type: 'array', items: { type: 'string' } },
              possibleCauses: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'array', items: { type: 'string' } },
            },
            required: ['isPlant', 'summary', 'visibleSigns', 'possibleCauses', 'recommendations'],
          },
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 400 || response.status === 401 || response.status === 403) throw new Error('Gemini отклонил ключ или запрос. Проверьте ключ и доступ к модели.');
      if (response.status === 429) throw new Error('Лимит запросов Gemini исчерпан. Попробуйте позже.');
      if (response.status >= 500) throw new Error('Сервис Gemini временно недоступен. Попробуйте позже.');
      throw new Error(`Gemini не ответил (HTTP ${response.status}).`);
    }

    const payload: unknown = await response.json();
    const candidates = (payload as { candidates?: { content?: { parts?: { text?: string }[] } }[] }).candidates;
    const text = candidates?.[0]?.content?.parts?.map(part => part.text ?? '').join('').trim();
    if (!text) throw new Error('Gemini не смог проанализировать этот снимок. Попробуйте другое фото.');
    return parseAnalysis(JSON.parse(text));
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Gemini отвечает слишком долго. Проверьте интернет и попробуйте снова.');
    if (error instanceof SyntaxError) throw new Error('Не удалось прочитать ответ Gemini. Повторите попытку.');
    if (error instanceof TypeError) throw new Error('Нет соединения с Gemini. Проверьте интернет.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
