import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../types';
import { Ionicons } from '@expo/vector-icons';
type Props = NativeStackScreenProps<RootStackParamList, 'Details'>;
export default function DetailsScreen({ route }: Props) { const { title, icon, body } = route.params; return <ScrollView contentContainerStyle={styles.page}><View style={styles.iconWrap}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={38} color="#237A57" /></View><Text style={styles.title}>{title}</Text>{body.split('\n\n').map((paragraph, index) => <Text style={styles.body} key={index}>{paragraph}</Text>)}</ScrollView>; }
const styles = StyleSheet.create({ page: { flexGrow: 1, padding: 22, backgroundColor: 'rgba(245,248,241,.50)' }, iconWrap: { height: 82, width: 82, alignItems: 'center', justifyContent: 'center', borderRadius: 25, backgroundColor: '#DFF1E5' }, title: { fontSize: 28, fontWeight: '900', color: '#174734', marginTop: 20, marginBottom: 12 }, body: { color: '#466152', fontSize: 16, lineHeight: 24, marginBottom: 14 } });
