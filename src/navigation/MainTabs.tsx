import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../types';
import HomeScreen from '../screens/HomeScreen';
import ServicesScreen from '../screens/ServicesScreen';
import PlantsScreen from '../screens/PlantsScreen';
import CatalogScreen from '../screens/CatalogScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';
const Tab = createBottomTabNavigator<TabParamList>();
const icons: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = { Главная: 'home-outline', Сервисы: 'grid-outline', Растения: 'leaf-outline', Каталог: 'book-outline', Профиль: 'person-outline' };
export default function MainTabs({ onSignOut }: { onSignOut: () => void }) { return <Tab.Navigator screenOptions={({ route }) => ({ headerShown: false, sceneStyle: { backgroundColor: 'transparent' }, tabBarActiveTintColor: '#237A57', tabBarInactiveTintColor: '#819188', tabBarStyle: { height: 64, paddingTop: 5, backgroundColor: 'rgba(255,255,255,.94)' }, tabBarLabelStyle: { fontSize: 10, fontWeight: '700' }, tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? icons[route.name].replace('-outline', '') as keyof typeof Ionicons.glyphMap : icons[route.name]} size={22} color={color} /> })}><Tab.Screen name="Главная" component={HomeScreen} /><Tab.Screen name="Сервисы" component={ServicesScreen} /><Tab.Screen name="Растения" component={PlantsScreen} /><Tab.Screen name="Каталог" component={CatalogScreen} /><Tab.Screen name="Профиль">{() => <ProfileScreen onSignOut={onSignOut} />}</Tab.Screen></Tab.Navigator>; }
