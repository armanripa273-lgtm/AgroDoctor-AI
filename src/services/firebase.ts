import { FirebaseError, getApp, getApps, initializeApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FirebaseAuth from 'firebase/auth';
import { Auth, createUserWithEmailAndPassword, getAuth, initializeAuth, Persistence, reload, sendEmailVerification, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBLFlcB2RJxw-p55cjqKlWYHIPU0tz_Zhg',
  authDomain: 'agrodoctor-ai.firebaseapp.com',
  projectId: 'agrodoctor-ai',
  storageBucket: 'agrodoctor-ai.firebasestorage.app',
  messagingSenderId: '552657137540',
  appId: '1:552657137540:web:c2f87b03d26a266e3ef7d1'
};

export const firebaseConfigured = !firebaseConfig.apiKey.startsWith('YOUR_');
let auth: Auth | null = null;
if (firebaseConfigured) {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const reactNativeAuth = FirebaseAuth as typeof FirebaseAuth & {
    getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
  };
  try {
    auth = initializeAuth(app, {
      persistence: reactNativeAuth.getReactNativePersistence(AsyncStorage)
    });
  } catch {
    // При Fast Refresh экземпляр Auth уже создан с AsyncStorage persistence.
    auth = getAuth(app);
  }
}

export async function registerAndSendVerification(email: string, password: string) {
  if (!auth) throw new Error('Firebase ещё не настроен. Используйте деморежим или добавьте конфигурацию Firebase.');
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(credential.user);
    return 'sent' as const;
  } catch (error) {
    if (!(error instanceof FirebaseError) || error.code !== 'auth/email-already-in-use') throw error;
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await reload(credential.user);
    if (credential.user.emailVerified) return 'verified' as const;
    await sendEmailVerification(credential.user);
    return 'sent' as const;
  }
}

export async function verifyFirebaseEmail(email: string, password: string) {
  if (!auth) throw new Error('Firebase ещё не настроен.');
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await reload(credential.user);
  if (!credential.user.emailVerified) { await signOut(auth); throw new Error('Сначала откройте письмо Firebase и подтвердите email.'); }
  return credential.user;
}

export async function resendFirebaseVerification(email: string, password: string) {
  if (!auth) throw new Error('Firebase ещё не настроен.');
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await reload(credential.user);
  if (credential.user.emailVerified) return false;
  await sendEmailVerification(credential.user);
  return true;
}
