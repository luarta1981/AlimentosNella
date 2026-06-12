import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
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
import { clearCart, useCart } from '@/store/cart';
import { crearPedido, registrarUsoCupon } from '@/services/firestore';

const RED  = NellaColors.red;
const GOLD = NellaColors.gold;
const GRAY = NellaColors.lightGray;
const BG   = '#FBF3E2';

// ─── Métodos de pago ──────────────────────────────────────────────────────────

type PayMethod = {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const METHODS: PayMethod[] = [
  {
    id: 'c2p',
    label: 'Pago Móvil C2P',
    desc: 'Paga desde tu banco con tu número de teléfono y cédula',
    icon: 'phone-portrait',
  },
  {
    id: 'transfer',
    label: 'Transferencia Bancaria',
    desc: 'Transfiere directamente a nuestra cuenta bancaria',
    icon: 'business',
  },
  {
    id: 'zelle',
    label: 'Zelle',
    desc: 'Envía tu pago fácil y rápido vía Zelle',
    icon: 'globe',
  },
  {
    id: 'delivery',
    label: 'Pago contra entrega',
    desc: 'Paga en efectivo al recibir tu pedido',
    icon: 'cash',
  },
  {
    id: 'receipt',
    label: 'Comprobante de Pago',
    desc: 'Envía el comprobante de tu pago por WhatsApp o correo',
    icon: 'camera',
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
  shaft:     { position: 'absolute', left: 3, width: 17, height: 2.5, backgroundColor: RED, borderRadius: 2 },
  tipTop:    { position: 'absolute', left: 3, top: 5,    width: 10, height: 2.5, backgroundColor: RED, borderRadius: 2, transform: [{ rotate: '-45deg' }] },
  tipBottom: { position: 'absolute', left: 3, bottom: 5, width: 10, height: 2.5, backgroundColor: RED, borderRadius: 2, transform: [{ rotate: '45deg' }] },
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

const DELIVERY = 1.50;

export default function PaymentMethodsScreen() {
  const insets    = useSafeAreaInsets();
  const { user }            = useAuthUser();
  const { items, coupon }   = useCart();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discount = coupon
    ? coupon.tipo === 'porcentaje'
      ? subtotal * (coupon.descuento / 100)
      : Math.min(coupon.descuento, subtotal)
    : 0;
  const total = subtotal + (items.length > 0 ? DELIVERY : 0) - discount;

  const handleConfirm = async () => {
    if (!selected || items.length === 0) return;
    setSaving(true);
    try {
      const pedidoId = await crearPedido({
        userId:      user?.uid ?? 'invitado',
        items:       items.map((i) => ({
          productId: i.id,
          name:      i.name,
          price:     i.price,
          qty:       i.qty,
        })),
        subtotal,
        delivery:    DELIVERY,
        ...(coupon && { descuento: discount, cuponId: coupon.id, cuponCodigo: coupon.codigo }),
        total,
        status:      'Pendiente',
        address:     '',
        payMethod:   selected,
      });
      if (coupon) registrarUsoCupon(coupon.id);
      clearCart();
      Alert.alert(
        '¡Pedido confirmado!',
        `Tu pedido #${pedidoId.slice(-8).toUpperCase()} fue registrado correctamente.`,
        [{ text: 'Ver mis pedidos', onPress: () => router.replace('/(tabs)/pedidos') }]
      );
    } catch {
      Alert.alert('Error', 'No se pudo guardar el pedido. Intenta de nuevo.');
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
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={s.iconBtn} onPress={() => router.back()} hitSlop={12}>
          <BackArrow />
        </Pressable>
        <Text style={s.headerTitle}>Métodos de Pago</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: Math.max(insets.bottom, 8) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner superior */}
        <View style={s.banner}>
          <Image
            source={require('@/assets/images/LOGO SIN FONDO.png')}
            style={s.bannerLogo}
            contentFit="contain"
          />
          <View style={s.bannerText}>
            <Text style={s.bannerTitle}>Métodos de Pago</Text>
            <Text style={s.bannerSub}>Elige tu método de pago</Text>
          </View>
        </View>

        {/* Tarjetas de método */}
        <View style={s.methodsWrap}>
          {METHODS.map((m) => {
            const isSelected = selected === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[s.methodCard, isSelected && s.methodCardSelected]}
                onPress={() => setSelected(m.id)}
                activeOpacity={0.82}
              >
                {/* Ícono */}
                <View style={[s.methodIconWrap, isSelected && s.methodIconWrapSelected]}>
                  <Ionicons
                    name={m.icon}
                    size={28}
                    color={isSelected ? '#FFF' : GOLD}
                  />
                </View>

                {/* Texto */}
                <View style={s.methodInfo}>
                  <Text style={[s.methodLabel, isSelected && s.methodLabelSelected]}>
                    {m.label}
                  </Text>
                  <Text style={s.methodDesc} numberOfLines={2}>
                    {m.desc}
                  </Text>
                </View>

                {/* Radio */}
                <View style={[s.radio, isSelected && s.radioSelected]}>
                  {isSelected && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mensaje de seguridad */}
        <View style={s.securityBadge}>
          <Ionicons name="shield-checkmark-outline" size={22} color={GOLD} />
          <Text style={s.securityText}>
            Tus pagos son 100% seguros y protegidos
          </Text>
        </View>

        {/* Botón confirmar */}
        <TouchableOpacity
          style={[s.confirmBtn, (!selected || saving) && s.confirmBtnDisabled]}
          activeOpacity={selected ? 0.82 : 1}
          disabled={!selected || saving}
          onPress={handleConfirm}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color={selected ? '#FFF' : `${GRAY}88`}
              />
              <Text style={[s.confirmBtnText, !selected && s.confirmBtnTextDisabled]}>
                Confirmar Pago
              </Text>
            </>
          )}
        </TouchableOpacity>
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
    fontSize: 24,
    color: RED,
  },

  scroll: { padding: 16, gap: 16 },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B0000',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 14,
    gap: 14,
    shadowColor: '#5A0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 6,
  },
  bannerLogo: { width: 52, height: 52 },
  bannerText: { flex: 1, gap: 2 },
  bannerTitle: {
    fontFamily: NellaFonts.display,
    fontSize: 22,
    color: '#FFFFFF',
    lineHeight: 26,
  },
  bannerSub: {
    fontFamily: NellaFonts.italic,
    fontSize: 13,
    color: '#FFD9A0',
  },

  // Métodos
  methodsWrap: { gap: 12 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF3E2',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C8901A',
    padding: 14,
    gap: 14,
    shadowColor: '#5A0000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  methodCardSelected: {
    borderColor: RED,
    backgroundColor: '#FBF3E2',
    shadowOpacity: 0.14,
    elevation: 5,
  },

  methodIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: `${GOLD}18`,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: `${GOLD}55`,
  },
  methodIconWrapSelected: {
    backgroundColor: RED,
    borderColor: RED,
  },

  methodInfo: { flex: 1, gap: 3 },
  methodLabel: {
    fontFamily: NellaFonts.bold,
    fontSize: 15,
    color: RED,
    lineHeight: 19,
  },
  methodLabelSelected: {
    color: RED,
  },
  methodDesc: {
    fontFamily: NellaFonts.italic,
    fontSize: 12,
    color: GRAY,
    lineHeight: 16,
  },

  // Radio button
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: `${GRAY}88`,
    justifyContent: 'center', alignItems: 'center',
  },
  radioSelected: {
    borderColor: RED,
  },
  radioDot: {
    width: 11, height: 11, borderRadius: 5.5,
    backgroundColor: RED,
  },

  // Seguridad
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${GOLD}18`,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: `${GOLD}55`,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  securityText: {
    fontFamily: NellaFonts.italic,
    fontSize: 13,
    color: '#5A4000',
    lineHeight: 18,
    flexShrink: 1,
  },

  // Botón confirmar
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RED,
    borderRadius: 30,
    paddingVertical: 17,
    paddingHorizontal: 28,
    gap: 12,
    shadowColor: RED,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmBtnDisabled: {
    backgroundColor: `${GRAY}55`,
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: {
    fontFamily: NellaFonts.bold,
    fontSize: 19,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  confirmBtnTextDisabled: {
    color: `${GRAY}88`,
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
