import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NellaColors, NellaFonts } from '@/constants/theme';

const RED  = NellaColors.red;
const GOLD = NellaColors.gold;
const GRAY = NellaColors.lightGray;
const BG   = '#FBF3E2';

const WHATSAPP_NUMBER  = '584141569617';
const WHATSAPP_MESSAGE = 'Hola%2C%20estoy%20interesado%20en%20ser%20distribuidor%20de%20Alimentos%20Nella';

// ─── Beneficios ───────────────────────────────────────────────────────────────

const BENEFITS = [
  {
    icon: 'pricetag'    as const,
    title: 'Precios especiales por volumen',
    desc:  'Tarifas preferenciales según la cantidad de tu pedido',
  },
  {
    icon: 'repeat'      as const,
    title: 'Pedidos recurrentes y programados',
    desc:  'Agenda tus pedidos con anticipación y sin interrupciones',
  },
  {
    icon: 'headset'     as const,
    title: 'Atención personalizada',
    desc:  'Un asesor dedicado a tu negocio disponible siempre',
  },
  {
    icon: 'car-sport'   as const,
    title: 'Despachos rápidos y seguros',
    desc:  'Entrega puntual con cadena de frío garantizada',
  },
];

// ─── Flecha atrás ─────────────────────────────────────────────────────────────

function BackArrow() {
  return (
    <View style={arrow.wrap}>
      <View style={arrow.shaft} />
      <View style={arrow.tipTop} />
      <View style={arrow.tipBottom} />
    </View>
  );
}
const arrow = StyleSheet.create({
  wrap:      { width: 22, height: 22, justifyContent: 'center' },
  shaft:     { position: 'absolute', left: 3, width: 17, height: 2.5, backgroundColor: '#FFF', borderRadius: 2 },
  tipTop:    { position: 'absolute', left: 3, top: 5,    width: 10, height: 2.5, backgroundColor: '#FFF', borderRadius: 2, transform: [{ rotate: '-45deg' }] },
  tipBottom: { position: 'absolute', left: 3, bottom: 5, width: 10, height: 2.5, backgroundColor: '#FFF', borderRadius: 2, transform: [{ rotate: '45deg' }] },
});

// ─── Barra de navegación inferior ────────────────────────────────────────────

const NAV_TABS = [
  { name: 'home',       label: 'Inicio',     icon: 'home-outline'     as const, href: '/(tabs)/home'       },
  { name: 'categorias', label: 'Categorías', icon: 'grid-outline'     as const, href: '/(tabs)/categorias' },
  { name: 'ofertas',    label: 'Ofertas',    icon: 'pricetag-outline' as const, href: '/(tabs)/ofertas'    },
  { name: 'pedidos',    label: 'Pedidos',    icon: 'receipt-outline'  as const, href: '/(tabs)/pedidos'    },
  { name: 'perfil',     label: 'Perfil',     icon: 'person-outline'   as const, href: '/(tabs)/perfil'     },
];

