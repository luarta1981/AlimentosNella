import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

type Order = {
  id: string; userId: string; total: number; status: string;
  payMethod: string; createdAt: any; items: any[];
};

type Period = 'day' | 'week' | 'month' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  day: 'Hoy', week: 'Esta semana', month: 'Este mes', all: 'Total',
};

function getPeriodStart(p: Period): number {
  const now = new Date();
  if (p === 'day')   return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (p === 'week')  {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    d.setDate(d.getDate() - d.getDay()); return d.getTime();
  }
  if (p === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return 0;
}

function tsMillis(createdAt: any): number {
  return createdAt?.toMillis?.() ?? (createdAt?.seconds ?? 0) * 1000;
}

function fmt(ts: any) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtTime(ts: any) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_BADGE: Record<string, string> = {
  Pendiente: 'badge badge-pending', 'En Proceso': 'badge badge-process',
  Entregado: 'badge badge-delivered', Cancelado: 'badge badge-cancelled',
};
const PAY_LABEL: Record<string, string> = {
  c2p: 'Pago Móvil', transfer: 'Transferencia', zelle: 'Zelle',
  delivery: 'Contra entrega', receipt: 'Comprobante',
};

// Simple inline bar
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, background: '#F0E4C8', borderRadius: 4, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 4, transition: 'width .4s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

export default function Dashboard() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [productos, setProductos] = useState(0);
  const [usuarios,  setUsuarios]  = useState(0);
  const [period,    setPeriod]    = useState<Period>('day');

  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, 'pedidos'),   (s) => setAllOrders(s.docs.map((d) => ({ id: d.id, ...d.data() } as Order)))),
      onSnapshot(collection(db, 'productos'), (s) => setProductos(s.size)),
      onSnapshot(collection(db, 'usuarios'),  (s) => setUsuarios(s.size)),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const start = getPeriodStart(period);
  const inPeriod = allOrders.filter((o) => tsMillis(o.createdAt) >= start);
  const delivered = inPeriod.filter((o) => o.status === 'Entregado');
  const revenue   = delivered.reduce((s, o) => s + (o.total ?? 0), 0);
  const avgTicket = delivered.length > 0 ? revenue / delivered.length : 0;
  const pending   = inPeriod.filter((o) => o.status === 'Pendiente').length;

  // Previous period comparison
  const prevStart = period === 'all' ? 0 : getPeriodStart(period) - (getPeriodStart(period) - (period === 'day' ? getPeriodStart(period) - 86400000 : period === 'week' ? getPeriodStart(period) - 7*86400000 : getPeriodStart(period) - 30*86400000));
  const prevEnd   = start;
  const prevDelivered = allOrders.filter((o) => {
    const t = tsMillis(o.createdAt);
    return t >= prevStart && t < prevEnd && o.status === 'Entregado';
  });
  const prevRevenue = prevDelivered.reduce((s, o) => s + (o.total ?? 0), 0);
  const revChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : null;

  // Recent orders (last 8 regardless of period)
  const recent = [...allOrders]
    .sort((a, b) => tsMillis(b.createdAt) - tsMillis(a.createdAt))
    .slice(0, 8);

  // Top products in period
  const productCount: Record<string, number> = {};
  inPeriod.forEach((o) => o.items?.forEach((it: any) => {
    productCount[it.name] = (productCount[it.name] ?? 0) + (it.qty ?? 1);
  }));
  const topProducts = Object.entries(productCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxQty = topProducts[0]?.[1] ?? 1;

  return (
    <>
      {/* ── Period selector ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            className={`filter-chip${period === p ? ' active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* ── Period stats ── */}
      <div className="stat-grid" style={{ marginBottom: 22 }}>
        {[
          {
            label: `Ingresos — ${PERIOD_LABELS[period]}`,
            value: `$${revenue.toFixed(2)}`,
            color: '#166534',
            sub: revChange !== null
              ? `${revChange >= 0 ? '▲' : '▼'} ${Math.abs(revChange).toFixed(0)}% vs período anterior`
              : 'Sin comparativa disponible',
          },
          { label: 'Pedidos completados', value: delivered.length, color: '#8B0000',  sub: `de ${inPeriod.length} totales` },
          { label: 'Ticket promedio',     value: `$${avgTicket.toFixed(2)}`, color: '#C8901A', sub: 'por pedido entregado' },
          { label: 'En espera',           value: pending, color: '#D97706', sub: 'pedidos pendientes' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="label">{s.label}</div>
            <div className="value" style={{ color: s.color }}>{s.value}</div>
            <div className="sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Two-column: top products + global stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginBottom: 28 }}>
        {/* Top products */}
        <div className="table-wrap" style={{ padding: 20 }}>
          <h3 style={{ fontStyle: 'italic', color: '#8B0000', marginBottom: 14, fontSize: 18 }}>
            🏆 Productos más vendidos — {PERIOD_LABELS[period]}
          </h3>
          {topProducts.length === 0 ? (
            <p style={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: 14 }}>Sin datos para este período</p>
          ) : topProducts.map(([name, qty], i) => (
            <div key={name} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: '#C8901A', marginRight: 6 }}>#{i + 1}</span>{name}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#8B0000' }}>{qty} uds</span>
              </div>
              <MiniBar value={qty} max={maxQty} color="#8B0000" />
            </div>
          ))}
        </div>

        {/* Global stats */}
        <div>
          <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: 'Productos en catálogo', value: productos,           color: '#8B0000' },
              { label: 'Usuarios registrados',  value: usuarios,            color: '#8B0000' },
              { label: 'Pedidos totales',        value: allOrders.length,   color: '#1D4ED8' },
              { label: 'Ingresos totales',       value: `$${allOrders.filter(o=>o.status==='Entregado').reduce((s,o)=>s+(o.total??0),0).toFixed(2)}`, color: '#166534' },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <div className="label">{s.label}</div>
                <div className="value" style={{ fontSize: 26, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent orders ── */}
      <div className="page-header"><h2>Pedidos Recientes</h2></div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Items</th><th>Total</th><th>Pago</th><th>Fecha</th><th>Hora</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#6B7280', fontStyle: 'italic' }}>Sin pedidos aún</td></tr>
            ) : recent.map((o) => (
              <tr key={o.id}>
                <td style={{ fontWeight: 700, color: '#8B0000' }}>#{o.id.slice(-8).toUpperCase()}</td>
                <td>{o.items?.length ?? 0} ítem(s)</td>
                <td style={{ fontWeight: 700 }}>${(o.total ?? 0).toFixed(2)}</td>
                <td style={{ fontSize: 13 }}>{PAY_LABEL[o.payMethod] ?? o.payMethod}</td>
                <td style={{ fontSize: 13 }}>{fmt(o.createdAt)}</td>
                <td style={{ fontSize: 13, color: '#6B7280' }}>{fmtTime(o.createdAt)}</td>
                <td><span className={STATUS_BADGE[o.status] ?? 'badge'}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
