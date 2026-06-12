import { collection, doc, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

const STATUS_MESSAGES: Record<string, { title: string; body: (id: string) => string }> = {
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

async function sendPushNotification(userId: string, orderId: string, newStatus: string) {
  const notif = STATUS_MESSAGES[newStatus];
  if (!notif) return;
  try {
    const snap = await getDoc(doc(db, 'usuarios', userId));
    const pushToken = snap.data()?.pushToken as string | undefined;
    if (!pushToken || !pushToken.startsWith('ExponentPushToken')) return;
    const shortId = orderId.slice(-8).toUpperCase();
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Accept-encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: pushToken,
        title: notif.title,
        body: notif.body(shortId),
        sound: 'default',
        data: { orderId, status: newStatus },
        channelId: 'pedidos',
      }),
    });
  } catch {
    // Push failed silently — order status update still goes through
  }
}

type OrderItem = { productId: string; name: string; price: number; qty: number };
type Order = {
  id: string; userId: string; items: OrderItem[]; subtotal: number;
  delivery: number; total: number; status: string;
  address: string; payMethod: string; createdAt: any; updatedAt: any;
};
type ClienteInfo = { nombre: string; email: string; cedula?: string };
type EmpresaInfo = { razon: string; rif: string };

type Status = 'Todos' | 'Pendiente' | 'En Proceso' | 'Entregado' | 'Cancelado';

const STATUSES: Status[] = ['Todos', 'Pendiente', 'En Proceso', 'Entregado', 'Cancelado'];

const STATUS_OPTIONS = ['Pendiente', 'En Proceso', 'Entregado', 'Cancelado'];

const PAY_LABEL: Record<string, string> = {
  c2p: 'Pago Móvil', transfer: 'Transferencia', zelle: 'Zelle',
  delivery: 'Contra entrega', receipt: 'Comprobante',
};

function statusBadge(s: string) {
  const map: Record<string, string> = {
    Pendiente: 'badge badge-pending', 'En Proceso': 'badge badge-process',
    Entregado: 'badge badge-delivered', Cancelado: 'badge badge-cancelled',
  };
  return map[s] ?? 'badge';
}

