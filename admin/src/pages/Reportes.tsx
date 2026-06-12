import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

type Order = {
  id: string; total: number; status: string;
  payMethod: string; createdAt: any; items: any[];
};

type Period = 'day' | 'week' | 'month' | 'all';
const PERIOD_LABELS: Record<Period, string> = {
  day: 'Hoy', week: 'Esta semana', month: 'Este mes', all: 'Todo el tiempo',
};

function getPeriodStart(p: Period): number {
  const now = new Date();
  if (p === 'day')   return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (p === 'week')  { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()); d.setDate(d.getDate() - d.getDay()); return d.getTime(); }
  if (p === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return 0;
}

function tsMs(ts: any): number {
  return ts?.toMillis?.() ?? (ts?.seconds ?? 0) * 1000;
}

function Bar({ label, value, max, color, suffix = '' }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 14 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{typeof value === 'number' && !suffix ? value : `${value}${suffix}`}</span>
      </div>
      <div style={{ background: '#F0E4C8', borderRadius: 6, height: 10, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 6, transition: 'width .5s' }} />
      </div>
    </div>
  );
}

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function Reportes() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading]     = useState(true);
  const [period, setPeriod]       = useState<Period>('month');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'pedidos'), (snap) => {
      setAllOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const start   = getPeriodStart(period);
  const inRange = allOrders.filter((o) => tsMs(o.createdAt) >= start);
  const delivered = inRange.filter((o) => o.status === 'Entregado');
  const cancelled = inRange.filter((o) => o.status === 'Cancelado');

  const revenue   = delivered.reduce((s, o) => s + (o.total ?? 0), 0);
  const avgTicket = delivered.length > 0 ? revenue / delivered.length : 0;

  // Products ranking
  const productUnits: Record<string, number>  = {};
  const productRevenue: Record<string, number> = {};
  inRange.forEach((o) => o.items?.forEach((it: any) => {
    productUnits[it.name]   = (productUnits[it.name]   ?? 0) + (it.qty ?? 1);
    productRevenue[it.name] = (productRevenue[it.name] ?? 0) + ((it.price ?? 0) * (it.qty ?? 1));
  }));
  const topUnits   = Object.entries(productUnits).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxUnits   = topUnits[0]?.[1] ?? 1;

  // Payment methods
  const payCount: Record<string, number> = {};
  inRange.forEach((o) => { payCount[o.payMethod] = (payCount[o.payMethod] ?? 0) + 1; });
  const PAY_LABEL: Record<string, string> = {
    c2p: 'Pago Móvil', transfer: 'Transferencia', zelle: 'Zelle',
    delivery: 'Contra entrega', receipt: 'Comprobante',
  };
  const topPay = Object.entries(payCount).sort((a, b) => b[1] - a[1]);
  const maxPay = topPay[0]?.[1] ?? 1;

  // Status breakdown
  const statusCount: Record<string, number> = {};
  inRange.forEach((o) => { statusCount[o.status] = (statusCount[o.status] ?? 0) + 1; });

  // Monthly revenue trend (last 6 months)
  const now = new Date();
  const monthlyRevenue: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d    = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const v = allOrders
      .filter((o) => {
        const t = tsMs(o.createdAt);
        return t >= d.getTime() && t < dEnd.getTime() && o.status === 'Entregado';
      })
      .reduce((s, o) => s + (o.total ?? 0), 0);
    monthlyRevenue.push({ label: MONTH_NAMES[d.getMonth()], value: v });
  }
  const maxMonthly = Math.max(...monthlyRevenue.map((m) => m.value), 1);

  if (loading) return <div className="loading">Cargando reportes…</div>;

  return (
    <>
      <div className="page-header"><h2>Reportes de Ventas</h2></div>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button key={p} className={`filter-chip${period === p ? ' active' : ''}`} onClick={() => setPeriod(p)}>
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        {[
          { label: 'Ingresos del período',      value: `$${revenue.toFixed(2)}`,     color: '#166534' },
          { label: 'Pedidos completados',       value: delivered.length,             color: '#8B0000' },
          { label: 'Pedidos totales',           value: inRange.length,               color: '#1D4ED8' },
          { label: 'Ticket promedio',           value: `$${avgTicket.toFixed(2)}`,   color: '#C8901A' },
          { label: 'Cancelados',                value: cancelled.length,             color: '#DC2626' },
          { label: 'Tasa de completados',       value: inRange.length > 0 ? `${Math.round(delivered.length/inRange.length*100)}%` : '0%', color: '#7C3AED' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="label">{s.label}</div>
            <div className="value" style={{ color: s.color, fontSize: 28 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginBottom: 28 }}>

        {/* Products ranking */}
        <div className="table-wrap" style={{ padding: 22 }}>
          <h3 style={{ fontStyle: 'italic', color: '#8B0000', marginBottom: 18, fontSize: 18 }}>
            📦 Productos más vendidos (unidades)
          </h3>
          {topUnits.length === 0
            ? <p style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Sin ventas en este período</p>
            : topUnits.map(([name, qty], i) => (
              <Bar key={name} label={`#${i+1} ${name}`} value={qty} max={maxUnits} color="#8B0000" suffix=" uds" />
            ))
          }
        </div>

        {/* Payment methods */}
        <div className="table-wrap" style={{ padding: 22 }}>
          <h3 style={{ fontStyle: 'italic', color: '#8B0000', marginBottom: 18, fontSize: 18 }}>
            💳 Métodos de pago
          </h3>
          {topPay.length === 0
            ? <p style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Sin pagos en este período</p>
            : topPay.map(([method, count]) => (
              <Bar key={method} label={PAY_LABEL[method] ?? method} value={count} max={maxPay} color="#C8901A" suffix=" pedidos" />
            ))
          }

          <h3 style={{ fontStyle: 'italic', color: '#8B0000', margin: '22px 0 14px', fontSize: 18 }}>
            📊 Estado de pedidos
          </h3>
          {Object.entries(statusCount).map(([st, cnt]) => {
            const colors: Record<string, string> = {
              Entregado: '#166534', Pendiente: '#D97706', 'En Proceso': '#1D4ED8', Cancelado: '#DC2626',
            };
            return (
              <Bar key={st} label={st} value={cnt} max={inRange.length} color={colors[st] ?? '#6B7280'} suffix=" pedidos" />
            );
          })}
        </div>
      </div>

      {/* Monthly trend */}
      <div className="table-wrap" style={{ padding: 22 }}>
        <h3 style={{ fontStyle: 'italic', color: '#8B0000', marginBottom: 18, fontSize: 18 }}>
          📈 Tendencia de ingresos — últimos 6 meses
        </h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 120, padding: '0 8px' }}>
          {monthlyRevenue.map(({ label, value }) => {
            const h = maxMonthly > 0 ? Math.round((value / maxMonthly) * 100) : 0;
            return (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: '#8B0000', fontWeight: 700 }}>
                  {value > 0 ? `$${value.toFixed(0)}` : ''}
                </span>
                <div style={{ width: '100%', position: 'relative', height: 80, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%', background: '#8B0000', borderRadius: '4px 4px 0 0',
                    height: `${Math.max(h, value > 0 ? 4 : 0)}%`,
                    transition: 'height .5s',
                    opacity: value === 0 ? 0.2 : 1,
                  }} />
                </div>
                <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
