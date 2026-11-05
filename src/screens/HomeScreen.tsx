import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { UserGreeting } from '../components/UserGreeting';
import { refreshPlantCareReview } from '../services/careReview';
import { getObservations, getPlants } from '../services/storage';
import { theme } from '../theme';
import { Observation, Plant, PlantCareReview } from '../types';

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
      const [nextPlants, nextObservations] = await Promise.all([getPlants(), getObservations()]);
      setPlants(nextPlants);
      setObservations(nextObservations);
      if (!nextPlants.length || !nextObservations.length) { setCareReview(null); setCareError(''); setHasLoadedCare(true); return; }
      setCareLoading(true);
      setCareError('');
      setCareReview(await refreshPlantCareReview(nextPlants, nextObservations, force));
      setHasLoadedCare(true);
    } catch (cause) {
      setCareError(cause instanceof Error ? cause.message : 'Не получилось проверить наблюдения.');
      setHasLoadedCare(true);
    } finally { setCareLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void refreshCare(); }, [refreshCare]));
  const savedAnalyses = observations.filter(item => item.note.includes('AI-подсказка (не окончательный диагноз)')).length;

  return <ScrollView contentContainerStyle={styles.page}>
    <View style={styles.introRow}><UserGreeting style={styles.greeting} /><View style={styles.journalPill}><Ionicons name="book-outline" size={13} color={theme.colors.leaf} /><Text style={styles.journalText}>ПОЛЕВОЙ ДНЕВНИК</Text></View></View>
    <Text style={styles.title}>Как чувствуют себя{`\n`}ваши растения?</Text>

    <View style={styles.hero}>
      <View style={styles.heroGlow} /><View style={styles.heroGlowSmall} />
      <View style={styles.heroTop}><View style={styles.heroTag}><Ionicons name="sparkles" size={15} color="#FFF" /><Text style={styles.heroTagText}>GEMINI · ФОТОРАЗБОР</Text></View><Ionicons name="leaf-outline" size={30} color="#D6F1DB" /></View>
      <Text style={styles.heroTitle}>Посмотрите, что{`\n`}скрывают листья</Text>
      <Text style={styles.heroBody}>Добавьте снимок и признаки. AI подскажет возможные причины и шаги для ухода.</Text>
      <Pressable onPress={() => navigation.navigate('Diagnosis')} style={styles.heroAction} accessibilityRole="button"><Ionicons name="camera-outline" size={20} color={theme.colors.leafDeep} /><Text style={styles.heroActionText}>Проверить растение</Text><Ionicons name="arrow-forward" size={20} color={theme.colors.leafDeep} /></Pressable>
    </View>

    <View style={styles.careCard}>
      <View style={styles.careHeader}><View style={styles.careIcon}><Ionicons name="sparkles-outline" size={21} color={theme.colors.leafDeep} /></View><View style={styles.careHeaderCopy}><Text style={styles.careTitle}>ИИ-проверка наблюдений</Text><Text style={styles.careCaption}>{careReview?.photoExamined ? 'По вашим записям и фото' : 'По вашим записям'}</Text></View><Pressable onPress={() => { void refreshCare(true); }} disabled={careLoading} style={styles.refreshButton} accessibilityLabel="Обновить ИИ-проверку"><Ionicons name="refresh-outline" size={19} color={theme.colors.leafDeep} /></Pressable></View>
      <View style={styles.careDivider} />
      {careLoading ? <View style={styles.loadingRow}><ActivityIndicator color={theme.colors.leaf} /><Text style={styles.careBody}>Анализируем сохранённые наблюдения…</Text></View>
        : careError ? <><Text style={styles.careBody}>{careReview?.summary || 'Не удалось обновить сводку.'}</Text><Text style={styles.error}>{careError}</Text></>
        : careReview ? <><Text style={styles.careSummary}>{careReview.summary}</Text>{careReview.insights.map(item => <View key={item.plantId} style={[styles.insight, item.status === 'attention' ? styles.insightAlert : item.status === 'watch' ? styles.insightWatch : styles.insightOk]}><View style={styles.insightTop}><Ionicons name={item.status === 'attention' ? 'alert-circle' : item.status === 'watch' ? 'eye' : 'checkmark-circle'} size={18} color={item.status === 'attention' ? theme.colors.danger : item.status === 'watch' ? theme.colors.sunflower : theme.colors.leaf} /><Text style={styles.insightName}>{item.plantName}</Text><Text style={styles.insightStatus}>{item.status === 'attention' ? 'ПРОВЕРЬТЕ' : item.status === 'watch' ? 'НАБЛЮДАЙТЕ' : 'СТАБИЛЬНО'}</Text></View><Text style={styles.careBody}>{item.explanation}</Text><Text style={styles.insightAdvice}>{item.recommendation}</Text></View>)}</>
        : hasLoadedCare ? <Text style={styles.careBody}>Добавьте растение и первое наблюдение. Здесь появится анализ ваших записей и фотографии.</Text> : null}
      <Text style={styles.careFootnote}>ИИ обновляет сводку при новых записях. Его совет не заменяет осмотр специалиста.</Text>
    </View>

    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Моя сводка</Text><Pressable onPress={() => navigation.navigate('Растения')}><Text style={styles.sectionLink}>Открыть сад <Ionicons name="arrow-forward" size={14} color={theme.colors.tomato} /></Text></Pressable></View>
    <View style={styles.stats}><Stat value={plants.length} label="растений" icon="leaf-outline" accent={theme.colors.leafDeep} /><Stat value={observations.length} label="наблюдений" icon="eye-outline" accent={theme.colors.tomato} /><Stat value={savedAnalyses} label="AI-подсказок" icon="bulb-outline" accent={theme.colors.cucumber} /></View>

    <View style={styles.tip}><View style={styles.tipIcon}><Ionicons name="bulb-outline" size={21} color={theme.colors.tomato} /></View><View style={styles.tipCopy}><Text style={styles.tipEyebrow}>ПРОФИЛАКТИКА</Text><Text style={styles.tipTitle}>Совет на сегодня</Text><Text style={styles.tipText}>Осматривайте нижнюю сторону листьев: там часто появляются первые признаки вредителей.</Text></View></View>
    <Pressable onPress={() => navigation.navigate('AddPlant')} style={styles.addButton}><Ionicons name="add-circle-outline" size={21} color="#FFF" /><Text style={styles.addText}>Добавить растение или наблюдение</Text></Pressable>
    <Pressable onPress={() => navigation.navigate('Assistant')} style={styles.chatButton}><Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.colors.leafDeep} /><Text style={styles.chatText}>Спросить AgroDoctor AI</Text><Ionicons name="arrow-forward" size={19} color={theme.colors.leafDeep} /></Pressable>
  </ScrollView>;
}

