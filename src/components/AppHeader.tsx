import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

export function AppHeader({ onReminders, onProfile }: { onReminders: () => void; onProfile: () => void }) {
  return <SafeAreaView edges={['top']} style={styles.safe}>
    <View style={styles.row}>
      <View style={styles.mark}><Ionicons name="leaf" size={22} color="#FFF" /></View>
      <View style={styles.brand}>
        <View style={styles.nameRow}><Text style={styles.name}>AgroDoctor</Text><Text style={styles.ai}>AI</Text></View>
        <View style={styles.onlineRow}><View style={styles.onlineDot} /><Text style={styles.caption}>Дневник растений</Text></View>
      </View>
      <Pressable onPress={onReminders} accessibilityRole="button" accessibilityLabel="Напоминания" style={styles.iconButton}><Ionicons name="notifications-outline" size={21} color={theme.colors.ink} /></Pressable>
      <Pressable onPress={onProfile} accessibilityRole="button" accessibilityLabel="Профиль" style={styles.avatar}><Ionicons name="person-outline" size={20} color="#FFF" /></Pressable>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: 'rgba(247,249,245,.96)', borderBottomWidth: 1, borderBottomColor: theme.colors.line },
  row: { height: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 11 },
  mark: { width: 37, height: 37, backgroundColor: theme.colors.leafDeep, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  brand: { flex: 1 }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, name: { color: theme.colors.ink, fontSize: 18, fontWeight: '900', letterSpacing: -.5 },
  ai: { overflow: 'hidden', backgroundColor: '#BCEED2', color: theme.colors.leafDeep, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, fontSize: 10, fontWeight: '900' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }, onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7AC69B' }, caption: { fontSize: 10, color: theme.colors.muted },
  iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.leafDeep, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#C8E8D5' },
});
