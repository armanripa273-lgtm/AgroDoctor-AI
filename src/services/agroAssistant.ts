import { AssistantAction, AssistantResponse, Disease, Observation, Plant, PlantReminder } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
const MODEL = 'gemini-3.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const IMAGE_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';

export type ChatTurn = { role: 'user' | 'model'; text: string };
type Context = { plants: Plant[]; observations: Observation[]; reminders: PlantReminder[]; diseases: Disease[] };

const actionSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['none', 'navigate', 'create_plant', 'create_reminder', 'save_observation', 'update_plant', 'delete_plant'] },
    screen: { type: 'string', enum: ['Главная', 'Сервисы', 'Растения', 'Каталог', 'Профиль', 'Напоминания', 'AI-анализ'] },
    plantId: { type: 'string' },
    plantName: { type: 'string' },
    name: { type: 'string' },
    species: { type: 'string' },
    title: { type: 'string' },
    body: { type: 'string' },
    note: { type: 'string' },
    condition: { type: 'string', enum: ['Наблюдение', 'Стабильно', 'Требует внимания'] },
    minutesFromNow: { type: 'integer' },
    dailyHour: { type: 'integer' },
    dailyMinute: { type: 'integer' },
  },
  required: ['type'],
};

const assistantSchema = {
  type: 'object',
  properties: { reply: { type: 'string' }, action: actionSchema },
  required: ['reply', 'action'],
};

const systemPrompt = `Ты AgroDoctor AI — русскоязычный помощник по уходу за растениями внутри мобильного приложения. Отвечай коротко и понятно, опирайся на переданные данные пользователя и каталог. Не утверждай диагноз по тексту или фото как факт, указывай неопределённость и обращайся к агроному при серьёзных/быстро ухудшающихся симптомах.

Ты можешь предложить только одно действие из списка: none (обычный ответ), navigate (открыть раздел), create_plant (создать карточку растения), create_reminder (локальное напоминание), save_observation (добавить запись в историю), update_plant (изменить название/вид растения), delete_plant (удалить растение и его историю). Никогда не заявляй, что действие выполнено: приложение попросит пользователя подтвердить его. Не предлагай действие, если пользователь лишь задаёт вопрос. Для создания карточки нужны название и вид, если вид неизвестен — попроси уточнение. Для напоминания задай одно уточнение, если не ясны растение или время; поддерживаются одноразовый срок в минутах от текущего локального времени либо ежедневное время. Если пользователь просит «завтра в 9», вычисли срок в минутах от переданного текущего времени и не делай его ежедневным. Не создавай частые или опасные напоминания. Не пытайся менять email, пароль, ключи, авторизацию или настройки устройства. Если нужного растения нет в контексте, уточни его. Для действия верни корректные поля JSON; иначе type=none. Не включай точные GPS координаты, адреса, email и личные данные в ответ.`;

function validateAction(value: unknown): AssistantAction {
  if (!value || typeof value !== 'object') return { type: 'none' };
  const action = value as Record<string, unknown>;
  const allowed = ['none', 'navigate', 'create_plant', 'create_reminder', 'save_observation', 'update_plant', 'delete_plant'] as const;
  if (typeof action.type !== 'string' || !allowed.includes(action.type as typeof allowed[number])) return { type: 'none' };
  const read = (key: string, limit = 160) => typeof action[key] === 'string' ? (action[key] as string).trim().slice(0, limit) : undefined;
  const integer = (key: string) => typeof action[key] === 'number' && Number.isSafeInteger(action[key]) ? action[key] as number : undefined;
  const type = action.type as AssistantAction['type'];
  const screen = read('screen') as AssistantAction['screen'];
  if (type === 'navigate' && !['Главная', 'Сервисы', 'Растения', 'Каталог', 'Профиль', 'Напоминания', 'AI-анализ'].includes(screen ?? '')) return { type: 'none' };
  const condition = read('condition') as AssistantAction['condition'];
  return {
    type,
    screen: type === 'navigate' ? screen : undefined,
    plantId: read('plantId'), plantName: read('plantName'), name: read('name'), species: read('species'),
    title: read('title'), body: read('body', 500), note: read('note', 500),
    condition: ['Наблюдение', 'Стабильно', 'Требует внимания'].includes(condition ?? '') ? condition : undefined,
    minutesFromNow: integer('minutesFromNow'), dailyHour: integer('dailyHour'), dailyMinute: integer('dailyMinute'),
  };
}

