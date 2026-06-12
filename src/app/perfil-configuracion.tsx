import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NellaColors, NellaFonts } from '@/constants/theme';
import { useAuthUser } from '@/hooks/useAuthUser';
import { db } from '@/lib/firebase';

const RED  = NellaColors.red;
const GOLD = NellaColors.gold;

type Config = {
  notifPedidos:     boolean;
  notifPromociones: boolean;
  notifNoticias:    boolean;
};

const DEFAULT_CONFIG: Config = {
  notifPedidos:     true,
  notifPromociones: true,
  notifNoticias:    false,
};

type ToggleItem = {
  key:   keyof Config;
  icon:  React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  desc:  string;
};

const TOGGLES: ToggleItem[] = [
  {
    key:   'notifPedidos',
    icon:  'receipt-outline',
    label: 'Actualizaciones de pedidos',
    desc:  'Recibe alertas cuando tu pedido cambie de estado',
  },
  {
    key:   'notifPromociones',
    icon:  'pricetag-outline',
    label: 'Promociones y ofertas',
    desc:  'Entérate de descuentos y cupones exclusivos',
  },
  {
    key:   'notifNoticias',
    icon:  'megaphone-outline',
    label: 'Novedades Nella',
    desc:  'Nuevos productos y anuncios de la tienda',
  },
];

export default function PerfilConfiguracionScreen() {
  const insets   = useSafeAreaInsets();
  const { user } = useAuthUser();

  const [config,  setConfig]  = useState<Config>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'usuarios', user.uid), (snap) => {
      const cfg = snap.data()?.config as Partial<Config> | undefined;
      setConfig({ ...DEFAULT_CONFIG, ...cfg });
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  const toggle = async (key: keyof Config, value: boolean) => {
    if (!user) return;
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    setSaving(true);
    try {
      await updateDoc(doc(db, 'usuarios', user.uid), { config: newConfig });
    } catch {
      setConfig(config);
      Alert.alert('Error', 'No se pudo guardar la preferencia.');
    } finally {
      setSaving(false);
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
        <Text style={s.headerTitle}>Configuración</Text>
        <View style={{ width: 34 }}>
          {saving && <ActivityIndicator size="small" color="#FFF" />}
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={RED} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Notificaciones */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Ionicons name="notifications-outline" size={18} color={RED} />
              <Text style={s.sectionTitle}>Notificaciones</Text>
            </View>
            <View style={s.card}>
              {TOGGLES.map((t, i) => (
                <View key={t.key}>
                  {i > 0 && <View style={s.sep} />}
                  <View style={s.toggleRow}>
                    <View style={s.toggleIcon}>
                      <Ionicons name={t.icon} size={20} color={GOLD} />
                    </View>
                    <View style={s.toggleText}>
                      <Text style={s.toggleLabel}>{t.label}</Text>
                      <Text style={s.toggleDesc}>{t.desc}</Text>
                    </View>
                    <Switch
                      value={config[t.key]}
                      onValueChange={(v) => toggle(t.key, v)}
                      trackColor={{ false: '#D1D5DB', true: `${GOLD}88` }}
                      thumbColor={config[t.key] ? GOLD : '#FFF'}
                      ios_backgroundColor="#D1D5DB"
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Info */}
          <View style={s.infoNote}>
            <Ionicons name="information-circle-outline" size={16} color={GOLD} />
            <Text style={s.infoText}>
              Los cambios se aplican de inmediato. Las notificaciones de pedidos siempre se recomiendan para estar al tanto de tus entregas.
            </Text>
          </View>

          {/* App version */}
          <Text style={s.version}>Alimentos Nella v1.0.0</Text>
        </ScrollView>
      )}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, gap: 20 },

  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 2 },
  sectionTitle: { fontFamily: NellaFonts.display, fontSize: 18, color: RED },

  card: {
    backgroundColor: 'rgba(251,243,226,0.96)', borderRadius: 20,
    borderWidth: 1.5, borderColor: GOLD, paddingHorizontal: 16, paddingVertical: 8,
  },
  sep: { height: 1, backgroundColor: `${GOLD}33`, marginLeft: 56 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  toggleIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: `${GOLD}15`, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: `${GOLD}33`,
  },
  toggleText: { flex: 1, gap: 2 },
  toggleLabel: { fontFamily: NellaFonts.bold, fontSize: 14, color: NellaColors.titleDark },
  toggleDesc: { fontFamily: NellaFonts.regular, fontSize: 11, color: NellaColors.bodyGray, lineHeight: 15 },

  infoNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: `${GOLD}15`, borderRadius: 14,
    borderWidth: 1, borderColor: `${GOLD}44`,
    padding: 14,
  },
  infoText: { flex: 1, fontFamily: NellaFonts.italic, fontSize: 12, color: '#5A4000', lineHeight: 17 },

  version: { fontFamily: NellaFonts.italic, fontSize: 12, color: NellaColors.lightGray, textAlign: 'center' },
});
