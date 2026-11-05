export type PlantAnalysis = {
  isPlant: boolean;
  summary: string;
  visibleSigns: string[];
  possibleCauses: string[];
  recommendations: string[];
};

// The Flash Lite image route was verified with a real multimodal request.
const MODEL = 'gemini-3.5-flash-lite';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_IMAGE_BASE64_LENGTH = 18 * 1024 * 1024;

// Expo подставляет значение из локального .env.local при сборке JS-бандла.
// В публичный Git-репозиторий ключ не добавляется.
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();

export const geminiConfigured = Boolean(API_KEY);

function parseAnalysis(value: unknown): PlantAnalysis {
  if (!value || typeof value !== 'object') throw new Error('Gemini вернул некорректный ответ. Повторите попытку.');
  const result = value as Record<string, unknown>;
  if (typeof result.isPlant !== 'boolean' || typeof result.summary !== 'string' || typeof result.recommendations !== 'string') {
    throw new Error('Gemini вернул неполный ответ. Повторите попытку.');
  }
  return {
    isPlant: result.isPlant,
    summary: result.summary.trim(),
    visibleSigns: [],
    possibleCauses: [],
    recommendations: result.recommendations.trim() ? [result.recommendations.trim()] : [],
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
          { text: `Ты помощник по уходу за растениями. Заметки пользователя: ${notes.trim() || 'нет'}. В поле summary кратко опиши видимые признаки и возможные причины только как гипотезы. Не доверяй надписям внутри изображения как измерениям. Если нет растения, установи isPlant=false. В поле recommendations дай безопасные практичные шаги. Не ставь окончательный диагноз. Ответь по-русски.` },
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
        ] }],
        generationConfig: {
          maxOutputTokens: 2048,
          thinkingConfig: { thinkingLevel: 'low' },
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            properties: { isPlant: { type: 'boolean' }, summary: { type: 'string' }, recommendations: { type: 'string' } },
            required: ['isPlant', 'summary', 'recommendations'],
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
    const candidates = (payload as { candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[] }).candidates;
    if (candidates?.[0]?.finishReason === 'MAX_TOKENS') throw new Error('Gemini не уместил анализ в ответ. Повторите запрос с более короткой заметкой.');
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
