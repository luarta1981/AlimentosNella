import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
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
import { getPedidoById, type PedidoDB } from '@/services/firestore';

const RED  = NellaColors.red;
const GOLD = NellaColors.gold;
const BG   = '#FBF3E2';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type OrderStatus = 'Pendiente' | 'En Proceso' | 'Entregado' | 'Cancelado';

const STATUS_CONFIG: Record<OrderStatus, { color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  Pendiente:    { color: '#B45309', bg: '#FEF3C7', icon: 'time-outline'            },
  'En Proceso': { color: '#1D4ED8', bg: '#DBEAFE', icon: 'bicycle-outline'         },
  Entregado:    { color: '#2E7D32', bg: '#DCFCE7', icon: 'checkmark-circle-outline' },
  Cancelado:    { color: '#6B7280', bg: '#F3F4F6', icon: 'close-circle-outline'    },
};

const PAY_LABELS: Record<string, string> = {
  c2p:      'Pago Móvil C2P',
  transfer: 'Transferencia Bancaria',
  zelle:    'Zelle',
  delivery: 'Pago contra entrega',
  receipt:  'Comprobante de Pago',
};

const PAY_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  c2p:      'phone-portrait',
  transfer: 'business',
  zelle:    'globe',
  delivery: 'cash',
  receipt:  'camera',
};

