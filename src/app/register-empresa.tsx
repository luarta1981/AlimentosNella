import { Image } from 'expo-image';
import { router } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
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
import { useAuthUser } from '@/hooks/useAuthUser';
import { db } from '@/lib/firebase';

const ICON_BG = '#5C4A1E';
const BTN_GREEN = '#2E7D32';
const BTN_GREEN_SHADOW = '#1B5E20';

function BuildingIcon() {
  return (
    <View style={iconStyles.wrapper}>
      {/* Piso superior */}
      <View style={iconStyles.floor}>
        <View style={iconStyles.window} />
        <View style={iconStyles.window} />
        <View style={iconStyles.window} />
      </View>
      {/* Piso medio */}
      <View style={iconStyles.floor}>
        <View style={iconStyles.window} />
        <View style={iconStyles.window} />
        <View style={iconStyles.window} />
      </View>
      {/* Planta baja con puerta */}
      <View style={[iconStyles.floor, iconStyles.groundFloor]}>
        <View style={iconStyles.window} />
        <View style={iconStyles.door} />
        <View style={iconStyles.window} />
      </View>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: ICON_BG,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginRight: 10,
    paddingHorizontal: 4,
    paddingBottom: 0,
  },
  floor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 3,
    marginBottom: 2,
  },
  groundFloor: {
    marginBottom: 0,
  },
  window: {
    width: 7,
    height: 6,
    backgroundColor: '#FBF3E2',
    borderRadius: 1,
  },
  door: {
    width: 7,
    height: 9,
    backgroundColor: '#FBF3E2',
    borderRadius: 2,
    alignSelf: 'flex-end',
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
  { key: 'razon',        label: 'Razón Social',          placeholder: 'Nombre legal de la empresa',  autoCapitalize: 'words' },
  { key: 'rif',          label: 'RIF',                   placeholder: 'Ej: J-12345678-9',            autoCapitalize: 'none' },
  { key: 'representante',label: 'Representante Legal',   placeholder: 'Nombre del representante',    autoCapitalize: 'words' },
  { key: 'telefono',     label: 'Teléfono',              placeholder: 'Ej: 0991234567',              keyboardType: 'phone-pad' },
  { key: 'correo',       label: 'Correo electrónico',    placeholder: 'Ej: empresa@correo.com',      keyboardType: 'email-address', autoCapitalize: 'none' },
  { key: 'direccion',    label: 'Dirección Fiscal',      placeholder: 'Calle, número, sector',       autoCapitalize: 'sentences' },
  { key: 'ciudad',       label: 'Ciudad',                placeholder: 'Ej: Caracas',                 autoCapitalize: 'words' },
];

const REQUIRED_KEYS = ['razon', 'rif', 'representante', 'telefono', 'correo', 'direccion'];

export default function RegisterEmpresaScreen() {
  const { user }              = useAuthUser();
  const [values, setValues]   = useState<Record<string, string>>({});
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const update = (key: string, val: string) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!accepted) return;
    if (!user?.uid) {
      setError('Debes iniciar sesión antes de registrar una empresa.');
      return;
    }
    for (const key of REQUIRED_KEYS) {
      if (!values[key]?.trim()) {
        const label = FIELDS.find((f) => f.key === key)?.label ?? key;
        setError(`El campo "${label}" es requerido.`);
        return;
      }
    }
    setError('');
    setLoading(true);
    try {
      await addDoc(collection(db, 'empresas'), {
        userId:        user.uid,
        razon:         values.razon.trim(),
        rif:           values.rif.trim().toUpperCase(),
        representante: values.representante.trim(),
        telefono:      values.telefono.trim(),
        correo:        values.correo.trim().toLowerCase(),
        direccion:     values.direccion.trim(),
        ciudad:        values.ciudad?.trim() ?? '',
        createdAt:     serverTimestamp(),
      });
      router.replace('/(tabs)/home');
    } catch {
      setError('Error al registrar. Verifica tu conexión e intenta de nuevo.');
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
              <BuildingIcon />
              <Text style={styles.title}>Registro</Text>
            </View>
            <Text style={styles.cardSubtitle}>Persona Jurídica / Empresa</Text>
            <View style={styles.divider} />
          </View>

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

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

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

          {/* Botón Registrar Empresa */}
          <Pressable
            style={({ pressed }) => [
              styles.btnPrimary,
              (!accepted || loading) && styles.btnDisabled,
              pressed && accepted && !loading && styles.btnPressed,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.btnPrimaryText}>Registrar Empresa</Text>
            }
          </Pressable>

          {/* Link login */}
          <Pressable
            style={styles.loginLink}
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
    fontSize: 17,
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

  errorBox: {
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
    backgroundColor: BTN_GREEN,
    borderRadius: 13,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BTN_GREEN_SHADOW,
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
