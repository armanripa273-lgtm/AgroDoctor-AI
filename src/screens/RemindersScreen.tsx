import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { cancelLocalReminder } from '../services/reminders';
import { getReminders, removeReminder } from '../services/storage';
import { PlantReminder } from '../types';

export default function RemindersScreen() {
  const navigation = useNavigation<any>();
  const [reminders, setReminders] = useState<PlantReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { setReminders((await getReminders()).filter(item => item.active).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const cancel = (item: PlantReminder) => Alert.alert('Удалить напоминание?', `«${item.title}» больше не будет приходить.`, [
    { text: 'Оставить', style: 'cancel' },
    { text: 'Удалить', style: 'destructive', onPress: () => { void (async () => {
      try { await cancelLocalReminder(item); await removeReminder(item.id); await refresh(); }
      catch { Alert.alert('Не удалось удалить', 'Попробуй ещё раз.'); }
    })(); } },
  ]);

  return <ScrollView contentContainerStyle={styles.page}>
    <View style={styles.heading}><View style={styles.icon}><Ionicons name="notifications-outline" size={23} color="#237A57" /></View><View style={{ flex: 1 }}><Text style={styles.title}>Напоминания</Text><Text style={styles.subtitle}>Локальные уведомления на этом телефоне</Text></View></View>
    {loading ? <Text style={styles.empty}>Загружаю…</Text> : reminders.length === 0 ? <View style={styles.emptyCard}><Ionicons name="leaf-outline" size={34} color="#77A58A" /><Text style={styles.emptyTitle}>Пока нет напоминаний</Text><Text style={styles.emptyText}>Попроси AgroDoctor AI напомнить о поливе, подкормке или осмотре растения.</Text></View> : reminders.map(item => <View key={item.id} style={styles.card}>
      <View style={styles.cardTop}><Text style={styles.cardTitle}>{item.title}</Text><Pressable accessibilityLabel="Удалить напоминание" onPress={() => cancel(item)} style={styles.delete}><Ionicons name="trash-outline" size={19} color="#A44840" /></Pressable></View>
      {!!item.plantName && <Text style={styles.plant}>{item.plantName}</Text>}
      {!!item.body && <Text style={styles.body}>{item.body}</Text>}
      <Text style={styles.date}>{item.repeatDaily ? `Каждый день · ${new Date(item.scheduledAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` : new Date(item.scheduledAt).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })}</Text>
    </View>)}
    <View style={styles.note}><Ionicons name="information-circle-outline" size={20} color="#7B671D" /><Text style={styles.noteText}>Уведомления создаются на устройстве и могут требовать разрешения Android. Это не push-рассылка с сервера.</Text></View>
    <Pressable style={styles.chatButton} onPress={() => navigation.navigate('Assistant')}><Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFF" /><Text style={styles.chatText}>Попросить AI создать напоминание</Text></Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({ page: { flexGrow: 1, padding: 20, paddingBottom: 30, backgroundColor: 'rgba(245,248,241,.58)' }, heading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }, icon: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#E0F0E6', alignItems: 'center', justifyContent: 'center' }, title: { color: '#174734', fontSize: 25, fontWeight: '900' }, subtitle: { color: '#6D8074', fontSize: 12, marginTop: 3 }, card: { padding: 16, backgroundColor: '#FFF', borderRadius: 17, marginBottom: 11, borderWidth: 1, borderColor: '#E4ECE5' }, cardTop: { flexDirection: 'row', alignItems: 'center' }, cardTitle: { flex: 1, color: '#174734', fontWeight: '800', fontSize: 16 }, delete: { padding: 5 }, plant: { color: '#237A57', fontSize: 12, fontWeight: '700', marginTop: 4 }, body: { color: '#596D60', fontSize: 13, lineHeight: 19, marginTop: 7 }, date: { color: '#718078', fontSize: 12, marginTop: 11 }, empty: { textAlign: 'center', color: '#718078', padding: 22 }, emptyCard: { alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, padding: 25, marginTop: 12 }, emptyTitle: { color: '#174734', fontWeight: '900', fontSize: 17, marginTop: 12 }, emptyText: { color: '#6D8074', textAlign: 'center', lineHeight: 20, marginTop: 7 }, note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 13, backgroundColor: '#FFF6D8', borderRadius: 14, marginTop: 8 }, noteText: { flex: 1, color: '#725A15', fontSize: 12, lineHeight: 18 }, chatButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9, backgroundColor: '#237A57', borderRadius: 15, padding: 15, marginTop: 17 }, chatText: { color: '#FFF', fontWeight: '800' } });
