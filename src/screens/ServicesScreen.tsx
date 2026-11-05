import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ServiceCard } from '../components/ServiceCard';
import { services } from '../data/content';
import { theme } from '../theme';

const detailText: Record<string, string> = {
  advice: 'Сначала оцените свет, частоту полива и состояние почвы. Каталог подсказывает общие меры, но он не заменяет консультацию агронома.',
  map: 'При добавлении наблюдения можно дать разрешение на геолокацию. Координаты сохраняются только локально.',
};

export default function ServicesScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const columns = width >= 700 ? 3 : 2;
  const cardWidth = (width - 40 - 12 * (columns - 1)) / columns;
  const open = (id: string) => {
    if (id === 'diagnosis') navigation.navigate('Diagnosis');
    else if (id === 'chat') navigation.navigate('Assistant');
    else if (id === 'reminders') navigation.navigate('Reminders');
    else if (id === 'compare') navigation.navigate('Compare');
    else if (id === 'plants' || id === 'history') navigation.navigate('Растения');
    else if (id === 'catalog') navigation.navigate('Каталог');
    else { const item = services.find(service => service.id === id)!; navigation.navigate('Details', { title: item.title, icon: item.icon, body: detailText[id] ?? 'Раздел находится в разработке.' }); }
  };
  const chat = services.find(service => service.id === 'chat')!;

  return <ScrollView contentContainerStyle={styles.page}>
    <View style={styles.metaRow}><View style={styles.metaPill}><View style={styles.metaDot} /><Text style={styles.metaText}>{services.length} ИНСТРУМЕНТОВ</Text></View><View style={styles.localPill}><Ionicons name="shield-checkmark-outline" size={15} color={theme.colors.leafDeep} /><Text style={styles.localText}>Полевой журнал</Text></View></View>
    <Text style={styles.title}>Сервисы</Text>
    <Text style={styles.subtitle}>Инструменты для ухода, наблюдений и поиска возможных причин изменений.</Text>
    <View style={styles.infoStrip}><View style={styles.infoIcon}><Ionicons name="leaf-outline" size={21} color={theme.colors.leafDeep} /></View><View style={styles.infoCopy}><Text style={styles.infoTitle}>Наблюдайте за своими растениями</Text><Text style={styles.infoText}>Добавляйте фото и заметки, чтобы видеть историю ухода.</Text></View><Ionicons name="arrow-forward" size={18} color={theme.colors.leafDeep} /></View>
    <View style={styles.grid}>{services.filter(service => service.id !== 'chat').map(service => <ServiceCard key={service.id} service={service} width={cardWidth} onPress={() => open(service.id)} />)}</View>
    <ServiceCard service={chat} width={width - 40} onPress={() => open(chat.id)} wide />
    <View style={styles.footerTip}><Ionicons name="bulb-outline" size={20} color={theme.colors.leafDeep} /><Text style={styles.footerTipText}>Начните с карточки растения — тогда история и AI-сводка смогут учитывать ваши наблюдения.</Text></View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 32, backgroundColor: 'rgba(247,249,245,.78)' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 7, marginTop: 4, marginBottom: 16 }, metaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, backgroundColor: '#E8EAE7' }, metaDot: { width: 7, height: 7, backgroundColor: theme.colors.tomato, borderRadius: 4 }, metaText: { color: theme.colors.ink, fontSize: 9, letterSpacing: .6, fontWeight: '900' }, localPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, backgroundColor: '#FFF' }, localText: { color: theme.colors.inkSoft, fontSize: 10, fontWeight: '700' },
  title: { color: theme.colors.ink, fontFamily: 'serif', fontWeight: 'bold', fontSize: 34, lineHeight: 39 }, subtitle: { color: theme.colors.inkSoft, fontSize: 13, lineHeight: 20, marginTop: 7, marginBottom: 20 },
  infoStrip: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF', borderRadius: 17, padding: 12, marginBottom: 18, borderWidth: 1, borderColor: theme.colors.line }, infoIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#BCEED2', alignItems: 'center', justifyContent: 'center' }, infoCopy: { flex: 1 }, infoTitle: { color: theme.colors.ink, fontWeight: '900', fontSize: 12 }, infoText: { color: theme.colors.muted, fontSize: 10, lineHeight: 14, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  footerTip: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#EDF1EC', borderRadius: 15, padding: 15, marginTop: 18 }, footerTipText: { flex: 1, color: theme.colors.inkSoft, fontSize: 12, lineHeight: 18 },
});
