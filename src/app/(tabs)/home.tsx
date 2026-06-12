import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NellaColors, NellaFonts } from '@/constants/theme';
import { useAuthUser } from '@/hooks/useAuthUser';
import { logoutUser } from '@/services/auth';
import { addToCart, useCart } from '@/store/cart';

const RED  = NellaColors.red;
const GOLD = NellaColors.gold;
const BG   = '#FBF3E2';
const DRAWER_WIDTH = Dimensions.get('window').width * 0.78;

// ─── Header icons ─────────────────────────────────────────────────────────────

function HamburgerIcon() {
  return (
    <View style={burgerSt.wrap}>
      <View style={burgerSt.line} />
      <View style={[burgerSt.line, burgerSt.mid]} />
      <View style={burgerSt.line} />
    </View>
  );
}
const burgerSt = StyleSheet.create({
  wrap: { width: 26, height: 20, justifyContent: 'space-between' },
  line: { height: 2.5, backgroundColor: RED, borderRadius: 2 },
  mid:  { width: '75%' },
});

function CartIcon({ count }: { count: number }) {
  return (
    <View style={cartSt.wrap}>
      <View style={cartSt.handle} />
      <View style={cartSt.basket} />
      <View style={cartSt.wheelRow}>
        <View style={cartSt.wheel} />
        <View style={cartSt.wheel} />
      </View>
      {count > 0 && (
        <View style={cartSt.badge}>
          <Text style={cartSt.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  );
}
const cartSt = StyleSheet.create({
  wrap:     { width: 28, height: 26, position: 'relative' },
  handle:   { position: 'absolute', top: 0, left: 8, width: 12, height: 8, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderWidth: 2.5, borderBottomWidth: 0, borderColor: RED },
  basket:   { position: 'absolute', top: 6, left: 2, width: 24, height: 13, borderWidth: 2.5, borderRadius: 3, borderColor: RED },
  wheelRow: { position: 'absolute', bottom: 0, left: 5, flexDirection: 'row', gap: 10 },
  wheel:    { width: 5, height: 5, borderRadius: 2.5, backgroundColor: RED },
  badge:    { position: 'absolute', top: -5, right: -7, backgroundColor: RED, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});

// ─── Menú lateral ─────────────────────────────────────────────────────────────

const MENU_ITEMS = [
  { label: 'Inicio',                      icon: 'sparkles-outline'           as const, href: '/'               },
  { label: 'Home',                        icon: 'home-outline'               as const, href: '/(tabs)/home'    },
  { label: 'Catálogo',                    icon: 'grid-outline'               as const, href: '/catalogo'       },
  { label: 'Ofertas',                     icon: 'pricetag-outline'           as const, href: '/(tabs)/ofertas' },
  { label: 'Mis Pedidos',                 icon: 'receipt-outline'            as const, href: '/(tabs)/pedidos' },
  { label: 'Mi Perfil',                   icon: 'person-outline'             as const, href: '/(tabs)/perfil'  },
  { label: 'Mayoristas y Distribuidores', icon: 'car-sport-outline'          as const, href: '/mayoristas',     highlight: true },
  { label: '¿Quiénes somos?',             icon: 'information-circle-outline' as const, href: '/quienes-somos'  },
];

function SideDrawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const { user } = useAuthUser();

  const handleLogout = () => {
    onClose();
    setTimeout(() => {
      Alert.alert(
        'Cerrar Sesión',
        '¿Seguro que deseas cerrar sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cerrar Sesión',
            style: 'destructive',
            onPress: async () => {
              await logoutUser();
              router.replace('/');
            },
          },
        ]
      );
    }, 250);
  };

  // Animar apertura/cierre al cambiar visible
  if (visible) {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  } else {
    Animated.timing(slideAnim, {
      toValue: -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }

  const handleNav = (href: string) => {
    onClose();
    setTimeout(() => router.push(href as any), 230);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Overlay oscuro */}
      <Pressable style={d.overlay} onPress={onClose} />

      {/* Panel deslizante */}
      <Animated.View style={[d.panel, { paddingTop: insets.top + 8, transform: [{ translateX: slideAnim }] }]}>
        {/* Logo + close */}
        <View style={d.drawerHeader}>
          <Image
            source={require('@/assets/images/LOGO SIN FONDO.png')}
            style={d.drawerLogo}
            contentFit="contain"
          />
          <Pressable onPress={onClose} hitSlop={12} style={d.closeBtn}>
            <Ionicons name="close-outline" size={26} color={RED} />
          </Pressable>
        </View>

        <View style={d.divider} />

        {/* Items del menú */}
        <ScrollView showsVerticalScrollIndicator={false} style={d.menuScroll}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[d.menuItem, item.highlight && d.menuItemHighlight]}
              activeOpacity={0.78}
              onPress={() => handleNav(item.href)}
            >
              <View style={[d.menuIconWrap, item.highlight && d.menuIconWrapHL]}>
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={item.highlight ? RED : RED}
                />
              </View>
              <Text style={[d.menuLabel, item.highlight && d.menuLabelHL]}>
                {item.label}
              </Text>
              {item.highlight && (
                <View style={d.newBadge}>
                  <Text style={d.newBadgeText}>Empresas</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pie del drawer */}
        <View style={[d.drawerFooter, { paddingBottom: insets.bottom + 12 }]}>
          {user && (
            <TouchableOpacity style={d.logoutBtn} activeOpacity={0.78} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={RED} />
              <Text style={d.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          )}
          <View style={d.divider} />
          <Text style={d.footerText}>Alimentos Nella © 2026</Text>
          <Text style={d.devText}>Lifetime Style LLC</Text>
          <Text style={d.devText}>(Mobile App Development)</Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const d = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  panel: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: BG,
    borderRightWidth: 2,
    borderRightColor: GOLD,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  drawerLogo: { width: 130, height: 82 },
  closeBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: `${RED}12`,
    justifyContent: 'center', alignItems: 'center',
  },
  divider: {
    height: 1.5,
    backgroundColor: `${GOLD}44`,
    marginHorizontal: 16,
    borderRadius: 1,
    marginBottom: 8,
  },
  menuScroll: { flex: 1, paddingHorizontal: 12 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  menuItemHighlight: {
    backgroundColor: `${GOLD}22`,
    borderWidth: 1.5,
    borderColor: GOLD,
    marginTop: 8,
  },
  menuIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: `${RED}12`,
    justifyContent: 'center', alignItems: 'center',
  },
  menuIconWrapHL: {
    backgroundColor: `${GOLD}33`,
  },
  menuLabel: {
    flex: 1,
    fontFamily: NellaFonts.bold,
    fontSize: 15,
    color: RED,
  },
  menuLabelHL: {
    color: '#7A5000',
  },
  newBadge: {
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: {
    fontFamily: NellaFonts.bold,
    fontSize: 10,
    color: '#FFF',
    letterSpacing: 0.3,
  },
  drawerFooter: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(139,0,0,0.07)',
    borderWidth: 1.5,
    borderColor: `${RED}33`,
  },
  logoutText: {
    fontFamily: NellaFonts.bold,
    fontSize: 15,
    color: RED,
  },
  footerText: {
    fontFamily: NellaFonts.italic,
    fontSize: 11,
    color: NellaColors.bodyGray,
    textAlign: 'center',
    paddingTop: 10,
  },
  devText: {
    fontFamily: NellaFonts.regular,
    fontSize: 10,
    color: NellaColors.lightGray,
    textAlign: 'center',
    marginTop: 2,
  },
});

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: '1', name: 'Panes\nFranceses',     img: require('@/assets/images/Pancitos Franceses 1.png') },
  { id: '2', name: 'Baguette\nPlain',       img: require('@/assets/images/Pancitos Baguette tradicionales 1.png') },
  { id: '3', name: 'Baguette\nParmesano',   img: require('@/assets/images/Pancitos Baguette Parmesano 1.png') },
  { id: '4', name: 'Baguette\nOrégano',     img: require('@/assets/images/Pancitos Baguette Oregano 1.png') },
  { id: '5', name: 'Panes\nDulces',         img: require('@/assets/images/Pancitos Dulces 1.png') },
  { id: '6', name: 'Dulces\nChocolate',     img: require('@/assets/images/Pancitos Dulces chocolate 1.png') },
  { id: '7', name: 'Pizza\nMargarita',      img: require('@/assets/images/Pizza Margarita 1.png') },
  { id: '8', name: 'Promociones\ny Combos', img: require('@/assets/images/banner principal app.png') },
];

