import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { onProductosChange } from '@/services/firestore';
import { addToCart } from '@/store/cart';

const RED  = NellaColors.red;
const GOLD = NellaColors.gold;
const GRAY = NellaColors.lightGray;
const BG   = '#FBF3E2';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Cat = 'panes' | 'baguettes' | 'dulces' | 'pizza';

type Product = {
  id: string;
  name: string;
  cat: Cat;
  subcat: string;
  weight: string;
  price: string;
  img: ReturnType<typeof require>;
};

// ─── Imágenes locales (siempre disponibles offline) ───────────────────────────

const IMG_MAP: Record<string, ReturnType<typeof require>> = {
  'Pancitos Franceses 1.png':              require('@/assets/images/Pancitos Franceses 1.png'),
  'Pancitos Baguette tradicionales 1.png': require('@/assets/images/Pancitos Baguette tradicionales 1.png'),
  'Pancitos Baguette Parmesano 1.png':     require('@/assets/images/Pancitos Baguette Parmesano 1.png'),
  'Pancitos Baguette Oregano 1.png':       require('@/assets/images/Pancitos Baguette Oregano 1.png'),
  'Pancitos Dulces 1.png':                 require('@/assets/images/Pancitos Dulces 1.png'),
  'Pancitos Dulces chocolate 1.png':       require('@/assets/images/Pancitos Dulces chocolate 1.png'),
  'Pizza Margarita 1.png':                 require('@/assets/images/Pizza Margarita 1.png'),
};

// Datos locales como fallback mientras Firestore carga
const LOCAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Pancitos Franceses',    cat: 'panes',     subcat: 'franceses',          weight: '250 g', price: '$2.50', img: IMG_MAP['Pancitos Franceses 1.png'] },
  { id: '2', name: 'Baguette Plain',         cat: 'baguettes', subcat: 'baguette_plain',     weight: '300 g', price: '$3.00', img: IMG_MAP['Pancitos Baguette tradicionales 1.png'] },
  { id: '3', name: 'Baguette Parmesano',     cat: 'baguettes', subcat: 'baguette_parmesano', weight: '300 g', price: '$3.25', img: IMG_MAP['Pancitos Baguette Parmesano 1.png'] },
  { id: '4', name: 'Baguette Orégano',       cat: 'baguettes', subcat: 'baguette_oregano',   weight: '300 g', price: '$3.25', img: IMG_MAP['Pancitos Baguette Oregano 1.png'] },
  { id: '5', name: 'Panes Dulces',           cat: 'panes',     subcat: 'dulces',             weight: '200 g', price: '$2.75', img: IMG_MAP['Pancitos Dulces 1.png'] },
  { id: '6', name: 'Panes Dulces Chocolate', cat: 'dulces',    subcat: 'dulces_chocolate',   weight: '200 g', price: '$3.00', img: IMG_MAP['Pancitos Dulces chocolate 1.png'] },
  { id: '7', name: 'Pizza Margarita',        cat: 'pizza',     subcat: 'pizza',              weight: '350 g', price: '$4.50', img: IMG_MAP['Pizza Margarita 1.png'] },
];

// ─── Filtros ──────────────────────────────────────────────────────────────────

const FILTERS = ['Todos', 'Panes', 'Baguettes', 'Dulces', 'Pizza'] as const;
type Filter = typeof FILTERS[number];

const FILTER_CAT: Record<Filter, Cat | null> = {
  Todos:     null,
  Panes:     'panes',
  Baguettes: 'baguettes',
  Dulces:    'dulces',
  Pizza:     'pizza',
};

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

// ─── Tarjeta de producto ──────────────────────────────────────────────────────

