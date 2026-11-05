import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { analyzePlantPhoto, geminiConfigured, PlantAnalysis } from '../services/gemini';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Diagnosis'>;
type Photo = { uri: string; base64: string };

export default function DiagnosisScreen({ navigation }: Props) {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<PlantAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickPhoto = async (source: 'camera' | 'gallery') => {
    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Нет доступа', source === 'camera' ? 'Разрешите доступ к камере в настройках телефона.' : 'Разрешите доступ к фотографиям в настройках телефона.');
        return;
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, base64: true, allowsEditing: source === 'camera' };
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.base64) throw new Error('Не удалось прочитать снимок. Попробуйте другую фотографию.');
      setPhoto({ uri: asset.uri, base64: asset.base64 });
      setAnalysis(null);
      setError('');
    } catch (cause) {
      Alert.alert('Ошибка фотографии', cause instanceof Error ? cause.message : 'Не удалось открыть фотографию.');
    }
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(current => current.includes(symptom) ? current.filter(item => item !== symptom) : [...current, symptom]);
    setAnalysis(null);
    setError('');
  };

  const analyze = async () => {
    if (!photo || loading) return;
    setLoading(true);
    setError('');
    setAnalysis(null);
    try {
      const context = [notes.trim(), selectedSymptoms.length ? `Отмеченные признаки: ${selectedSymptoms.join(', ')}.` : ''].filter(Boolean).join('\n');
      setAnalysis(await analyzePlantPhoto(photo.base64, context));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось выполнить анализ.');
    } finally {
      setLoading(false);
    }
  };

  const saveAsObservation = () => {
    if (!photo || !analysis) return;
    const aiNote = `AI-подсказка (не окончательный диагноз): ${analysis.summary}\nВозможные причины: ${analysis.possibleCauses.join('; ') || 'не определены'}.`;
    navigation.navigate('AddPlant', { initialImageUri: photo.uri, initialNote: [notes.trim(), aiNote].filter(Boolean).join('\n\n') });
  };

  return <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <View style={styles.modeRow}><View style={styles.modePill}><Ionicons name="sparkles-outline" size={16} color="#FFF" /><Text style={styles.modeText}>GEMINI · ФОТОРАЗБОР</Text></View><Text style={styles.modeHint}>AI-подсказка</Text></View>
    <Text style={styles.title}>Анализ растения <Ionicons name="leaf-outline" size={27} color={theme.colors.tomato} /></Text>
    <Text style={styles.subtitle}>Сфотографируйте лист, стебель или плод. Расскажите, какие изменения вы заметили.</Text>
    <View style={styles.photoTip}><View style={styles.photoTipIcon}><Ionicons name="bulb-outline" size={22} color="#A74427" /></View><View style={{ flex: 1 }}><Text style={styles.photoTipTitle}>Совет перед съёмкой</Text><Text style={styles.photoTipText}>Снимайте с двух сторон при дневном свете. Чёткое фото поможет заметить больше признаков.</Text></View></View>
    {!geminiConfigured && <Text style={styles.warning}>Ключ Gemini не настроен в этой копии приложения. Добавьте EXPO_PUBLIC_GEMINI_API_KEY в .env.local и перезапустите Expo.</Text>}

    <View style={styles.photoCard}><View style={styles.photoBox}>
      {photo ? <Image source={{ uri: photo.uri }} style={styles.photo} /> : <><View style={styles.scanFrame}><View style={styles.cameraMark}><Ionicons name="scan-outline" size={31} color={theme.colors.leafDeep} /></View></View><Text style={styles.photoHint}>Ваш снимок появится здесь</Text><Text style={styles.photoSubhint}>Камера или галерея</Text></>}
    </View>
    <View style={styles.photoActions}><Pressable style={styles.cameraButton} onPress={() => { void pickPhoto('camera'); }} accessibilityRole="button"><Ionicons name="camera-outline" size={19} color="#FFF" /><Text style={styles.cameraButtonText}>{photo ? 'Сделать фото' : 'Камера'}</Text></Pressable><Pressable style={styles.galleryButton} onPress={() => { void pickPhoto('gallery'); }} accessibilityRole="button"><Ionicons name="images-outline" size={19} color={theme.colors.leaf} /><Text style={styles.galleryButtonText}>{photo ? 'Другое фото' : 'Галерея'}</Text></Pressable></View>
    </View>

    <View style={styles.symptomHeading}><Text style={styles.label}>Что вы заметили?</Text><Text style={styles.optional}>необязательно</Text></View>
    <TextInput value={notes} onChangeText={value => { setNotes(value); setAnalysis(null); }} placeholder="Например, желтеют нижние листья, полив раз в неделю" multiline maxLength={500} style={styles.input} />
    <View style={styles.symptomChips}>{symptomOptions.map(symptom => { const active = selectedSymptoms.includes(symptom); return <Pressable key={symptom} onPress={() => toggleSymptom(symptom)} style={[styles.symptomChip, active && styles.symptomChipActive]}><Ionicons name={active ? 'checkmark-circle' : 'add-circle-outline'} size={16} color={active ? '#FFF' : theme.colors.leaf} /><Text style={[styles.symptomText, active && styles.symptomTextActive]}>{symptom}</Text></Pressable>; })}</View>
    <Text style={styles.disclaimer}>Фото отправится в Gemini только после нажатия кнопки ниже. AI-подсказка может ошибаться и не заменяет диагноз специалиста.</Text>

    <Pressable onPress={() => { void analyze(); }} disabled={!photo || !geminiConfigured || loading} style={[styles.button, (!photo || !geminiConfigured || loading) && styles.buttonDisabled]} accessibilityRole="button">
      {loading ? <ActivityIndicator color="#FFF" /> : <><Ionicons name="scan-outline" size={20} color="#FFF" /><Text style={styles.buttonText}>Проанализировать фото</Text></>}
    </Pressable>
    {!!error && <Text style={styles.error}>{error}</Text>}

    {analysis && <View style={styles.result}>
      <Text style={styles.resultTag}>РЕЗУЛЬТАТ GEMINI · НЕ ОКОНЧАТЕЛЬНЫЙ ДИАГНОЗ</Text>
      <Text style={styles.resultTitle}>{analysis.isPlant ? 'Что видно на фото' : 'Растение не распознано'}</Text>
      <Text style={styles.summary}>{analysis.summary}</Text>
      {analysis.isPlant && <>
        <ResultList title="Видимые признаки" items={analysis.visibleSigns} />
        <ResultList title="Возможные причины" items={analysis.possibleCauses} />
        <ResultList title="Что сделать дальше" items={analysis.recommendations} />
        <Pressable style={styles.saveButton} onPress={saveAsObservation}><Ionicons name="save-outline" size={18} color={theme.colors.leaf} /><Text style={styles.saveText}>Сохранить как наблюдение</Text></Pressable>
      </>}
    </View>}
  </ScrollView>;
}

