import {
  addDoc, collection, doc, onSnapshot,
  serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Repartidor = {
  id: string; nombre: string; telefono: string;
  vehiculo: string; activo: boolean;
};

type DeliveryStatus = 'sin_asignar' | 'asignado' | 'en_ruta' | 'entregado';

type Order = {
  id: string; userId: string; address: string; total: number;
  status: string; payMethod: string; createdAt: any; items: any[];
  repartidorId?: string; repartidorNombre?: string;
  deliveryStatus?: DeliveryStatus;
};
type ClienteInfo = { nombre: string; cedula?: string };
type EmpresaInfo  = { razon: string;  rif: string };

// ─── Config ───────────────────────────────────────────────────────────────────

const DS_CFG: Record<DeliveryStatus, { label: string; bg: string; color: string; border: string }> = {
  sin_asignar: { label: '— Sin asignar', bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' },
  asignado:    { label: '✓ Asignado',    bg: '#DBEAFE', color: '#1D4ED8', border: '#1D4ED8' },
  en_ruta:     { label: '🚚 En ruta',    bg: '#FEF3C7', color: '#92400E', border: '#D97706' },
  entregado:   { label: '✅ Entregado',  bg: '#DCFCE7', color: '#166534', border: '#166534' },
};

const PAY_LABEL: Record<string, string> = {
  c2p: 'Pago Móvil', transfer: 'Transferencia',
  zelle: 'Zelle', delivery: 'Contra entrega', receipt: 'Comprobante',
};

function fmt(ts: any) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const VEHICULOS = ['Moto', 'Carro', 'Bicicleta', 'A pie', 'Otro'];

// ─── Component ───────────────────────────────────────────────────────────────

export default function GestionEntregas() {
  const [orders,       setOrders]       = useState<Order[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [clientes,     setClientes]     = useState<Record<string, ClienteInfo>>({});
  const [empresas,     setEmpresas]     = useState<Record<string, EmpresaInfo>>({});
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState<DeliveryStatus | 'todos'>('todos');
  const [search,       setSearch]       = useState('');

  // Inline assignment state: orderId → { repartidorId, deliveryStatus }
  const [pending,  setPending]  = useState<Record<string, { rid: string; ds: DeliveryStatus }>>({});
  const [saving,   setSaving]   = useState<Record<string, boolean>>({});

  // Repartidores modal
  const [repModal, setRepModal] = useState(false);
  const [repForm,  setRepForm]  = useState({ nombre: '', telefono: '', vehiculo: 'Moto' });
  const [repSaving, setRepSaving] = useState(false);

  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, 'pedidos'), (snap) => {
        const all = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Order))
          .filter((o) => o.status !== 'Cancelado')
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setOrders(all);
        setLoading(false);
      }),
      onSnapshot(collection(db, 'repartidores'), (snap) => {
        setRepartidores(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Repartidor)));
      }),
      onSnapshot(collection(db, 'usuarios'), (snap) => {
        const map: Record<string, ClienteInfo> = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          map[d.id] = { nombre: data.displayName ?? '', cedula: data.cedula };
        });
        setClientes(map);
      }),
      onSnapshot(collection(db, 'empresas'), (snap) => {
        const map: Record<string, EmpresaInfo> = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.userId) map[data.userId] = { razon: data.razon ?? '', rif: data.rif ?? '' };
        });
        setEmpresas(map);
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  // Helpers
  const getPending = (o: Order) => pending[o.id] ?? {
    rid: o.repartidorId ?? '',
    ds:  (o.deliveryStatus ?? 'sin_asignar') as DeliveryStatus,
  };

  const hasPending = (o: Order) => {
    const p = pending[o.id];
    if (!p) return false;
    return p.rid !== (o.repartidorId ?? '') || p.ds !== (o.deliveryStatus ?? 'sin_asignar');
  };

  const saveAssignment = async (o: Order) => {
    const p = pending[o.id];
    if (!p) return;
    setSaving((s) => ({ ...s, [o.id]: true }));
    try {
      const rep = repartidores.find((r) => r.id === p.rid);
      await updateDoc(doc(db, 'pedidos', o.id), {
        repartidorId:     p.rid || null,
        repartidorNombre: rep?.nombre ?? null,
        deliveryStatus:   p.ds,
        deliveryUpdatedAt: serverTimestamp(),
      });
      setPending((prev) => { const c = { ...prev }; delete c[o.id]; return c; });
    } finally {
      setSaving((s) => ({ ...s, [o.id]: false }));
    }
  };

  const addRepartidor = async () => {
    if (!repForm.nombre.trim()) return;
    setRepSaving(true);
    try {
      await addDoc(collection(db, 'repartidores'), {
        nombre: repForm.nombre.trim(), telefono: repForm.telefono.trim(),
        vehiculo: repForm.vehiculo, activo: true, createdAt: serverTimestamp(),
      });
      setRepForm({ nombre: '', telefono: '', vehiculo: 'Moto' });
    } finally {
      setRepSaving(false);
    }
  };

  const toggleRep = (r: Repartidor) =>
    updateDoc(doc(db, 'repartidores', r.id), { activo: !r.activo });

  // Stats
  const sinAsignar = orders.filter((o) => !o.deliveryStatus || o.deliveryStatus === 'sin_asignar').length;
  const enRuta     = orders.filter((o) => o.deliveryStatus === 'en_ruta').length;
  const entregados = orders.filter((o) => o.deliveryStatus === 'entregado').length;

  const filtered = orders.filter((o) => {
    const ds = o.deliveryStatus ?? 'sin_asignar';
    const matchF = filter === 'todos' || ds === filter;
    const q = search.toLowerCase();
    const c = clientes[o.userId];
    const e = empresas[o.userId];
    const matchS = !q ||
      o.id.toLowerCase().includes(q) ||
      o.address?.toLowerCase().includes(q) ||
      o.repartidorNombre?.toLowerCase().includes(q) ||
      c?.nombre.toLowerCase().includes(q) ||
      c?.cedula?.includes(q) ||
      e?.razon.toLowerCase().includes(q) ||
      e?.rif.toLowerCase().includes(q);
    return matchF && matchS;
  });

  const activeReps = repartidores.filter((r) => r.activo);

  if (loading) return <div className="loading">Cargando entregas…</div>;

  return (
    <>
      <div className="page-header">
        <h2>Gestión de Entregas</h2>
        <button className="btn btn-primary" onClick={() => setRepModal(true)}>
          👤 Gestionar Repartidores ({repartidores.length})
        </button>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 22 }}>
        {[
          { label: 'Sin asignar', value: sinAsignar, color: '#6B7280' },
          { label: 'Asignados',   value: orders.filter((o) => o.deliveryStatus === 'asignado').length, color: '#1D4ED8' },
          { label: 'En ruta',     value: enRuta,     color: '#D97706' },
          { label: 'Entregados',  value: entregados, color: '#166534' },
          { label: 'Repartidores activos', value: activeReps.length, color: '#8B0000' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="label">{s.label}</div>
            <div className="value" style={{ color: s.color, fontSize: 28 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Active repartidores quick view */}
      {activeReps.length > 0 && (
        <div style={{
          display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18,
          padding: '12px 16px', background: '#fff',
          borderRadius: 10, border: '1.5px solid #F0E4C8',
        }}>
          <span style={{ fontSize: 13, color: '#9CA3AF', alignSelf: 'center', marginRight: 4 }}>
            Repartidores activos:
          </span>
          {activeReps.map((r) => (
            <span key={r.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#FBF3E2', border: '1.5px solid #C8901A',
              borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600,
            }}>
              {r.vehiculo === 'Moto' ? '🏍' : r.vehiculo === 'Carro' ? '🚗' : r.vehiculo === 'Bicicleta' ? '🚲' : '🚶'} {r.nombre}
            </span>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        {([
          { k: 'todos',       l: `Todos (${orders.length})` },
          { k: 'sin_asignar', l: `Sin asignar (${sinAsignar})` },
          { k: 'asignado',    l: 'Asignados' },
          { k: 'en_ruta',     l: `En ruta (${enRuta})` },
          { k: 'entregado',   l: `Entregados (${entregados})` },
        ] as { k: string; l: string }[]).map(({ k, l }) => (
          <button
            key={k}
            className={`filter-chip${filter === k ? ' active' : ''}`}
            onClick={() => setFilter(k as any)}
          >{l}</button>
        ))}
        <input
          className="search-input"
          placeholder="Buscar por pedido, dirección o repartidor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Orders table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Pedido</th><th>Dirección</th><th>Items / Total</th>
              <th>Pago</th><th>Fecha</th><th>Repartidor</th>
              <th>Estado entrega</th><th>Guardar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8}>
                <div className="empty-state"><div className="icon">🚚</div>
                  <p>No hay pedidos en esta categoría</p>
                </div>
              </td></tr>
            ) : filtered.map((o) => {
              const p   = getPending(o);
              const cfg = DS_CFG[p.ds ?? 'sin_asignar'];
              const changed = hasPending(o);
              const isSaving = saving[o.id] ?? false;

              return (
                <tr key={o.id} style={{ background: changed ? '#FFFBEB' : undefined }}>
                  <td style={{ fontWeight: 700, color: '#8B0000', whiteSpace: 'nowrap' }}>
                    #{o.id.slice(-8).toUpperCase()}
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{o.status}</div>
                    {empresas[o.userId] ? (
                      <>
                        <div style={{ fontSize: 12, color: '#374151', fontWeight: 600, marginTop: 3 }}>
                          {empresas[o.userId].razon}
                        </div>
                        <div style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>
                          RIF {empresas[o.userId].rif}
                        </div>
                      </>
                    ) : (
                      <>
                        {clientes[o.userId]?.nombre && (
                          <div style={{ fontSize: 12, color: '#374151', fontWeight: 600, marginTop: 3 }}>
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
                  <td style={{ fontSize: 13, maxWidth: 160 }}>
                    {o.address ? (
                      <>📍 <span>{o.address}</span></>
                    ) : (
                      <span style={{ color: '#D1D5DB' }}>Sin dirección</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>${(o.total ?? 0).toFixed(2)}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{o.items?.length ?? 0} ítem(s)</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{PAY_LABEL[o.payMethod] ?? o.payMethod}</td>
                  <td style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>{fmt(o.createdAt)}</td>

                  {/* Repartidor selector */}
                  <td>
                    <select
                      className="status-select"
                      style={{ minWidth: 140 }}
                      value={p.rid}
                      onChange={(e) => setPending((prev) => ({
                        ...prev,
                        [o.id]: { ...getPending(o), rid: e.target.value },
                      }))}
                    >
                      <option value="">— Sin asignar</option>
                      {activeReps.map((r) => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                    </select>
                  </td>

                  {/* Delivery status selector */}
                  <td>
                    <select
                      className="status-select"
                      value={p.ds}
                      onChange={(e) => setPending((prev) => ({
                        ...prev,
                        [o.id]: { ...getPending(o), ds: e.target.value as DeliveryStatus },
                      }))}
                      style={{
                        background: cfg.bg, color: cfg.color,
                        fontWeight: 700, border: `1.5px solid ${cfg.border}`,
                      }}
                    >
                      <option value="sin_asignar">— Sin asignar</option>
                      <option value="asignado">✓ Asignado</option>
                      <option value="en_ruta">🚚 En ruta</option>
                      <option value="entregado">✅ Entregado</option>
                    </select>
                  </td>

                  <td>
                    <button
                      className={`btn btn-sm ${changed ? 'btn-gold' : 'btn-outline'}`}
                      onClick={() => saveAssignment(o)}
                      disabled={!changed || isSaving}
                      style={{ opacity: changed ? 1 : 0.35, minWidth: 72 }}
                    >
                      {isSaving ? '…' : 'Guardar'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Repartidores Modal ── */}
      {repModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setRepModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-head">
              <h3>Gestionar Repartidores</h3>
              <button className="modal-close" onClick={() => setRepModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Add form */}
              <div style={{
                background: '#FBF3E2', borderRadius: 10, padding: '14px 16px',
                border: '1.5px solid #F0E4C8', marginBottom: 20,
              }}>
                <p style={{ fontWeight: 700, color: '#8B0000', marginBottom: 10, fontSize: 15 }}>
                  ➕ Agregar repartidor
                </p>
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Nombre *</label>
                    <input
                      type="text" value={repForm.nombre}
                      onChange={(e) => setRepForm({ ...repForm, nombre: e.target.value })}
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Teléfono</label>
                    <input
                      type="tel" value={repForm.telefono}
                      onChange={(e) => setRepForm({ ...repForm, telefono: e.target.value })}
                      placeholder="04XX-XXXXXXX"
                    />
                  </div>
                </div>
                <div className="form-row" style={{ marginTop: 10 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Vehículo</label>
                    <select value={repForm.vehiculo} onChange={(e) => setRepForm({ ...repForm, vehiculo: e.target.value })}>
                      {VEHICULOS.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      onClick={addRepartidor}
                      disabled={repSaving || !repForm.nombre.trim()}
                    >
                      {repSaving ? 'Guardando…' : 'Agregar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* List */}
              {repartidores.length === 0 ? (
                <p style={{ color: '#9CA3AF', textAlign: 'center', fontStyle: 'italic', padding: 20 }}>
                  No hay repartidores registrados
                </p>
              ) : (
                <table style={{ width: '100%', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: 'none' }}>
                      {['Nombre','Teléfono','Vehículo','Estado'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: '#8B0000', background: 'none', fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {repartidores.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #F0E4C8' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.nombre}</td>
                        <td style={{ padding: '8px 10px' }}>
                          {r.telefono
                            ? <a href={`tel:${r.telefono}`} style={{ color: '#1D4ED8', textDecoration: 'none' }}>{r.telefono}</a>
                            : '—'
                          }
                        </td>
                        <td style={{ padding: '8px 10px' }}>{r.vehiculo}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span
                            className={r.activo ? 'badge badge-active' : 'badge badge-inactive'}
                            style={{ cursor: 'pointer' }}
                            onClick={() => toggleRep(r)}
                            title="Clic para cambiar estado"
                          >
                            {r.activo ? '● Activo' : '○ Inactivo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn btn-outline" onClick={() => setRepModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
