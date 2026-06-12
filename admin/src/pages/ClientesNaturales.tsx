import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

type Cliente = {
  uid: string; email: string; displayName: string;
  role: string; phone?: string; address?: string; cedula?: string; createdAt: any;
};

type Order = { id: string; userId: string; total: number; status: string; createdAt: any };

function fmt(ts: any) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
}

const AVATAR_COLORS = ['#8B0000','#C8901A','#1D4ED8','#166534','#4B5320','#7C3AED'];

export default function ClientesNaturales() {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,       setSearch]       = useState('');
  const [searchCedula, setSearchCedula] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, 'usuarios'), (snap) => {
        const all = snap.docs
          .map((d) => ({ uid: d.id, ...d.data() } as Cliente))
          .filter((u) => u.role !== 'admin')
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds ?? 0;
            return tb - ta;
          });
        setClients(all);
        setLoading(false);
      }),
      onSnapshot(collection(db, 'pedidos'), (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const filtered = clients.filter((c) => {
    const q  = search.toLowerCase();
    const qc = searchCedula.replace(/\D/g, '');
    const matchGeneral = !q || (
      c.displayName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
    const matchCedula = !qc || c.cedula?.replace(/\D/g, '').includes(qc);
    return matchGeneral && matchCedula;
  });

  // Stats
  const now   = new Date();
  const month = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const newThisMonth = clients.filter((c) => {
    const t = c.createdAt?.toMillis?.() ?? (c.createdAt?.seconds ?? 0) * 1000;
    return t >= month;
  }).length;

  if (loading) return <div className="loading">Cargando clientes…</div>;

  return (
    <>
      <div className="page-header"><h2>Clientes Naturales ({clients.length})</h2></div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 22 }}>
        {[
          { label: 'Total clientes',     value: clients.length,   color: '#8B0000' },
          { label: 'Nuevos este mes',    value: newThisMonth,     color: '#166534' },
          { label: 'Con pedidos',
            value: clients.filter((c) => orders.some((o) => o.userId === c.uid)).length,
            color: '#C8901A' },
          { label: 'Sin pedidos',
            value: clients.filter((c) => !orders.some((o) => o.userId === c.uid)).length,
            color: '#6B7280' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="label">{s.label}</div>
            <div className="value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Buscar por nombre, correo o teléfono…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="search-input"
          placeholder="Buscar por cédula…"
          value={searchCedula}
          onChange={(e) => setSearchCedula(e.target.value)}
          style={{ maxWidth: 200 }}
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Cliente</th><th>Correo</th><th>Teléfono</th><th>Pedidos</th><th>Registro</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6}>
                <div className="empty-state"><div className="icon">👤</div>
                  <p>{search ? 'Sin resultados' : 'No hay clientes registrados'}</p>
                </div>
              </td></tr>
            ) : filtered.map((c, i) => {
              const clientOrders = orders.filter((o) => o.userId === c.uid);
              const delivered    = clientOrders.filter((o) => o.status === 'Entregado');
              const totalSpent   = delivered.reduce((s, o) => s + (o.total ?? 0), 0);
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length];

              return (
                <>
                  <tr
                    key={c.uid}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setExpanded(expanded === c.uid ? null : c.uid)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: color, color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 13, flexShrink: 0,
                        }}>
                          {initials(c.displayName ?? '')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#8B0000' }}>{c.displayName || '—'}</div>
                          {c.address && (
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                              📍 {c.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 14 }}>
                      <a href={`mailto:${c.email}`} style={{ color: '#1D4ED8', textDecoration: 'none' }}>{c.email}</a>
                    </td>
                    <td style={{ fontSize: 14 }}>
                      {c.phone
                        ? <a href={`tel:${c.phone}`} style={{ color: '#1D4ED8', textDecoration: 'none' }}>{c.phone}</a>
                        : <span style={{ color: '#D1D5DB' }}>—</span>
                      }
                    </td>
                    <td>
                      <div style={{ fontSize: 14 }}>
                        <span style={{ fontWeight: 700, color: '#8B0000' }}>{clientOrders.length}</span>
                        <span style={{ color: '#6B7280', fontSize: 12, marginLeft: 4 }}>pedidos</span>
                      </div>
                      {totalSpent > 0 && (
                        <div style={{ fontSize: 12, color: '#166534', fontWeight: 700 }}>
                          ${totalSpent.toFixed(2)} total
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 13, color: '#6B7280' }}>{fmt(c.createdAt)}</td>
                    <td style={{ color: '#C8901A', fontSize: 13, textAlign: 'center' }}>
                      {expanded === c.uid ? '▲' : '▼'}
                    </td>
                  </tr>

                  {/* Expanded: historial de pedidos */}
                  {expanded === c.uid && (
                    <tr key={`${c.uid}-exp`} className="order-items-row">
                      <td colSpan={6}>
                        <div className="order-items-inner">
                          <h4 style={{ marginBottom: 10 }}>Historial de pedidos de {c.displayName}</h4>
                          {clientOrders.length === 0 ? (
                            <p style={{ fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' }}>Sin pedidos registrados</p>
                          ) : (
                            <table style={{ width: '100%', fontSize: 13 }}>
                              <thead>
                                <tr style={{ background: 'none' }}>
                                  {['#', 'Items', 'Total', 'Estado', 'Fecha'].map((h) => (
                                    <th key={h} style={{ textAlign: 'left', padding: '4px 8px', color: '#8B0000', fontWeight: 700, background: 'none' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {[...clientOrders]
                                  .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
                                  .map((o) => (
                                    <tr key={o.id} style={{ borderBottom: '1px solid #F0E4C8' }}>
                                      <td style={{ padding: '5px 8px', fontWeight: 700 }}>#{o.id.slice(-8).toUpperCase()}</td>
                                      <td style={{ padding: '5px 8px' }}>—</td>
                                      <td style={{ padding: '5px 8px', fontWeight: 700 }}>${(o.total ?? 0).toFixed(2)}</td>
                                      <td style={{ padding: '5px 8px' }}>
                                        <span className={
                                          o.status === 'Entregado' ? 'badge badge-delivered' :
                                          o.status === 'Cancelado' ? 'badge badge-cancelled' :
                                          o.status === 'En Proceso' ? 'badge badge-process' : 'badge badge-pending'
                                        }>{o.status}</span>
                                      </td>
                                      <td style={{ padding: '5px 8px', color: '#6B7280' }}>{fmt(o.createdAt)}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
