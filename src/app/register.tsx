import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NellaColors, NellaFonts } from '@/constants/theme';
import { registerUser } from '@/services/auth';

function PersonIcon() {
  return (
    <View style={iconStyles.wrapper}>
      <View style={iconStyles.head} />
      <View style={iconStyles.body} />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#5C4A1E',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginRight: 10,
  },
  head: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FBF3E2',
    position: 'absolute',
    top: 6,
  },
  body: {
    width: 26,
    height: 16,
    borderRadius: 13,
    backgroundColor: '#FBF3E2',
    marginBottom: -4,
  },
});

type Field = {
  key: string;
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words';
};

const FIELDS: Field[] = [
  { key: 'nombre',    label: 'Nombre completo',      placeholder: 'Ej: María González',       autoCapitalize: 'words' },
  { key: 'cedula',    label: 'Cédula de identidad',  placeholder: 'Ej: 1234567890',           keyboardType: 'numeric' },
  { key: 'telefono',  label: 'Teléfono',             placeholder: 'Ej: 0991234567',           keyboardType: 'phone-pad' },
  { key: 'correo',    label: 'Correo electrónico',   placeholder: 'Ej: maria@correo.com',     keyboardType: 'email-address', autoCapitalize: 'none' },
  { key: 'direccion', label: 'Dirección de entrega', placeholder: 'Calle, número, referencia', autoCapitalize: 'sentences' },
  { key: 'ciudad',    label: 'Ciudad',               placeholder: 'Ej: Quito',                autoCapitalize: 'words' },
];

function authErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'Este correo ya está registrado.';
    case 'auth/invalid-email':        return 'El correo electrónico no es válido.';
    case 'auth/weak-password':        return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/too-many-requests':    return 'Demasiados intentos. Intenta más tarde.';
    default:                          return 'Error al registrarse. Intenta de nuevo.';
  }
}

export default function RegisterScreen() {
  const [values, setValues]       = useState<Record<string, string>>({});
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [accepted, setAccepted]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const update = (key: string, val: string) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const handleRegister = async () => {
    setError('');
    if (!values.nombre?.trim() || !values.correo?.trim() || !password) {
      setError('Nombre, correo y contraseña son obligatorios.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!accepted) {
      setError('Debes aceptar los Términos y Condiciones.');
      return;
    }
    setLoading(true);
    try {
      await registerUser(
        values.correo.trim().toLowerCase(),
        password,
        values.nombre.trim(),
        {
          cedula:  values.cedula?.trim()    || undefined,
          phone:   values.telefono?.trim()  || undefined,
          address: values.direccion?.trim() || undefined,
        }
      );
      router.replace('/(tabs)/home');
    } catch (e: any) {
      setError(authErrorMessage(e.code ?? ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <Image
            source={require('@/assets/images/LOGO SIN FONDO.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <PersonIcon />
              <Text style={styles.title}>Registro</Text>
            </View>
            <Text style={styles.cardSubtitle}>Persona Natural</Text>
            <View style={styles.divider} />
          </View>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Campos */}
          {FIELDS.map((f) => (
            <View key={f.key} style={styles.fieldGroup}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={styles.input}
                placeholder={f.placeholder}
                placeholderTextColor={NellaColors.lightGray}
                value={values[f.key] ?? ''}
                onChangeText={(v) => update(f.key, v)}
                keyboardType={f.keyboardType ?? 'default'}
                autoCapitalize={f.autoCapitalize ?? 'sentences'}
              />
            </View>
          ))}

          {/* Contraseña */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={NellaColors.lightGray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={8} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={`${NellaColors.red}88`} />
              </Pressable>
            </View>
          </View>

          {/* Confirmar contraseña */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="Repite tu contraseña"
                placeholderTextColor={NellaColors.lightGray}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showConf}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowConf((v) => !v)} hitSlop={8} style={styles.eyeBtn}>
                <Ionicons name={showConf ? 'eye-off-outline' : 'eye-outline'} size={18} color={`${NellaColors.red}88`} />
              </Pressable>
            </View>
          </View>

          {/* Términos */}
          <Pressable
            style={styles.checkRow}
            onPress={() => setAccepted((v) => !v)}
          >
            <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
              {accepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>
              Acepto los{' '}
              <Text style={styles.checkLink}>Términos y Condiciones</Text>
              {' '}y la{' '}
              <Text style={styles.checkLink}>Política de Privacidad</Text>
            </Text>
          </Pressable>

          {/* Botón Registrar */}
          <Pressable
            style={({ pressed }) => [
              styles.btnPrimary,
              (!accepted || loading) && styles.btnDisabled,
              pressed && accepted && !loading && styles.btnPressed,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.btnPrimaryText}>Registrar</Text>
            }
          </Pressable>

          {/* Link empresa */}
          <Pressable
            style={styles.loginLink}
            onPress={() => router.push('/register-empresa')}
          >
            <Text style={styles.loginLinkText}>
              ¿Registrar como empresa?{' '}
              <Text style={styles.loginLinkBold}>Persona Jurídica</Text>
            </Text>
          </Pressable>

          {/* Link login */}
          <Pressable
            style={[styles.loginLink, { marginTop: 4 }]}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginLinkText}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.loginLinkBold}>Iniciar Sesión</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // Logo
  logoRow: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 2,
  },
  logo: {
    width: 120,
    height: 82,
  },

  // Card
  card: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(251,243,226,0.92)',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },

  cardHeader: {
    marginBottom: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: NellaFonts.display,
    fontSize: 34,
    color: NellaColors.red,
    lineHeight: 40,
  },
  cardSubtitle: {
    fontFamily: NellaFonts.bold,
    fontSize: 18,
    color: NellaColors.gold,
    marginBottom: 12,
    textAlign: 'center',
  },
  divider: {
    height: 1.5,
    backgroundColor: NellaColors.gold,
    opacity: 0.4,
    borderRadius: 1,
  },

  // Campos
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontFamily: NellaFonts.bold,
    fontSize: 14,
    color: NellaColors.red,
    marginBottom: 5,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(139,0,0,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: NellaFonts.regular,
    fontSize: 16,
    color: NellaColors.titleDark,
  },

  // Checkbox
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    marginBottom: 20,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: NellaColors.red,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxActive: {
    backgroundColor: NellaColors.red,
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  checkLabel: {
    fontFamily: NellaFonts.regular,
    fontSize: 14,
    color: NellaColors.bodyGray,
    flex: 1,
    lineHeight: 20,
  },
  checkLink: {
    fontFamily: NellaFonts.bold,
    color: NellaColors.gold,
    textDecorationLine: 'underline',
  },

  // Botones
  btnPrimary: {
    backgroundColor: NellaColors.red,
    borderRadius: 13,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: NellaColors.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
    elevation: 4,
    marginBottom: 16,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnPressed: {
    opacity: 0.75,
  },
  btnPrimaryText: {
    fontFamily: NellaFonts.display,
    color: '#FFFFFF',
    fontSize: 19,
    letterSpacing: 0.5,
  },

  // Error
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

  // Input con ícono ojo
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(139,0,0,0.2)',
  },
  inputFlex: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  eyeBtn: {
    paddingHorizontal: 12,
  },

  // Link
  loginLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginLinkText: {
    fontFamily: NellaFonts.regular,
    fontSize: 15,
    color: NellaColors.bodyGray,
  },
  loginLinkBold: {
    fontFamily: NellaFonts.bold,
    color: NellaColors.red,
    textDecorationLine: 'underline',
  },
});
