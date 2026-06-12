import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
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
import { addToCart, useCart } from '@/store/cart';

// ─── Product registry ─────────────────────────────────────────────────────────
// Images must be statically required at bundle time, so they live here.

type Product = {
  name: string;
  price: string;
  presentacion: string;
  description: string;
  img: ReturnType<typeof require>;
};

const PRODUCTS: Record<string, Product> = {
  '1': {
    name: 'Pancitos Franceses\nCongelados',
    price: '$2.50',
    presentacion: '5 unidades',
    description:
      'Deliciosos pancitos franceses elaborados con ingredientes seleccionados, listos para hornear directamente del congelador. Corteza crujiente e interior suave y esponjoso.',
    img: require('@/assets/images/Pancitos Franceses.png'),
  },
  '2': {
    name: 'Baguette\nTradicionales',
    price: '$3.00',
    presentacion: '5 unidades',
    description:
      'Baguette artesanal de estilo clásico, con una corteza dorada y crujiente. Perfecto para acompañar sopas, quesos o simplemente con mantequilla.',
    img: require('@/assets/images/Pancitos Baguette Tradicionales.png'),
  },
  '3': {
    name: 'Baguette\nParmesano',
    price: '$3.25',
    presentacion: '5 unidades',
    description:
      'Baguette relleno con auténtico queso parmesano, ideal para los amantes del queso. Horneado directo del congelador con un sabor intenso y gratinado irresistible.',
    img: require('@/assets/images/Pancitos Baguette Parmesano.png'),
  },
  '4': {
    name: 'Baguette\nOrégano',
    price: '$3.25',
    presentacion: '5 unidades',
    description:
      'Baguette aromatizado con orégano fresco, una combinación perfecta de hierbas y pan crujiente. Ideal para acompañar pastas y ensaladas mediterráneas.',
    img: require('@/assets/images/Pancitos Baguette Oregano.png'),
  },
  '5': {
    name: 'Pancitos\nDulces',
    price: '$2.75',
    presentacion: '5 unidades',
    description:
      'Suaves pancitos dulces con un toque de azúcar y vainilla. Perfectos para el desayuno o la merienda, listos en minutos desde el congelador.',
    img: require('@/assets/images/Pancitos Dulces.png'),
  },
  '6': {
    name: 'Pancitos Dulces\nChips de Chocolate',
    price: '$3.00',
    presentacion: '5 unidades',
    description:
      'Pancitos dulces esponjosos rellenos de chips de chocolate belga. Un placer irresistible para toda la familia, listos para hornear en minutos.',
    img: require('@/assets/images/Pancitos Dulces Chips Chocolate.png'),
  },
  '7': {
    name: 'Pizza\nMargarita',
    price: '$4.50',
    presentacion: '2 unidades',
    description:
      'Pizza margarita clásica con salsa de tomate natural, mozzarella derretida y albahaca fresca. Lista para hornear en casa con sabor de pizzería artesanal.',
    img: require('@/assets/images/Pizza Margarita.png'),
  },
};

const DEFAULT_PRODUCT = PRODUCTS['1'];

// ─── Back arrow ───────────────────────────────────────────────────────────────

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
  shaft:     { position: 'absolute', left: 3, width: 17, height: 2.5, backgroundColor: NellaColors.red, borderRadius: 2 },
  tipTop:    { position: 'absolute', left: 3, top: 5,    width: 10, height: 2.5, backgroundColor: NellaColors.red, borderRadius: 2, transform: [{ rotate: '-45deg' }] },
  tipBottom: { position: 'absolute', left: 3, bottom: 5, width: 10, height: 2.5, backgroundColor: NellaColors.red, borderRadius: 2, transform: [{ rotate: '45deg' }]  },
});

// ─── Heart icon ───────────────────────────────────────────────────────────────

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <Text style={{ fontSize: 22, color: filled ? '#E53935' : NellaColors.lightGray }}>
      {filled ? '♥' : '♡'}
    </Text>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text
          key={i}
          style={{ fontSize: 17, color: i <= full ? NellaColors.gold : i === full + 1 ? '#D4A843' : '#D0C4A8' }}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

// ─── Detail chips ─────────────────────────────────────────────────────────────

const DETAILS_BASE = [
  { icon: '⚖️', label: 'Peso',        value: '250 g'     },
  { icon: '🕐', label: 'Preparación', value: '5 – 8 min' },
] as const;

