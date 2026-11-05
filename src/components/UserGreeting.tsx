import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { getProfile } from '../services/storage';
import { theme } from '../theme';

function profileName(login: string, email: string) {
  return login.trim() || email.split('@')[0] || 'пользователь';
}

export function UserGreeting({ style }: { style?: StyleProp<TextStyle> }) {
  const [name, setName] = useState('пользователь');
  useFocusEffect(useCallback(() => {
    getProfile().then(profile => setName(profile.displayName?.trim() || profileName(profile.login, profile.email)));
  }, []));
  return <Text style={[styles.greeting, style]}>Здравствуйте, {name} 👋</Text>;
}

export function CurrentUserName({ style }: { style?: StyleProp<TextStyle> }) {
  const [name, setName] = useState('Пользователь');
  useFocusEffect(useCallback(() => {
    getProfile().then(profile => setName(profile.displayName?.trim() || profileName(profile.login, profile.email)));
  }, []));
  return <Text style={style}>{name}</Text>;
}

const styles = StyleSheet.create({ greeting: { color: theme.colors.inkSoft, fontWeight: '700', fontSize: 15 } });