function BottomNavBar() {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[s.navBar, { paddingBottom: Math.max(bottom, 8) }]}>
      {NAV_TABS.map((t) => (
        <Pressable
          key={t.name}
          style={s.navBtn}
          onPress={() => router.navigate(t.href as any)}
        >
          <Ionicons name={t.icon} size={24} color={GRAY} />
          <Text style={[s.navLabel, { color: '#4B5320' }]}>{t.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function MayoristasScreen() {
  const insets = useSafeAreaInsets();

  const openWhatsApp = () => {
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`);
  };

  return (
    <ImageBackground
      source={require('@/assets/images/fondo plantilla 1.png')}
      style={s.root}
      resizeMode="cover"
    >
      {/* ── Hero header rojo ──────────────────────────────── */}
      <View style={[s.heroHeader, { paddingTop: insets.top + 10 }]}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
          <BackArrow />
        </Pressable>

        <View style={s.heroContent}>
          <Text style={s.heroTitle}>Mayoristas y Distribuidores</Text>
          <Text style={s.heroSub}>Beneficios exclusivos para tu negocio</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: Math.max(insets.bottom, 8) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Tarjeta visual camión ─────────────────────── */}
        <View style={s.truckCard}>
          <View style={s.truckIconWrap}>
            <Ionicons name="car-sport-outline" size={64} color={RED} />
            <View style={s.truckBadge}>
              <Ionicons name="snow-outline" size={14} color="#1D4ED8" />
              <Text style={s.truckBadgeText}>Cadena de frío</Text>
            </View>
          </View>
          <View style={s.truckInfo}>
            <Text style={s.truckTitle}>Flota Nella</Text>
            <Text style={s.truckDesc}>
              Distribución directa de productos congelados a negocios, restaurantes y supermercados
            </Text>
          </View>
        </View>

        {/* ── Sección beneficios ────────────────────────── */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLine} />
          <Text style={s.sectionTitle}>Nuestros beneficios</Text>
          <View style={s.sectionLine} />
        </View>

        <View style={s.benefitsWrap}>
          {BENEFITS.map((b, i) => (
            <View key={i} style={s.benefitCard}>
              <View style={s.benefitIconWrap}>
                <Ionicons name={b.icon} size={28} color={GOLD} />
              </View>
              <View style={s.benefitText}>
                <Text style={s.benefitTitle}>{b.title}</Text>
                <Text style={s.benefitDesc}>{b.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Franja de confianza ───────────────────────── */}
        <View style={s.trustStrip}>
          <View style={s.trustItem}>
            <Text style={s.trustNum}>+50</Text>
            <Text style={s.trustLabel}>Clientes{'\n'}mayoristas</Text>
          </View>
          <View style={s.trustDivider} />
          <View style={s.trustItem}>
            <Text style={s.trustNum}>5★</Text>
            <Text style={s.trustLabel}>Calificación{'\n'}promedio</Text>
          </View>
          <View style={s.trustDivider} />
          <View style={s.trustItem}>
            <Text style={s.trustNum}>24h</Text>
            <Text style={s.trustLabel}>Tiempo de{'\n'}respuesta</Text>
          </View>
        </View>

        {/* ── CTAs ──────────────────────────────────────── */}
        <TouchableOpacity style={s.goldBtn} activeOpacity={0.82} onPress={() => router.push('/mayoristas-form')}>
          <Ionicons name="mail-outline" size={20} color={RED} />
          <Text style={s.goldBtnText}>Solicitar información</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.waBtn} activeOpacity={0.82} onPress={openWhatsApp}>
          <Ionicons name="logo-whatsapp" size={22} color="#FFF" />
          <Text style={s.waBtnText}>Contactar por WhatsApp</Text>
        </TouchableOpacity>

        {/* ── Nota seguridad ────────────────────────────── */}
        <View style={s.securityNote}>
          <Ionicons name="shield-checkmark-outline" size={18} color={GOLD} />
          <Text style={s.securityText}>
            Información 100% confidencial. Te contactamos en menos de 24 horas.
          </Text>
        </View>
      </ScrollView>

      <BottomNavBar />
    </ImageBackground>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  // Hero header
  heroHeader: {
    backgroundColor: RED,
    paddingHorizontal: 16,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
  },
  backBtn: {
    width: 34, height: 34,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  heroContent: {
    alignItems: 'center',
    gap: 2,
    marginTop: 0,
  },
  heroTitle: {
    fontFamily: NellaFonts.display,
    fontSize: 28,
    color: '#FFFFFF',
    lineHeight: 34,
    textAlign: 'center',
  },
  heroSub: {
    fontFamily: NellaFonts.italic,
    fontSize: 18,
    color: '#FFD9A0',
    textAlign: 'center',
  },

  // Scroll
  scroll: { padding: 16, gap: 16 },

  // Tarjeta camión
  truckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 16,
    gap: 16,
    shadowColor: '#5A0000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 4,
  },
  truckIconWrap: {
    alignItems: 'center',
    gap: 6,
  },
  truckBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DBEAFE',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  truckBadgeText: {
    fontFamily: NellaFonts.bold,
    fontSize: 9,
    color: '#1D4ED8',
  },
  truckInfo: { flex: 1, gap: 5 },
  truckTitle: {
    fontFamily: NellaFonts.display,
    fontSize: 20,
    color: RED,
    lineHeight: 24,
  },
  truckDesc: {
    fontFamily: NellaFonts.italic,
    fontSize: 12,
    color: NellaColors.bodyGray,
    lineHeight: 17,
  },

  // Separador de sección
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: `${GOLD}55`,
    borderRadius: 1,
  },
  sectionTitle: {
    fontFamily: NellaFonts.display,
    fontSize: 18,
    color: RED,
  },

  // Beneficios
  benefitsWrap: { gap: 12 },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 14,
    gap: 14,
    shadowColor: '#5A0000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  benefitIconWrap: {
    width: 52, height: 52,
    borderRadius: 26,
    backgroundColor: `${GOLD}18`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: `${GOLD}55`,
    flexShrink: 0,
  },
  benefitText: { flex: 1, gap: 3 },
  benefitTitle: {
    fontFamily: NellaFonts.bold,
    fontSize: 14,
    color: RED,
    lineHeight: 18,
  },
  benefitDesc: {
    fontFamily: NellaFonts.italic,
    fontSize: 12,
    color: NellaColors.bodyGray,
    lineHeight: 16,
  },

  // Franja de confianza
  trustStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: GOLD,
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  trustDivider: {
    width: 1.5,
    height: 40,
    backgroundColor: `${GOLD}66`,
    borderRadius: 1,
  },
  trustNum: {
    fontFamily: NellaFonts.display,
    fontSize: 26,
    color: GOLD,
    lineHeight: 30,
  },
  trustLabel: {
    fontFamily: NellaFonts.italic,
    fontSize: 11,
    color: '#FFE4B0',
    textAlign: 'center',
    lineHeight: 15,
  },

  // Botón dorado
  goldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 28,
    gap: 10,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.40,
    shadowRadius: 10,
    elevation: 6,
  },
  goldBtnText: {
    fontFamily: NellaFonts.bold,
    fontSize: 18,
    color: RED,
    letterSpacing: 0.4,
  },

  // Botón WhatsApp
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 28,
    gap: 10,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  waBtnText: {
    fontFamily: NellaFonts.bold,
    fontSize: 18,
    color: '#FFF',
    letterSpacing: 0.4,
  },

  // Nota seguridad
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${GOLD}18`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${GOLD}44`,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  securityText: {
    flex: 1,
    fontFamily: NellaFonts.italic,
    fontSize: 12,
    color: '#5A4000',
    lineHeight: 17,
  },

  // Nav bar
  navBar: {
    flexDirection: 'row',
    backgroundColor: BG,
    borderTopWidth: 1.5,
    borderTopColor: `${GOLD}44`,
    paddingTop: 8,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  navBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    borderRadius: 10,
  },
  navLabel: {
    fontFamily: NellaFonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