const symptomOptions = ['Желтеют листья', 'Пятна', 'Белый налёт', 'Листья вянут', 'Вредители'];

function ResultList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <View style={styles.list}><Text style={styles.listTitle}>{title}</Text>{items.map((item, index) => <View style={styles.listRow} key={`${title}-${index}`}><View style={styles.dot} /><Text style={styles.listItem}>{item}</Text></View>)}</View>;
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 42, backgroundColor: 'rgba(247,249,245,.84)', flexGrow: 1 },
  modeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 17 }, modePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.leafDeep }, modeText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: .5 }, modeHint: { color: theme.colors.muted, fontSize: 11, fontWeight: '700' },
  intro: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, introIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: theme.colors.tomatoPale },
  introBody: { flex: 1 },
  kicker: { color: theme.colors.tomato, fontSize: 9, letterSpacing: .9, fontWeight: '900', marginBottom: 4 },
  title: { color: theme.colors.ink, fontFamily: 'serif', fontSize: 30, lineHeight: 38, fontWeight: 'bold' },
  subtitle: { color: theme.colors.inkSoft, lineHeight: 21, fontSize: 13, marginTop: 8 },
  photoTip: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FFDBCF', borderRadius: 16, padding: 15, marginTop: 21, marginBottom: 20 }, photoTipIcon: { width: 39, height: 39, borderRadius: 20, backgroundColor: '#FFC1AA', alignItems: 'center', justifyContent: 'center' }, photoTipTitle: { color: theme.colors.ink, fontFamily: 'serif', fontWeight: 'bold', fontSize: 16 }, photoTipText: { color: '#783D29', fontSize: 12, lineHeight: 18, marginTop: 5 },
  disclaimer: { backgroundColor: '#EFF2EE', borderRadius: 12, color: theme.colors.inkSoft, padding: 13, lineHeight: 18, fontSize: 11, marginTop: 5 },
  warning: { backgroundColor: theme.colors.dangerPale, borderRadius: 13, color: theme.colors.danger, padding: 14, lineHeight: 20, marginTop: 12 },
  label: { color: theme.colors.ink, fontWeight: '900', marginTop: 19, marginBottom: 9 },
  photoCard: { backgroundColor: '#FFF', padding: 12, borderRadius: 20, shadowColor: theme.colors.leafDeep, shadowOpacity: .08, shadowRadius: 12, elevation: 3 },
  photoBox: { height: 245, backgroundColor: '#DDEEE1', borderRadius: 13, borderWidth: 1, borderColor: '#A9D7BA', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: { width: '100%', height: '100%' }, scanFrame: { width: 102, height: 102, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#A2D8B6', borderRadius: 18 }, cameraMark: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#C2E8D0', alignItems: 'center', justifyContent: 'center' },
  photoHint: { color: theme.colors.leafDeep, fontWeight: '900', marginTop: 10 }, photoSubhint: { color: theme.colors.inkSoft, fontSize: 12, marginTop: 4 },
  photoActions: { flexDirection: 'row', gap: 10, marginTop: 11 }, cameraButton: { flex: 1, minHeight: 48, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: theme.colors.leafDeep, borderRadius: 11 }, cameraButtonText: { color: '#FFF', fontWeight: '900' }, galleryButton: { flex: 1, minHeight: 48, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#EDF0EC', borderRadius: 11 }, galleryButtonText: { color: theme.colors.leaf, fontWeight: '900' },
  symptomHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, optional: { color: theme.colors.muted, fontSize: 11, marginTop: 18 },
  symptomChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13, marginBottom: 12 }, symptomChip: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 10, minHeight: 38, backgroundColor: '#EBEFEA', borderRadius: 19 }, symptomChipActive: { backgroundColor: theme.colors.leaf }, symptomText: { color: theme.colors.inkSoft, fontSize: 12, fontWeight: '800' }, symptomTextActive: { color: '#FFF' },
  input: { minHeight: 100, backgroundColor: theme.colors.paper, borderColor: theme.colors.line, borderWidth: 1, borderRadius: 13, padding: 14, textAlignVertical: 'top', color: theme.colors.ink },
  button: { backgroundColor: theme.colors.leafDeep, borderRadius: 13, padding: 16, marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, minHeight: 56 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  error: { color: '#AD3935', marginTop: 14, fontWeight: '700', lineHeight: 20 },
  result: { backgroundColor: theme.colors.paper, borderRadius: 17, padding: 18, marginTop: 24, borderColor: theme.colors.line, borderWidth: 1 },
  resultTag: { color: theme.colors.tomato, fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },
  resultTitle: { color: theme.colors.ink, fontSize: 21, fontWeight: '900', marginTop: 10 },
  summary: { color: theme.colors.inkSoft, lineHeight: 22, marginTop: 8 },
  list: { marginTop: 18 },
  listTitle: { color: theme.colors.ink, fontSize: 16, fontWeight: '900', marginBottom: 7 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.tomato, marginTop: 7 },
  listItem: { flex: 1, color: theme.colors.inkSoft, lineHeight: 20 },
  saveButton: { borderWidth: 1, borderColor: theme.colors.leaf, borderRadius: 11, padding: 14, marginTop: 22, flexDirection: 'row', justifyContent: 'center', gap: 8, alignItems: 'center', minHeight: 48 },
  saveText: { color: theme.colors.leaf, fontWeight: '900' },
});
