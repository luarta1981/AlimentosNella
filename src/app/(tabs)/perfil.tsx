import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NellaColors, NellaFonts } from '@/constants/theme';
import { useAuthUser } from '@/hooks/useAuthUser';
import { auth, db } from '@/lib/firebase';
import { logoutUser } from '@/services/auth';

type UserData = {
  displayName: string;
  email:       string;
  phone:       string;
  address:     string;
  createdAt:   any;
};

const RED  = NellaColors.red;
const GOLD = NellaColors.gold;

type MenuItem = {
  icon:   React.ComponentProps<typeof Ionicons>['name'];
  label:  string;
  desc:   string;
  route?: string;
  danger?: boolean;
  action?: () => void;
};

const MENU_ITEMS: MenuItem[] = [
  { icon: 'person-outline',        label: 'Editar Perfil',      desc: 'Cambiar nombre, teléfono y dirección', route: '/perfil-edit'          },
  { icon: 'location-outline',      label: 'Mis Direcciones',    desc: 'Gestiona tus direcciones de entrega',  route: '/perfil-direcciones'   },
  { icon: 'card-outline',          label: 'Métodos de Pago',    desc: 'Formas de pago preferidas',            route: '/perfil-pagos'         },
  { icon: 'settings-outline',      label: 'Configuración',      desc: 'Notificaciones y preferencias',        route: '/perfil-configuracion' },
  { icon: 'lock-closed-outline',   label: 'Cambiar Contraseña', desc: 'Actualiza tu contraseña de acceso'                                    },
  { icon: 'help-circle-outline',   label: 'Ayuda y Soporte',    desc: 'Preguntas frecuentes y contacto'                                      },
  { icon: 'log-out-outline',       label: 'Cerrar Sesión',      desc: 'Salir de tu cuenta Nella',             danger: true                   },
];

function formatDate(ts: any): string {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' });
}

