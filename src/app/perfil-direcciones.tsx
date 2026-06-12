import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
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
import { db } from '@/lib/firebase';

const RED  = NellaColors.red;
const GOLD = NellaColors.gold;

type Direccion = {
  id:          string;
  label:       string;
  calle:       string;
  ciudad:      string;
  referencias: string;
  isDefault:   boolean;
};

const LABELS = ['Casa', 'Trabajo', 'Otro'];

function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

const EMPTY: Omit<Direccion, 'id' | 'isDefault'> = { label: 'Casa', calle: '', ciudad: '', referencias: '' };

export default function PerfilDireccionesScreen() {
  const insets   = useSafeAreaInsets();
  const { user } = useAuthUser();

  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editId,      setEditId]      = useState<string | null>(null);
  const [form,        setForm]        = useState<Omit<Direccion, 'id' | 'isDefault'>>(EMPTY);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'usuarios', user.uid), (snap) => {
      setDirecciones((snap.data()?.direcciones as Direccion[]) ?? []);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  const save = async (newList: Direccion[]) => {
    if (!user) return;
    setSaving(true);
    try { await updateDoc(doc(db, 'usuarios', user.uid), { direcciones: newList }); }
    catch { Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.'); }
    finally { setSaving(false); }
  };

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (d: Direccion) => {
    setEditId(d.id);
    setForm({ label: d.label, calle: d.calle, ciudad: d.ciudad, referencias: d.referencias });
    setModalOpen(true);
  };

  const handleSaveForm = async () => {
    if (!form.calle.trim() || !form.ciudad.trim()) {
      Alert.alert('Campos requeridos', 'Calle y ciudad son obligatorios.');
      return;
    }
    let newList: Direccion[];
    if (editId) {
      newList = direcciones.map((d) =>
        d.id === editId ? { ...d, ...form } : d
      );
    } else {
      const nueva: Direccion = {
        id: makeId(), isDefault: direcciones.length === 0, ...form,
      };
      newList = [...direcciones, nueva];
    }
    await save(newList);
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar dirección', '¿Seguro que deseas eliminar esta dirección?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: () => save(direcciones.filter((d) => d.id !== id)),
      },
    ]);
  };

  const handleSetDefault = (id: string) => {
    save(direcciones.map((d) => ({ ...d, isDefault: d.id === id })));
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
        <Text style={s.headerTitle}>Mis Direcciones</Text>
        <Pressable style={s.addBtn} onPress={openAdd} hitSlop={8}>
          {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="add" size={26} color="#FFF" />}
        </Pressable>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={RED} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {direcciones.length === 0 ? (
            <View style={s.emptyCard}>
              <Ionicons name="location-outline" size={48} color={`${GOLD}88`} />
              <Text style={s.emptyTitle}>Sin direcciones guardadas</Text>
              <Text style={s.emptyDesc}>Agrega tu primera dirección de entrega.</Text>
              <Pressable style={s.emptyBtn} onPress={openAdd}>
                <Ionicons name="add-circle-outline" size={18} color={RED} />
                <Text style={s.emptyBtnText}>Agregar dirección</Text>
              </Pressable>
            </View>
          ) : (
            <View style={s.listCard}>
              {direcciones.map((d, i) => (
                <View key={d.id}>
                  {i > 0 && <View style={s.sep} />}
                  <View style={s.dirRow}>
                    <View style={[s.labelBadge, d.isDefault && s.labelBadgeDefault]}>
                      <Ionicons
                        name={d.label === 'Casa' ? 'home-outline' : d.label === 'Trabajo' ? 'briefcase-outline' : 'location-outline'}
                        size={16}
                        color={d.isDefault ? '#FFF' : GOLD}
                      />
                      <Text style={[s.labelText, d.isDefault && s.labelTextDefault]}>
                        {d.label}{d.isDefault ? ' · Predeterminada' : ''}
                      </Text>
                    </View>
                    <View style={s.dirActions}>
                      <Pressable onPress={() => openEdit(d)} hitSlop={8} style={s.actionBtn}>
                        <Ionicons name="pencil-outline" size={18} color={GOLD} />
                      </Pressable>
                      <Pressable onPress={() => handleDelete(d.id)} hitSlop={8} style={s.actionBtn}>
                        <Ionicons name="trash-outline" size={18} color={RED} />
                      </Pressable>
                    </View>
                  </View>
                  <Text style={s.dirCalle}>{d.calle}</Text>
                  <Text style={s.dirCiudad}>{d.ciudad}</Text>
                  {!!d.referencias && <Text style={s.dirRef}>{d.referencias}</Text>}
                  {!d.isDefault && (
                    <Pressable style={s.defaultBtn} onPress={() => handleSetDefault(d.id)}>
                      <Text style={s.defaultBtnText}>Usar como predeterminada</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal agregar/editar */}
      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editId ? 'Editar dirección' : 'Nueva dirección'}</Text>
              <Pressable onPress={() => setModalOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={RED} />
              </Pressable>
            </View>

            {/* Tipo */}
            <Text style={s.label}>Tipo</Text>
            <View style={s.labelRow}>
              {LABELS.map((l) => (
                <Pressable
                  key={l}
                  style={[s.labelOption, form.label === l && s.labelOptionActive]}
                  onPress={() => setForm((f) => ({ ...f, label: l }))}
                >
                  <Text style={[s.labelOptionText, form.label === l && s.labelOptionTextActive]}>{l}</Text>
                </Pressable>
              ))}
            </View>

            {[
              { key: 'calle',       label: 'Calle / Dirección *', placeholder: 'Calle, número, urbanización' },
              { key: 'ciudad',      label: 'Ciudad *',            placeholder: 'Ej: Caracas'                 },
              { key: 'referencias', label: 'Referencias',         placeholder: 'Color de la casa, piso…'     },
            ].map((f) => (
              <View key={f.key} style={s.modalField}>
                <Text style={s.label}>{f.label}</Text>
                <TextInput
                  style={s.input}
                  value={form[f.key as keyof typeof form]}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
                  placeholder={f.placeholder}
                  placeholderTextColor={NellaColors.lightGray}
                  autoCapitalize="sentences"
                />
              </View>
            ))}

            <Pressable style={s.saveBtn} onPress={handleSaveForm}>
              <Text style={s.saveBtnText}>{editId ? 'Guardar cambios' : 'Agregar dirección'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  addBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16 },

  emptyCard: {
    backgroundColor: 'rgba(251,243,226,0.95)', borderRadius: 20,
    borderWidth: 1.5, borderColor: GOLD, padding: 36,
    alignItems: 'center', gap: 10, marginTop: 24,
  },
  emptyTitle: { fontFamily: NellaFonts.display, fontSize: 20, color: RED },
  emptyDesc: { fontFamily: NellaFonts.italic, fontSize: 14, color: NellaColors.bodyGray, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8,
    backgroundColor: `${GOLD}22`, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10,
    borderWidth: 1.5, borderColor: GOLD,
  },
  emptyBtnText: { fontFamily: NellaFonts.bold, fontSize: 14, color: RED },

  listCard: {
    backgroundColor: 'rgba(251,243,226,0.95)', borderRadius: 20,
    borderWidth: 1.5, borderColor: GOLD, padding: 16, gap: 4,
  },
  sep: { height: 1, backgroundColor: `${GOLD}33`, marginVertical: 14 },
  dirRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  labelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: `${GOLD}18`, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: `${GOLD}55`,
  },
  labelBadgeDefault: { backgroundColor: RED, borderColor: RED },
  labelText: { fontFamily: NellaFonts.bold, fontSize: 13, color: GOLD },
  labelTextDefault: { color: '#FFF' },
  dirActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6 },
  dirCalle: { fontFamily: NellaFonts.regular, fontSize: 15, color: NellaColors.titleDark, marginBottom: 2 },
  dirCiudad: { fontFamily: NellaFonts.italic, fontSize: 13, color: NellaColors.bodyGray },
  dirRef: { fontFamily: NellaFonts.italic, fontSize: 12, color: NellaColors.bodyGray, marginTop: 2 },
  defaultBtn: {
    marginTop: 8, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: `${GOLD}15`, borderRadius: 8,
    borderWidth: 1, borderColor: `${GOLD}44`,
  },
  defaultBtnText: { fontFamily: NellaFonts.bold, fontSize: 12, color: GOLD },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard: {
    backgroundColor: '#FBF3E2', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, borderTopWidth: 2, borderColor: GOLD,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  modalTitle: { fontFamily: NellaFonts.display, fontSize: 22, color: RED },
  modalField: { marginBottom: 14 },
  label: { fontFamily: NellaFonts.bold, fontSize: 13, color: RED, marginBottom: 6 },
  labelRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  labelOption: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: `${GOLD}55`, backgroundColor: `${GOLD}10`,
  },
  labelOptionActive: { backgroundColor: RED, borderColor: RED },
  labelOptionText: { fontFamily: NellaFonts.bold, fontSize: 13, color: GOLD },
  labelOptionTextActive: { color: '#FFF' },
  input: {
    backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1.5,
    borderColor: `${RED}30`, paddingHorizontal: 14, paddingVertical: 11,
    fontFamily: NellaFonts.regular, fontSize: 15, color: NellaColors.titleDark,
  },
  saveBtn: {
    backgroundColor: GOLD, borderRadius: 12, height: 50,
    justifyContent: 'center', alignItems: 'center', marginTop: 6,
  },
  saveBtnText: { fontFamily: NellaFonts.display, fontSize: 18, color: RED },
});
