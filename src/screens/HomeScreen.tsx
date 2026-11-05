import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getObservations, getPlants } from '../services/storage';
import { refreshPlantCareReview } from '../services/careReview';
import { Observation, Plant, PlantCareReview } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { UserGreeting } from '../components/UserGreeting';
import { theme } from '../theme';
export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [careReview, setCareReview] = useState<PlantCareReview | null>(null);
  const [careLoading, setCareLoading] = useState(false);
  const [careError, setCareError] = useState('');
  const [hasLoadedCare, setHasLoadedCare] = useState(false);
  const refreshCare = useCallback(async (force = false) => {
    try {
      const [p, o] = await Promise.all([getPlants(), getObservations()]);
      setPlants(p);
      setObservations(o);
      if (!o.length || !p.length) { setCareReview(null); setCareError(''); setHasLoadedCare(true); return; }
      setCareLoading(true);
      setCareError('');
      const review = await refreshPlantCareReview(p, o, force);
      setCareReview(review);
      setHasLoadedCare(true);
    } catch (cause) {
      setCareError(cause instanceof Error ? cause.message : 'Не получилось проверить наблюдения.');
      setHasLoadedCare(true);
    } finally { setCareLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void refreshCare(); }, [refreshCare]));
  const savedAnalyses = observations.filter(item => item.note.includes('AI-подсказка (не окончательный диагноз)')).length;
  return <ScrollView contentContainerStyle={styles.page}>
    <UserGreeting style={styles.greeting} />
    <Text style={styles.title}>Как чувствуют себя{`\n`}ваши растения?</Text>
    <View style={styles.hero}><View style={styles.heroTop}><Text style={styles.heroTag}>GEMINI · ФОТОРАЗБОР</Text><Ionicons name="sunny-outline" size={27} color="#FFE18A" /></View><Text style={styles.heroTitle}>Посмотрите, что скрывают листья</Text><Text style={styles.heroText}>Снимок и заметки помогут заметить признаки проблем и получить возможные причины — AI-подсказка не заменяет диагноз специалиста.</Text><Pressable style={styles.heroButton} onPress={() => navigation.navigate('Diagnosis')}><Text style={styles.heroButtonText}>Проверить растение</Text><Ionicons name="arrow-forward" size={18} color="#633B12" /></Pressable></View>
    <View style={styles.careCard}>
      <View style={styles.careHeader}><View style={styles.careIcon}><Ionicons name="sparkles-outline" size={20} color={theme.colors.leaf} /></View><View style={{ flex: 1 }}><Text style={styles.careTitle}>ИИ-проверка наблюдений</Text><Text style={styles.careSubtitle}>Обновляется при новых записях</Text></View><Pressable onPress={() => { void refreshCare(true); }} disabled={careLoading} style={styles.refreshButton} accessibilityLabel="Повторить AI-проверку"><Ionicons name="refresh" size={19} color={theme.colors.leaf} /></Pressable></View>
      {careLoading ? <View style={styles.careLoading}><ActivityIndicator size="small" color={theme.colors.leaf} /><Text style={styles.careBody}>ИИ изучает записи и сохранённые фото…</Text></View>
        : careError ? <><Text style={styles.careBody}>{careReview?.summary || 'Не удалось обновить AI-сводку.'}</Text><Text style={styles.careError}>{careError}</Text></>
        : careReview ? <><Text style={styles.careSummary}>{careReview.summary}</Text>{careReview.insights.map(item => <View key={item.plantId} style={[styles.insight, item.status === 'attention' ? styles.insightAlert : item.status === 'watch' ? styles.insightWatch : styles.insightOk]}><View style={styles.insightHeading}><Ionicons name={item.status === 'attention' ? 'alert-circle' : item.status === 'watch' ? 'eye' : 'checkmark-circle'} size={18} color={item.status === 'attention' ? theme.colors.danger : item.status === 'watch' ? theme.colors.sunflower : theme.colors.leaf} /><Text style={styles.insightPlant}>{item.plantName}</Text><Text style={styles.statusLabel}>{item.status === 'attention' ? 'ПРОВЕРЬТЕ' : item.status === 'watch' ? 'НАБЛЮДАЙТЕ' : 'СТАБИЛЬНО'}</Text></View><Text style={styles.careBody}>{item.explanation}</Text><Text style={styles.careAdvice}>{item.recommendation}</Text></View>)}</>
        : hasLoadedCare ? <Text style={styles.careBody}>Добавь растение и наблюдение — тогда ИИ сможет автоматически проверить состояние. Если заметки или фото ничего не показывают, ИИ скажет, что данных недостаточно.</Text> : null}
      <Text style={styles.careDisclaimer}>Сводка обновляется при появлении новых наблюдений и не чаще раза в 12 часов. Совет ИИ — не окончательный диагноз.</Text>
    </View>
    <View style={styles.sectionLine}><Text style={styles.section}>Моя сводка</Text><Pressable onPress={() => navigation.navigate('Растения')}><Text style={styles.link}>Открыть</Text></Pressable></View>
    <View style={styles.stats}><Stat value={String(plants.length)} label="растений" accent={theme.colors.leaf} /><Stat value={String(observations.length)} label="наблюдений" accent={theme.colors.sunflower} /><Stat value={String(savedAnalyses)} label="AI-подсказок" accent={theme.colors.tomato} /></View>
    <View style={styles.tip}><View style={styles.tipIcon}><Ionicons name="bulb-outline" size={23} color="#8A6910" /></View><View style={{ flex: 1 }}><Text style={styles.tipTitle}>Совет дня</Text><Text style={styles.tipText}>Осматривайте нижнюю сторону листьев: там часто появляются первые признаки вредителей.</Text></View></View>
    <Pressable style={styles.add} onPress={() => navigation.navigate('AddPlant')}><Ionicons name="add-circle-outline" size={20} color="#FFF" /><Text style={styles.addText}>Добавить растение или наблюдение</Text></Pressable>
    <Pressable style={styles.chatButton} onPress={() => navigation.navigate('Assistant')}><Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.colors.leaf} /><Text style={styles.chatButtonText}>Спросить AgroDoctor AI</Text><Ionicons name="arrow-forward" size={18} color={theme.colors.leaf} /></Pressable>
  </ScrollView>;
}
function Stat({ value, label, accent }: { value: string; label: string; accent: string }) { return <View style={[styles.stat, { borderTopColor: accent }]}><Text style={styles.statNumber}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 35, backgroundColor: 'rgba(255,252,240,.34)', flexGrow: 1 },
  greeting: { color: '#65796C', fontWeight: '700', fontSize: 15 },
  title: { color: '#183D2C', fontWeight: '900', fontSize: 30, lineHeight: 36, marginTop: 5, letterSpacing: -.5 },
  hero: { backgroundColor: '#D95D40', borderRadius: 22, padding: 20, marginTop: 22, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTag: { color: '#FFF2DE', fontSize: 10, fontWeight: '900', letterSpacing: 1, backgroundColor: 'rgba(103,48,29,.30)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  heroTitle: { color: '#FFFDF4', fontSize: 23, lineHeight: 27, fontWeight: '900', marginTop: 18, maxWidth: 270 },
  heroText: { color: '#FFF0E4', lineHeight: 21, marginTop: 8, fontSize: 14 },
  heroButton: { flexDirection: 'row', alignItems: 'center', gap: 9, alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 11, backgroundColor: '#FFE089', marginTop: 17, minHeight: 44 },
  heroButtonText: { color: '#633B12', fontWeight: '900' },
  careCard: { backgroundColor: '#FFFEF8', borderWidth: 1, borderColor: '#E4E8D6', borderRadius: 18, padding: 16, marginTop: 14 },
  careHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  careIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#E7F0D4', justifyContent: 'center', alignItems: 'center' },
  careTitle: { color: '#183D2C', fontWeight: '900', fontSize: 15 },
  careSubtitle: { color: '#748176', fontSize: 11, marginTop: 2 },
  refreshButton: { padding: 9, minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  careLoading: { flexDirection: 'row', gap: 9, alignItems: 'center', paddingVertical: 14 },
  careSummary: { color: '#355744', fontWeight: '700', fontSize: 14, lineHeight: 21, marginTop: 13 },
  careBody: { color: '#52665A', fontSize: 12, lineHeight: 18, marginTop: 6 },
  careAdvice: { color: '#24784E', fontSize: 12, fontWeight: '800', lineHeight: 18, marginTop: 5 },
  careError: { color: '#A33C34', fontSize: 12, marginTop: 6 },
  insight: { padding: 11, borderRadius: 12, marginTop: 10 }, insightAlert: { backgroundColor: '#FBE8E3' }, insightWatch: { backgroundColor: '#FFF1BC' }, insightOk: { backgroundColor: '#E7F0D4' },
  insightHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 }, insightPlant: { color: '#183D2C', fontSize: 13, fontWeight: '900', flex: 1 }, statusLabel: { color: '#69796D', fontSize: 9, fontWeight: '900' },
  careDisclaimer: { color: '#7C887F', fontSize: 10, lineHeight: 15, marginTop: 12 },
  sectionLine: { marginTop: 26, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, section: { color: '#183D2C', fontSize: 20, fontWeight: '900' }, link: { color: '#24784E', fontWeight: '900', paddingVertical: 8, paddingLeft: 12 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 12 }, stat: { flex: 1, padding: 13, backgroundColor: '#FFFEF8', borderRadius: 14, borderTopWidth: 4, borderColor: '#E4E8D6' }, statNumber: { color: '#183D2C', fontWeight: '900', fontSize: 24 }, statLabel: { color: '#6D8074', fontSize: 11, marginTop: 3 },
  tip: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#FFF1BC', borderRadius: 16, marginTop: 20 }, tipIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFEF8' }, tipTitle: { color: '#73570C', fontWeight: '900' }, tipText: { color: '#6F5B28', lineHeight: 19, fontSize: 13, marginTop: 3 },
  add: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#24784E', borderRadius: 13, padding: 15, marginTop: 22, minHeight: 52 }, addText: { color: '#FFF', fontWeight: '900', textAlign: 'center' },
  chatButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFEF8', borderWidth: 1, borderColor: '#E4E8D6', borderRadius: 13, paddingHorizontal: 15, paddingVertical: 13, marginTop: 10, minHeight: 50 }, chatButtonText: { color: '#24784E', fontWeight: '900', flex: 1 },
});
