import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NellaColors, NellaFonts } from '@/constants/theme';
import { auth } from '@/lib/firebase';
import { logoutUser, resendVerificationEmail } from '@/services/auth';

const RED  = NellaColors.red;
const GOLD = NellaColors.gold;

export default function VerifyEmailScreen() {
  const insets = useSafeAreaInsets();
  const email  = auth.currentUser?.email ?? '';

  const [checking, setChecking]   = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [error, setError]         = useState('');

  const handleCheckVerified = async () => {
    setError('');
    setResendMsg('');
    setChecking(true);
    try {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        router.replace('/(tabs)/home');
      } else {
        setError('Tu correo aún no ha sido verificado. Revisa tu bandeja de entrada.');
      }
    } catch {
      setError('No se pudo verificar. Intenta de nuevo.');
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResendMsg('');
    setResending(true);
    try {
      await resendVerificationEmail();
      setResendMsg('Correo de verificación enviado. Revisa tu bandeja de entrada.');
    } catch (e: any) {
      if (e?.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Espera unos minutos e intenta de nuevo.');
      } else {
        setError('No se pudo reenviar el correo. Intenta más tarde.');
      }
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.replace('/login');
  };

  return (
    <ImageBackground
      source={require('@/assets/images/fondo plantilla 1.png')}
      style={s.root}
      resizeMode="cover"
    >
      <View style={[s.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        {/* Logo */}
        <Image
          source={require('@/assets/images/LOGO SIN FONDO.png')}
          style={s.logo}
          contentFit="contain"
        />

        {/* Card */}
        <View style={s.card}>
          {/* Ícono */}
          <View style={s.iconWrap}>
            <Ionicons name="mail-unread-outline" size={52} color={GOLD} />
          </View>

          <Text style={s.title}>Verifica tu correo</Text>
          <Text style={s.subtitle}>
            Te enviamos un enlace de verificación a:
          </Text>
          <Text style={s.email}>{email}</Text>
          <Text style={s.hint}>
            Abre el correo y toca el enlace para activar tu cuenta. Luego regresa aquí y presiona el botón de abajo.
          </Text>

          {/* Feedback */}
          {!!error && (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}
          {!!resendMsg && (
            <View style={s.successBox}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#166534" />
              <Text style={s.successText}>{resendMsg}</Text>
            </View>
          )}

          {/* Ya verifiqué */}
          <Pressable
            style={({ pressed }) => [s.btnPrimary, pressed && { opacity: 0.8 }]}
            onPress={handleCheckVerified}
            disabled={checking}
          >
            {checking
              ? <ActivityIndicator color="#FFF" />
              : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                  <Text style={s.btnPrimaryText}>Ya verifiqué mi correo</Text>
                </>
              )
            }
          </Pressable>

          {/* Reenviar */}
          <Pressable
            style={({ pressed }) => [s.btnOutline, pressed && { opacity: 0.7 }]}
            onPress={handleResend}
            disabled={resending}
          >
            {resending
              ? <ActivityIndicator color={GOLD} size="small" />
              : (
                <>
                  <Ionicons name="refresh-outline" size={18} color={GOLD} />
                  <Text style={s.btnOutlineText}>Reenviar correo de verificación</Text>
                </>
              )
            }
          </Pressable>

          {/* Cerrar sesión */}
          <Pressable style={s.logoutBtn} onPress={handleLogout}>
            <Text style={s.logoutText}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },

  logo: { width: 110, height: 74 },

  card: {
    width: '100%',
    backgroundColor: 'rgba(251,243,226,0.97)',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: GOLD,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },

  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${GOLD}18`,
    borderWidth: 2,
    borderColor: `${GOLD}55`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },

  title: {
    fontFamily: NellaFonts.display,
    fontSize: 30,
    color: RED,
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: NellaFonts.regular,
    fontSize: 14,
    color: NellaColors.bodyGray,
    textAlign: 'center',
  },
  email: {
    fontFamily: NellaFonts.bold,
    fontSize: 15,
    color: RED,
    textAlign: 'center',
  },
  hint: {
    fontFamily: NellaFonts.italic,
    fontSize: 13,
    color: NellaColors.bodyGray,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 2,
    marginBottom: 4,
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
    width: '100%',
  },
  errorText: {
    fontFamily: NellaFonts.bold,
    fontSize: 13,
    color: '#B91C1C',
    flex: 1,
  },

  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 10,
    width: '100%',
  },
  successText: {
    fontFamily: NellaFonts.bold,
    fontSize: 13,
    color: '#166534',
    flex: 1,
  },

  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: RED,
    borderRadius: 13,
    height: 52,
    width: '100%',
    marginTop: 4,
    shadowColor: RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
    elevation: 4,
  },
  btnPrimaryText: {
    fontFamily: NellaFonts.display,
    color: '#FFF',
    fontSize: 18,
  },

  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderRadius: 13,
    height: 48,
    width: '100%',
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  btnOutlineText: {
    fontFamily: NellaFonts.bold,
    color: GOLD,
    fontSize: 14,
  },

  logoutBtn: {
    marginTop: 4,
    paddingVertical: 4,
  },
  logoutText: {
    fontFamily: NellaFonts.italic,
    fontSize: 13,
    color: NellaColors.bodyGray,
    textDecorationLine: 'underline',
  },
});
