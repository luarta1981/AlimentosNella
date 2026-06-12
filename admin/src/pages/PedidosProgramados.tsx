import {
  addDoc, collection, deleteDoc, doc,
  onSnapshot, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Item = { nombre: string; cantidad: number; precio: number };
type Producto = { id: string; name: string; price: number; category: string; available: boolean };

type PedidoProgramado = {
  id: string; cliente: string; telefono: string;
  tipo: 'natural' | 'empresa';
  items: Item[];
  fechaEntrega: string; horaEntrega: string;
  direccion: string; notas: string; total: number;
  estado: 'Pendiente' | 'Confirmado' | 'En Preparación' | 'Listo' | 'Entregado' | 'Cancelado';
  createdAt?: any;
};

const ESTADOS: PedidoProgramado['estado'][] = [
  'Pendiente', 'Confirmado', 'En Preparación', 'Listo', 'Entregado', 'Cancelado',
];

const ESTADO_CFG: Record<PedidoProgramado['estado'], { bg: string; color: string; border: string }> = {
  Pendiente:       { bg: '#FEF3C7', color: '#92400E', border: '#D97706' },
  Confirmado:      { bg: '#DBEAFE', color: '#1D4ED8', border: '#1D4ED8' },
  'En Preparación': { bg: '#EDE9FE', color: '#6D28D9', border: '#7C3AED' },
  Listo:           { bg: '#FBF3E2', color: '#8B0000', border: '#C8901A' },
  Entregado:       { bg: '#DCFCE7', color: '#166534', border: '#166534' },
  Cancelado:       { bg: '#F3F4F6', color: '#6B7280', border: '#9CA3AF' },
};

const EMPTY_ITEM: Item = { nombre: '', cantidad: 1, precio: 0 };
const EMPTY: Omit<PedidoProgramado, 'id' | 'createdAt'> = {
  cliente: '', telefono: '', tipo: 'natural',
  items: [{ ...EMPTY_ITEM }],
  fechaEntrega: '', horaEntrega: '09:00',
  direccion: '', notas: '', total: 0, estado: 'Pendiente',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcTotal(items: Item[]) {
  return items.reduce((s, i) => s + (i.precio * i.cantidad), 0);
}

function dateProximity(fechaStr: string): 'today' | 'tomorrow' | 'past' | 'future' {
  if (!fechaStr) return 'future';
  const today    = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const fecha    = new Date(fechaStr + 'T00:00:00');
  if (fecha < today)    return 'past';
  if (fecha.getTime() === today.getTime())    return 'today';
  if (fecha.getTime() === tomorrow.getTime()) return 'tomorrow';
  return 'future';
}

function fmtDate(str: string) {
  if (!str) return '—';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('es-VE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function fmt(ts: any) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

const TODAY_STR = new Date().toISOString().split('T')[0];

// ─── Component ───────────────────────────────────────────────────────────────

export default function PedidosProgramados() {
  const [pedidos,    setPedidos]    = useState<PedidoProgramado[]>([]);
  const [productos,  setProductos]  = useState<Producto[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false);
  const [editing,    setEditing]    = useState<PedidoProgramado | null>(null);
  const [form,       setForm]       = useState<Omit<PedidoProgramado,'id'|'createdAt'>>(EMPTY);
  const [saving,     setSaving]     = useState(false);
  const [confirmId,  setConfirmId]  = useState<string | null>(null);
  const [filter,     setFilter]     = useState<PedidoProgramado['estado'] | 'todos'>('todos');
  const [statusSaving, setStatusSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'productos'), (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Producto))
        .filter((p) => p.available !== false)
        .sort((a, b) => a.name.localeCompare(b.name));
      setProductos(all);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'pedidos_programados'), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PedidoProgramado));
      all.sort((a, b) => {
        if (!a.fechaEntrega) return 1;
        if (!b.fechaEntrega) return -1;
        return a.fechaEntrega.localeCompare(b.fechaEntrega) || a.horaEntrega.localeCompare(b.horaEntrega);
      });
      setPedidos(all);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Form helpers
  const updateItem = (i: number, field: keyof Item, val: string | number) => {
    const items = form.items.map((it, idx) =>
      idx === i ? { ...it, [field]: field === 'nombre' ? val : Number(val) } : it
    );
    setForm({ ...form, items, total: calcTotal(items) });
  };
  const selectProductForItem = (i: number, productName: string) => {
    const prod  = productos.find((p) => p.name === productName);
    const items = form.items.map((it, idx) =>
      idx === i ? { ...it, nombre: productName, precio: prod?.price ?? it.precio } : it
    );
    setForm({ ...form, items, total: calcTotal(items) });
  };

  const addItem    = () => setForm({ ...form, items: [...form.items, { ...EMPTY_ITEM }] });
  const removeItem = (i: number) => {
    const items = form.items.filter((_, idx) => idx !== i);
    setForm({ ...form, items: items.length ? items : [{ ...EMPTY_ITEM }], total: calcTotal(items) });
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, items: [{ ...EMPTY_ITEM }], fechaEntrega: TODAY_STR });
    setModal(true);
  };
  const openEdit = (p: PedidoProgramado) => {
    setEditing(p);
    setForm({ cliente: p.cliente, telefono: p.telefono, tipo: p.tipo, items: p.items, fechaEntrega: p.fechaEntrega, horaEntrega: p.horaEntrega, direccion: p.direccion, notas: p.notas, total: p.total, estado: p.estado });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.cliente.trim() || !form.fechaEntrega) return;
    setSaving(true);
    try {
      const data = { ...form, total: calcTotal(form.items) };
      if (editing) {
        await updateDoc(doc(db, 'pedidos_programados', editing.id), data);
      } else {
        await addDoc(collection(db, 'pedidos_programados'), { ...data, createdAt: serverTimestamp() });
      }
      setModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id: string, estado: PedidoProgramado['estado']) => {
    setStatusSaving((s) => ({ ...s, [id]: true }));
    try {
      await updateDoc(doc(db, 'pedidos_programados', id), { estado });
    } finally {
      setStatusSaving((s) => ({ ...s, [id]: false }));
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'pedidos_programados', id));
    setConfirmId(null);
  };

  // Stats
  const hoy      = pedidos.filter((p) => p.fechaEntrega === TODAY_STR && p.estado !== 'Cancelado').length;
  const semana   = pedidos.filter((p) => {
    if (!p.fechaEntrega || p.estado === 'Cancelado') return false;
    const d = new Date(p.fechaEntrega + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const next7 = new Date(today); next7.setDate(today.getDate() + 7);
    return d >= today && d <= next7;
  }).length;
  const pendientes = pedidos.filter((p) => p.estado === 'Pendiente').length;
  const alertaHoy  = pedidos.filter((p) => p.fechaEntrega === TODAY_STR && !['Entregado','Cancelado'].includes(p.estado));

  const filtered = pedidos.filter((p) => filter === 'todos' || p.estado === filter);

  if (loading) return <div className="loading">Cargando pedidos programados…</div>;

  return (
    <>
      <div className="page-header">
        <h2>Programar Pedidos</h2>
        <button className="btn btn-primary" onClick={openAdd}>＋ Nuevo pedido</button>
      </div>

      {/* Alert for today */}
      {alertaHoy.length > 0 && (
        <div style={{
          background: '#FEF3C7', border: '2px solid #D97706', borderRadius: 10,
          padding: '14px 20px', marginBottom: 22,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ fontSize: 24 }}>📅</span>
          <div>
            <div style={{ fontWeight: 700, color: '#92400E', fontSize: 16 }}>
              {alertaHoy.length} pedido{alertaHoy.length > 1 ? 's' : ''} programado{alertaHoy.length > 1 ? 's' : ''} para hoy
            </div>
            <div style={{ fontSize: 13, color: '#78350F', marginTop: 3 }}>
              {alertaHoy.map((p) => `${p.cliente} (${p.horaEntrega})`).join(' · ')}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 22 }}>
        {[
          { label: 'Para hoy',          value: hoy,       color: '#DC2626' },
          { label: 'Próximos 7 días',   value: semana,    color: '#D97706' },
          { label: 'Pendientes',        value: pendientes, color: '#6B7280' },
          { label: 'Total programados', value: pedidos.length, color: '#8B0000' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="label">{s.label}</div>
            <div className="value" style={{ color: s.color, fontSize: 28 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <button className={`filter-chip${filter === 'todos' ? ' active' : ''}`} onClick={() => setFilter('todos')}>
          Todos ({pedidos.length})
        </button>
        {ESTADOS.map((e) => {
          const cnt = pedidos.filter((p) => p.estado === e).length;
          if (cnt === 0) return null;
          return (
            <button key={e} className={`filter-chip${filter === e ? ' active' : ''}`} onClick={() => setFilter(e)}>
              {e} ({cnt})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Entrega</th><th>Cliente</th><th>Productos</th>
              <th>Total</th><th>Dirección</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state"><div className="icon">📅</div>
                  <p>No hay pedidos programados</p>
                </div>
              </td></tr>
            ) : filtered.map((p) => {
              const prox  = dateProximity(p.fechaEntrega);
              const cfg   = ESTADO_CFG[p.estado];
              const rowBg =
                prox === 'today'    ? 'rgba(220,38,38,0.05)'   :
                prox === 'tomorrow' ? 'rgba(217,119,6,0.05)'   :
                prox === 'past'     ? 'rgba(107,114,128,0.05)' : undefined;

              return (
                <tr key={p.id} style={{ background: rowBg }}>
                  {/* Fecha */}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 700, color: prox === 'today' ? '#DC2626' : prox === 'tomorrow' ? '#D97706' : '#1F2937' }}>
                      {fmtDate(p.fechaEntrega)}
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>⏰ {p.horaEntrega}</div>
                    {prox === 'today' && (
                      <span style={{ fontSize: 10, background: '#FEE2E2', color: '#DC2626', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>HOY</span>
                    )}
                    {prox === 'tomorrow' && (
                      <span style={{ fontSize: 10, background: '#FEF3C7', color: '#D97706', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>MAÑANA</span>
                    )}
                    {prox === 'past' && p.estado !== 'Entregado' && p.estado !== 'Cancelado' && (
                      <span style={{ fontSize: 10, background: '#F3F4F6', color: '#6B7280', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>VENCIDO</span>
                    )}
                  </td>

                  {/* Cliente */}
                  <td>
                    <div style={{ fontWeight: 700, color: '#8B0000' }}>{p.cliente}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>
                      {p.tipo === 'empresa' ? '🏢 Empresa' : '👤 Natural'}
                    </div>
                    {p.telefono && (
                      <a href={`tel:${p.telefono}`} style={{ fontSize: 12, color: '#1D4ED8', textDecoration: 'none' }}>
                        📞 {p.telefono}
                      </a>
                    )}
                  </td>

                  {/* Productos */}
                  <td style={{ maxWidth: 200 }}>
                    {p.items.slice(0, 3).map((it, i) => (
                      <div key={i} style={{ fontSize: 13, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        • {it.nombre} × {it.cantidad}
                      </div>
                    ))}
                    {p.items.length > 3 && (
                      <div style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                        +{p.items.length - 3} más
                      </div>
                    )}
                  </td>

                  {/* Total */}
                  <td style={{ fontWeight: 700, color: '#8B0000', fontSize: 17, whiteSpace: 'nowrap' }}>
                    ${(p.total ?? calcTotal(p.items)).toFixed(2)}
                  </td>

                  {/* Dirección */}
                  <td style={{ fontSize: 13, color: '#6B7280', maxWidth: 150 }}>
                    {p.direccion ? `📍 ${p.direccion}` : <span style={{ color: '#D1D5DB' }}>—</span>}
                    {p.notas && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>💬 {p.notas}</div>}
                  </td>

                  {/* Estado */}
                  <td>
                    <select
                      className="status-select"
                      value={p.estado}
                      onChange={(e) => handleStatus(p.id, e.target.value as PedidoProgramado['estado'])}
                      disabled={statusSaving[p.id]}
                      style={{ background: cfg.bg, color: cfg.color, fontWeight: 700, border: `1.5px solid ${cfg.border}` }}
                    >
                      {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </td>

                  {/* Acciones */}
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(p.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Add/Edit Modal ── */}
      {modal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-head">
              <h3>{editing ? 'Editar Pedido Programado' : 'Nuevo Pedido Programado'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Cliente */}
              <div className="form-row">
                <div className="form-group">
                  <label>Cliente *</label>
                  <input type="text" value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} placeholder="Nombre o Razón Social" />
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}>
                    <option value="natural">👤 Persona Natural</option>
                    <option value="empresa">🏢 Empresa</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="04XX-XXXXXXX" />
                </div>
                <div className="form-group">
                  <label>Estado inicial</label>
                  <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as any })}>
                    {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>

              {/* Fecha y hora */}
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de entrega *</label>
                  <input type="date" value={form.fechaEntrega} onChange={(e) => setForm({ ...form, fechaEntrega: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Hora de entrega</label>
                  <input type="time" value={form.horaEntrega} onChange={(e) => setForm({ ...form, horaEntrega: e.target.value })} />
                </div>
              </div>

              {/* Dirección y notas */}
              <div className="form-group">
                <label>Dirección de entrega</label>
                <input type="text" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} placeholder="Calle, número, sector, ciudad" />
              </div>
              <div className="form-group">
                <label>Notas / Indicaciones</label>
                <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Instrucciones especiales, referencias, etc." style={{ minHeight: 60 }} />
              </div>

              {/* Products */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ margin: 0 }}>Productos *</label>
                  <button type="button" className="btn btn-outline btn-sm" onClick={addItem}>＋ Agregar</button>
                </div>
                <div style={{ background: '#FBF3E2', borderRadius: 10, padding: '12px 14px', border: '1.5px solid #F0E4C8' }}>
                  {/* Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 32px', gap: 8, fontSize: 12, fontWeight: 700, color: '#8B0000', marginBottom: 6 }}>
                    <span>Producto</span><span>Cant.</span><span>Precio $</span><span></span>
                  </div>
                  {form.items.map((it, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 32px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <select
                        value={it.nombre}
                        onChange={(e) => selectProductForItem(i, e.target.value)}
                        style={{ fontSize: 14, padding: '6px 10px', borderColor: it.nombre ? '#D1D5DB' : '#C8901A' }}
                      >
                        <option value="">— Seleccionar producto —</option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                      <input
                        type="number" min="1" value={it.cantidad}
                        onChange={(e) => updateItem(i, 'cantidad', e.target.value)}
                        style={{ fontSize: 14, padding: '6px 8px', textAlign: 'center' }}
                      />
                      <input
                        type="number" min="0" step="0.01" value={it.precio}
                        onChange={(e) => updateItem(i, 'precio', e.target.value)}
                        style={{ fontSize: 14, padding: '6px 8px', textAlign: 'right' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 18, padding: 0, fontWeight: 700 }}
                        disabled={form.items.length === 1}
                      >×</button>
                    </div>
                  ))}
                  <div style={{ textAlign: 'right', fontWeight: 700, color: '#8B0000', fontSize: 16, marginTop: 4, paddingTop: 8, borderTop: '1px solid #F0E4C8' }}>
                    Total: ${calcTotal(form.items).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !form.cliente.trim() || !form.fechaEntrega}
              >
                {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmId && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-head"><h3>Eliminar pedido programado</h3></div>
            <div className="modal-body"><p style={{ fontSize: 16 }}>¿Seguro que deseas eliminar este pedido? No se puede deshacer.</p></div>
            <div className="modal-foot">
              <button className="btn btn-outline" onClick={() => setConfirmId(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmId)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
