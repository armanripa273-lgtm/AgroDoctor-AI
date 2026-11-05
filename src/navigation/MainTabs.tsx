import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../types';
import HomeScreen from '../screens/HomeScreen';
import ServicesScreen from '../screens/ServicesScreen';
import PlantsScreen from '../screens/PlantsScreen';
import CatalogScreen from '../screens/CatalogScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';
const Tab = createBottomTabNavigator<TabParamList>();
const icons: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = { Главная: 'home-outline', Сервисы: 'grid-outline', Растения: 'leaf-outline', Каталог: 'book-outline', Профиль: 'person-outline' };
export default function MainTabs({ onSignOut }: { onSignOut: () => void }) { return <Tab.Navigator screenOptions={({ route }) => ({ headerShown: false, sceneStyle: { backgroundColor: 'transparent' }, tabBarActiveTintColor: theme.colors.leaf, tabBarInactiveTintColor: '#748378', tabBarStyle: { height: 70, paddingTop: 7, paddingBottom: 5, backgroundColor: theme.colors.paper, borderTopColor: '#E7E8D9', borderTopWidth: 1, elevation: 0 }, tabBarLabelStyle: { fontSize: 10, fontWeight: '800', marginTop: 1 }, tabBarIcon: ({ color, focused }) => <View style={[styles.iconCell, focused && styles.iconCellActive]}><Ionicons name={focused ? icons[route.name].replace('-outline', '') as keyof typeof Ionicons.glyphMap : icons[route.name]} size={21} color={color} /></View> })}><Tab.Screen name="Главная" component={HomeScreen} /><Tab.Screen name="Сервисы" component={ServicesScreen} /><Tab.Screen name="Растения" component={PlantsScreen} /><Tab.Screen name="Каталог" component={CatalogScreen} /><Tab.Screen name="Профиль">{() => <ProfileScreen onSignOut={onSignOut} />}</Tab.Screen></Tab.Navigator>; }
const styles = StyleSheet.create({ iconCell: { width: 38, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 11 }, iconCellActive: { backgroundColor: '#E2F0DF' } });