function fmt(ts: any) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Orders() {
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [clientes, setClientes] = useState<Record<string, ClienteInfo>>({});
  const [empresas, setEmpresas] = useState<Record<string, EmpresaInfo>>({});
  const [loading,  setLoading]  = useState(true);
  const [filter,     setFilter]     = useState<Status>('Todos');
  const [clientType, setClientType] = useState<'todos' | 'natural' | 'juridico'>('todos');
  const [search,     setSearch]     = useState('');
  const [expanded,   setExpanded]   = useState<string | null>(null);

  useEffect(() => {
    const unsubPedidos = onSnapshot(collection(db, 'pedidos'), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      all.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds ?? 0;
        return tb - ta;
      });
      setOrders(all);
      setLoading(false);
    });
    const unsubUsuarios = onSnapshot(collection(db, 'usuarios'), (snap) => {
      const map: Record<string, ClienteInfo> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        map[d.id] = { nombre: data.displayName ?? '', email: data.email ?? '', cedula: data.cedula };
      });
      setClientes(map);
    });
    const unsubEmpresas = onSnapshot(collection(db, 'empresas'), (snap) => {
      const map: Record<string, EmpresaInfo> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.userId) map[data.userId] = { razon: data.razon ?? '', rif: data.rif ?? '' };
      });
      setEmpresas(map);
    });
    return () => { unsubPedidos(); unsubUsuarios(); unsubEmpresas(); };
  }, []);

  const handleStatus = async (id: string, status: string) => {
    const order = orders.find((o) => o.id === id);
    await updateDoc(doc(db, 'pedidos', id), { status, updatedAt: serverTimestamp() });
    if (order) sendPushNotification(order.userId, id, status);
  };

  const filtered = orders.filter((o) => {
    const matchFilter = filter === 'Todos' || o.status === filter;
    const isEmpresa   = !!empresas[o.userId];
    const matchType   =
      clientType === 'todos'    ||
      (clientType === 'juridico' &&  isEmpresa) ||
      (clientType === 'natural'  && !isEmpresa);
    const q = search.toLowerCase();
    const c = clientes[o.userId];
    const e = empresas[o.userId];
    const matchSearch = !q ||
      o.id.toLowerCase().includes(q) ||
      c?.nombre.toLowerCase().includes(q) ||
      c?.email.toLowerCase().includes(q) ||
      c?.cedula?.includes(q) ||
      e?.razon.toLowerCase().includes(q) ||
      e?.rif.toLowerCase().includes(q);
    return matchFilter && matchType && matchSearch;
  });

  if (loading) return <div className="loading">Cargando pedidos…</div>;

  return (
    <>
      <div className="page-header"><h2>Pedidos ({orders.length})</h2></div>

      <div className="filter-bar">
        {STATUSES.map((s) => (
          <button key={s} className={`filter-chip${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>{s}</button>
        ))}

        <div style={{ width: 1, height: 28, background: '#D1D5DB', alignSelf: 'center', margin: '0 4px' }} />

        {([
          { k: 'todos',    l: 'Todos' },
          { k: 'natural',  l: '👤 Natural' },
          { k: 'juridico', l: '🏢 Jurídico' },
        ] as { k: typeof clientType; l: string }[]).map(({ k, l }) => (
          <button
            key={k}
            className={`filter-chip${clientType === k ? ' active' : ''}`}
            onClick={() => setClientType(k)}
          >{l}</button>
        ))}

        <input className="search-input" placeholder="Buscar por ID, nombre o cédula…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Pedido</th><th>Correo</th><th>Items</th><th>Total</th><th>Pago</th><th>Fecha</th><th>Estado</th><th>Cambiar estado</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8}><div className="empty-state"><div className="icon">📋</div><p>Sin pedidos en esta categoría</p></div></td></tr>
            ) : filtered.map((o) => (
              <>
                <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#8B0000' }}>
                      #{o.id.slice(-8).toUpperCase()}
                      <span style={{ marginLeft: 6, fontSize: 12, color: '#C8901A' }}>{expanded === o.id ? '▲' : '▼'}</span>
                    </div>
                    {empresas[o.userId] ? (
                      <>
                        <div style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>
                          {empresas[o.userId].razon}
                        </div>
                        <div style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>
                          RIF {empresas[o.userId].rif}
                        </div>
                      </>
                    ) : (
                      <>
                        {clientes[o.userId]?.nombre && (
                          <div style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>
                            {clientes[o.userId].nombre}
                          </div>
                        )}
                        {clientes[o.userId]?.cedula && (
                          <div style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>
                            C.I. {clientes[o.userId].cedula}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td style={{ fontSize: 13, color: '#6B7280', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {clientes[o.userId]?.email || o.userId}
                  </td>
                  <td>{o.items?.length ?? 0} ítem(s)</td>
                  <td style={{ fontWeight: 700 }}>${(o.total ?? 0).toFixed(2)}</td>
                  <td>{PAY_LABEL[o.payMethod] ?? o.payMethod}</td>
                  <td style={{ fontSize: 13 }}>{fmt(o.createdAt)}</td>
                  <td><span className={statusBadge(o.status)}>{o.status}</span></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      className="status-select"
                      value={o.status}
                      onChange={(e) => handleStatus(o.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
                {expanded === o.id && (
                  <tr key={`${o.id}-exp`} className="order-items-row">
                    <td colSpan={8}>
                      <div className="order-items-inner">

                        {/* Datos del cliente */}
                        {empresas[o.userId] ? (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            background: '#FBF3E2', border: '1.5px solid #C8901A',
                            borderRadius: 10, padding: '10px 14px', marginBottom: 14,
                          }}>
                            <span style={{ fontSize: 22 }}>🏢</span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#8B0000' }}>
                                {empresas[o.userId].razon}
                              </div>
                              <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace', marginTop: 2 }}>
                                RIF {empresas[o.userId].rif}
                              </div>
                            </div>
                          </div>
                        ) : clientes[o.userId]?.nombre ? (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            background: '#FBF3E2', border: '1.5px solid #C8901A',
                            borderRadius: 10, padding: '10px 14px', marginBottom: 14,
                          }}>
                            <span style={{ fontSize: 22 }}>👤</span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#8B0000' }}>
                                {clientes[o.userId].nombre}
                              </div>
                              {clientes[o.userId].cedula && (
                                <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace', marginTop: 2 }}>
                                  C.I. {clientes[o.userId].cedula}
                                </div>
                              )}
                              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>
                                {clientes[o.userId].email}
                              </div>
                            </div>
                          </div>
                        ) : null}

                        <h4>Productos del pedido</h4>
                        {(o.items ?? []).map((item, i) => (
                          <div key={i} className="item-line">
                            {item.name} × {item.qty} — ${(item.price * item.qty).toFixed(2)}
                          </div>
                        ))}
                        <div style={{ marginTop: 10, display: 'flex', gap: 24, fontSize: 14 }}>
                          <span><b>Subtotal:</b> ${(o.subtotal ?? 0).toFixed(2)}</span>
                          <span><b>Delivery:</b> ${(o.delivery ?? 0).toFixed(2)}</span>
                          <span style={{ color: '#8B0000', fontWeight: 700 }}><b>Total:</b> ${(o.total ?? 0).toFixed(2)}</span>
                          {o.address ? <span><b>Dirección:</b> {o.address}</span> : null}
                        </div>
                        {o.updatedAt && <div style={{ marginTop: 6, fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>Actualizado: {fmt(o.updatedAt)}</div>}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
