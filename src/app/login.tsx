import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NellaColors, NellaFonts } from '@/constants/theme';
import { useAuthUser } from '@/hooks/useAuthUser';
import { loginUser, resetPassword } from '@/services/auth';

const RED  = NellaColors.red;
const GOLD = NellaColors.gold;

function authErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':   return 'Correo o contraseña incorrectos.';
    case 'auth/wrong-password':        return 'Contraseña incorrecta.';
    case 'auth/invalid-email':         return 'El correo electrónico no es válido.';
    case 'auth/user-disabled':         return 'Esta cuenta ha sido deshabilitada.';
    case 'auth/too-many-requests':     return 'Demasiados intentos. Intenta más tarde.';
    default:                           return 'Error al iniciar sesión. Intenta de nuevo.';
  }
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuthUser();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError]               = useState('');

  if (authLoading) return null;
  if (user) return <Redirect href={user.emailVerified ? '/(tabs)/home' : '/verify-email'} />;

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico para recuperar tu contraseña.');
      return;
    }
    setError('');
    setResetLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      Alert.alert(
        'Correo enviado',
        `Te enviamos un enlace para restablecer tu contraseña a ${email.trim().toLowerCase()}.\n\nRevisa tu bandeja de entrada.`,
        [{ text: 'Aceptar' }]
      );
    } catch (e: any) {
      const code = e.code ?? '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email' || code === 'auth/invalid-credential') {
        setError('No encontramos una cuenta con ese correo.');
      } else {
        setError('No se pudo enviar el correo. Intenta de nuevo.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Completa todos los campos.');
      return;
    }
    setLoading(true);
    try {
      const loggedIn = await loginUser(email.trim().toLowerCase(), password);
      if (loggedIn.emailVerified) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/verify-email');
      }
    } catch (e: any) {
      setError(authErrorMessage(e.code ?? ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('@/assets/images/fondo plantilla 1.png')}
      style={s.root}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={s.logoWrap}>
            <Image
              source={require('@/assets/images/LOGO SIN FONDO.png')}
              style={s.logo}
              contentFit="contain"
            />
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.title}>Iniciar Sesión</Text>
            <Text style={s.subtitle}>Bienvenido de nuevo</Text>
            <View style={s.divider} />

            {/* Error */}
            {!!error && (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {/* Email */}
            <View style={s.fieldGroup}>
              <Text style={s.label}>Correo electrónico</Text>
              <View style={s.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={`${RED}88`} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="tu@correo.com"
                  placeholderTextColor={NellaColors.lightGray}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Contraseña */}
            <View style={s.fieldGroup}>
              <Text style={s.label}>Contraseña</Text>
              <View style={s.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={`${RED}88`} style={s.inputIcon} />
                <TextInput
                  style={[s.input, s.inputPassword]}
                  placeholder="Tu contraseña"
                  placeholderTextColor={NellaColors.lightGray}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={8} style={s.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={`${RED}88`} />
                </Pressable>
              </View>
            </View>

            {/* Botón iniciar sesión */}
            <Pressable
              style={({ pressed }) => [s.btnPrimary, pressed && s.btnPressed]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={s.btnPrimaryText}>Iniciar Sesión</Text>
              }
            </Pressable>

            {/* Links */}
            <Pressable
              style={s.link}
              onPress={handleForgotPassword}
              disabled={resetLoading}
            >
              {resetLoading
                ? <ActivityIndicator size="small" color={GOLD} />
                : <Text style={s.linkText}>¿Olvidaste tu contraseña?</Text>
              }
            </Pressable>

            <View style={s.registerRow}>
              <Text style={s.registerText}>¿No tienes cuenta? </Text>
              <Pressable onPress={() => router.push('/register')}>
                <Text style={s.registerLink}>Regístrate</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  kav:  { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 16 },

  logoWrap: { alignItems: 'center', marginBottom: 8 },
  logo: { width: 130, height: 86 },

  card: {
    backgroundColor: 'rgba(251,243,226,0.96)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: GOLD,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontFamily: NellaFonts.display,
    fontSize: 32,
    color: RED,
    textAlign: 'center',
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: NellaFonts.italic,
    fontSize: 15,
    color: NellaColors.bodyGray,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 12,
  },
  divider: {
    height: 1.5,
    backgroundColor: GOLD,
    borderRadius: 1,
    marginBottom: 18,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    fontFamily: NellaFonts.bold,
    fontSize: 13,
    color: '#B91C1C',
    flex: 1,
  },

  fieldGroup: { marginBottom: 16 },
  label: {
    fontFamily: NellaFonts.bold,
    fontSize: 14,
    color: RED,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: `${RED}30`,
  },
  inputIcon: { paddingLeft: 12 },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 13,
    fontFamily: NellaFonts.regular,
    fontSize: 16,
    color: NellaColors.titleDark,
  },
  inputPassword: { paddingRight: 0 },
  eyeBtn: { paddingHorizontal: 12 },

  btnPrimary: {
    backgroundColor: RED,
    borderRadius: 13,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
    shadowColor: RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
    elevation: 4,
  },
  btnPressed: { opacity: 0.75 },
  btnPrimaryText: {
    fontFamily: NellaFonts.display,
    color: '#FFF',
    fontSize: 19,
    letterSpacing: 0.5,
  },

  link: { alignItems: 'center', marginBottom: 14 },
  linkText: {
    fontFamily: NellaFonts.italic,
    fontSize: 14,
    color: GOLD,
    textDecorationLine: 'underline',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontFamily: NellaFonts.regular,
    fontSize: 15,
    color: NellaColors.bodyGray,
  },
  registerLink: {
    fontFamily: NellaFonts.bold,
    fontSize: 15,
    color: RED,
    textDecorationLine: 'underline',
  },
});
