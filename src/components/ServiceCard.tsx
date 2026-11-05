import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { Service } from '../types';

export function ServiceCard({ service, width, onPress, wide = false }: { service: Service; width: number; onPress: () => void; wide?: boolean }) {
  const accent = service.accent ?? theme.colors.leaf;
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={service.title} style={({ pressed }) => [styles.card, wide && styles.wide, { width, backgroundColor: service.color, opacity: pressed ? .8 : 1 }]}>
    <View style={[styles.iconBox, wide && styles.wideIcon]}><Ionicons name={service.icon as keyof typeof Ionicons.glyphMap} size={25} color={accent} /></View>
    <View style={wide ? styles.wideCopy : styles.copy}><Text style={styles.title}>{service.title}</Text><Text numberOfLines={2} style={[styles.description, { color: accent }]}>{service.description}</Text></View>
    <View style={styles.arrow}><Ionicons name="arrow-up-outline" size={17} color={theme.colors.ink} style={styles.arrowIcon} /></View>
    {service.id === 'diagnosis' && !wide && <Text style={[styles.badge, { color: accent }]}>GEMINI</Text>}
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { minHeight: 178, borderRadius: 24, padding: 16, overflow: 'hidden', justifyContent: 'space-between' },
  wide: { minHeight: 104, flexDirection: 'row', alignItems: 'center', gap: 13, justifyContent: 'flex-start' },
  iconBox: { width: 48, height: 48, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.84)', alignItems: 'center', justifyContent: 'center' }, wideIcon: { width: 52, height: 52 },
  copy: { paddingTop: 18 }, wideCopy: { flex: 1 },
  title: { color: theme.colors.ink, fontFamily: 'serif', fontWeight: 'bold', fontSize: 18, lineHeight: 22 },
  description: { fontSize: 11, lineHeight: 16, marginTop: 5 },
  arrow: { position: 'absolute', top: 16, right: 16, width: 29, height: 29, backgroundColor: 'rgba(255,255,255,.72)', borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, arrowIcon: { transform: [{ rotate: '45deg' }] },
  badge: { position: 'absolute', top: 62, left: 16, fontSize: 9, fontWeight: '900', letterSpacing: .8 },
});
