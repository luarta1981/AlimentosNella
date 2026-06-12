import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
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
import { auth, db } from '@/lib/firebase';

const RED  = NellaColors.red;
const GOLD = NellaColors.gold;

export default function PerfilEditScreen() {
  const insets      = useSafeAreaInsets();
  const { user }    = useAuthUser();

  const [nombre,    setNombre]    = useState(user?.displayName ?? '');
  const [telefono,  setTelefono]  = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad,    setCiudad]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [loaded,    setLoaded]    = useState(false);

  // Carga datos actuales de Firestore una sola vez
  if (!loaded && user) {
    setLoaded(true);
    import('firebase/firestore').then(({ getDoc, doc: fsDoc }) => {
      getDoc(fsDoc(db, 'usuarios', user.uid)).then((snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        if (d.displayName) setNombre(d.displayName);
        if (d.phone)       setTelefono(d.phone);
        if (d.address)     setDireccion(d.address);
        if (d.ciudad)      setCiudad(d.ciudad);
      });
    });
  }

  const handleSave = async () => {
    if (!user) return;
    if (!nombre.trim()) {
      Alert.alert('Campo requerido', 'El nombre no puede estar vacío.');
      return;
    }
    setLoading(true);
    try {
      await updateProfile(auth.currentUser!, { displayName: nombre.trim() });
      await updateDoc(doc(db, 'usuarios', user.uid), {
        displayName: nombre.trim(),
        phone:       telefono.trim(),
        address:     direccion.trim(),
        ciudad:      ciudad.trim(),
      });
      Alert.alert('Perfil actualizado', 'Tus datos fueron guardados correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.');
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
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </Pressable>
        <Text style={s.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 34 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View style={s.avatarRow}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarInitials}>
                {nombre.trim().charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Información personal</Text>
            <View style={s.divider} />

            {[
              { label: 'Nombre completo', value: nombre,    set: setNombre,    placeholder: 'Tu nombre',      caps: 'words'    as const },
              { label: 'Teléfono',        value: telefono,  set: setTelefono,  placeholder: 'Ej: 0414-…',     kb:   'phone-pad' as const },
              { label: 'Dirección',       value: direccion, set: setDireccion, placeholder: 'Calle, número…', caps: 'sentences' as const },
              { label: 'Ciudad',          value: ciudad,    set: setCiudad,    placeholder: 'Ej: Caracas',    caps: 'words'     as const },
            ].map((f) => (
              <View key={f.label} style={s.field}>
                <Text style={s.label}>{f.label}</Text>
                <TextInput
                  style={s.input}
                  value={f.value}
                  onChangeText={f.set}
                  placeholder={f.placeholder}
                  placeholderTextColor={NellaColors.lightGray}
                  keyboardType={f.kb ?? 'default'}
                  autoCapitalize={f.caps ?? 'none'}
                />
              </View>
            ))}

            <Pressable
              style={({ pressed }) => [s.saveBtn, pressed && { opacity: 0.8 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={RED} />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={20} color={RED} />
                    <Text style={s.saveBtnText}>Guardar cambios</Text>
                  </>
              }
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: RED, paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 2, borderBottomColor: GOLD,
  },
  backBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: NellaFonts.display, fontSize: 22, color: '#FFF' },
  scroll: { padding: 16, gap: 16 },
  avatarRow: { alignItems: 'center', marginBottom: 4 },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: `${GOLD}22`, borderWidth: 2.5, borderColor: GOLD,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { fontFamily: NellaFonts.display, fontSize: 38, color: RED },
  card: {
    backgroundColor: 'rgba(251,243,226,0.96)', borderRadius: 20,
    borderWidth: 1.5, borderColor: GOLD, paddingHorizontal: 20,
    paddingTop: 22, paddingBottom: 26,
  },
  cardTitle: { fontFamily: NellaFonts.display, fontSize: 20, color: RED, marginBottom: 12 },
  divider: { height: 1.5, backgroundColor: GOLD, borderRadius: 1, marginBottom: 18 },
  field: { marginBottom: 16 },
  label: { fontFamily: NellaFonts.bold, fontSize: 13, color: RED, marginBottom: 6 },
  input: {
    backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5,
    borderColor: `${RED}30`, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: NellaFonts.regular, fontSize: 15, color: NellaColors.titleDark,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: GOLD, borderRadius: 14, height: 52, marginTop: 6,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  saveBtnText: { fontFamily: NellaFonts.display, fontSize: 18, color: RED },
});
