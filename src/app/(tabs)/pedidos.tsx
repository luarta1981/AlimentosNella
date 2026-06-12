import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { onPedidosUsuarioChange, type PedidoDB } from '@/services/firestore';

const RED  = NellaColors.red;
const GOLD = NellaColors.gold;
const BG   = '#FBF3E2';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type OrderStatus = 'Pendiente' | 'En Proceso' | 'Entregado' | 'Cancelado';

const STATUS_CONFIG: Record<OrderStatus, {
  color: string;
  bg: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> = {
  Pendiente:    { color: '#B45309', bg: '#FEF3C7', icon: 'time-outline'            },
  'En Proceso': { color: '#1D4ED8', bg: '#DBEAFE', icon: 'bicycle-outline'         },
  Entregado:    { color: '#2E7D32', bg: '#DCFCE7', icon: 'checkmark-circle-outline' },
  Cancelado:    { color: '#6B7280', bg: '#F3F4F6', icon: 'close-circle-outline'    },
};

// ─── Filtros ──────────────────────────────────────────────────────────────────

const FILTERS = ['Todos', 'Pendientes', 'En Proceso', 'Entregados', 'Cancelados'] as const;
type Filter = typeof FILTERS[number];

const FILTER_STATUS: Record<Filter, OrderStatus | null> = {
  Todos:        null,
  Pendientes:   'Pendiente',
  'En Proceso': 'En Proceso',
  Entregados:   'Entregado',
  Cancelados:   'Cancelado',
};

// ─── Pantalla ─────────────────────────────────────────────────────────────────

function formatDate(ts: any): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PedidosScreen() {
  const insets                        = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuthUser();
  const [filter, setFilter]   = useState<Filter>('Todos');
  const [orders, setOrders]   = useState<PedidoDB[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Esperar a que Firebase resuelva el estado de auth
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    setLoading(true);
    const unsub = onPedidosUsuarioChange(user.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });
    return unsub;
  }, [user, authLoading]);

  const filtered = orders.filter((o) =>
    FILTER_STATUS[filter] === null || o.status === FILTER_STATUS[filter]
  );

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
        <Text style={s.title}>Mis Pedidos</Text>
        <Text style={s.subtitle}>Historial de tus órdenes</Text>
      </View>

      <View style={s.divider} />

      {/* Filtros horizontales */}
      <View style={s.filtersWrap}>
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
                onPress={() => setFilter(f)}
                style={[s.chip, active && s.chipActive]}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>{f}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={s.empty}>
            <ActivityIndicator size="large" color={RED} />
            <Text style={s.emptyText}>Cargando pedidos...</Text>
          </View>
        ) : !user ? (
          <View style={s.empty}>
            <Ionicons name="person-outline" size={54} color={`${GOLD}88`} />
            <Text style={s.emptyText}>Inicia sesión para ver tus pedidos</Text>
            <TouchableOpacity style={s.loginBtn} onPress={() => router.push('/login')}>
              <Text style={s.loginBtnText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="receipt-outline" size={54} color={`${GOLD}88`} />
            <Text style={s.emptyText}>
              {orders.length === 0 ? 'Aún no tienes pedidos' : 'No hay pedidos en esta categoría'}
            </Text>
          </View>
        ) : (
          filtered.map((order) => {
            const cfg    = STATUS_CONFIG[order.status as OrderStatus] ?? STATUS_CONFIG['Pendiente'];
            const shortId = (order.id ?? '').slice(-8).toUpperCase();
            return (
              <View key={order.id} style={s.orderCard}>
                {/* Cabecera: número + estado */}
                <View style={s.orderHeader}>
                  <View style={s.orderIdRow}>
                    <Ionicons name="receipt-outline" size={16} color={GOLD} />
                    <Text style={s.orderId}>Pedido #{shortId}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
                    <Ionicons name={cfg.icon} size={13} color={cfg.color} />
                    <Text style={[s.statusText, { color: cfg.color }]}>{order.status}</Text>
                  </View>
                </View>

                {/* Productos */}
                <View style={s.itemsList}>
                  {order.items.map((item, i) => (
                    <Text key={i} style={s.itemText}>• {item.name} ×{item.qty}</Text>
                  ))}
                </View>

                {/* Fecha + total */}
                <View style={s.orderMeta}>
                  <View style={s.dateRow}>
                    <Ionicons name="calendar-outline" size={13} color={NellaColors.bodyGray} />
                    <Text style={s.dateText}>{formatDate(order.createdAt)}</Text>
                  </View>
                  <Text style={s.totalText}>${order.total.toFixed(2)}</Text>
                </View>

                <View style={s.cardDivider} />

                <TouchableOpacity
                  style={s.detailBtn}
                  activeOpacity={0.78}
                  onPress={() => router.push({ pathname: '/order-detail', params: { id: order.id } })}
                >
                  <Ionicons name="eye-outline" size={16} color={RED} />
                  <Text style={s.detailBtnText}>Ver detalles</Text>
                  <Ionicons name="chevron-forward-outline" size={15} color={RED} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </ImageBackground>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(251,243,226,0.95)',
    borderBottomWidth: 1.5,
    borderBottomColor: `${GOLD}44`,
  },
  logo:  { width: 52, height: 34, marginBottom: 1 },
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

  // Filtros
  filtersWrap: {
    backgroundColor: 'rgba(251,243,226,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: `${GOLD}33`,
    paddingVertical: 10,
  },
  filtersRow: {
    gap: 8,
    paddingHorizontal: 14,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: GOLD,
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

  // Scroll
  scroll: { padding: 14, gap: 14 },

  // Estado vacío
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 14,
  },
  emptyText: {
    fontFamily: NellaFonts.italic,
    fontSize: 16,
    color: NellaColors.bodyGray,
    textAlign: 'center',
  },

  // Tarjeta de pedido
  orderCard: {
    backgroundColor: BG,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 14,
    gap: 10,
    shadowColor: '#5A0000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderId: {
    fontFamily: NellaFonts.bold,
    fontSize: 14,
    color: RED,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  statusText: {
    fontFamily: NellaFonts.bold,
    fontSize: 11,
  },

  // Productos del pedido
  itemsList: { gap: 3 },
  itemText: {
    fontFamily: NellaFonts.regular,
    fontSize: 13,
    color: NellaColors.subtitleGray,
    lineHeight: 18,
  },

  // Fecha + total
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontFamily: NellaFonts.italic,
    fontSize: 12,
    color: NellaColors.bodyGray,
  },
  totalText: {
    fontFamily: NellaFonts.display,
    fontSize: 22,
    color: RED,
    lineHeight: 26,
  },

  cardDivider: {
    height: 1,
    backgroundColor: `${GOLD}44`,
    borderRadius: 1,
  },

  // Login CTA
  loginBtn: {
    marginTop: 12,
    backgroundColor: RED,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  loginBtnText: {
    fontFamily: NellaFonts.bold,
    fontSize: 15,
    color: '#FFF',
  },

  // Botón Ver detalles
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  detailBtnText: {
    fontFamily: NellaFonts.bold,
    fontSize: 14,
    color: RED,
    letterSpacing: 0.3,
  },
});
