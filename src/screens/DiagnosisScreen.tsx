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

  const choosePhoto = () => Alert.alert('Фотография растения', 'Откуда добавить снимок?', [
    { text: 'Сфотографировать', onPress: () => { void pickPhoto('camera'); } },
    { text: 'Выбрать из галереи', onPress: () => { void pickPhoto('gallery'); } },
    { text: 'Отмена', style: 'cancel' },
  ]);

  const analyze = async () => {
    if (!photo || loading) return;
    setLoading(true);
    setError('');
    setAnalysis(null);
    try {
      setAnalysis(await analyzePlantPhoto(photo.base64, notes));
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
    <View style={styles.intro}><Ionicons name="sparkles-outline" size={26} color={theme.colors.tomato} /><View style={styles.introBody}><Text style={styles.title}>AI-анализ растения</Text><Text style={styles.subtitle}>Gemini изучает фото и предлагает возможные причины и шаги по уходу.</Text></View></View>
    <Text style={styles.disclaimer}>Это подсказка, а не точный диагноз. Фотография отправится в Gemini только после нажатия «Проанализировать».</Text>
    {!geminiConfigured && <Text style={styles.warning}>Ключ Gemini не настроен в этой копии приложения. Добавьте EXPO_PUBLIC_GEMINI_API_KEY в .env.local и перезапустите Expo.</Text>}

    <Text style={styles.label}>Фотография</Text>
    <Pressable style={styles.photoBox} onPress={choosePhoto} accessibilityRole="button" accessibilityLabel="Выбрать или сделать фото растения">
      {photo ? <Image source={{ uri: photo.uri }} style={styles.photo} /> : <><Ionicons name="camera-outline" size={34} color={theme.colors.leaf} /><Text style={styles.photoHint}>Сфотографировать или выбрать фото</Text></>}
    </Pressable>
    {photo && <Pressable onPress={choosePhoto}><Text style={styles.changePhoto}>Выбрать другое фото</Text></Pressable>}

    <Text style={styles.label}>Что вы заметили? (необязательно)</Text>
    <TextInput value={notes} onChangeText={value => { setNotes(value); setAnalysis(null); }} placeholder="Например, желтеют нижние листья, полив раз в неделю" multiline maxLength={500} style={styles.input} />

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

function ResultList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <View style={styles.list}><Text style={styles.listTitle}>{title}</Text>{items.map((item, index) => <View style={styles.listRow} key={`${title}-${index}`}><View style={styles.dot} /><Text style={styles.listItem}>{item}</Text></View>)}</View>;
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 42, backgroundColor: 'rgba(255,252,240,.34)', flexGrow: 1 },
  intro: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  introBody: { flex: 1 },
  title: { color: theme.colors.ink, fontSize: 26, fontWeight: '900' },
  subtitle: { color: theme.colors.inkSoft, lineHeight: 20, marginTop: 5 },
  disclaimer: { backgroundColor: theme.colors.sunflowerPale, borderRadius: 13, color: '#725A15', padding: 14, lineHeight: 20, marginTop: 20 },
  warning: { backgroundColor: theme.colors.dangerPale, borderRadius: 13, color: theme.colors.danger, padding: 14, lineHeight: 20, marginTop: 12 },
  label: { color: theme.colors.ink, fontWeight: '900', marginTop: 21, marginBottom: 9 },
  photoBox: { height: 210, backgroundColor: theme.colors.cucumberPale, borderRadius: 16, borderWidth: 1, borderColor: '#B8D6A0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  photoHint: { color: theme.colors.leaf, fontWeight: '900', marginTop: 9 },
  changePhoto: { color: theme.colors.leaf, textAlign: 'right', fontWeight: '900', marginTop: 10, padding: 7 },
  input: { minHeight: 90, backgroundColor: theme.colors.paper, borderColor: '#D8DECD', borderWidth: 1, borderRadius: 12, padding: 14, textAlignVertical: 'top', color: theme.colors.ink },
  button: { backgroundColor: theme.colors.leaf, borderRadius: 12, padding: 16, marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, minHeight: 54 },
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
