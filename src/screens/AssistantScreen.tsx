import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, ScrollViewInstance, StyleSheet, Text, TextInput, View } from 'react-native';
import { diseases } from '../data/content';
import { askAgroAssistant, ChatTurn } from '../services/agroAssistant';
import { createLocalReminder, cancelLocalReminder } from '../services/reminders';
import { refreshPlantCareReview } from '../services/careReview';
import { deletePlant, getObservations, getPlants, getReminders, removeReminder, saveObservation, savePlant, updatePlant } from '../services/storage';
import { AssistantAction, AssistantResponse, Observation, Plant, PlantReminder } from '../types';
import { theme } from '../theme';

type Message = { id: string; role: 'user' | 'assistant'; text: string; action?: AssistantAction; completed?: boolean; imageUri?: string };
type AttachedPhoto = { uri: string; base64: string };

export default function AssistantScreen() {
  const navigation = useNavigation<any>();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [messages, setMessages] = useState<Message[]>([{ id: 'welcome', role: 'assistant', text: 'Привет! Я помогу разобраться с растениями, записями и напоминаниями. Можешь спросить, как они себя чувствуют, или попросить меня добавить наблюдение либо напоминание.' }]);
  const [draft, setDraft] = useState('');
  const [photo, setPhoto] = useState<AttachedPhoto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100); return () => clearTimeout(timer); }, [messages, loading]);

  const attachPhoto = () => Alert.alert('Добавить фото', 'Выбери источник фотографии.', [
    { text: 'Сфотографировать', onPress: () => { void pickPhoto('camera'); } },
    { text: 'Выбрать из галереи', onPress: () => { void pickPhoto('gallery'); } },
    { text: 'Отмена', style: 'cancel' },
  ]);

  const pickPhoto = async (source: 'camera' | 'gallery') => {
    try {
      const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return Alert.alert('Нет доступа', 'Разреши доступ к камере или фотографиям в настройках телефона.');
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, base64: true, allowsEditing: source === 'camera' };
      const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.base64) throw new Error('Не удалось прочитать фото. Попробуй другой снимок.');
      setPhoto({ uri: asset.uri, base64: asset.base64 });
    } catch (cause) { Alert.alert('Ошибка фото', cause instanceof Error ? cause.message : 'Не удалось открыть фото.'); }
  };

  const send = async (preset?: string) => {
    const text = (preset ?? draft).trim();
    if ((!text && !photo) || loading) return;
    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', text: text || 'Посмотри, пожалуйста, на это растение.', imageUri: photo?.uri };
    const prior = messages.filter(item => item.id !== 'welcome').map(item => ({ role: item.role === 'assistant' ? 'model' : 'user', text: item.text } as ChatTurn));
    setMessages(current => [...current, userMessage]);
    setDraft(''); setError(''); setLoading(true);
    const sentPhoto = photo;
    setPhoto(null);
    try {
      const [plants, observations, reminders] = await Promise.all([getPlants(), getObservations(), getReminders()]);
      const response = await askAgroAssistant(text || 'Проанализируй признаки растения на фото и подскажи безопасные следующие шаги.', prior, { plants, observations, reminders, diseases }, sentPhoto?.base64);
      setMessages(current => [...current, { id: `assistant-${Date.now()}`, role: 'assistant', text: response.reply, action: response.action.type === 'none' ? undefined : response.action }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось подключиться к помощнику.');
    } finally { setLoading(false); }
  };

  const applyAction = async (message: Message) => {
    const action = message.action;
    if (!action) return;
    try {
      if (action.type === 'navigate' && action.screen) {
        if (action.screen === 'Напоминания') navigation.navigate('Reminders');
        else if (action.screen === 'AI-анализ') navigation.navigate('Diagnosis');
        else navigation.navigate('Main', { screen: action.screen });
      } else if (action.type === 'create_plant') {
        if (!action.name?.trim() || !action.species?.trim()) throw new Error('Чтобы создать карточку, уточни название растения и его вид.');
        const plant: Plant = { id: `plant-${Date.now()}`, name: action.name.trim(), species: action.species.trim(), createdAt: new Date().toISOString() };
        await savePlant(plant);
        Alert.alert('Растение добавлено', `Создал карточку «${plant.name}».`);
      } else if (action.type === 'create_reminder') {
        const plant = findPlant(action, await getPlants());
        if (!action.title || (action.minutesFromNow == null && action.dailyHour == null)) throw new Error('Чтобы создать напоминание, уточни название и время.');
        if (action.minutesFromNow != null && (action.minutesFromNow < 1 || action.minutesFromNow > 525600)) throw new Error('Время напоминания должно быть в пределах года.');
        if (action.dailyHour != null && (action.dailyHour < 0 || action.dailyHour > 23 || (action.dailyMinute ?? 0) < 0 || (action.dailyMinute ?? 0) > 59)) throw new Error('Время ежедневного напоминания задано неверно.');
        const date = action.dailyHour != null ? new Date() : new Date(Date.now() + (action.minutesFromNow ?? 1) * 60_000);
        if (action.dailyHour != null) { date.setHours(action.dailyHour, action.dailyMinute ?? 0, 0, 0); }
        const reminder = await createLocalReminder({ plantId: plant?.id, plantName: plant?.name ?? action.plantName, title: action.title, body: action.body || 'Пора проверить растение и выполнить уход.', scheduledAt: date.toISOString(), repeatDaily: action.dailyHour != null });
        Alert.alert('Готово', `Напоминание «${reminder.title}» сохранено на этом телефоне.`);
      } else if (action.type === 'save_observation') {
        const plant = findPlant(action, await getPlants());
        if (!plant) throw new Error('Не удалось определить растение. Попроси ассистента уточнить его название.');
        const observation: Observation = { id: `obs-${Date.now()}`, plantId: plant.id, date: new Date().toISOString(), note: action.note || 'Запись добавлена через AI-чат.', condition: action.condition || 'Наблюдение' };
        await saveObservation(observation);
        void Promise.all([getPlants(), getObservations()]).then(([plants, observations]) => refreshPlantCareReview(plants, observations)).catch(() => undefined);
        Alert.alert('Сохранено', `Добавил наблюдение для «${plant.name}».`);
      } else if (action.type === 'update_plant') {
        const plant = findPlant(action, await getPlants());
        if (!plant) throw new Error('Не удалось определить растение для изменения.');
        const changes = { ...(action.name ? { name: action.name } : {}), ...(action.species ? { species: action.species } : {}) };
        if (!Object.keys(changes).length) throw new Error('Ассистент не указал, какие сведения изменить.');
        await updatePlant(plant.id, changes);
        Alert.alert('Обновлено', `Изменил карточку «${plant.name}».`);
      } else if (action.type === 'delete_plant') {
        const plant = findPlant(action, await getPlants());
        if (!plant) throw new Error('Не удалось определить растение для удаления.');
        const linked = (await getReminders()).filter(item => item.plantId === plant.id);
        for (const reminder of linked) { await cancelLocalReminder(reminder); await removeReminder(reminder.id); }
        await deletePlant(plant.id);
        Alert.alert('Растение удалено', `Карточка «${plant.name}», записи и связанные напоминания удалены с телефона.`);
      }
      setMessages(current => current.map(item => item.id === message.id ? { ...item, completed: true } : item));
    } catch (cause) { Alert.alert('Не получилось выполнить действие', cause instanceof Error ? cause.message : 'Повтори запрос.'); }
  };

  const confirmAction = (message: Message) => {
    const action = message.action;
    if (!action || action.type === 'none') return;
    const description = actionDescription(action);
    Alert.alert('Подтвердить действие?', description, [
      { text: 'Отмена', style: 'cancel', onPress: () => setMessages(current => current.map(item => item.id === message.id ? { ...item, completed: true } : item)) },
      { text: action.type === 'delete_plant' ? 'Продолжить' : 'Подтвердить', style: action.type === 'delete_plant' ? 'destructive' : 'default', onPress: () => { void applyAction(message); } },
    ]);
  };

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
    <View style={styles.header}><View style={styles.avatar}><Ionicons name="leaf" color="#FFF" size={20} /></View><View style={{ flex: 1 }}><Text style={styles.headerTitle}>AgroDoctor AI</Text><Text style={styles.headerSub}>Помощник по вашим растениям</Text></View><Pressable onPress={() => navigation.navigate('Reminders')} style={styles.headerButton}><Ionicons name="notifications-outline" size={22} color={theme.colors.plum} /></Pressable></View>
    <ScrollView ref={scrollRef} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
      <Text style={styles.privacy}>Ответы создаёт Gemini. Имена растений, заметки и каталог отправляются в Google для ответа; email, пароль и GPS не передаются.</Text>
      {messages.map(message => <View key={message.id} style={[styles.messageRow, message.role === 'user' && styles.userRow]}>
        <View style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
          {message.imageUri && <Image source={{ uri: message.imageUri }} style={styles.messagePhoto} />}
          {!!message.text && <Text style={[styles.messageText, message.role === 'user' && styles.userText]}>{message.text}</Text>}
          {message.action && <View style={styles.action}><Text style={styles.actionTitle}>{actionDescription(message.action)}</Text>{message.completed ? <Text style={styles.completed}>Готово</Text> : <Pressable onPress={() => confirmAction(message)} style={styles.confirm}><Text style={styles.confirmText}>Проверить и подтвердить</Text></Pressable>}</View>}
        </View>
      </View>)}
      {loading && <View style={[styles.bubble, styles.assistantBubble, styles.loading]}><ActivityIndicator color={theme.colors.leaf} /><Text style={styles.loadingText}>Смотрю данные…</Text></View>}
      {!!error && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
    {messages.length <= 1 && <View style={styles.quick}><Pressable onPress={() => { void send('Как сейчас дела у моих растений?') }}><Text style={styles.quickChip}>Сводка по растениям</Text></Pressable><Pressable onPress={() => { void send('Напомни полить моё растение завтра в 9:00') }}><Text style={styles.quickChip}>Создать напоминание</Text></Pressable></View>}
    {photo && <View style={styles.attachment}><Image source={{ uri: photo.uri }} style={styles.attachmentImage} /><Text style={styles.attachmentLabel}>Фото добавлено</Text><Pressable onPress={() => setPhoto(null)}><Ionicons name="close-circle" size={22} color="#728178" /></Pressable></View>}
    <View style={styles.composer}><Pressable onPress={attachPhoto} style={styles.attachButton}><Ionicons name="camera-outline" size={22} color={theme.colors.leaf} /></Pressable><TextInput value={draft} onChangeText={setDraft} placeholder="Спроси про растения или уход…" style={styles.input} multiline maxLength={1000} /><Pressable onPress={() => { void send(); }} disabled={loading || (!draft.trim() && !photo)} style={[styles.sendButton, (loading || (!draft.trim() && !photo)) && styles.sendDisabled]}><Ionicons name="arrow-up" size={22} color="#FFF" /></Pressable></View>
  </KeyboardAvoidingView>;
}

function findPlant(action: AssistantAction, plants: Plant[]) {
  return plants.find(plant => action.plantId && plant.id === action.plantId) || plants.find(plant => action.plantName && plant.name.toLocaleLowerCase('ru').includes(action.plantName.toLocaleLowerCase('ru')));
}

function actionDescription(action: AssistantAction) {
  if (action.type === 'navigate') return `Открыть раздел «${action.screen || 'Растения'}»`;
  if (action.type === 'create_plant') return `Создать карточку «${action.name || 'новое растение'}»${action.species ? ` · ${action.species}` : ''}`;
  if (action.type === 'create_reminder') return `Напоминание: ${action.title || 'уход за растением'}${action.minutesFromNow ? ` через ${action.minutesFromNow} мин.` : action.dailyHour != null ? ` ежедневно в ${String(action.dailyHour).padStart(2, '0')}:${String(action.dailyMinute ?? 0).padStart(2, '0')}` : ''}`;
  if (action.type === 'save_observation') return `Добавить наблюдение для «${action.plantName || 'растения'}»`;
  if (action.type === 'update_plant') return `Изменить карточку «${action.plantName || 'растения'}»`;
  if (action.type === 'delete_plant') return `Удалить карточку «${action.plantName || 'растения'}» и её историю`;
  return 'Действие';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'rgba(255,252,240,.28)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: theme.colors.paper, borderBottomWidth: 1, borderBottomColor: theme.colors.line },
  avatar: { width: 39, height: 39, borderRadius: 13, backgroundColor: theme.colors.leaf, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: theme.colors.ink, fontSize: 16, fontWeight: '900' }, headerSub: { color: '#728178', fontSize: 11, marginTop: 2 }, headerButton: { padding: 7, minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  messages: { padding: 15, gap: 12, flexGrow: 1 },
  privacy: { color: '#526657', fontSize: 11, lineHeight: 16, backgroundColor: theme.colors.sunflowerPale, borderLeftWidth: 3, borderLeftColor: theme.colors.sunflower, borderRadius: 10, padding: 11, marginBottom: 2 },
  messageRow: { alignItems: 'flex-start' }, userRow: { alignItems: 'flex-end' }, bubble: { maxWidth: '88%', borderRadius: 16, padding: 13 },
  assistantBubble: { backgroundColor: theme.colors.paper, borderTopLeftRadius: 5, borderWidth: 1, borderColor: theme.colors.line }, userBubble: { backgroundColor: theme.colors.leafDeep, borderTopRightRadius: 5 },
  messageText: { color: '#344D3E', fontSize: 14, lineHeight: 20 }, userText: { color: '#FFF' }, messagePhoto: { width: 210, height: 150, borderRadius: 10, marginBottom: 8 },
  action: { borderTopWidth: 1, borderTopColor: theme.colors.line, marginTop: 10, paddingTop: 10 }, actionTitle: { color: theme.colors.ink, fontWeight: '800', fontSize: 12, lineHeight: 17 }, confirm: { marginTop: 9, backgroundColor: theme.colors.cucumberPale, padding: 10, borderRadius: 9, alignItems: 'center', minHeight: 40, justifyContent: 'center' }, confirmText: { color: theme.colors.leaf, fontWeight: '900', fontSize: 12 }, completed: { color: theme.colors.leaf, fontWeight: '900', marginTop: 8 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 9 }, loadingText: { color: '#607568', fontSize: 13 }, error: { color: theme.colors.danger, backgroundColor: theme.colors.paper, padding: 12, borderRadius: 11 },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingBottom: 9 }, quickChip: { color: '#5E4A0E', backgroundColor: theme.colors.sunflowerPale, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 9, fontSize: 12, fontWeight: '800' },
  attachment: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 7 }, attachmentImage: { width: 38, height: 38, borderRadius: 8 }, attachmentLabel: { color: '#607568', flex: 1, fontSize: 12 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10, backgroundColor: theme.colors.paper, borderTopWidth: 1, borderTopColor: theme.colors.line }, attachButton: { width: 42, height: 44, alignItems: 'center', justifyContent: 'center' }, input: { flex: 1, maxHeight: 95, minHeight: 44, backgroundColor: '#F2F0E5', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10, color: theme.colors.ink }, sendButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: theme.colors.tomato, alignItems: 'center', justifyContent: 'center' }, sendDisabled: { opacity: 0.45 },
});
