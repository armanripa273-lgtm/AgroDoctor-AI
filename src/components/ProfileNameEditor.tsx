import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { getProfile, saveProfile, UserProfile } from '../services/storage';
import { theme } from '../theme';

function initialName(profile: UserProfile) {
  return profile.displayName?.trim() || profile.login.trim() || profile.email.split('@')[0] || 'Пользователь';
}

export default function ProfileNameEditor() {
  const [profile, setProfile] = useState<UserProfile>({ login: '', email: '' });
  const [name, setName] = useState('Пользователь');
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);

  useFocusEffect(useCallback(() => {
    getProfile().then(value => {
      setProfile(value);
      setName(initialName(value));
    });
  }, []));

  const beginEditing = () => { setDraft(name); setEditing(true); };
  const save = async () => {
    const cleanName = draft.trim();
    if (!cleanName) return Alert.alert('Введите имя', 'Имя пользователя не должно быть пустым.');
    const next = { ...profile, displayName: cleanName };
    await saveProfile(next);
    setProfile(next);
    setName(cleanName);
    setEditing(false);
  };

  return <View style={styles.container}>
    <Text style={styles.name}>{name}</Text>
    {editing ? <>
      <TextInput value={draft} onChangeText={setDraft} placeholder="Как вас называть?" maxLength={32} autoCapitalize="words" returnKeyType="done" style={styles.input} />
      <View style={styles.actions}>
        <Pressable onPress={() => void save()} style={styles.save}><Text style={styles.saveText}>Сохранить</Text></Pressable>
        <Pressable onPress={() => setEditing(false)} style={styles.cancel}><Text style={styles.cancelText}>Отмена</Text></Pressable>
      </View>
    </> : <Pressable onPress={beginEditing} style={styles.editButton}><Text style={styles.editText}>Изменить имя пользователя</Text></Pressable>}
  </View>;
}

export function ProfileInitials() {
  const [initials, setInitials] = useState('П');
  useFocusEffect(useCallback(() => {
    getProfile().then(profile => {
      const name = initialName(profile);
      setInitials(name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toLocaleUpperCase('ru-RU')).join(''));
    });
  }, []));
  return <Text style={styles.initials}>{initials}</Text>;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginTop: 13, width: '100%' },
  name: { color: theme.colors.ink, fontSize: 25, fontWeight: '900' },
  initials: { color: '#FFF', fontSize: 29, fontWeight: '900' },
  editButton: { paddingHorizontal: 12, paddingVertical: 9, marginTop: 3, minHeight: 40, justifyContent: 'center' },
  editText: { color: theme.colors.leaf, fontWeight: '900', fontSize: 13 },
  input: { width: '100%', marginTop: 12, borderWidth: 1, borderColor: '#D8DECD', borderRadius: 11, padding: 12, color: theme.colors.ink, backgroundColor: theme.colors.paper },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  save: { backgroundColor: theme.colors.leaf, borderRadius: 9, paddingHorizontal: 17, paddingVertical: 11, minHeight: 42, justifyContent: 'center' },
  saveText: { color: '#FFF', fontWeight: '900' },
  cancel: { borderWidth: 1, borderColor: '#D8DECD', borderRadius: 9, paddingHorizontal: 17, paddingVertical: 11, minHeight: 42, justifyContent: 'center' },
  cancelText: { color: '#506B5A', fontWeight: '800' },
});