export async function askAgroAssistant(message: string, history: ChatTurn[], context: Context, imageBase64?: string): Promise<AssistantResponse> {
  if (!API_KEY) throw new Error('Gemini не настроен в этой копии приложения.');
  if (imageBase64 && imageBase64.length > 18 * 1024 * 1024) throw new Error('Фото слишком большое. Выбери снимок меньшего размера.');
  const safeContext = {
    plants: context.plants.map(({ id, name, species }) => ({ id, name, species })),
    recentObservations: [...context.observations].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map(({ plantId, date, note, condition }) => ({ plantId, date, note: note.slice(0, 500), condition })),
    reminders: context.reminders.filter(item => item.active).map(({ id, plantId, plantName, title, scheduledAt, repeatDaily }) => ({ id, plantId, plantName, title, scheduledAt, repeatDaily })),
    diseaseCatalog: context.diseases.map(({ name, category, symptoms, advice }) => ({ name, category, symptoms, advice })),
    currentLocalTime: new Date().toLocaleString('ru-RU'),
  };
  const contents: Array<{ role: 'user' | 'model'; parts: Array<Record<string, unknown>> }> = [
    ...history.slice(-10).map(turn => ({ role: turn.role, parts: [{ text: turn.text }] })),
    { role: 'user', parts: [
      { text: `ДАННЫЕ ПРИЛОЖЕНИЯ (источник истины, не выдумывай отсутствующие записи):\n${JSON.stringify(safeContext)}\n\nСООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ:\n${message}` },
      ...(imageBase64 ? [{ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }] : []),
    ] },
  ];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
  const response = await fetch(imageBase64 ? IMAGE_ENDPOINT : ENDPOINT, {
    method: 'POST',
    signal: controller.signal,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: imageBase64 ? `${systemPrompt}\nДля ответа с приложенным фото верни обычный текст и не предлагай действия с данными.` : systemPrompt }] },
      contents,
      generationConfig: imageBase64
        ? { maxOutputTokens: 1600, thinkingConfig: { thinkingLevel: 'low' } }
        : { maxOutputTokens: 2048, thinkingConfig: { thinkingLevel: 'low' }, responseMimeType: 'application/json', responseJsonSchema: assistantSchema },
    }),
  });
  if (!response.ok) {
    if (response.status === 429) throw new Error('Лимит запросов Gemini достигнут. Попробуй позже.');
    if (response.status === 400 || response.status === 401 || response.status === 403) throw new Error('Gemini отклонил запрос. Проверь ключ и подключение к интернету.');
    throw new Error(`Gemini временно недоступен (HTTP ${response.status}).`);
  }
  const payload: any = await response.json();
  if (payload.candidates?.[0]?.finishReason === 'MAX_TOKENS') throw new Error('Gemini не уместил ответ. Спроси короче или начни новый вопрос.');
  const text = payload.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? '').join('').trim();
  if (!text) throw new Error('Gemini не сформировал ответ. Попробуй переформулировать вопрос.');
  if (imageBase64) return { reply: text, action: { type: 'none' } };
  let parsed: { reply?: unknown; action?: unknown };
  try { parsed = JSON.parse(text); } catch { throw new Error('Gemini вернул неполный ответ. Повтори вопрос.'); }
  if (typeof parsed.reply !== 'string') throw new Error('Gemini вернул ответ в неизвестном формате.');
  return { reply: parsed.reply, action: validateAction(parsed.action) };
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Gemini отвечает слишком долго. Проверь интернет и попробуй снова.');
    if (error instanceof TypeError) throw new Error('Нет соединения с Gemini. Проверь интернет.');
    throw error;
  } finally { clearTimeout(timeout); }
}
