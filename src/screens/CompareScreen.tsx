import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getObservations, getPlants } from '../services/storage';
import { Observation, Plant } from '../types';
import { theme } from '../theme';

export default function CompareScreen() {
  const navigation = useNavigation<any>();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState('');

  const refresh = useCallback(async () => {
    const [nextPlants, nextObservations] = await Promise.all([getPlants(), getObservations()]);
    setPlants(nextPlants);
    setObservations(nextObservations);
    setSelectedPlantId(current => nextPlants.some(plant => plant.id === current) ? current : (nextPlants[0]?.id ?? ''));
  }, []);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const selectedPlant = plants.find(plant => plant.id === selectedPlantId);
  const plantObservations = useMemo(() => observations
    .filter(item => item.plantId === selectedPlantId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [observations, selectedPlantId]);
  const photos = plantObservations.filter(item => Boolean(item.imageUri));
  const before = photos.length > 1 ? photos[0] : undefined;
  const latest = photos.length ? photos[photos.length - 1] : undefined;
  const addPhoto = () => navigation.navigate('AddPlant', { plantId: selectedPlantId });

  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.kicker}>ФОТОДНЕВНИК</Text>
    <Text style={styles.title}>Изменения со временем</Text>
    <Text style={styles.subtitle}>Сравни снимки одного растения по датам. Приложение показывает исходные фото и не рассчитывает выдуманный процент «выздоровления».</Text>

    {plants.length > 0 && <>
      <Text style={styles.sectionLabel}>Выбери растение</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.plantChips}>{plants.map(plant => <Pressable key={plant.id} onPress={() => setSelectedPlantId(plant.id)} style={[styles.plantChip, plant.id === selectedPlantId && styles.plantChipActive]}><Ionicons name="leaf-outline" size={15} color={plant.id === selectedPlantId ? '#FFF' : theme.colors.leaf} /><Text numberOfLines={1} style={[styles.plantChipText, plant.id === selectedPlantId && styles.plantChipTextActive]}>{plant.name}</Text></Pressable>)}</ScrollView>
    </>}

    {!selectedPlant ? <View style={styles.emptyCard}><View style={styles.emptyIcon}><Ionicons name="images-outline" size={25} color={theme.colors.leaf} /></View><Text style={styles.emptyTitle}>Сначала добавь растение</Text><Text style={styles.emptyText}>После этого можно будет сохранять его фото и сравнивать наблюдения.</Text><Pressable onPress={() => navigation.navigate('AddPlant')} style={styles.addButton}><Text style={styles.addButtonText}>Добавить растение</Text></Pressable></View>
      : photos.length === 0 ? <View style={styles.emptyCard}><View style={styles.emptyIcon}><Ionicons name="camera-outline" size={25} color={theme.colors.tomato} /></View><Text style={styles.emptyTitle}>Для сравнения нужны фото</Text><Text style={styles.emptyText}>Для «{selectedPlant.name}» пока нет снимков. Добавь фото в новое наблюдение, чтобы начать фотодневник.</Text><Pressable onPress={addPhoto} style={styles.addButton}><Ionicons name="camera-outline" size={17} color="#FFF" /><Text style={styles.addButtonText}>Добавить снимок</Text></Pressable></View>
      : <>
        <View style={styles.plantSummary}><View style={styles.summaryMark}><Ionicons name="leaf" size={18} color="#FFF" /></View><View style={styles.summaryCopy}><Text style={styles.summaryName}>{selectedPlant.name}</Text><Text style={styles.summarySpecies}>{selectedPlant.species}</Text></View><View style={styles.photoCount}><Text style={styles.photoCountNumber}>{photos.length}</Text><Text style={styles.photoCountLabel}>фото</Text></View></View>
        <View style={styles.compareHeader}><Text style={styles.sectionTitle}>Фото до и после</Text><Text style={styles.compareHint}>первое и последнее</Text></View>
        <View style={styles.photoPair}>
          <PhotoPanel label="РАНЬШЕ" observation={before} emptyLabel="Добавь ещё один снимок" onPress={addPhoto} />
          <PhotoPanel label="ПОСЛЕДНЕЕ" observation={latest} />
        </View>
        <Text style={styles.dataNote}>Сравнение основано на сохранённых наблюдениях. Оно не оценивает процент улучшения.</Text>

        <View style={styles.historyHeader}><Text style={styles.sectionTitle}>История наблюдений</Text><Text style={styles.historyCount}>{plantObservations.length}</Text></View>
        {plantObservations.slice(-5).reverse().map(item => <View style={styles.historyItem} key={item.id}>
          <View style={styles.timeline}><View style={styles.timelineDot} /><View style={styles.timelineLine} /></View>
          {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.historyThumb} /> : <View style={styles.historyThumbPlaceholder}><Ionicons name="document-text-outline" size={18} color={theme.colors.leaf} /></View>}
          <View style={styles.historyCopy}><Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</Text><Text numberOfLines={2} style={styles.historyNote}>{item.note || item.condition}</Text><Text style={styles.historyCondition}>{item.condition}</Text></View>
        </View>)}
        <Pressable onPress={addPhoto} style={styles.secondaryAction}><Ionicons name="add-circle-outline" size={19} color={theme.colors.leaf} /><Text style={styles.secondaryActionText}>Добавить новое наблюдение</Text><Ionicons name="arrow-forward" size={16} color={theme.colors.leaf} /></Pressable>
      </>}
  </ScrollView>;
}

