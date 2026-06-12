import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NellaColors, NellaFonts } from '@/constants/theme';
import { onOfertasChange, type OfertaDB } from '@/services/firestore';

const RED  = NellaColors.red;
const GOLD = NellaColors.gold;

export default function OfertasScreen() {
  const insets = useSafeAreaInsets();
  const [ofertas, setOfertas] = useState<OfertaDB[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onOfertasChange((data) => {
      setOfertas(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <ImageBackground
      source={require('@/assets/images/fondo plantilla 1.png')}
      style={s.root}
      resizeMode="cover"
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 4 }]}>
        <Image
          source={require('@/assets/images/LOGO SIN FONDO.png')}
          style={s.logo}
          contentFit="contain"
        />
        <Text style={s.title}>Ofertas</Text>
        <Text style={s.subtitle}>Aprovecha nuestras promociones</Text>
      </View>

      <View style={s.divider} />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={RED} />
            <Text style={s.centerText}>Cargando ofertas...</Text>
          </View>
        ) : ofertas.length === 0 ? (
          <View style={s.center}>
            <Ionicons name="pricetag-outline" size={54} color={`${GOLD}88`} />
            <Text style={s.centerText}>No hay ofertas disponibles por ahora</Text>
          </View>
        ) : (
          ofertas.map((o) => {
            const badgeLabel = o.badge || (o.discount > 0 ? `-${o.discount}%` : null);
            return (
              <Pressable key={o.id} style={({ pressed }) => [s.card, pressed && s.cardPressed]}>
                {/* Badge */}
                {badgeLabel && (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{badgeLabel}</Text>
                  </View>
                )}

                {/* Image */}
                <View style={s.imgWrap}>
                  {o.imgUrl ? (
                    <Image
                      source={{ uri: o.imgUrl }}
                      style={s.img}
                      contentFit="cover"
                    />
                  ) : (
                    <Ionicons name="pricetag-outline" size={48} color={`${GOLD}66`} />
                  )}
                </View>

                {/* Info */}
                <View style={s.info}>
                  <Text style={s.cardTitle} numberOfLines={2}>{o.title}</Text>
                  {!!o.description && (
                    <Text style={s.cardDesc} numberOfLines={2}>{o.description}</Text>
                  )}
                  <View style={s.priceRow}>
                    {o.originalPrice > 0 && (
                      <Text style={s.original}>${o.originalPrice.toFixed(2)}</Text>
                    )}
                    {o.salePrice > 0 ? (
                      <Text style={s.precio}>${o.salePrice.toFixed(2)}</Text>
                    ) : o.originalPrice > 0 ? (
                      <Text style={s.precio}>${o.originalPrice.toFixed(2)}</Text>
                    ) : null}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color={GOLD} style={{ marginRight: 12 }} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(251,243,226,0.95)',
    borderBottomWidth: 1.5,
    borderBottomColor: `${GOLD}44`,
  },
  logo: { width: 52, height: 34, marginBottom: 1 },
  title: {
    fontFamily: NellaFonts.display,
    fontSize: 30,
    color: RED,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: NellaFonts.italic,
    fontSize: 12,
    color: '#4B5320',
    marginTop: 1,
  },

  divider: {
    height: 1.5,
    backgroundColor: '#C8901A',
  },

  scroll: { padding: 14, gap: 14 },

  center: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 14,
  },
  centerText: {
    fontFamily: NellaFonts.italic,
    fontSize: 16,
    color: NellaColors.bodyGray,
    textAlign: 'center',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
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
  cardPressed: { opacity: 0.80 },

  badge: {
    backgroundColor: RED,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
  },
  badgeText: {
    fontFamily: NellaFonts.bold,
    fontSize: 11,
    color: '#FFF',
    letterSpacing: 0.4,
  },

  imgWrap: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(240,228,200,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  img: { width: 100, height: 100 },

  info: { flex: 1, padding: 12, gap: 4 },
  cardTitle: {
    fontFamily: NellaFonts.bold,
    fontSize: 15,
    color: RED,
    lineHeight: 20,
  },
  cardDesc: {
    fontFamily: NellaFonts.regular,
    fontSize: 12,
    color: NellaColors.bodyGray,
    lineHeight: 17,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  original: {
    fontFamily: NellaFonts.regular,
    fontSize: 12,
    color: NellaColors.lightGray,
    textDecorationLine: 'line-through',
  },
  precio: {
    fontFamily: NellaFonts.display,
    fontSize: 20,
    color: RED,
    lineHeight: 24,
  },
});
