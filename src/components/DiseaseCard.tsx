import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { Disease } from '../types';

export function DiseaseCard({ disease, onPress }: { disease: Disease; onPress: () => void }) {
  const accent = disease.accent ?? theme.colors.leaf;
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${disease.name}. ${disease.symptoms}`} style={({ pressed }) => [styles.card, { borderLeftColor: accent, opacity: pressed ? .8 : 1 }]}>
    <View style={styles.main}><View style={[styles.iconBox, { backgroundColor: disease.color }]}><MaterialCommunityIcons name={disease.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={25} color={accent} /></View>
      <View style={styles.copy}><View style={[styles.category, { backgroundColor: disease.color }]}><Text style={[styles.categoryText, { color: accent }]}>{disease.category}</Text></View><Text style={styles.name}>{disease.name}</Text><Text numberOfLines={2} style={styles.symptoms}>{disease.symptoms}</Text></View>
    </View>
    <View style={styles.footer}><Text style={[styles.action, { color: accent }]}>Признаки и меры ухода</Text><Ionicons name="arrow-forward" size={16} color={accent} /><View style={styles.footerSpacer} /><Ionicons name="chevron-forward" size={17} color={theme.colors.muted} /></View>
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { minHeight: 145, backgroundColor: '#FFF', borderRadius: 16, borderLeftWidth: 5, overflow: 'hidden', shadowColor: theme.colors.leafDeep, shadowOpacity: .04, shadowRadius: 8, elevation: 1 },
  main: { flexDirection: 'row', gap: 12, padding: 14, paddingBottom: 10 }, iconBox: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 },
  category: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 }, categoryText: { fontSize: 9, fontWeight: '900', letterSpacing: .5, textTransform: 'uppercase' },
  name: { color: theme.colors.ink, fontFamily: 'serif', fontWeight: 'bold', fontSize: 18, marginTop: 5 }, symptoms: { color: theme.colors.inkSoft, fontSize: 12, lineHeight: 17, marginTop: 4 },
  footer: { minHeight: 34, marginLeft: 58, marginRight: 10, marginBottom: 8, paddingHorizontal: 12, backgroundColor: '#F5F7F4', borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }, action: { fontSize: 11, fontWeight: '900' }, footerSpacer: { flex: 1 },
});
