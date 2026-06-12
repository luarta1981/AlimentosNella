import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Modal,
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

type MetodoPago = {
  id:          string;
  tipo:        string;
  descripcion: string;
  isDefault:   boolean;
};

type TipoOption = { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; color: string };

const TIPOS: TipoOption[] = [
  { label: 'Efectivo',               icon: 'cash-outline',             color: '#22C55E' },
  { label: 'Transferencia Bancaria', icon: 'swap-horizontal-outline',  color: '#3B82F6' },
  { label: 'Pago Móvil',             icon: 'phone-portrait-outline',   color: '#8B5CF6' },
  { label: 'Zelle',                  icon: 'logo-usd',                 color: '#6366F1' },
  { label: 'USD en efectivo',        icon: 'cash-outline',             color: '#F59E0B' },
];

function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export default function PerfilPagosScreen() {
  const insets   = useSafeAreaInsets();
  const { user } = useAuthUser();

  const [metodos,   setMetodos]   = useState<MetodoPago[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [tipoSel,   setTipoSel]   = useState(TIPOS[0].label);
  const [desc,      setDesc]      = useState('');

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'usuarios', user.uid), (snap) => {
      setMetodos((snap.data()?.metodos_pago as MetodoPago[]) ?? []);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  const saveList = async (list: MetodoPago[]) => {
    if (!user) return;
    setSaving(true);
    try { await updateDoc(doc(db, 'usuarios', user.uid), { metodos_pago: list }); }
    catch { Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.'); }
    finally { setSaving(false); }
  };

  const handleAdd = async () => {
    const nuevo: MetodoPago = {
      id: makeId(), tipo: tipoSel, descripcion: desc.trim(), isDefault: metodos.length === 0,
    };
    await saveList([...metodos, nuevo]);
    setModalOpen(false);
    setDesc('');
    setTipoSel(TIPOS[0].label);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar método', '¿Seguro que deseas eliminar este método de pago?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => saveList(metodos.filter((m) => m.id !== id)) },
    ]);
  };

  const handleSetDefault = (id: string) => {
    saveList(metodos.map((m) => ({ ...m, isDefault: m.id === id })));
  };

  const tipoInfo = (tipo: string) => TIPOS.find((t) => t.label === tipo) ?? TIPOS[0];

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
        <Text style={s.headerTitle}>Métodos de Pago</Text>
        <Pressable style={s.addBtn} onPress={() => setModalOpen(true)} hitSlop={8}>
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
          {metodos.length === 0 ? (
            <View style={s.emptyCard}>
              <Ionicons name="card-outline" size={48} color={`${GOLD}88`} />
              <Text style={s.emptyTitle}>Sin métodos guardados</Text>
              <Text style={s.emptyDesc}>Agrega un método de pago preferido.</Text>
              <Pressable style={s.emptyBtn} onPress={() => setModalOpen(true)}>
                <Ionicons name="add-circle-outline" size={18} color={RED} />
                <Text style={s.emptyBtnText}>Agregar método</Text>
              </Pressable>
            </View>
          ) : (
            <View style={s.listCard}>
              {metodos.map((m, i) => {
                const info = tipoInfo(m.tipo);
                return (
                  <View key={m.id}>
                    {i > 0 && <View style={s.sep} />}
                    <View style={s.metodoRow}>
                      <View style={[s.metodoBadge, { backgroundColor: `${info.color}22`, borderColor: `${info.color}66` }]}>
                        <Ionicons name={info.icon} size={22} color={info.color} />
                      </View>
                      <View style={s.metodoInfo}>
                        <View style={s.metodoTitleRow}>
                          <Text style={s.metodoTipo}>{m.tipo}</Text>
                          {m.isDefault && (
                            <View style={s.defaultChip}>
                              <Text style={s.defaultChipText}>Predeterminado</Text>
                            </View>
                          )}
                        </View>
                        {!!m.descripcion && <Text style={s.metodoDesc}>{m.descripcion}</Text>}
                        {!m.isDefault && (
                          <Pressable onPress={() => handleSetDefault(m.id)} style={s.setDefaultBtn}>
                            <Text style={s.setDefaultBtnText}>Usar como predeterminado</Text>
                          </Pressable>
                        )}
                      </View>
                      <Pressable onPress={() => handleDelete(m.id)} hitSlop={8} style={s.deleteBtn}>
                        <Ionicons name="trash-outline" size={18} color={RED} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal agregar */}
      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Nuevo método de pago</Text>
              <Pressable onPress={() => setModalOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={RED} />
              </Pressable>
            </View>

            <Text style={s.label}>Tipo de pago</Text>
            <View style={s.tiposGrid}>
              {TIPOS.map((t) => (
                <Pressable
                  key={t.label}
                  style={[s.tipoOption, tipoSel === t.label && { borderColor: t.color, backgroundColor: `${t.color}15` }]}
                  onPress={() => setTipoSel(t.label)}
                >
                  <Ionicons name={t.icon} size={20} color={tipoSel === t.label ? t.color : NellaColors.bodyGray} />
                  <Text style={[s.tipoText, tipoSel === t.label && { color: t.color }]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={s.modalField}>
              <Text style={s.label}>Descripción (opcional)</Text>
              <TextInput
                style={s.input}
                value={desc}
                onChangeText={setDesc}
                placeholder="Ej: Banco Venezuela, últimos 4 dígitos…"
                placeholderTextColor={NellaColors.lightGray}
                autoCapitalize="sentences"
              />
            </View>

            <Pressable style={s.saveBtn} onPress={handleAdd}>
              <Text style={s.saveBtnText}>Agregar</Text>
            </Pressable>
          </View>
        </View>
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
    borderWidth: 1.5, borderColor: GOLD, padding: 16,
  },
  sep: { height: 1, backgroundColor: `${GOLD}33`, marginVertical: 14 },
  metodoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  metodoBadge: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, flexShrink: 0,
  },
  metodoInfo: { flex: 1, gap: 4 },
  metodoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metodoTipo: { fontFamily: NellaFonts.bold, fontSize: 15, color: NellaColors.titleDark },
  defaultChip: {
    backgroundColor: `${GOLD}22`, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: `${GOLD}55`,
  },
  defaultChipText: { fontFamily: NellaFonts.bold, fontSize: 10, color: GOLD },
  metodoDesc: { fontFamily: NellaFonts.italic, fontSize: 12, color: NellaColors.bodyGray },
  setDefaultBtn: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: `${GOLD}12`, borderRadius: 7, borderWidth: 1, borderColor: `${GOLD}44`,
  },
  setDefaultBtnText: { fontFamily: NellaFonts.bold, fontSize: 11, color: GOLD },
  deleteBtn: { padding: 6, marginLeft: 4 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard: {
    backgroundColor: '#FBF3E2', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, borderTopWidth: 2, borderColor: GOLD,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  modalTitle: { fontFamily: NellaFonts.display, fontSize: 22, color: RED },
  tiposGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tipoOption: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1.5, borderColor: `${GOLD}44`,
    backgroundColor: `${GOLD}08`,
  },
  tipoText: { fontFamily: NellaFonts.bold, fontSize: 12, color: NellaColors.bodyGray },
  modalField: { marginBottom: 14 },
  label: { fontFamily: NellaFonts.bold, fontSize: 13, color: RED, marginBottom: 6 },
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
