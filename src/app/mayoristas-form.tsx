import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { db } from '@/lib/firebase';

const RED  = NellaColors.red;
const GOLD = NellaColors.gold;
const BG   = '#FBF3E2';

type Field = { key: string; label: string; placeholder: string; multiline?: boolean; keyboardType?: 'default' | 'phone-pad' };

const FIELDS: Field[] = [
  { key: 'nombre',   label: 'Nombre completo',   placeholder: 'Ej: Carlos Rodríguez' },
  { key: 'empresa',  label: 'Empresa / Negocio',  placeholder: 'Ej: Distribuidora El Sol' },
  { key: 'telefono', label: 'Teléfono',           placeholder: 'Ej: 0414-1234567', keyboardType: 'phone-pad' },
  { key: 'mensaje',  label: 'Mensaje',            placeholder: 'Cuéntanos sobre tu negocio y qué necesitas…', multiline: true },
];

export default function MayoristasFormScreen() {
  const insets = useSafeAreaInsets();
  const [values, setValues]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const update = (key: string, val: string) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!values.nombre?.trim() || !values.telefono?.trim()) {
      setError('Nombre y teléfono son obligatorios.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await addDoc(collection(db, 'solicitudes_mayoristas'), {
        nombre:    values.nombre.trim(),
        empresa:   values.empresa?.trim() ?? '',
        telefono:  values.telefono.trim(),
        mensaje:   values.mensaje?.trim() ?? '',
        createdAt: serverTimestamp(),
      });
      setSent(true);
    } catch {
      setError('Error al enviar. Verifica tu conexión e intenta de nuevo.');
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
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </Pressable>
        <Text style={s.headerTitle}>Solicitar información</Text>
        <View style={{ width: 34 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {sent ? (
            /* ── Confirmación ── */
            <View style={s.successCard}>
              <View style={s.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
              </View>
              <Text style={s.successTitle}>¡Solicitud enviada!</Text>
              <Text style={s.successDesc}>
                Recibimos tu información. Un asesor de Alimentos Nella se pondrá en contacto contigo en menos de 24 horas.
              </Text>
              <Pressable style={s.successBtn} onPress={() => router.back()}>
                <Text style={s.successBtnText}>Volver</Text>
              </Pressable>
            </View>
          ) : (
            /* ── Formulario ── */
            <View style={s.card}>
              <Text style={s.cardTitle}>Únete a nuestra red</Text>
              <Text style={s.cardSub}>
                Completa el formulario y un asesor te contactará para brindarte información sobre precios y condiciones mayoristas.
              </Text>
              <View style={s.divider} />

              {!!error && (
                <View style={s.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              )}

              {FIELDS.map((f) => (
                <View key={f.key} style={s.fieldGroup}>
                  <Text style={s.label}>
                    {f.label}
                    {(f.key === 'nombre' || f.key === 'telefono') && (
                      <Text style={{ color: RED }}> *</Text>
                    )}
                  </Text>
                  <TextInput
                    style={[s.input, f.multiline && s.inputMulti]}
                    placeholder={f.placeholder}
                    placeholderTextColor={NellaColors.lightGray}
                    value={values[f.key] ?? ''}
                    onChangeText={(v) => update(f.key, v)}
                    keyboardType={f.keyboardType ?? 'default'}
                    multiline={f.multiline}
                    numberOfLines={f.multiline ? 4 : 1}
                    textAlignVertical={f.multiline ? 'top' : 'center'}
                    autoCapitalize={f.key === 'telefono' ? 'none' : 'sentences'}
                  />
                </View>
              ))}

              <Pressable
                style={({ pressed }) => [s.submitBtn, pressed && { opacity: 0.8 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={RED} />
                  : <>
                      <Ionicons name="send-outline" size={20} color={RED} />
                      <Text style={s.submitBtnText}>Enviar solicitud</Text>
                    </>
                }
              </Pressable>

              <Text style={s.privacyNote}>
                Tu información es confidencial y solo será usada para contactarte.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: RED,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
  },
  backBtn: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: NellaFonts.display,
    fontSize: 22,
    color: '#FFF',
  },

  scroll: { padding: 16 },

  card: {
    backgroundColor: 'rgba(251,243,226,0.96)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: GOLD,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    fontFamily: NellaFonts.display,
    fontSize: 28,
    color: RED,
    textAlign: 'center',
    lineHeight: 34,
  },
  cardSub: {
    fontFamily: NellaFonts.italic,
    fontSize: 13,
    color: NellaColors.bodyGray,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  divider: {
    height: 1.5,
    backgroundColor: GOLD,
    borderRadius: 1,
    marginBottom: 20,
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
    marginBottom: 16,
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
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: `${RED}30`,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: NellaFonts.regular,
    fontSize: 15,
    color: NellaColors.titleDark,
  },
  inputMulti: {
    height: 110,
    paddingTop: 12,
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: GOLD,
    borderRadius: 14,
    height: 54,
    marginTop: 6,
    marginBottom: 14,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnText: {
    fontFamily: NellaFonts.display,
    fontSize: 19,
    color: RED,
    letterSpacing: 0.4,
  },

  privacyNote: {
    fontFamily: NellaFonts.italic,
    fontSize: 12,
    color: NellaColors.bodyGray,
    textAlign: 'center',
    lineHeight: 17,
  },

  // Confirmación
  successCard: {
    backgroundColor: 'rgba(251,243,226,0.97)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: GOLD,
    paddingHorizontal: 28,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
    marginTop: 24,
  },
  successIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BBF7D0',
  },
  successTitle: {
    fontFamily: NellaFonts.display,
    fontSize: 30,
    color: RED,
    textAlign: 'center',
  },
  successDesc: {
    fontFamily: NellaFonts.italic,
    fontSize: 15,
    color: NellaColors.bodyGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  successBtn: {
    backgroundColor: RED,
    borderRadius: 13,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 8,
    shadowColor: RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 7,
    elevation: 4,
  },
  successBtnText: {
    fontFamily: NellaFonts.display,
    fontSize: 18,
    color: '#FFF',
    letterSpacing: 0.4,
  },
});