function Stat({ value, label, icon, accent }: { value: number; label: string; icon: keyof typeof Ionicons.glyphMap; accent: string }) {
  return <View style={[styles.stat, { borderLeftColor: accent }]}><Ionicons name={icon} size={19} color={accent} /><Text style={styles.statNumber}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 30, backgroundColor: 'rgba(247,249,245,.75)' },
  introRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 5 }, greeting: { color: theme.colors.inkSoft, fontSize: 13, fontWeight: '700' },
  journalPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E8F2E9' }, journalText: { color: theme.colors.leafDeep, fontSize: 9, fontWeight: '900', letterSpacing: .4 },
  title: { color: theme.colors.ink, fontFamily: 'serif', fontSize: 30, lineHeight: 36, fontWeight: 'bold', marginTop: 13, marginBottom: 20 },
  hero: { minHeight: 270, backgroundColor: '#A84325', borderRadius: 20, padding: 22, overflow: 'hidden', justifyContent: 'space-between', shadowColor: theme.colors.leafDeep, shadowOpacity: .16, shadowRadius: 15, elevation: 5 },
  heroGlow: { position: 'absolute', width: 250, height: 250, borderRadius: 125, right: -98, bottom: -124, backgroundColor: '#17412E' }, heroGlowSmall: { position: 'absolute', width: 190, height: 190, borderRadius: 95, right: -92, top: -94, backgroundColor: 'rgba(255,179,116,.20)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, heroTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,.18)', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 18 }, heroTagText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: .5 },
  heroTitle: { fontFamily: 'serif', color: '#FFF', fontSize: 27, lineHeight: 32, fontWeight: 'bold', marginTop: 21 }, heroBody: { color: '#FFF3EB', fontSize: 13, lineHeight: 20, marginTop: 9, marginBottom: 17, maxWidth: 310 },
  heroAction: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 11, paddingHorizontal: 17, backgroundColor: '#FFDDD0' }, heroActionText: { color: theme.colors.leafDeep, fontWeight: '900', fontSize: 14, flex: 1 },
  careCard: { marginTop: 18, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: theme.colors.line, padding: 17, shadowColor: theme.colors.leafDeep, shadowOpacity: .05, shadowRadius: 12, elevation: 2 },
  careHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 }, careIcon: { width: 43, height: 43, backgroundColor: '#BCEED2', borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, careHeaderCopy: { flex: 1 }, careTitle: { color: theme.colors.ink, fontFamily: 'serif', fontSize: 17, fontWeight: 'bold' }, careCaption: { color: theme.colors.muted, fontSize: 10, marginTop: 3 }, refreshButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }, careDivider: { height: 1, backgroundColor: theme.colors.line, marginVertical: 14 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, careBody: { color: theme.colors.inkSoft, fontSize: 12, lineHeight: 19 }, careSummary: { color: theme.colors.ink, fontSize: 13, lineHeight: 20, fontWeight: '700' }, error: { color: theme.colors.danger, marginTop: 8, fontSize: 12 },
  insight: { padding: 12, borderRadius: 11, marginTop: 10 }, insightAlert: { backgroundColor: theme.colors.dangerPale }, insightWatch: { backgroundColor: theme.colors.sunflowerPale }, insightOk: { backgroundColor: theme.colors.cucumberPale }, insightTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }, insightName: { flex: 1, color: theme.colors.ink, fontWeight: '900', fontSize: 13 }, insightStatus: { color: theme.colors.inkSoft, fontSize: 9, fontWeight: '900' }, insightAdvice: { color: theme.colors.leafDeep, marginTop: 5, lineHeight: 18, fontSize: 12, fontWeight: '700' }, careFootnote: { color: theme.colors.muted, fontSize: 10, lineHeight: 15, marginTop: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 27, marginBottom: 11 }, sectionTitle: { color: theme.colors.ink, fontFamily: 'serif', fontSize: 21, fontWeight: 'bold' }, sectionLink: { color: theme.colors.tomato, fontWeight: '900', fontSize: 12 },
  stats: { flexDirection: 'row', gap: 9 }, stat: { flex: 1, minHeight: 116, backgroundColor: '#FFF', borderRadius: 14, padding: 11, borderLeftWidth: 5, justifyContent: 'space-between' }, statNumber: { color: theme.colors.ink, fontSize: 27, fontWeight: '900' }, statLabel: { color: theme.colors.inkSoft, fontSize: 11, fontWeight: '700' },
  tip: { backgroundColor: '#EFF2ED', borderRadius: 18, flexDirection: 'row', gap: 12, padding: 17, marginTop: 22 }, tipIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFDBCF', alignItems: 'center', justifyContent: 'center' }, tipCopy: { flex: 1 }, tipEyebrow: { color: theme.colors.tomato, fontSize: 9, fontWeight: '900', letterSpacing: .7 }, tipTitle: { color: theme.colors.ink, fontFamily: 'serif', fontWeight: 'bold', fontSize: 17, marginTop: 3 }, tipText: { color: theme.colors.inkSoft, lineHeight: 19, fontSize: 12, marginTop: 6 },
  addButton: { minHeight: 51, marginTop: 23, backgroundColor: theme.colors.leafDeep, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 13 }, addText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
  chatButton: { minHeight: 51, marginTop: 10, backgroundColor: '#FFF', borderColor: theme.colors.line, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14 }, chatText: { color: theme.colors.leafDeep, flex: 1, fontFamily: 'serif', fontWeight: 'bold', fontSize: 15 },
});
