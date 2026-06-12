import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NellaColors, NellaFonts } from '@/constants/theme';
import { validarCupon } from '@/services/firestore';
import { applyCoupon, removeCoupon, useCart } from '@/store/cart';

const RED  = NellaColors.red;
const GOLD = NellaColors.gold;
const GRAY = NellaColors.lightGray;
const BG   = '#FBF3E2';

const DELIVERY = 1.50;

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
  { name: 'home',       label: 'Inicio',     icon: 'home-outline'     as const, href: '/(tabs)/home'        },
  { name: 'categorias', label: 'Categorías', icon: 'grid-outline'     as const, href: '/(tabs)/categorias'  },
  { name: 'ofertas',    label: 'Ofertas',    icon: 'pricetag-outline' as const, href: '/(tabs)/ofertas'     },
  { name: 'pedidos',    label: 'Pedidos',    icon: 'receipt-outline'  as const, href: '/(tabs)/pedidos'     },
  { name: 'perfil',     label: 'Perfil',     icon: 'person-outline'   as const, href: '/(tabs)/perfil'      },
];

function BottomNavBar() {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={StyleSheet.flatten([s.navBar, { paddingBottom: Math.max(bottom, 8) }])}>
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

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { items, coupon, updateQty, removeFromCart } = useCart();

  const [couponCode,    setCouponCode]    = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError,   setCouponError]   = useState('');

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = coupon
    ? coupon.tipo === 'porcentaje'
      ? subtotal * (coupon.descuento / 100)
      : Math.min(coupon.descuento, subtotal)
    : 0;
  const total = subtotal + (items.length > 0 ? DELIVERY : 0) - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    const result = await validarCupon(couponCode, subtotal);
    setCouponLoading(false);
    if (result.ok) {
      applyCoupon({
        id:        result.cupon.id!,
        codigo:    result.cupon.codigo,
        tipo:      result.cupon.tipo,
        descuento: result.cupon.descuento,
      });
      setCouponCode('');
    } else {
      setCouponError(result.error);
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
        <Text style={s.title}>Mi Carrito</Text>
        <View style={s.badgeWrap}>
          <Ionicons name="cart-outline" size={22} color={RED} />
          {items.length > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{items.length}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: Math.max(insets.bottom, 8) + 90 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Lista de productos */}
        {items.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="cart-outline" size={64} color={`${GOLD}88`} />
            <Text style={s.emptyTitle}>Tu carrito está vacío</Text>
            <Text style={s.emptyDesc}>Agrega productos desde el catálogo</Text>
            <Pressable style={s.emptyBtn} onPress={() => router.push('/catalogo')}>
              <Text style={s.emptyBtnText}>Ver Catálogo</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {items.map((item) => (
              <View key={item.id} style={s.itemCard}>
                {/* Imagen */}
                <View style={s.itemImgWrap}>
                  <Image source={item.img} style={s.itemImg} contentFit="contain" />
                </View>

                {/* Info + acciones */}
                <View style={s.itemInfo}>
                  {/* Nombre + botón eliminar en la misma fila */}
                  <View style={s.itemTopRow}>
                    <Text style={s.itemName} numberOfLines={2}>{item.name}</Text>
                    <TouchableOpacity
                      style={s.deleteBtn}
                      onPress={() => removeFromCart(item.id)}
                      activeOpacity={0.5}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={RED} />
                    </TouchableOpacity>
                  </View>

                  <Text style={s.itemUnit}>${item.price.toFixed(2)} c/u</Text>

                  {/* Selector cantidad + precio total */}
                  <View style={s.itemBottomRow}>
                    <View style={s.qtyRow}>
                      <TouchableOpacity
                        style={s.qtyBtn}
                        onPress={() => updateQty(item.id, -1)}
                        activeOpacity={0.7}
                      >
                        <Text style={s.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <View style={s.qtyNumWrap}>
                        <Text style={s.qtyNum}>{item.qty}</Text>
                      </View>
                      <TouchableOpacity
                        style={s.qtyBtn}
                        onPress={() => updateQty(item.id, 1)}
                        activeOpacity={0.7}
                      >
                        <Text style={s.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={s.itemPrice}>${(item.price * item.qty).toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Cupón de descuento */}
            <View style={s.couponCard}>
              <Text style={s.couponTitle}>¿Tienes un cupón?</Text>

              {coupon ? (
                <View style={s.couponApplied}>
                  <Ionicons name="ticket-outline" size={20} color="#2E7D32" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.couponAppliedCode}>{coupon.codigo}</Text>
                    <Text style={s.couponAppliedDesc}>
                      {coupon.tipo === 'porcentaje'
                        ? `${coupon.descuento}% de descuento`
                        : `$${coupon.descuento.toFixed(2)} de descuento`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => { removeCoupon(); setCouponError(''); }} hitSlop={10}>
                    <Ionicons name="close-circle" size={22} color="#8B0000" />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={s.couponRow}>
                    <TextInput
                      style={s.couponInput}
                      placeholder="Ingresa tu código"
                      placeholderTextColor="#AAA"
                      value={couponCode}
                      onChangeText={(t) => { setCouponCode(t.toUpperCase()); setCouponError(''); }}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      onSubmitEditing={handleApplyCoupon}
                      returnKeyType="done"
                    />
                    <TouchableOpacity
                      style={[s.couponBtn, !couponCode.trim() && s.couponBtnDisabled]}
                      onPress={handleApplyCoupon}
                      disabled={!couponCode.trim() || couponLoading}
                      activeOpacity={0.8}
                    >
                      {couponLoading
                        ? <ActivityIndicator size="small" color="#FFF" />
                        : <Text style={s.couponBtnText}>Aplicar</Text>}
                    </TouchableOpacity>
                  </View>
                  {!!couponError && (
                    <Text style={s.couponError}>{couponError}</Text>
                  )}
                </>
              )}
            </View>

            {/* Resumen */}
            <View style={s.summary}>
              <Text style={s.summaryTitle}>Resumen del pedido</Text>

              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Subtotal</Text>
                <Text style={s.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>

              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Delivery</Text>
                <Text style={s.summaryValue}>${DELIVERY.toFixed(2)}</Text>
              </View>

              {discount > 0 && (
                <View style={s.summaryRow}>
                  <Text style={[s.summaryLabel, { color: '#2E7D32' }]}>
                    Descuento ({coupon!.codigo})
                  </Text>
                  <Text style={s.discountValue}>-${discount.toFixed(2)}</Text>
                </View>
              )}

              <View style={s.divider} />

              <View style={s.summaryRow}>
                <Text style={s.totalLabel}>Total</Text>
                <Text style={s.totalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>

            {/* Botón pagar */}
            <TouchableOpacity style={s.payBtn} activeOpacity={0.82} onPress={() => router.push('/payment-methods')}>
              <Ionicons name="card-outline" size={22} color="#FFF" />
              <Text style={s.payBtnText}>Proceder al Pago</Text>
            </TouchableOpacity>
          </>
        )}
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
  title: {
    fontFamily: NellaFonts.display,
    fontSize: 26,
    color: RED,
  },
  badgeWrap: { position: 'relative', width: 42, alignItems: 'center' },
  badge: {
    position: 'absolute',
    top: -4, right: 2,
    backgroundColor: RED,
    borderRadius: 8,
    minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: NellaFonts.bold,
    fontSize: 10,
    color: '#FFF',
    lineHeight: 14,
  },

  scroll: { padding: 14, gap: 12 },

  // Estado vacío
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: NellaFonts.display,
    fontSize: 24,
    color: RED,
  },
  emptyDesc: {
    fontFamily: NellaFonts.italic,
    fontSize: 15,
    color: NellaColors.bodyGray,
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: RED,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  emptyBtnText: {
    fontFamily: NellaFonts.bold,
    fontSize: 16,
    color: '#FFF',
    letterSpacing: 0.4,
  },

  // Tarjeta de ítem
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 10,
    gap: 12,
    shadowColor: '#5A0000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
  },
  itemImgWrap: {
    width: 80, height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(200,144,26,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  itemImg: { width: '90%', height: '90%' },

  itemInfo: { flex: 1, gap: 4 },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  itemName: {
    flex: 1,
    fontFamily: NellaFonts.bold,
    fontSize: 14,
    color: RED,
    lineHeight: 18,
  },
  itemPrice: {
    fontFamily: NellaFonts.display,
    fontSize: 20,
    color: RED,
    lineHeight: 24,
  },
  itemUnit: {
    fontFamily: NellaFonts.italic,
    fontSize: 11,
    color: GRAY,
  },

  // Selector cantidad
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1.5, borderColor: RED,
    backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnText: {
    color: RED,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    includeFontPadding: false,
  },
  qtyNumWrap: { minWidth: 28, alignItems: 'center' },
  qtyNum: {
    fontFamily: NellaFonts.bold,
    fontSize: 18,
    color: RED,
  },

  // Botón eliminar
  deleteBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(139,0,0,0.10)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: `${RED}55`,
  },

  // Cupón
  couponCard: {
    backgroundColor: BG,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 16,
    gap: 10,
    marginTop: 4,
  },
  couponTitle: {
    fontFamily: NellaFonts.bold,
    fontSize: 15,
    color: RED,
  },
  couponRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    fontFamily: NellaFonts.bold,
    fontSize: 15,
    color: RED,
    borderWidth: 1.5,
    borderColor: `${GOLD}88`,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#FFF',
    letterSpacing: 1.5,
  },
  couponBtn: {
    backgroundColor: RED,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    minHeight: 42,
  },
  couponBtnDisabled: {
    backgroundColor: `${GOLD}55`,
  },
  couponBtnText: {
    fontFamily: NellaFonts.bold,
    fontSize: 14,
    color: '#FFF',
  },
  couponError: {
    fontFamily: NellaFonts.italic,
    fontSize: 13,
    color: '#DC2626',
    marginTop: -4,
  },
  couponApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    padding: 10,
    gap: 10,
  },
  couponAppliedCode: {
    fontFamily: NellaFonts.bold,
    fontSize: 14,
    color: '#1A5C20',
    letterSpacing: 1,
  },
  couponAppliedDesc: {
    fontFamily: NellaFonts.italic,
    fontSize: 12,
    color: '#2E7D32',
  },
  discountValue: {
    fontFamily: NellaFonts.bold,
    fontSize: 15,
    color: '#2E7D32',
  },

  // Resumen
  summary: {
    backgroundColor: BG,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 18,
    gap: 10,
    marginTop: 4,
  },
  summaryTitle: {
    fontFamily: NellaFonts.display,
    fontSize: 20,
    color: RED,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: NellaFonts.regular,
    fontSize: 15,
    color: NellaColors.bodyGray,
  },
  summaryValue: {
    fontFamily: NellaFonts.bold,
    fontSize: 15,
    color: NellaColors.subtitleGray,
  },
  divider: {
    height: 1.5,
    backgroundColor: `${GOLD}44`,
    borderRadius: 1,
  },
  totalLabel: {
    fontFamily: NellaFonts.display,
    fontSize: 22,
    color: RED,
  },
  totalValue: {
    fontFamily: NellaFonts.display,
    fontSize: 26,
    color: RED,
    lineHeight: 30,
  },

  // Botón pagar
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RED,
    borderRadius: 30,
    paddingVertical: 17,
    paddingHorizontal: 28,
    gap: 12,
    marginTop: 4,
    shadowColor: RED,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 12,
    elevation: 8,
  },
  payBtnText: {
    fontFamily: NellaFonts.bold,
    fontSize: 19,
    color: '#FFF',
    letterSpacing: 0.5,
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
