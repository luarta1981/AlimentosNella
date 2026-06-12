import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Show notifications even when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const STATUS_NOTIF: Record<string, { title: string; body: (id: string) => string }> = {
  'En Proceso': {
    title: 'Alimentos Nella 🔄',
    body: (id) => `Tu pedido #${id} está en preparación. ¡Lo estamos haciendo con amor!`,
  },
  'Entregado': {
    title: 'Alimentos Nella ✅',
    body: (id) => `¡Tu pedido #${id} fue entregado! Buen provecho 🥐`,
  },
  'Cancelado': {
    title: 'Alimentos Nella ❌',
    body: (id) => `Tu pedido #${id} ha sido cancelado.`,
  },
};

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null; // simulators don't support push

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('pedidos', {
      name: 'Estado de pedidos',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B0000',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch {
    // No EAS project ID configured yet — push won't work but local notifs will
    return null;
  }
}

export async function savePushToken(uid: string, token: string): Promise<void> {
  await updateDoc(doc(db, 'usuarios', uid), { pushToken: token });
}

export async function triggerLocalNotification(
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true, data },
    trigger: null,
  });
}
