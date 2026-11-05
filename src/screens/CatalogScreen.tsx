import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DiseaseCard } from '../components/DiseaseCard';
import { diseases } from '../data/content';
import { Disease } from '../types';
import { theme } from '../theme';

export default function CatalogScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Все');
  const categories = useMemo(() => ['Все', ...Array.from(new Set(diseases.map(item => item.category)))], []);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('ru');
    return diseases.filter(item => (category === 'Все' || item.category === category)
      && (!needle || `${item.name} ${item.category} ${item.symptoms}`.toLocaleLowerCase('ru').includes(needle)));
  }, [category, query]);
  const render = ({ item }: { item: Disease }) => <DiseaseCard disease={item} onPress={() => navigation.navigate('Details', { title: item.name, icon: 'medical-outline', body: `Категория: ${item.category}\n\nПризнаки: ${item.symptoms}\n\nОбщие рекомендации: ${item.advice}\n\nИнформация носит справочный характер и не является диагнозом.` })} />;
  const header = <View>
    <View style={styles.kickerPill}><Text style={styles.kicker}>СПРАВОЧНИК СИМПТОМОВ</Text></View>
    <Text style={styles.title}>Каталог болезней</Text>
    <Text style={styles.subtitle}>Сравните признаки и откройте карточку с мерами ухода.</Text>
    <View style={styles.countRow}><View style={styles.countMark}><Ionicons name="leaf-outline" size={15} color={theme.colors.leaf} /></View><Text style={styles.countText}>{diseases.length} карточек · справочная информация</Text></View>
    <View style={styles.search}><Ionicons name="search-outline" size={19} color={theme.colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Название или симптом" placeholderTextColor="#829087" style={styles.searchInput} returnKeyType="search" accessibilityLabel="Поиск заболеваний по названию или симптомам" />{query.length > 0 && <Pressable onPress={() => setQuery('')} style={styles.clearSearch} accessibilityLabel="Очистить поиск"><Ionicons name="close-circle" size={19} color={theme.colors.muted} /></Pressable>}</View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{categories.map(item => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}><Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text></Pressable>)}</ScrollView>
    <Text style={styles.resultCount}>{filtered.length} {filtered.length === 1 ? 'карточка' : 'карточек'}</Text>
  </View>;
  const footer = <Pressable onPress={() => navigation.navigate('Diagnosis')} style={styles.scanCta}><View style={styles.scanIcon}><Ionicons name="sparkles-outline" size={23} color={theme.colors.leafDeep} /></View><View style={styles.scanCopy}><Text style={styles.scanTitle}>Не уверены в причине?</Text><Text style={styles.scanText}>Добавьте фото и признаки для AI-подсказки.</Text><Text style={styles.scanAction}>Открыть анализ  →</Text></View></Pressable>;
  return <FlatList style={styles.screen} contentContainerStyle={styles.list} data={filtered} renderItem={render} keyExtractor={item => item.id} ItemSeparatorComponent={() => <View style={{ height: 11 }} />} ListHeaderComponent={header} ListFooterComponent={footer} ListEmptyComponent={<View style={styles.empty}><Ionicons name="search-outline" size={25} color={theme.colors.muted} /><Text style={styles.emptyText}>По этому запросу ничего не найдено.</Text></View>} keyboardShouldPersistTaps="handled" />;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: 'rgba(247,249,245,.78)' },
  list: { padding: 20, paddingBottom: 35 },
  kickerPill: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14, backgroundColor: '#C9EED9', marginBottom: 12 },
  kicker: { fontSize: 9, letterSpacing: .6, fontWeight: '900', color: theme.colors.leafDeep },
  title: { fontFamily: 'serif', fontSize: 30, lineHeight: 37, fontWeight: 'bold', color: theme.colors.ink },
  subtitle: { color: theme.colors.inkSoft, marginTop: 6, marginBottom: 14, lineHeight: 20 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 15 },
  countMark: { width: 25, height: 25, borderRadius: 8, backgroundColor: theme.colors.cucumberPale, alignItems: 'center', justifyContent: 'center' },
  countText: { color: theme.colors.inkSoft, fontSize: 12, fontWeight: '800' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 50, paddingHorizontal: 13, backgroundColor: theme.colors.paper, borderWidth: 1, borderColor: theme.colors.line, borderRadius: 13, shadowColor: theme.colors.leafDeep, shadowOpacity: .04, shadowRadius: 7, elevation: 1 },
  searchInput: { flex: 1, minHeight: 46, color: theme.colors.ink, fontSize: 14 },
  clearSearch: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
  chips: { gap: 8, paddingVertical: 14 },
  chip: { minHeight: 38, paddingHorizontal: 13, justifyContent: 'center', backgroundColor: '#E9ECE8', borderRadius: 10 },
  chipActive: { backgroundColor: theme.colors.leafDeep },
  chipText: { color: theme.colors.inkSoft, fontSize: 12, fontWeight: '800' },
  chipTextActive: { color: '#FFF' },
  resultCount: { color: theme.colors.muted, fontSize: 11, fontWeight: '800', marginBottom: 10 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 25, gap: 8, backgroundColor: theme.colors.paper, borderRadius: 14 },
  emptyText: { textAlign: 'center', color: theme.colors.muted, lineHeight: 19 },
  scanCta: { flexDirection: 'row', gap: 13, backgroundColor: theme.colors.leafDeep, borderRadius: 17, padding: 17, marginTop: 23 }, scanIcon: { width: 42, height: 42, backgroundColor: '#C9EED9', borderRadius: 21, alignItems: 'center', justifyContent: 'center' }, scanCopy: { flex: 1 }, scanTitle: { color: '#FFF', fontFamily: 'serif', fontSize: 18, fontWeight: 'bold' }, scanText: { color: '#C8E7D3', fontSize: 11, lineHeight: 16, marginTop: 5 }, scanAction: { color: '#FFF', fontWeight: '900', fontSize: 12, marginTop: 10 },
});
