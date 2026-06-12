import {
  CrimsonPro_700Bold,
  CrimsonPro_700Bold_Italic,
  CrimsonPro_400Regular,
  CrimsonPro_400Regular_Italic,
} from '@expo-google-fonts/crimson-pro';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ImageBackground, StyleSheet, View, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAuthUser } from '@/hooks/useAuthUser';

// TODO: re-enable for production build
// import * as Notifications from 'expo-notifications';
// import { router } from 'expo-router';
// import { useRef } from 'react';
// import { useOrderStatusWatcher } from '@/hooks/useOrderStatusWatcher';
// import { registerForPushNotificationsAsync, savePushToken } from '@/services/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { user }    = useAuthUser();

  const [fontsLoaded, fontError] = useFonts({
    CrimsonPro_700Bold,
    CrimsonPro_700Bold_Italic,
    CrimsonPro_400Regular,
    CrimsonPro_400Regular_Italic,
  });

  // TODO: re-enable for production build
  // useEffect(() => {
  //   if (!user) return;
  //   registerForPushNotificationsAsync().then((token) => {
  //     if (token) savePushToken(user.uid, token);
  //   });
  // }, [user?.uid]);

  // TODO: re-enable for production build
  // const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  // useEffect(() => {
  //   responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
  //     const orderId = response.notification.request.content.data?.orderId as string | undefined;
  //     if (orderId) {
  //       router.push({ pathname: '/order-detail', params: { id: orderId } });
  //     } else {
  //       router.push('/(tabs)/pedidos');
  //     }
  //   });
  //   return () => { responseListener.current?.remove(); };
  // }, []);

  // TODO: re-enable for production build
  // useOrderStatusWatcher(user);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: '#FBF3E2' }} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ImageBackground
        source={require('@/assets/images/fondo plantilla 1.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
        <AnimatedSplashOverlay />
      </ImageBackground>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
