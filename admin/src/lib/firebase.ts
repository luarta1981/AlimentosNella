import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyC1XqopB0mFbRuCjNzZlU_S3Q9JIsZTulQ',
  authDomain: 'alimentosnella.firebaseapp.com',
  projectId: 'alimentosnella',
  storageBucket: 'alimentosnella.firebasestorage.app',
  messagingSenderId: '80774196131',
  appId: '1:80774196131:web:39f14c39e42725f9e60816',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export const storage = getStorage(app);
export default app;
