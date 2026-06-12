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

const CATEGORIES = [
  { id: '1', label: 'Panes\nFranceses',    subcat: 'franceses',          title: 'Panes Franceses',    img: require('@/assets/images/Pancitos Franceses 1.png') },
  { id: '2', label: 'Baguette\nPlain',     subcat: 'baguette_plain',     title: 'Baguette Plain',     img: require('@/assets/images/Pancitos Baguette tradicionales 1.png') },
  { id: '3', label: 'Baguette\nParmesano', subcat: 'baguette_parmesano', title: 'Baguette Parmesano', img: require('@/assets/images/Pancitos Baguette Parmesano 1.png') },
  { id: '4', label: 'Baguette\nOrégano',   subcat: 'baguette_oregano',   title: 'Baguette Orégano',   img: require('@/assets/images/Pancitos Baguette Oregano 1.png') },
  { id: '5', label: 'Panes\nDulces',       subcat: 'dulces',             title: 'Panes Dulces',       img: require('@/assets/images/Pancitos Dulces 1.png') },
  { id: '6', label: 'Dulces\nChocolate',   subcat: 'dulces_chocolate',   title: 'Dulces Chocolate',   img: require('@/assets/images/Pancitos Dulces chocolate 1.png') },
  { id: '7', label: 'Pizza\nMargarita',    subcat: 'pizza',              title: 'Pizza Margarita',    img: require('@/assets/images/Pizza Margarita 1.png') },
] as const;

export default function CategoriasScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={require('@/assets/images/fondo plantilla 1.png')}
      style={s.root}
      resizeMode="cover"
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Text style={s.title}>Categorías</Text>
        <Text style={s.subtitle}>¿Qué deseas ordenar hoy?</Text>
      </View>

      {/* Category grid */}
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.grid}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={s.card}
              onPress={() => router.push({ pathname: '/catalogo', params: { subcat: cat.subcat, title: cat.title } })}
            >
              <View style={s.imgCircle}>
                <Image source={cat.img} style={s.img} contentFit="cover" />
              </View>
              <Text style={s.cardLabel}>{cat.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: 'rgba(251,243,226,0.95)',
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
  },
  title: {
    fontFamily: NellaFonts.display,
    fontSize: 30,
    color: RED,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: NellaFonts.italic,
    fontSize: 15,
    color: '#4B5320',
    marginTop: 2,
  },

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },

  card: {
    width: '46%',
    alignItems: 'center',
    backgroundColor: 'rgba(251,243,226,0.92)',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: GOLD,
    shadowColor: '#5A0000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  imgCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: GOLD,
    backgroundColor: NellaColors.creamDark,
  },
  img: {
    width: '100%',
    height: '100%',
  },
  cardLabel: {
    fontFamily: NellaFonts.bold,
    fontSize: 13,
    color: RED,
    textAlign: 'center',
    lineHeight: 18,
  },
});
