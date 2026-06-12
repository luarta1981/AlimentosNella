import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NellaColors, NellaFonts } from '@/constants/theme';

const RED  = NellaColors.red;
const GOLD = NellaColors.gold;
const GRAY = NellaColors.lightGray;
const BG   = '#FBF3E2';

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
  shaft:     { position: 'absolute', left: 3, width: 17, height: 2.5, backgroundColor: RED, borderRadius: 2 },
  tipTop:    { position: 'absolute', left: 3, top: 5,    width: 10, height: 2.5, backgroundColor: RED, borderRadius: 2, transform: [{ rotate: '-45deg' }] },
  tipBottom: { position: 'absolute', left: 3, bottom: 5, width: 10, height: 2.5, backgroundColor: RED, borderRadius: 2, transform: [{ rotate: '45deg' }] },
});

// ─── Valores ──────────────────────────────────────────────────────────────────

const VALUES = [
  {
    icon: 'ribbon'        as const,
    label: 'Calidad Premium',
    desc:  'Productos elaborados bajo los más altos estándares de calidad e higiene',
  },
  {
    icon: 'leaf'          as const,
    label: 'Ingredientes Seleccionados',
    desc:  'Usamos solo ingredientes frescos y cuidadosamente seleccionados',
  },
  {
    icon: 'heart'         as const,
    label: 'Hecho con Amor',
    desc:  'Cada producto lleva la dedicación y el cariño de nuestra familia Nella',
  },
];

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

export default function QuienesSomosScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={require('@/assets/images/fondo plantilla 1.png')}
      style={s.root}
      resizeMode="cover"
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={s.iconBtn} onPress={() => router.back()} hitSlop={12}>
          <BackArrow />
        </Pressable>
        <Text style={s.headerTitle}>¿Quiénes somos?</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: Math.max(insets.bottom, 8) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo centrado */}
        <View style={s.logoWrap}>
          <Image
            source={require('@/assets/images/LOGO SIN FONDO.png')}
            style={s.logo}
            contentFit="contain"
          />
        </View>

        {/* Título y descripción */}
        <View style={s.aboutCard}>
          <Text style={s.aboutTitle}>¿Quiénes somos?</Text>
          <Text style={s.aboutBody}>
            Alimentos Nella es una empresa venezolana con pasión por la gastronomía y el bienestar de las familias.
            Nos dedicamos a la elaboración y distribución de productos congelados de alta calidad: panes artesanales, baguettes, dulces y pizzas, listos para hornear en minutos.
          </Text>
          <Text style={s.aboutBody}>
            Nacimos con el compromiso de llevar sabor y comodidad a tu mesa, usando recetas tradicionales perfeccionadas con técnicas modernas de congelación que preservan el sabor y los nutrientes de cada ingrediente.
          </Text>
          <View style={s.goldDivider} />
          <Text style={s.aboutBody}>
            Trabajamos con proveedores locales de confianza y mantenemos una cadena de frío rigurosa para garantizar que cada producto llegue a tu hogar en óptimas condiciones.
          </Text>
        </View>

        {/* Separador de sección */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLine} />
          <Text style={s.sectionTitle}>Nuestros valores</Text>
          <View style={s.sectionLine} />
        </View>

        {/* Valores — 3 tarjetas */}
        <View style={s.valuesWrap}>
          {VALUES.map((v, i) => (
            <View key={i} style={s.valueCard}>
              <View style={s.valueIconWrap}>
                <Ionicons name={v.icon} size={32} color={GOLD} />
              </View>
              <Text style={s.valueLabel}>{v.label}</Text>
              <Text style={s.valueDesc}>{v.desc}</Text>
            </View>
          ))}
        </View>

        {/* Franja de stats */}
        <View style={s.statsStrip}>
          <View style={s.statItem}>
            <Text style={s.statNum}>+5</Text>
            <Text style={s.statLabel}>Años de{'\n'}experiencia</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>7</Text>
            <Text style={s.statLabel}>Líneas de{'\n'}productos</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>100%</Text>
            <Text style={s.statLabel}>Hecho en{'\n'}Venezuela</Text>
          </View>
        </View>

        {/* Frase final */}
        <View style={s.closingCard}>
          <Ionicons name="heart" size={28} color={RED} />
          <Text style={s.closingText}>
            ¡Gracias por preferirnos!{'\n'}Seguimos trabajando para llevarte lo mejor a tu hogar.
          </Text>
          <View style={s.closingSignature}>
            <Text style={s.signatureText}>— El equipo de Alimentos Nella</Text>
          </View>
        </View>
      </ScrollView>

      <BottomNavBar />
    </ImageBackground>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'rgba(251,243,226,0.95)',
    borderBottomWidth: 1.5,
    borderBottomColor: `${GOLD}44`,
  },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(251,243,226,0.88)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: `${GOLD}44`,
  },
  headerTitle: {
    fontFamily: NellaFonts.display,
    fontSize: 22,
    color: RED,
  },

  scroll: { padding: 16, gap: 20 },

  // Logo
  logoWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  logo: { width: 120, height: 80 },

  // Tarjeta descriptiva
  aboutCard: {
    backgroundColor: BG,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 20,
    gap: 12,
    shadowColor: '#5A0000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  aboutTitle: {
    fontFamily: NellaFonts.display,
    fontSize: 26,
    color: RED,
    textAlign: 'center',
    lineHeight: 32,
  },
  aboutBody: {
    fontFamily: NellaFonts.italic,
    fontSize: 14,
    color: NellaColors.subtitleGray,
    lineHeight: 22,
    textAlign: 'justify',
  },
  goldDivider: {
    height: 1.5,
    backgroundColor: `${GOLD}55`,
    borderRadius: 1,
    marginVertical: 2,
  },

  // Separador de sección
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionLine: {
    flex: 1, height: 1.5,
    backgroundColor: `${GOLD}55`,
    borderRadius: 1,
  },
  sectionTitle: {
    fontFamily: NellaFonts.display,
    fontSize: 18,
    color: RED,
  },

  // Valores
  valuesWrap: { gap: 12 },
  valueCard: {
    backgroundColor: BG,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#5A0000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  valueIconWrap: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: `${GOLD}18`,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: `${GOLD}55`,
  },
  valueLabel: {
    fontFamily: NellaFonts.bold,
    fontSize: 16,
    color: RED,
    textAlign: 'center',
  },
  valueDesc: {
    fontFamily: NellaFonts.italic,
    fontSize: 13,
    color: NellaColors.bodyGray,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Franja de stats
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: GOLD,
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: {
    width: 1.5, height: 40,
    backgroundColor: `${GOLD}66`,
    borderRadius: 1,
  },
  statNum: {
    fontFamily: NellaFonts.display,
    fontSize: 24,
    color: GOLD,
    lineHeight: 28,
  },
  statLabel: {
    fontFamily: NellaFonts.italic,
    fontSize: 11,
    color: '#FFE4B0',
    textAlign: 'center',
    lineHeight: 15,
  },

  // Frase final
  closingCard: {
    backgroundColor: BG,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 22,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#5A0000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  closingText: {
    fontFamily: NellaFonts.display,
    fontSize: 18,
    color: RED,
    textAlign: 'center',
    lineHeight: 26,
  },
  closingSignature: {
    borderTopWidth: 1,
    borderTopColor: `${GOLD}44`,
    paddingTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  signatureText: {
    fontFamily: NellaFonts.italic,
    fontSize: 13,
    color: NellaColors.bodyGray,
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
    flex: 1, alignItems: 'center',
    gap: 3, paddingVertical: 4, borderRadius: 10,
  },
  navLabel: {
    fontFamily: NellaFonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
