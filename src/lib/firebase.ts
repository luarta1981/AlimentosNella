import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ─── Configuración del proyecto Firebase ──────────────────────────────────────
// Obtén estos valores desde: https://console.firebase.google.com
// → Tu proyecto → Configuración del proyecto → Tus apps → Web app

const firebaseConfig = {
  apiKey:            'AIzaSyC1XqopB0mFbRuCjNzZlU_S3Q9JIsZTulQ',
  authDomain:        'alimentosnella.firebaseapp.com',
  projectId:         'alimentosnella',
  storageBucket:     'alimentosnella.firebasestorage.app',
  messagingSenderId: '80774196131',
  appId:             '1:80774196131:web:39f14c39e42725f9e60816',
  measurementId:     'G-YBCQ1S2RQ2',
};

// ─── Inicialización ───────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);

// Auth con persistencia en AsyncStorage (mantiene sesión entre reinicios)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore database
export const db = getFirestore(app);

export default app;
