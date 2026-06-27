import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NellaColors, NellaFonts } from '@/constants/theme';
import { NellaHeader } from '@/components/nella-header';
import { useAuthUser } from '@/hooks/useAuthUser';

const FEATURES = [
  { image: require('@/assets/images/Pancitos Baguette Parmesano.png'), label: 'Calidad' },
  { image: require('@/assets/images/Pancitos Baguette Oregano.png'),   label: 'Frescura' },
  { image: require('@/assets/images/Pancitos Dulces Chips Chocolate.png'), label: 'Sabor' },
  { image: require('@/assets/images/Pizza Margarita.png'),             label: 'Confianza' },
];

export default function WelcomeScreen() {
  const { user, loading } = useAuthUser();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={NellaColors.red} />
      </SafeAreaView>
    );
  }

  if (user) return <Redirect href={user.emailVerified ? '/(tabs)/home' : '/verify-email'} />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Banner principal de productos */}
        <View style={styles.bannerWrapper}>
          <Image
            source={require('@/assets/images/banner principal app.png')}
            style={styles.bannerImage}
            contentFit="contain"
          />
        </View>

        {/* Iconos: Calidad / Frescura / Sabor / Confianza */}
        <View style={styles.featuresRow}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureBadge}>
              <View style={styles.featureCircle}>
                <Image source={f.image} style={styles.featureImg} contentFit="cover" />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Título y subtítulo */}
        <View style={styles.textBlock}>
          <Text style={styles.headline}>
            Productos congelados{'\n'}listos para hornear
          </Text>
          <Text style={styles.subtitle}>
            Calidad, frescura y sabor en cada producto.
          </Text>
        </View>

        {/* Botones */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.btnPrimaryText}>Iniciar Sesión</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.btnSecondaryText}>Crear Cuenta</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.linkBtn, pressed && styles.btnPressed]}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Text style={styles.linkText}>Explorar como invitado</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flexGrow: 1,
    paddingTop: 0,
    paddingBottom: 36,
  },

  // Banner
  bannerWrapper: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: -32,
  },
  bannerImage: {
    width: '100%',
    aspectRatio: 1.05,
  },

  // Feature badges
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 6,
  },
  featureBadge: {
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  featureCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: NellaColors.gold,
  },
  featureImg: {
    width: '100%',
    height: '100%',
  },
  featureLabel: {
    fontFamily: NellaFonts.display,
    fontSize: 13,
    color: NellaColors.red,
    textAlign: 'center',
  },

  // Texto
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingBottom: 16,
    gap: 7,
  },
  headline: {
    fontFamily: NellaFonts.display,
    fontSize: 32,
    color: NellaColors.red,
    textAlign: 'center',
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: NellaFonts.italic,
    fontSize: 20,
    color: NellaColors.gold,
    textAlign: 'center',
    lineHeight: 28,
  },

  // Botones
  actions: {
    paddingHorizontal: 20,
    gap: 11,
  },
  btnPrimary: {
    backgroundColor: NellaColors.red,
    borderRadius: 13,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: NellaColors.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
    elevation: 4,
  },
  btnPrimaryText: {
    fontFamily: NellaFonts.display,
    color: '#FFFFFF',
    fontSize: 18,
    letterSpacing: 0.4,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderRadius: 13,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: NellaColors.red,
  },
  btnSecondaryText: {
    fontFamily: NellaFonts.display,
    color: NellaColors.red,
    fontSize: 18,
    letterSpacing: 0.4,
  },
  btnPressed: {
    opacity: 0.72,
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  linkText: {
    fontFamily: NellaFonts.bold,
    color: '#000000',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