function formatDate(ts: any): string {
  if (!ts) return '—';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

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

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder]     = useState<PedidoDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    if (!id) { setError(true); setLoading(false); return; }
    getPedidoById(id)
      .then((data) => { if (data) setOrder(data); else setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const cfg     = STATUS_CONFIG[(order?.status as OrderStatus) ?? 'Pendiente'];
  const shortId = (order?.id ?? id ?? '').slice(-8).toUpperCase();

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
        <Text style={s.title}>Detalle del Pedido</Text>
        <View style={{ width: 42 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={RED} />
          <Text style={s.loadingText}>Cargando pedido...</Text>
        </View>
      ) : error || !order ? (
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={54} color={`${GOLD}88`} />
          <Text style={s.errorText}>No se pudo cargar el pedido</Text>
          <Pressable style={s.retryBtn} onPress={() => router.back()}>
            <Text style={s.retryBtnText}>Volver</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Número + estado */}
          <View style={s.card}>
            <View style={s.orderHeaderRow}>
              <View style={s.orderIdRow}>
                <Ionicons name="receipt-outline" size={18} color={GOLD} />
                <Text style={s.orderId}>Pedido #{shortId}</Text>
              </View>
              <View style={[s.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
                <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                <Text style={[s.statusText, { color: cfg.color }]}>{order.status}</Text>
              </View>
            </View>
            <View style={s.divider} />
            <View style={s.dateRow}>
              <Ionicons name="calendar-outline" size={14} color={NellaColors.bodyGray} />
              <Text style={s.dateText}>{formatDate(order.createdAt)}</Text>
            </View>
          </View>

          {/* Productos */}
          <View style={s.card}>
            <View style={s.cardTitleRow}>
              <Ionicons name="basket-outline" size={18} color={GOLD} />
              <Text style={s.cardTitle}>Productos</Text>
            </View>
            <View style={s.divider} />
            {order.items.map((item, i) => (
              <View key={i} style={[s.itemRow, i < order.items.length - 1 && s.itemRowBorder]}>
                <View style={s.itemLeft}>
                  <Text style={s.itemName}>{item.name}</Text>
                  <Text style={s.itemUnit}>${item.price.toFixed(2)} c/u</Text>
                </View>
                <View style={s.itemRight}>
                  <View style={s.qtyBadge}>
                    <Text style={s.qtyText}>×{item.qty}</Text>
                  </View>
                  <Text style={s.itemTotal}>${(item.price * item.qty).toFixed(2)}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Resumen de pago */}
          <View style={s.card}>
            <View style={s.cardTitleRow}>
              <Ionicons name="wallet-outline" size={18} color={GOLD} />
              <Text style={s.cardTitle}>Resumen</Text>
            </View>
            <View style={s.divider} />

            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Subtotal</Text>
              <Text style={s.summaryValue}>${order.subtotal.toFixed(2)}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Delivery</Text>
              <Text style={s.summaryValue}>${order.delivery.toFixed(2)}</Text>
            </View>
            <View style={[s.divider, { marginVertical: 6 }]} />
            <View style={s.summaryRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>${order.total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Método de pago */}
          <View style={s.card}>
            <View style={s.cardTitleRow}>
              <Ionicons name="card-outline" size={18} color={GOLD} />
              <Text style={s.cardTitle}>Método de Pago</Text>
            </View>
            <View style={s.divider} />
            <View style={s.payRow}>
              <View style={s.payIconWrap}>
                <Ionicons
                  name={PAY_ICONS[order.payMethod] ?? 'cash'}
                  size={24}
                  color={GOLD}
                />
              </View>
              <Text style={s.payLabel}>
                {PAY_LABELS[order.payMethod] ?? order.payMethod}
              </Text>
            </View>
          </View>

          {/* Estado visual */}
          <View style={[s.card, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
            <View style={s.statusFullRow}>
              <Ionicons name={cfg.icon} size={28} color={cfg.color} />
              <View style={{ flex: 1 }}>
                <Text style={[s.statusFullLabel, { color: cfg.color }]}>Estado: {order.status}</Text>
                <Text style={s.statusHint}>
                  {order.status === 'Pendiente'    && 'Tu pedido fue recibido y está siendo revisado.'}
                  {order.status === 'En Proceso'   && 'Tu pedido está siendo preparado para entrega.'}
                  {order.status === 'Entregado'    && '¡Tu pedido fue entregado exitosamente!'}
                  {order.status === 'Cancelado'    && 'Este pedido fue cancelado.'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
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

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 32,
  },
  loadingText: {
    fontFamily: NellaFonts.italic,
    fontSize: 15,
    color: NellaColors.bodyGray,
  },
  errorText: {
    fontFamily: NellaFonts.italic,
    fontSize: 16,
    color: NellaColors.bodyGray,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: RED,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  retryBtnText: {
    fontFamily: NellaFonts.bold,
    fontSize: 15,
    color: '#FFF',
  },

  scroll: { padding: 14, gap: 14 },

  card: {
    backgroundColor: BG,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 16,
    gap: 10,
    shadowColor: '#5A0000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: NellaFonts.display,
    fontSize: 18,
    color: RED,
  },

  divider: {
    height: 1.5,
    backgroundColor: `${GOLD}44`,
    borderRadius: 1,
  },

  // Cabecera del pedido
  orderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  orderId: {
    fontFamily: NellaFonts.bold,
    fontSize: 16,
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
    fontSize: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontFamily: NellaFonts.italic,
    fontSize: 13,
    color: NellaColors.bodyGray,
  },

  // Ítems
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: `${GOLD}33`,
  },
  itemLeft: { flex: 1, gap: 2 },
  itemName: {
    fontFamily: NellaFonts.bold,
    fontSize: 14,
    color: RED,
    lineHeight: 18,
  },
  itemUnit: {
    fontFamily: NellaFonts.italic,
    fontSize: 11,
    color: NellaColors.lightGray,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBadge: {
    backgroundColor: `${GOLD}22`,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: `${GOLD}55`,
  },
  qtyText: {
    fontFamily: NellaFonts.bold,
    fontSize: 13,
    color: '#7A5000',
  },
  itemTotal: {
    fontFamily: NellaFonts.display,
    fontSize: 18,
    color: RED,
    lineHeight: 22,
    minWidth: 52,
    textAlign: 'right',
  },

  // Resumen
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: NellaFonts.regular,
    fontSize: 14,
    color: NellaColors.bodyGray,
  },
  summaryValue: {
    fontFamily: NellaFonts.bold,
    fontSize: 14,
    color: NellaColors.subtitleGray,
  },
  totalLabel: {
    fontFamily: NellaFonts.display,
    fontSize: 20,
    color: RED,
  },
  totalValue: {
    fontFamily: NellaFonts.display,
    fontSize: 26,
    color: RED,
    lineHeight: 30,
  },

  // Método de pago
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  payIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: `${GOLD}18`,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: `${GOLD}55`,
  },
  payLabel: {
    fontFamily: NellaFonts.bold,
    fontSize: 15,
    color: RED,
    flex: 1,
  },

  // Estado completo
  statusFullRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  statusFullLabel: {
    fontFamily: NellaFonts.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  statusHint: {
    fontFamily: NellaFonts.italic,
    fontSize: 13,
    color: NellaColors.bodyGray,
    marginTop: 2,
    lineHeight: 17,
  },
});
