import AsyncStorage from '@react-native-async-storage/async-storage';
import { Observation, Plant } from '../types';
const KEYS = { session: '@agro/session', plants: '@agro/plants', observations: '@agro/observations' };
export type UserProfile = { login: string; email: string; displayName?: string };
async function read<T>(key: string, fallback: T): Promise<T> { const raw = await AsyncStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; }
export const getSession = async () => (await AsyncStorage.getItem(KEYS.session)) === 'true';
export const setSession = (value: boolean) => AsyncStorage.setItem(KEYS.session, String(value));
export const getProfile = () => read<UserProfile>('@agro/profile', { login: '', email: '' });
export const saveProfile = async (profile: UserProfile) => { const existing = await getProfile(); const sameUser = existing.email.toLowerCase() === profile.email.toLowerCase(); const next = sameUser && existing.displayName ? { ...profile, displayName: existing.displayName } : profile; await AsyncStorage.setItem('@agro/profile', JSON.stringify(next)); };
export const getPlants = () => read<Plant[]>(KEYS.plants, []);
export const savePlant = async (plant: Plant) => { const all = await getPlants(); await AsyncStorage.setItem(KEYS.plants, JSON.stringify([plant, ...all])); };
export const getObservations = () => read<Observation[]>(KEYS.observations, []);
export const saveObservation = async (observation: Observation) => { const all = await getObservations(); await AsyncStorage.setItem(KEYS.observations, JSON.stringify([observation, ...all])); };