const FEATURED = [
  { id: '1', name: 'Pancitos Franceses',     price: '$2.50', img: require('@/assets/images/Pancitos Franceses.png') },
  { id: '2', name: 'Baguette Tradicionales', price: '$3.00', img: require('@/assets/images/Pancitos Baguette Tradicionales.png') },
  { id: '3', name: 'Baguette Parmesano',     price: '$3.25', img: require('@/assets/images/Pancitos Baguette Parmesano.png') },
  { id: '4', name: 'Baguette Orégano',       price: '$3.25', img: require('@/assets/images/Pancitos Baguette Oregano.png') },
  { id: '5', name: 'Pancitos Dulces',        price: '$2.75', img: require('@/assets/images/Pancitos Dulces.png') },
  { id: '6', name: 'Dulces Chips Chocolate', price: '$3.00', img: require('@/assets/images/Pancitos Dulces Chips Chocolate.png') },
  { id: '7', name: 'Pizza Margarita',        price: '$4.50', img: require('@/assets/images/Pizza Margarita.png') },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { totalItems: cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <ImageBackground
      source={require('@/assets/images/fondo plantilla 1.png')}
      style={styles.root}
      resizeMode="cover"
    >
      {/* ── Header ──────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable style={styles.headerBtn} hitSlop={8} onPress={() => setMenuOpen(true)}>
          <HamburgerIcon />
        </Pressable>

        <Image
          source={require('@/assets/images/LOGO SIN FONDO.png')}
          style={styles.headerLogo}
          contentFit="contain"
        />

        <Pressable style={styles.headerBtn} hitSlop={8} onPress={() => router.push('/cart')}>
          <CartIcon count={cartCount} />
        </Pressable>
      </View>

      {/* ── Menú lateral ────────────────────────────────── */}
      <SideDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* ── Contenido ───────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <ImageBackground
          source={require('@/assets/images/fondo plantilla 1.png')}
          style={styles.bannerCard}
          resizeMode="cover"
        >
          <Image
            source={require('@/assets/images/banner principal app.png')}
            style={styles.bannerImg}
            contentFit="contain"
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>
              Productos congelados{'\n'}listos para hornear
            </Text>
            <Pressable style={styles.bannerBtn} onPress={() => router.push('/catalogo')}>
              <Text style={styles.bannerBtnText}>Ver productos</Text>
            </Pressable>
          </View>
        </ImageBackground>

        {/* Banner Mayoristas */}
        <TouchableOpacity
          style={styles.mayoristaBanner}
          activeOpacity={0.85}
          onPress={() => router.push('/mayoristas')}
        >
          <View style={styles.mayoristaLeft}>
            <Ionicons name="car-sport-outline" size={32} color={RED} />
          </View>
          <View style={styles.mayoristaText}>
            <Text style={styles.mayoristaTitle}>¿Tienes un negocio?</Text>
            <Text style={styles.mayoristaSub}>Conoce nuestros planes mayoristas →</Text>
          </View>
        </TouchableOpacity>

        {/* Categorías */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map((c) => (
              <Pressable key={c.id} style={styles.catCard}>
                <View style={styles.catCircle}>
                  <Image source={c.img} style={styles.catImg} contentFit="cover" />
                </View>
                <Text style={styles.catLabel}>{c.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Productos Destacados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos Destacados</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featScroll}
          >
            {FEATURED.map((p) => (
              <Pressable
                key={p.id}
                style={styles.prodCard}
                onPress={() => router.push({ pathname: '/product-detail', params: { id: p.id } })}
              >
                <ImageBackground
                  source={require('@/assets/images/fondo plantilla 1.png')}
                  style={styles.prodCardBg}
                  resizeMode="cover"
                >
                  <Image source={p.img} style={styles.prodImg} contentFit="contain" />
                  <View style={styles.prodFooter}>
                    <Text style={styles.prodName} numberOfLines={2}>{p.name}</Text>
                    <TouchableOpacity
                      style={styles.prodAddBtn}
                      activeOpacity={0.75}
                      onPress={() => addToCart({
                        id: p.id,
                        name: p.name,
                        price: parseFloat(p.price.replace('$', '')),
                        img: p.img,
                      })}
                    >
                      <Text style={styles.prodAddBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </ImageBackground>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: 'rgba(240,228,200,0.97)',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(200,144,26,0.30)',
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerLogo: { width: 100, height: 66 },

  scroll: { paddingBottom: 24, alignSelf: 'stretch' },

  // Banner principal
  bannerCard: { width: '100%', marginTop: 4, marginBottom: 4, overflow: 'hidden' },
  bannerImg:  { width: '100%', aspectRatio: 1.5 },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end', alignItems: 'center',
    padding: 18, gap: 10,
  },
  bannerTitle: {
    fontFamily: NellaFonts.bold, fontSize: 22,
    color: RED, lineHeight: 28, textAlign: 'center',
  },
  bannerBtn: {
    backgroundColor: RED, borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 18, alignSelf: 'center',
  },
  bannerBtnText: { fontFamily: NellaFonts.bold, fontSize: 14, color: '#FFF', letterSpacing: 0.3 },

  // Banner Mayoristas
  mayoristaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 8,
    backgroundColor: `${GOLD}22`,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: GOLD,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  mayoristaLeft: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: `${RED}12`,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: `${RED}25`,
  },
  mayoristaText: { flex: 1, gap: 3 },
  mayoristaTitle: { fontFamily: NellaFonts.bold, fontSize: 14, color: RED },
  mayoristaSub:   { fontFamily: NellaFonts.italic, fontSize: 12, color: '#7A5000' },

  // Section
  section: { marginTop: 20, paddingHorizontal: 14 },
  sectionTitle: { fontFamily: NellaFonts.display, fontSize: 22, color: RED, marginBottom: 12 },

  // Categories grid
  catGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catCard:  { width: '22.5%', alignItems: 'center', gap: 5 },
  catCircle: {
    width: 64, height: 64, borderRadius: 32, overflow: 'hidden',
    borderWidth: 2, borderColor: GOLD, backgroundColor: NellaColors.creamDark,
  },
  catImg:   { width: '100%', height: '100%' },
  catLabel: { fontFamily: NellaFonts.bold, fontSize: 11, color: RED, textAlign: 'center', lineHeight: 14 },

  // Featured products
  featScroll: { gap: 12, paddingHorizontal: 14, paddingBottom: 8 },
  prodCard: { width: 150, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(200,144,26,0.35)' },
  prodCardBg: { width: '100%' },
  prodImg:  { width: '100%', height: 150 },
  prodFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 8 },
  prodName: { flex: 1, fontFamily: NellaFonts.bold, fontSize: 13, color: RED, lineHeight: 18, paddingRight: 6 },
  prodAddBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: RED,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: RED, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
  prodAddBtnText: { color: '#FFF', fontSize: 20, lineHeight: 24, fontWeight: '700', includeFontPadding: false },


});
