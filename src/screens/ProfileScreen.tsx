import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { firebaseConfigured, logoutFirebase } from '../services/firebase';
import { getObservations, getPlants, getProfile, saveProfile, setSession, UserProfile } from '../services/storage';
import { theme } from '../theme';

export default function ProfileScreen({ onSignOut }: { onSignOut: () => void }) {
  const [profile, setProfile] = useState<UserProfile>({ login: '', email: '' });
  const [plantsCount, setPlantsCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  useFocusEffect(useCallback(() => { void Promise.all([getProfile(), getPlants(), getObservations()]).then(([nextProfile, plants, notes]) => { setProfile(nextProfile); setPlantsCount(plants.length); setNotesCount(notes.length); }); }, []));
  const name = profile.displayName?.trim() || profile.login.trim() || profile.email.split('@')[0] || 'Пользователь';
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toLocaleUpperCase('ru-RU')).join('');
  const saveName = async () => { const clean = draft.trim(); if (!clean) return Alert.alert('Введите имя', 'Имя пользователя не должно быть пустым.'); const next = { ...profile, displayName: clean }; await saveProfile(next); setProfile(next); setEditing(false); };
  const logout = () => Alert.alert('Выйти из аккаунта?', 'Вы вернётесь на экран входа.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Выйти', style: 'destructive', onPress: async () => { await logoutFirebase().catch(() => undefined); await setSession(false); onSignOut(); } }]);

  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.kicker}>МОЙ ПОЛЕВОЙ ДНЕВНИК</Text><Text style={styles.title}>Профиль</Text>
    <View style={styles.hero}><View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View><Text style={styles.name}>{name}</Text><Text style={styles.email}>{profile.email || 'Email не указан'}</Text><View style={styles.heroTag}><Ionicons name="leaf-outline" size={14} color="#D3F2DF" /><Text style={styles.heroTagText}>AgroDoctor AI</Text></View></View>
    <View style={styles.stats}><View style={styles.stat}><Ionicons name="leaf-outline" size={20} color={theme.colors.leafDeep} /><Text style={styles.statValue}>{plantsCount}</Text><Text style={styles.statLabel}>растений</Text></View><View style={styles.stat}><Ionicons name="document-text-outline" size={20} color={theme.colors.tomato} /><Text style={styles.statValue}>{notesCount}</Text><Text style={styles.statLabel}>наблюдений</Text></View></View>
    <Text style={styles.sectionTitle}>Мои данные</Text><View style={styles.card}>
      <View style={styles.row}><View style={styles.rowIcon}><Ionicons name="person-outline" size={19} color={theme.colors.leafDeep} /></View><View style={styles.rowCopy}><Text style={styles.rowLabel}>Имя</Text><Text style={styles.rowValue}>{name}</Text></View><Pressable onPress={() => { setDraft(name); setEditing(true); }} style={styles.editButton} accessibilityLabel="Изменить имя"><Ionicons name="create-outline" size={19} color={theme.colors.leafDeep} /></Pressable></View>
      {editing && <View style={styles.editor}><TextInput value={draft} onChangeText={setDraft} maxLength={32} autoCapitalize="words" placeholder="Как вас называть?" style={styles.input} /><View style={styles.editorActions}><Pressable onPress={() => { void saveName(); }} style={styles.saveName}><Text style={styles.saveNameText}>Сохранить</Text></Pressable><Pressable onPress={() => setEditing(false)} style={styles.cancel}><Text style={styles.cancelText}>Отмена</Text></Pressable></View></View>}
      <View style={styles.divider} /><View style={styles.row}><View style={styles.rowIcon}><Ionicons name="mail-outline" size={19} color={theme.colors.leafDeep} /></View><View style={styles.rowCopy}><Text style={styles.rowLabel}>Email</Text><Text style={styles.rowValue}>{profile.email || 'Не указан'}</Text></View></View>
      <View style={styles.divider} /><View style={styles.row}><View style={styles.rowIcon}><Ionicons name="shield-checkmark-outline" size={19} color={theme.colors.leafDeep} /></View><View style={styles.rowCopy}><Text style={styles.rowLabel}>Вход</Text><Text style={styles.rowValue}>{firebaseConfigured ? 'Firebase Email/Password' : 'Учебный режим'}</Text></View></View>
    </View>
    <View style={styles.about}><Ionicons name="information-circle-outline" size={23} color={theme.colors.leafDeep} /><View style={{ flex: 1 }}><Text style={styles.aboutTitle}>О приложении</Text><Text style={styles.aboutText}>Карточки растений и наблюдения хранятся на этом устройстве. AI-подсказки помогают замечать изменения и не заменяют консультацию агронома.</Text></View></View>
    <Pressable onPress={logout} style={styles.logout}><Ionicons name="log-out-outline" size={19} color={theme.colors.danger} /><Text style={styles.logoutText}>Выйти из аккаунта</Text></Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 36, backgroundColor: 'rgba(247,249,245,.78)' }, kicker: { color: theme.colors.tomato, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, title: { color: theme.colors.ink, fontFamily: 'serif', fontSize: 32, fontWeight: 'bold', marginTop: 4, marginBottom: 17 },
  hero: { backgroundColor: theme.colors.leafDeep, borderRadius: 22, padding: 22, alignItems: 'center' }, avatar: { width: 74, height: 74, borderRadius: 37, backgroundColor: '#327354', borderWidth: 3, borderColor: '#BFE8CF', alignItems: 'center', justifyContent: 'center' }, initials: { color: '#FFF', fontFamily: 'serif', fontSize: 29, fontWeight: 'bold' }, name: { color: '#FFF', fontFamily: 'serif', fontSize: 23, fontWeight: 'bold', marginTop: 12 }, email: { color: '#D3E8DA', fontSize: 12, marginTop: 4 }, heroTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 13 }, heroTagText: { color: '#D3F2DF', fontSize: 11, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 10, marginTop: 13 }, stat: { flex: 1, minHeight: 95, backgroundColor: '#FFF', borderRadius: 15, padding: 13, justifyContent: 'space-between' }, statValue: { color: theme.colors.ink, fontSize: 23, fontWeight: '900' }, statLabel: { color: theme.colors.muted, fontSize: 11 },
  sectionTitle: { color: theme.colors.ink, fontFamily: 'serif', fontWeight: 'bold', fontSize: 20, marginTop: 26, marginBottom: 11 }, card: { backgroundColor: '#FFF', borderRadius: 17, padding: 15 }, row: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 46 }, rowIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: theme.colors.cucumberPale, alignItems: 'center', justifyContent: 'center' }, rowCopy: { flex: 1 }, rowLabel: { color: theme.colors.muted, fontSize: 10 }, rowValue: { color: theme.colors.ink, fontSize: 13, fontWeight: '800', marginTop: 2 }, editButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, divider: { height: 1, backgroundColor: theme.colors.line, marginVertical: 11 },
  editor: { marginTop: 10 }, input: { minHeight: 45, backgroundColor: theme.colors.canvas, borderWidth: 1, borderColor: theme.colors.line, borderRadius: 10, paddingHorizontal: 12, color: theme.colors.ink }, editorActions: { flexDirection: 'row', gap: 9, marginTop: 9 }, saveName: { backgroundColor: theme.colors.leafDeep, borderRadius: 9, paddingHorizontal: 13, paddingVertical: 11 }, saveNameText: { color: '#FFF', fontWeight: '900' }, cancel: { paddingHorizontal: 13, paddingVertical: 11 }, cancelText: { color: theme.colors.inkSoft, fontWeight: '800' },
  about: { flexDirection: 'row', gap: 11, backgroundColor: '#E6F3EA', borderRadius: 15, padding: 15, marginTop: 21 }, aboutTitle: { color: theme.colors.ink, fontFamily: 'serif', fontSize: 16, fontWeight: 'bold' }, aboutText: { color: theme.colors.inkSoft, lineHeight: 18, fontSize: 11, marginTop: 4 }, logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 22, minHeight: 48, borderWidth: 1, borderColor: '#E9C6CD', borderRadius: 12 }, logoutText: { color: theme.colors.danger, fontWeight: '900' },
});