function ProductCard({ item }: { item: Product }) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart({
      id: item.id,
      name: item.name,
      price: parseFloat(item.price.replace('$', '')),
      img: item.img,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 900);
  };

  return (
    <Pressable
      style={s.card}
      onPress={() => router.push({ pathname: '/product-detail', params: { id: item.id } })}
    >
      <View style={s.cardImgWrap}>
        <Image source={item.img} style={s.cardImg} contentFit="cover" />
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardName} numberOfLines={2}>{item.name}</Text>
        <Text style={s.cardWeight}>{item.weight}</Text>
        <View style={s.cardFooter}>
          <Text style={s.cardPrice}>{item.price}</Text>
          <TouchableOpacity
            onPress={handleAdd}
            activeOpacity={0.75}
            style={[s.addBtn, added && s.addBtnDone]}
          >
            <Text style={s.addBtnText}>{added ? '✓' : '+'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Barra de navegación inferior ────────────────────────────────────────────

const NAV_TABS = [
  { name: 'home',       label: 'Inicio',     icon: 'home-outline'     as const, href: '/(tabs)/home'        },
  { name: 'categorias', label: 'Categorías', icon: 'grid'             as const, href: '/(tabs)/categorias', active: true },
  { name: 'ofertas',    label: 'Ofertas',    icon: 'pricetag-outline' as const, href: '/(tabs)/ofertas'     },
  { name: 'pedidos',    label: 'Pedidos',    icon: 'receipt-outline'  as const, href: '/(tabs)/pedidos'     },
  { name: 'perfil',     label: 'Perfil',     icon: 'person-outline'   as const, href: '/(tabs)/perfil'      },
];

function BottomNavBar() {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={StyleSheet.flatten([s.navBar, { paddingBottom: Math.max(bottom, 8) }])}>
      {NAV_TABS.map((t) => {
        const iconColor  = t.active ? RED : GRAY;
        const labelColor = t.active ? RED : '#4B5320';
        return (
          <Pressable
            key={t.name}
            style={[s.navBtn, t.active && s.navBtnActive]}
            onPress={() => router.navigate(t.href as any)}
          >
            <Ionicons name={t.icon} size={24} color={iconColor} />
            <Text style={[s.navLabel, { color: labelColor }]}>{t.label}</Text>
            {t.active && <View style={s.navActiveBar} />}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function CatalogoScreen() {
  const insets = useSafeAreaInsets();
  const { subcat: subcatParam, title: titleParam } =
    useLocalSearchParams<{ subcat?: string; title?: string }>();

  const [filter, setFilter] = useState<Filter>('Todos');
  const [activeSubcat, setActiveSubcat] = useState<string | undefined>(subcatParam);
  const [products, setProducts] = useState<Product[]>(LOCAL_PRODUCTS);

  useEffect(() => {
    const unsub = onProductosChange((firestoreList) => {
      if (firestoreList.length === 0) return;
      const mapped: Product[] = firestoreList
        .filter((p) => p.available !== false)
        .map((p) => ({
          id:     p.id ?? '',
          name:   p.name,
          cat:    (p.category as Cat) ?? 'panes',
          subcat: p.subcat ?? '',
          weight: p.weight ?? '',
          price:  `$${Number(p.price).toFixed(2)}`,
          img:    IMG_MAP[p.imgUrl ?? ''] ?? IMG_MAP['Pancitos Franceses 1.png'],
        }));
      setProducts(mapped);
    });
    return unsub;
  }, []);

  const handleFilter = (f: Filter) => {
    setActiveSubcat(undefined);
    setFilter(f);
  };

  const filtered = products.filter((p) => {
    if (activeSubcat) return p.subcat === activeSubcat;
    return FILTER_CAT[filter] === null || p.cat === FILTER_CAT[filter];
  });

  const headerTitle = titleParam ?? 'Catálogo';

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
        <Text style={s.title}>{headerTitle}</Text>
        <View style={{ width: 42 }} />
      </View>

      {/* Chips de filtro */}
      <View style={s.searchWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filtersRow}
        >
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => handleFilter(f)}
                style={[s.chip, active && s.chipActive]}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>{f}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Grid de productos — ScrollView con flexWrap para re-render confiable */}
      <ScrollView
        contentContainerStyle={[s.grid, { paddingBottom: Math.max(insets.bottom, 8) + 80 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>Sin productos en esta categoría</Text>
          </View>
        ) : (
          <View style={s.row}>
            {filtered.map((item) => (
              <View key={item.id} style={s.cardWrap}>
                <ProductCard item={item} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomNavBar />
    </ImageBackground>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

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
    fontSize: 22,
    color: RED,
  },

  searchWrap: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: 'rgba(251,243,226,0.85)',
  },

  filtersRow: {
    gap: 8,
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FBF3E2',
    borderWidth: 1.5,
    borderColor: '#C8901A',
  },
  chipActive: {
    backgroundColor: RED,
    borderColor: RED,
  },
  chipText: {
    fontFamily: NellaFonts.bold,
    fontSize: 13,
    color: NellaColors.bodyGray,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },

  grid: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  row: {
    flexDirection: 'column',
    gap: 12,
  },
  cardWrap: {
    width: '100%',
  },

  card: {
    backgroundColor: '#FBF3E2',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C8901A',
    overflow: 'hidden',
    shadowColor: '#5A0000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImgWrap: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FBF3E2',
  },
  cardImg: {
    width: '100%',
    height: '100%',
  },
  cardBody: {
    padding: 10,
    gap: 3,
  },
  cardName: {
    fontFamily: NellaFonts.bold,
    fontSize: 13,
    color: RED,
    lineHeight: 17,
  },
  cardWeight: {
    fontFamily: NellaFonts.italic,
    fontSize: 11,
    color: GRAY,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  cardPrice: {
    fontFamily: NellaFonts.display,
    fontSize: 20,
    color: RED,
    lineHeight: 24,
  },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: RED,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: RED,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  addBtnDone: {
    backgroundColor: '#2E7D32',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    includeFontPadding: false,
  },

  empty: {
    paddingTop: 60,
    alignItems: 'center',
    width: '100%',
  },
  emptyText: {
    fontFamily: NellaFonts.italic,
    fontSize: 16,
    color: GRAY,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

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
    position: 'relative',
  },
  navBtnActive: {
    backgroundColor: 'rgba(139,0,0,0.07)',
  },
  navLabel: {
    fontFamily: NellaFonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  navActiveBar: {
    position: 'absolute',
    bottom: 0,
    width: 24, height: 3,
    borderRadius: 2,
    backgroundColor: RED,
  },
});