function PhotoPanel({ label, observation, emptyLabel, onPress }: { label: string; observation?: Observation; emptyLabel?: string; onPress?: () => void }) {
  return <View style={styles.photoColumn}>
    <Text style={styles.photoLabel}>{label}</Text>
    {observation?.imageUri ? <Image source={{ uri: observation.imageUri }} style={styles.compareImage} /> : <Pressable onPress={onPress} style={styles.photoPlaceholder}><Ionicons name="camera-outline" size={24} color={theme.colors.leaf} /><Text style={styles.placeholderText}>{emptyLabel ?? 'Нет снимка'}</Text></Pressable>}
    <Text numberOfLines={1} style={styles.photoDate}>{observation ? new Date(observation.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'ожидается фото'}</Text>
    {!!observation && <Text numberOfLines={2} style={styles.photoCondition}>{observation.condition}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 38, flexGrow: 1, backgroundColor: 'rgba(248,250,246,.34)' },
  kicker: { color: theme.colors.tomato, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: theme.colors.ink, fontSize: 28, lineHeight: 34, fontWeight: '900', marginTop: 6 },
  subtitle: { color: theme.colors.inkSoft, fontSize: 13, lineHeight: 19, marginTop: 7 },
  sectionLabel: { color: theme.colors.ink, fontSize: 13, fontWeight: '900', marginTop: 21, marginBottom: 9 },
  plantChips: { gap: 8, paddingBottom: 3 },
  plantChip: { maxWidth: 190, minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, backgroundColor: theme.colors.paper, borderWidth: 1, borderColor: theme.colors.line, borderRadius: 10 },
  plantChipActive: { backgroundColor: theme.colors.leafDeep, borderColor: theme.colors.leafDeep },
  plantChipText: { color: theme.colors.inkSoft, fontSize: 12, fontWeight: '800', flexShrink: 1 }, plantChipTextActive: { color: '#FFF' },
  emptyCard: { alignItems: 'center', marginTop: 24, padding: 24, backgroundColor: theme.colors.paper, borderWidth: 1, borderColor: theme.colors.line, borderRadius: 18 },
  emptyIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: theme.colors.cucumberPale },
  emptyTitle: { color: theme.colors.ink, fontSize: 18, fontWeight: '900', marginTop: 13 }, emptyText: { color: theme.colors.inkSoft, textAlign: 'center', lineHeight: 20, marginTop: 7 },
  addButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, backgroundColor: theme.colors.leafDeep, borderRadius: 11, marginTop: 17 }, addButtonText: { color: '#FFF', fontWeight: '900' },
  plantSummary: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.leafDeep, padding: 14, borderRadius: 15, marginTop: 24 }, summaryMark: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,.14)' }, summaryCopy: { flex: 1, marginLeft: 10 }, summaryName: { color: '#FFF', fontWeight: '900', fontSize: 15 }, summarySpecies: { color: '#D9EADF', fontSize: 12, marginTop: 2 }, photoCount: { alignItems: 'center', paddingHorizontal: 9 }, photoCountNumber: { color: '#FFF', fontSize: 18, fontWeight: '900' }, photoCountLabel: { color: '#D9EADF', fontSize: 10 },
  compareHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 }, sectionTitle: { color: theme.colors.ink, fontSize: 18, fontWeight: '900' }, compareHint: { color: theme.colors.muted, fontSize: 10 },
  photoPair: { flexDirection: 'row', gap: 10 }, photoColumn: { flex: 1, minWidth: 0, padding: 9, backgroundColor: theme.colors.paper, borderRadius: 13, borderWidth: 1, borderColor: theme.colors.line }, photoLabel: { color: theme.colors.leaf, fontSize: 9, fontWeight: '900', letterSpacing: .8, marginBottom: 7 }, compareImage: { width: '100%', height: 140, borderRadius: 9, backgroundColor: theme.colors.cucumberPale }, photoPlaceholder: { height: 140, padding: 8, alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 9, backgroundColor: theme.colors.cucumberPale }, placeholderText: { color: theme.colors.inkSoft, fontSize: 11, textAlign: 'center', fontWeight: '700' }, photoDate: { color: theme.colors.ink, fontSize: 11, fontWeight: '900', marginTop: 8 }, photoCondition: { color: theme.colors.muted, fontSize: 10, marginTop: 3 },
  dataNote: { color: theme.colors.muted, fontSize: 11, lineHeight: 16, marginTop: 10 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 25, marginBottom: 11 }, historyCount: { color: theme.colors.tomato, fontSize: 12, fontWeight: '900' },
  historyItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, minHeight: 76 }, timeline: { width: 12, alignItems: 'center', alignSelf: 'stretch' }, timelineDot: { width: 9, height: 9, borderRadius: 5, marginTop: 7, backgroundColor: theme.colors.tomato, borderWidth: 2, borderColor: '#FFF' }, timelineLine: { width: 1, flex: 1, backgroundColor: theme.colors.line, marginTop: 3 }, historyThumb: { width: 48, height: 48, borderRadius: 10 }, historyThumbPlaceholder: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.cucumberPale }, historyCopy: { flex: 1, paddingBottom: 13 }, historyDate: { color: theme.colors.leaf, fontSize: 10, fontWeight: '900' }, historyNote: { color: theme.colors.inkSoft, fontSize: 12, lineHeight: 17, marginTop: 3 }, historyCondition: { color: theme.colors.muted, fontSize: 10, marginTop: 3 },
  secondaryAction: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 48, backgroundColor: theme.colors.paper, borderWidth: 1, borderColor: theme.colors.line, borderRadius: 12, paddingHorizontal: 13, marginTop: 4 }, secondaryActionText: { color: theme.colors.leaf, fontSize: 12, fontWeight: '900', flex: 1 },
});
