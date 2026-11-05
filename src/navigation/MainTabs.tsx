import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import HomeScreen from '../screens/HomeScreen';
import ServicesScreen from '../screens/ServicesScreen';
import PlantsScreen from '../screens/PlantsScreen';
import CatalogScreen from '../screens/CatalogScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { theme } from '../theme';
import { TabParamList } from '../types';

const Tab = createBottomTabNavigator<TabParamList>();
const visibleTabs = [
  { name: 'Главная', icon: 'home-outline', activeIcon: 'home' },
  { name: 'Сервисы', icon: 'grid-outline', activeIcon: 'grid' },
  { name: 'Растения', icon: 'leaf-outline', activeIcon: 'leaf' },
  { name: 'Каталог', icon: 'book-outline', activeIcon: 'book' },
] as const;

function GardenTabBar({ state, navigation, onScan }: BottomTabBarProps & { onScan: () => void }) {
  const renderTab = (name: typeof visibleTabs[number]['name']) => {
    const tab = visibleTabs.find(item => item.name === name)!;
    const focused = state.routes[state.index]?.name === name;
    return <Pressable key={name} onPress={() => navigation.navigate(name)} accessibilityRole="button" accessibilityLabel={name} accessibilityState={{ selected: focused }} style={styles.tab}>
      <Ionicons name={(focused ? tab.activeIcon : tab.icon) as keyof typeof Ionicons.glyphMap} size={21} color={focused ? theme.colors.leafDeep : theme.colors.inkSoft} />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{name}</Text>
    </Pressable>;
  };
  return <SafeAreaView edges={['bottom']} style={styles.barArea}><View style={styles.bar}>
    {renderTab('Главная')}{renderTab('Сервисы')}
    <Pressable onPress={onScan} accessibilityRole="button" accessibilityLabel="Сфотографировать растение для анализа" style={styles.scanButton}><Ionicons name="scan-outline" size={28} color="#FFF" /></Pressable>
    {renderTab('Растения')}{renderTab('Каталог')}
  </View></SafeAreaView>;
}

export default function MainTabs({ onSignOut }: { onSignOut: () => void }) {
  const rootNavigation = useNavigation<any>();
  return <View style={styles.root}>
    <AppHeader onReminders={() => rootNavigation.navigate('Reminders')} onProfile={() => rootNavigation.navigate('Main', { screen: 'Профиль' })} />
    <Tab.Navigator screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }} tabBar={props => <GardenTabBar {...props} onScan={() => rootNavigation.navigate('Diagnosis')} />}>
      <Tab.Screen name="Главная" component={HomeScreen} />
      <Tab.Screen name="Сервисы" component={ServicesScreen} />
      <Tab.Screen name="Растения" component={PlantsScreen} />
      <Tab.Screen name="Каталог" component={CatalogScreen} />
      <Tab.Screen name="Профиль">{() => <ProfileScreen onSignOut={onSignOut} />}</Tab.Screen>
    </Tab.Navigator>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  barArea: { backgroundColor: 'rgba(247,249,245,.82)', paddingTop: 6, paddingHorizontal: 14 },
  bar: { height: 65, borderRadius: 34, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 5, shadowColor: theme.colors.leafDeep, shadowOpacity: .11, shadowRadius: 14, elevation: 7, borderWidth: 1, borderColor: theme.colors.line },
  tab: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabLabel: { color: theme.colors.inkSoft, fontSize: 10, fontWeight: '700' }, tabLabelActive: { color: theme.colors.leafDeep, fontWeight: '900' },
  scanButton: { width: 58, height: 58, marginTop: -21, borderRadius: 29, backgroundColor: theme.colors.leafDeep, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF', shadowColor: theme.colors.leafDeep, shadowOpacity: .28, shadowRadius: 10, elevation: 8 },
});
