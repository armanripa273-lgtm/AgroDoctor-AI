import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import MainTabs from './src/navigation/MainTabs';
import DetailsScreen from './src/screens/DetailsScreen';
import AddPlantScreen from './src/screens/AddPlantScreen';
import DiagnosisScreen from './src/screens/DiagnosisScreen';
import AssistantScreen from './src/screens/AssistantScreen';
import RemindersScreen from './src/screens/RemindersScreen';
import { RootStackParamList } from './src/types';
import { getSession } from './src/services/storage';
import { theme } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent', card: theme.colors.paper, text: theme.colors.ink, border: theme.colors.line, primary: theme.colors.leaf } };

export default function App() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { getSession().then(value => { setSignedIn(value); setReady(true); }); }, []);
  if (!ready) return <View style={styles.loader}><ActivityIndicator size="large" color={theme.colors.leaf} /></View>;
  return <SafeAreaProvider><ImageBackground source={require('./assets/botanical-background.png')} style={styles.background} imageStyle={styles.backgroundImage}><NavigationContainer theme={navigationTheme}><StatusBar style="dark" />
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' }, headerStyle: { backgroundColor: theme.colors.paper }, headerTintColor: theme.colors.ink, headerTitleStyle: { fontWeight: '800' } }}>
      {signedIn ? <><Stack.Screen name="Main">{() => <MainTabs onSignOut={() => setSignedIn(false)} />}</Stack.Screen><Stack.Screen name="Details" component={DetailsScreen} options={{ headerShown: true, title: 'Подробнее' }} /><Stack.Screen name="Diagnosis" component={DiagnosisScreen} options={{ headerShown: true, title: 'AI-анализ' }} /><Stack.Screen name="Assistant" component={AssistantScreen} options={{ headerShown: true, title: 'AI-чат' }} /><Stack.Screen name="Reminders" component={RemindersScreen} options={{ headerShown: true, title: 'Напоминания' }} /><Stack.Screen name="AddPlant" component={AddPlantScreen} options={{ headerShown: true, title: 'Новое наблюдение' }} /></> : <Stack.Screen name="Login">{() => <LoginScreen onSuccess={() => setSignedIn(true)} />}</Stack.Screen>}
    </Stack.Navigator>
  </NavigationContainer></ImageBackground></SafeAreaProvider>;
}
const styles = StyleSheet.create({ background: { flex: 1, backgroundColor: theme.colors.canvas }, backgroundImage: { opacity: 1 }, loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.canvas } });
