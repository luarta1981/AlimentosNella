import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';

// ─── Registro ─────────────────────────────────────────────────────────────────

export async function registerUser(
  email: string,
  password: string,
  displayName: string,
  extras?: { cedula?: string; phone?: string; address?: string }
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  await updateProfile(user, { displayName });
  await sendEmailVerification(user);

  await setDoc(doc(db, 'usuarios', user.uid), {
    uid:         user.uid,
    email:       user.email,
    displayName,
    role:        'cliente',
    ...(extras?.cedula  ? { cedula:  extras.cedula }  : {}),
    ...(extras?.phone   ? { phone:   extras.phone }   : {}),
    ...(extras?.address ? { address: extras.address } : {}),
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
  });

  return user;
}

// ─── Inicio de sesión ─────────────────────────────────────────────────────────

export async function loginUser(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// ─── Cerrar sesión ────────────────────────────────────────────────────────────

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// ─── Recuperar contraseña ─────────────────────────────────────────────────────

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// ─── Observador de sesión ─────────────────────────────────────────────────────

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ─── Reenviar verificación de correo ─────────────────────────────────────────

export async function resendVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No hay sesión activa.');
  await sendEmailVerification(user);
}

// ─── Usuario actual ───────────────────────────────────────────────────────────

export function getCurrentUser(): User | null {
  return auth.currentUser;
}