export default function PerfilScreen() {
  const insets      = useSafeAreaInsets();
  const { user }    = useAuthUser();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'usuarios', user.uid)).then((snap) => {
      if (snap.exists()) setUserData(snap.data() as UserData);
    });
  }, [user]);

  const displayName = userData?.displayName || user?.displayName || 'Invitado';
  const email       = userData?.email       || user?.email       || '';
  const phone       = userData?.phone       || '';
  const address     = userData?.address     || '';
  const memberSince = userData?.createdAt   ? `Miembro desde ${formatDate(userData.createdAt)}` : 'Miembro Nella';

  const handleChangePassword = () => {
    const emailAddr = user?.email;
    if (!emailAddr) return;
    Alert.alert(
      'Cambiar contraseña',
      `Te enviaremos un enlace a ${emailAddr} para restablecer tu contraseña.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar enlace',
          onPress: async () => {
            try {
              await sendPasswordResetEmail(auth, emailAddr);
              Alert.alert('Correo enviado', 'Revisa tu bandeja de entrada.');
            } catch {
              Alert.alert('Error', 'No se pudo enviar el correo. Intenta de nuevo.');
            }
          },
        },
      ]
    );
  };

  const handleMenuPress = (item: MenuItem) => {
    if (item.danger)                         { handleLogout(); return; }
    if (item.label === 'Cambiar Contraseña') { handleChangePassword(); return; }
    if (item.label === 'Ayuda y Soporte')    { return; }
    if (item.route)                          { router.push(item.route as any); }
  };

  const handleLogout = () => {
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
  };

  return (
    <ImageBackground
      source={require('@/assets/images/fondo plantilla 1.png')}
      style={s.root}
      resizeMode="cover"
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Image
          source={require('@/assets/images/LOGO SIN FONDO.png')}
          style={s.logo}
          contentFit="contain"
        />
        <Text style={s.title}>Mi Perfil</Text>
      </View>

      <View style={s.divider} />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + name */}
        <View style={s.avatarSection}>
          <View style={s.avatarWrap}>
            <View style={s.avatarCircle}>
              <Ionicons name="person" size={52} color={GOLD} />
            </View>
            <Pressable style={s.editBadge} onPress={() => router.push('/perfil-edit')} hitSlop={8}>
              <Ionicons name="camera" size={14} color="#FFF" />
            </Pressable>
          </View>
          <Text style={s.userName}>{displayName}</Text>
          <Text style={s.userEmail}>{email}</Text>
          <View style={s.memberBadge}>
            <Ionicons name="star" size={13} color={GOLD} />
            <Text style={s.memberText}>{memberSince}</Text>
          </View>
        </View>

        {/* Datos de contacto */}
        <View style={s.infoCard}>
          <Text style={s.infoCardTitle}>Datos de contacto</Text>
          <View style={s.infoRow}>
            <Ionicons name="mail-outline" size={16} color={GOLD} />
            <Text style={s.infoLabel}>Correo</Text>
            <Text style={s.infoValue} numberOfLines={1}>{email || '—'}</Text>
          </View>
          <View style={s.infoSep} />
          <View style={s.infoRow}>
            <Ionicons name="call-outline" size={16} color={GOLD} />
            <Text style={s.infoLabel}>Teléfono</Text>
            <Text style={s.infoValue}>{phone || 'No registrado'}</Text>
          </View>
          <View style={s.infoSep} />
          <View style={s.infoRow}>
            <Ionicons name="location-outline" size={16} color={GOLD} />
            <Text style={s.infoLabel}>Dirección</Text>
            <Text style={s.infoValue} numberOfLines={2}>{address || 'No registrada'}</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>12</Text>
            <Text style={s.statLabel}>Pedidos</Text>
          </View>
          <View style={[s.statCard, s.statCardMid]}>
            <Text style={s.statNum}>4.9</Text>
            <Text style={s.statLabel}>Calificación</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>3</Text>
            <Text style={s.statLabel}>Favoritos</Text>
          </View>
        </View>

        {/* Menu items */}
        <View style={s.menuSection}>
          {MENU_ITEMS.map((item, i) => (
            <Pressable
              key={item.label}
              onPress={() => handleMenuPress(item)}
              style={({ pressed }) => [
                s.menuItem,
                i === 0 && s.menuItemFirst,
                i === MENU_ITEMS.length - 1 && s.menuItemLast,
                item.danger && s.menuItemDanger,
                pressed && s.menuItemPressed,
              ]}
            >
              <View style={[s.menuIconWrap, item.danger && s.menuIconDanger]}>
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.danger ? RED : GOLD}
                />
              </View>
              <View style={s.menuText}>
                <Text style={[s.menuLabel, item.danger && s.menuLabelDanger]}>
                  {item.label}
                </Text>
                <Text style={s.menuDesc}>{item.desc}</Text>
              </View>
              {!item.danger && (
                <Ionicons name="chevron-forward" size={18} color={`${GOLD}88`} />
              )}
            </Pressable>
          ))}
        </View>

        {/* App version */}
        <Text style={s.version}>Alimentos Nella v1.0.0</Text>
      </ScrollView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(251,243,226,0.95)',
    borderBottomWidth: 1.5,
    borderBottomColor: `${GOLD}44`,
  },
  logo: { width: 80, height: 54, marginBottom: 2 },
  title: {
    fontFamily: NellaFonts.display,
    fontSize: 30,
    color: RED,
    lineHeight: 36,
  },

  divider: {
    height: 1.5,
    backgroundColor: '#C8901A',
  },

  scroll: { padding: 16, gap: 16 },

  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'rgba(251,243,226,0.90)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: GOLD,
    gap: 6,
  },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(200,144,26,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: GOLD,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: RED,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FBF3E2',
  },
  userName: {
    fontFamily: NellaFonts.display,
    fontSize: 24,
    color: RED,
    lineHeight: 30,
  },
  userEmail: {
    fontFamily: NellaFonts.italic,
    fontSize: 14,
    color: NellaColors.bodyGray,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    backgroundColor: 'rgba(200,144,26,0.10)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: GOLD,
  },
  memberText: {
    fontFamily: NellaFonts.italic,
    fontSize: 12,
    color: GOLD,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FBF3E2',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: GOLD,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  statCardMid: {
    borderColor: RED,
    backgroundColor: 'rgba(139,0,0,0.05)',
  },
  statNum: {
    fontFamily: NellaFonts.display,
    fontSize: 26,
    color: RED,
    lineHeight: 30,
  },
  statLabel: {
    fontFamily: NellaFonts.italic,
    fontSize: 11,
    color: NellaColors.bodyGray,
  },

  menuSection: {
    backgroundColor: 'rgba(251,243,226,0.92)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: GOLD,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: `${GOLD}22`,
  },
  menuItemFirst: { borderTopWidth: 0 },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemDanger: { backgroundColor: 'rgba(139,0,0,0.04)' },
  menuItemPressed: { opacity: 0.70 },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(200,144,26,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconDanger: {
    backgroundColor: 'rgba(139,0,0,0.08)',
  },
  menuText: { flex: 1, gap: 2 },
  menuLabel: {
    fontFamily: NellaFonts.bold,
    fontSize: 14,
    color: NellaColors.titleDark,
  },
  menuLabelDanger: { color: RED },
  menuDesc: {
    fontFamily: NellaFonts.regular,
    fontSize: 11,
    color: NellaColors.bodyGray,
    lineHeight: 15,
  },

  version: {
    fontFamily: NellaFonts.italic,
    fontSize: 12,
    color: NellaColors.lightGray,
    textAlign: 'center',
    marginTop: 4,
  },

  infoCard: {
    backgroundColor: 'rgba(251,243,226,0.92)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: GOLD,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 2,
  },
  infoCardTitle: {
    fontFamily: NellaFonts.display,
    fontSize: 17,
    color: RED,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  infoLabel: {
    fontFamily: NellaFonts.bold,
    fontSize: 13,
    color: NellaColors.bodyGray,
    width: 72,
  },
  infoValue: {
    fontFamily: NellaFonts.regular,
    fontSize: 14,
    color: NellaColors.titleDark,
    flex: 1,
  },
  infoSep: {
    height: 1,
    backgroundColor: `${GOLD}33`,
    marginLeft: 26,
  },
});
