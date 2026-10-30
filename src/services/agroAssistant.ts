import { AssistantAction, AssistantResponse, Disease, Observation, Plant, PlantReminder } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
const MODEL = 'gemini-3.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

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
  const allowed = ['none', 'navigate', 'create_plant', 'create_reminder', 'save_observation', 'update_plant', 'delete_plant'];
  if (typeof action.type !== 'string' || !allowed.includes(action.type)) return { type: 'none' };
  return action as AssistantAction;
}

export async function askAgroAssistant(message: string, history: ChatTurn[], context: Context, imageBase64?: string): Promise<AssistantResponse> {
  if (!API_KEY) throw new Error('Gemini не настроен в этой копии приложения.');
  const safeContext = {
    plants: context.plants.map(({ id, name, species }) => ({ id, name, species })),
    recentObservations: context.observations.slice(0, 20).map(({ plantId, date, note, condition }) => ({ plantId, date, note: note.slice(0, 500), condition })),
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
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.3, maxOutputTokens: 800, responseMimeType: 'application/json', responseJsonSchema: assistantSchema },
    }),
  });
  if (!response.ok) {
    if (response.status === 429) throw new Error('Лимит запросов Gemini достигнут. Попробуй позже.');
    if (response.status === 400 || response.status === 401 || response.status === 403) throw new Error('Gemini отклонил запрос. Проверь ключ и подключение к интернету.');
    throw new Error(`Gemini временно недоступен (HTTP ${response.status}).`);
  }
  const payload: any = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? '').join('').trim();
  if (!text) throw new Error('Gemini не сформировал ответ. Попробуй переформулировать вопрос.');
  const parsed = JSON.parse(text) as { reply?: unknown; action?: unknown };
  if (typeof parsed.reply !== 'string') throw new Error('Gemini вернул ответ в неизвестном формате.');
  return { reply: parsed.reply, action: validateAction(parsed.action) };
}