function getDetails(product: Product) {
  return [
    { icon: '📦', label: 'Presentación', value: product.presentacion },
    ...DETAILS_BASE,
  ];
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const product = (id && PRODUCTS[id]) ? PRODUCTS[id] : DEFAULT_PRODUCT;

  const { totalItems } = useCart();
  const [liked,    setLiked]    = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added,    setAdded]    = useState(false);

  const handleAddToCart = () => {
    addToCart(
      { id: id ?? '1', name: product.name, price: parseFloat(product.price.replace('$', '')), img: product.img },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <ImageBackground
      source={require('@/assets/images/fondo plantilla 1.png')}
      style={s.root}
      resizeMode="cover"
    >
      {/* ── Top bar ───────────────────────────────────── */}
      <View style={[s.topBar, { paddingTop: insets.top + 10 }]}>
        <Pressable style={s.iconBtn} onPress={() => router.back()} hitSlop={12}>
          <BackArrow />
        </Pressable>

        {/* Ícono carrito con badge */}
        <Pressable style={s.iconBtn} onPress={() => router.push('/cart')} hitSlop={12}>
          <View>
            <Text style={{ fontSize: 20 }}>🛒</Text>
            {totalItems > 0 && (
              <View style={s.cartBadge}>
                <Text style={s.cartBadgeText}>{totalItems > 9 ? '9+' : totalItems}</Text>
              </View>
            )}
          </View>
        </Pressable>

        <Pressable style={s.iconBtn} onPress={() => setLiked((v) => !v)} hitSlop={12}>
          <HeartIcon filled={liked} />
        </Pressable>
      </View>

      {/* ── Scrollable body ───────────────────────────── */}
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Product image card ── */}
        <View style={s.imgCard}>
          <Image
            source={product.img}
            style={s.productImg}
            contentFit="contain"
          />
          <View style={s.frozenBadge}>
            <Text style={s.frozenText}>❄  Mantener congelado</Text>
          </View>
        </View>

        {/* ── Info card ── */}
        <View style={s.infoCard}>

          <Text style={s.productName}>{product.name}</Text>

          <View style={s.ratingRow}>
            <Stars rating={4.8} />
            <Text style={s.ratingNum}>4.8</Text>
            <Text style={s.reviewCount}>(120 reseñas)</Text>
          </View>

          <Text style={s.description}>{product.description}</Text>

          <View style={s.chipsRow}>
            {getDetails(product).map((d) => (
              <View key={d.label} style={s.chip}>
                <Text style={s.chipIcon}>{d.icon}</Text>
                <Text style={s.chipLabel}>{d.label}</Text>
                <Text style={s.chipValue}>{d.value}</Text>
              </View>
            ))}
          </View>

          <View style={s.divider} />

          {/* Precio + selector de cantidad */}
          <View style={s.priceRow}>
            <Text style={s.price}>{product.price}</Text>

            <View style={s.qtyRow}>
              <TouchableOpacity
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                hitSlop={8}
                activeOpacity={0.7}
                style={s.qtyBtn}
              >
                <Text style={s.qtyBtnText}>−</Text>
              </TouchableOpacity>

              <View style={s.qtyNumWrap}>
                <Text style={s.qtyNum}>{quantity}</Text>
              </View>

              <TouchableOpacity
                onPress={() => setQuantity((q) => q + 1)}
                hitSlop={8}
                activeOpacity={0.7}
                style={s.qtyBtn}
              >
                <Text style={s.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón carrito */}
          <TouchableOpacity activeOpacity={0.82} style={[s.cartBtn, added && s.cartBtnDone]} onPress={handleAddToCart}>
            <Text style={s.cartIcon}>{added ? '✓' : '🛒'}</Text>
            <Text style={s.cartBtnText}>{added ? '¡Agregado!' : 'Agregar al carrito'}</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </ImageBackground>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  cartBadge: {
    position: 'absolute', top: -4, right: -6,
    backgroundColor: NellaColors.red,
    borderRadius: 8, minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 2,
  },
  cartBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '700', lineHeight: 14 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(251,243,226,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(200,144,26,0.30)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
  },

  scroll: {
    paddingHorizontal: 16,
    gap: 18,
  },

  imgCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(251,243,226,0.94)',
    alignItems: 'center',
    paddingTop: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(200,144,26,0.32)',
    shadowColor: '#5A0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  productImg: {
    width: '82%',
    aspectRatio: 1,
  },
  frozenBadge: {
    width: '100%',
    backgroundColor: 'rgba(20,70,155,0.84)',
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 12,
  },
  frozenText: {
    fontFamily: NellaFonts.bold,
    fontSize: 13.5,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  infoCard: {
    backgroundColor: 'rgba(251,243,226,0.95)',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(200,144,26,0.28)',
    shadowColor: '#5A0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },

  productName: {
    fontFamily: NellaFonts.display,
    fontSize: 30,
    color: NellaColors.red,
    lineHeight: 36,
    marginBottom: 10,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  ratingNum: {
    fontFamily: NellaFonts.bold,
    fontSize: 15,
    color: NellaColors.gold,
  },
  reviewCount: {
    fontFamily: NellaFonts.regular,
    fontSize: 13,
    color: NellaColors.bodyGray,
  },

  description: {
    fontFamily: NellaFonts.regular,
    fontSize: 15,
    color: NellaColors.bodyGray,
    lineHeight: 23,
    marginBottom: 18,
  },

  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 18,
  },
  chip: {
    flex: 1,
    backgroundColor: 'rgba(200,144,26,0.10)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(200,144,26,0.28)',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 4,
  },
  chipIcon:  { fontSize: 19 },
  chipLabel: {
    fontFamily: NellaFonts.bold,
    fontSize: 11,
    color: NellaColors.red,
    textAlign: 'center',
  },
  chipValue: {
    fontFamily: NellaFonts.italic,
    fontSize: 12,
    color: NellaColors.bodyGray,
    textAlign: 'center',
  },

  divider: {
    height: 1.5,
    backgroundColor: 'rgba(200,144,26,0.25)',
    borderRadius: 1,
    marginBottom: 18,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  price: {
    fontFamily: NellaFonts.display,
    fontSize: 40,
    color: NellaColors.red,
    lineHeight: 46,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: NellaColors.red,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: NellaColors.red,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  qtyBtnText: {
    color: NellaColors.red,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    includeFontPadding: false,
  },
  qtyNumWrap: {
    minWidth: 44,
    alignItems: 'center',
  },
  qtyNum: {
    fontFamily: NellaFonts.bold,
    fontSize: 24,
    color: NellaColors.red,
    textAlign: 'center',
  },

  cartBtnDone: {
    backgroundColor: '#2E7D32',
  },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NellaColors.red,
    borderRadius: 30,
    paddingVertical: 17,
    paddingHorizontal: 28,
    gap: 12,
    shadowColor: NellaColors.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  cartIcon: { fontSize: 22 },
  cartBtnText: {
    fontFamily: NellaFonts.bold,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
