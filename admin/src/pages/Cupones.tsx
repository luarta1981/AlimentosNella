import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';

type Cupon = {
  id: string; codigo: string;
  tipo: 'porcentaje' | 'monto';
  descuento: number; minimoCompra: number;
  usosMaximos: number; usosActuales: number;
  activo: boolean; expiracion: string; createdAt?: any;
};

const EMPTY: Omit<Cupon, 'id' | 'createdAt'> = {
  codigo: '', tipo: 'porcentaje', descuento: 10,
  minimoCompra: 0, usosMaximos: 100, usosActuales: 0,
  activo: true, expiracion: '',
};

function fmt(ts: any) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isExpired(exp: string): boolean {
  if (!exp) return false;
  return new Date(exp) < new Date();
}

function statusOf(c: Cupon): 'activo' | 'inactivo' | 'expirado' | 'agotado' {
  if (isExpired(c.expiracion)) return 'expirado';
  if (c.usosMaximos > 0 && c.usosActuales >= c.usosMaximos) return 'agotado';
  if (!c.activo) return 'inactivo';
  return 'activo';
}

const STATUS_CFG = {
  activo:   { label: '✓ Activo',   bg: '#DCFCE7', color: '#166534', border: '#166534' },
  inactivo: { label: '○ Inactivo', bg: '#F3F4F6', color: '#6B7280', border: '#6B7280' },
  expirado: { label: '✕ Expirado', bg: '#FEE2E2', color: '#DC2626', border: '#DC2626' },
  agotado:  { label: '⊘ Agotado',  bg: '#FEF3C7', color: '#92400E', border: '#D97706' },
};

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function Cupones() {
  const [cupones, setCupones]   = useState<Cupon[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState<Cupon | null>(null);
  const [form, setForm]         = useState<Omit<Cupon,'id'|'createdAt'>>(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [copied, setCopied]     = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cupones'), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Cupon));
      all.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds ?? 0;
        return tb - ta;
      });
      setCupones(all);
      setLoading(false);
    });
    return unsub;
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, codigo: genCode() });
    setModal(true);
  };
  const openEdit = (c: Cupon) => {
    setEditing(c);
    setForm({ codigo: c.codigo, tipo: c.tipo, descuento: c.descuento, minimoCompra: c.minimoCompra, usosMaximos: c.usosMaximos, usosActuales: c.usosActuales, activo: c.activo, expiracion: c.expiracion ?? '' });
    setModal(true);
  };
  const close = () => setModal(false);

  const handleSave = async () => {
    if (!form.codigo.trim()) return;
    setSaving(true);
    try {
      const data = { ...form, codigo: form.codigo.trim().toUpperCase() };
      if (editing) {
        await updateDoc(doc(db, 'cupones', editing.id), data);
      } else {
        await addDoc(collection(db, 'cupones'), { ...data, usosActuales: 0, createdAt: serverTimestamp() });
      }
      close();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Cupon) => {
    await updateDoc(doc(db, 'cupones', c.id), { activo: !c.activo });
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'cupones', id));
    setConfirmId(null);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  // Stats
  const active   = cupones.filter((c) => statusOf(c) === 'activo').length;
  const expired  = cupones.filter((c) => statusOf(c) === 'expirado').length;
  const totalUses = cupones.reduce((s, c) => s + (c.usosActuales ?? 0), 0);

  if (loading) return <div className="loading">Cargando cupones…</div>;

  return (
    <>
      <div className="page-header">
        <h2>Cupones de Descuento ({cupones.length})</h2>
        <button className="btn btn-primary" onClick={openAdd}>＋ Nuevo cupón</button>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 22 }}>
        {[
          { label: 'Cupones activos',  value: active,    color: '#166534' },
          { label: 'Total cupones',    value: cupones.length, color: '#8B0000' },
          { label: 'Usos totales',     value: totalUses, color: '#C8901A' },
          { label: 'Expirados',        value: expired,   color: '#DC2626' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="label">{s.label}</div>
            <div className="value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Código</th><th>Descuento</th><th>Mínimo</th>
              <th>Usos</th><th>Expira</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cupones.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state"><div className="icon">🎟️</div><p>Sin cupones creados</p></div>
              </td></tr>
            ) : cupones.map((c) => {
              const st  = statusOf(c);
              const cfg = STATUS_CFG[st];
              const pct = c.usosMaximos > 0 ? Math.round(c.usosActuales / c.usosMaximos * 100) : 0;

              return (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontFamily: 'monospace', fontWeight: 700, fontSize: 15,
                        background: '#FBF3E2', border: '1.5px dashed #C8901A',
                        padding: '3px 10px', borderRadius: 6, color: '#8B0000',
                        letterSpacing: 1,
                      }}>
                        {c.codigo}
                      </span>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: 2 }}
                        onClick={() => copyCode(c.codigo)}
                        title="Copiar código"
                      >
                        {copied === c.codigo ? '✅' : '📋'}
                      </button>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#8B0000', fontSize: 16 }}>
                    {c.tipo === 'porcentaje' ? `${c.descuento}%` : `$${c.descuento.toFixed(2)}`}
                    <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>
                      {c.tipo === 'porcentaje' ? 'porcentaje' : 'monto fijo'}
                    </div>
                  </td>
                  <td style={{ fontSize: 14 }}>
                    {c.minimoCompra > 0 ? `$${c.minimoCompra.toFixed(2)}` : <span style={{ color: '#D1D5DB' }}>Sin mínimo</span>}
                  </td>
                  <td>
                    <div style={{ fontSize: 14 }}>
                      <span style={{ fontWeight: 700 }}>{c.usosActuales}</span>
                      <span style={{ color: '#6B7280' }}> / {c.usosMaximos > 0 ? c.usosMaximos : '∞'}</span>
                    </div>
                    {c.usosMaximos > 0 && (
                      <div style={{ background: '#F0E4C8', borderRadius: 3, height: 4, marginTop: 4 }}>
                        <div style={{ width: `${pct}%`, background: pct >= 80 ? '#DC2626' : '#C8901A', height: '100%', borderRadius: 3 }} />
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 13, color: isExpired(c.expiracion) ? '#DC2626' : '#6B7280' }}>
                    {c.expiracion
                      ? new Date(c.expiracion).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
                      : <span style={{ color: '#D1D5DB' }}>Sin límite</span>
                    }
                  </td>
                  <td>
                    <span
                      style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`, cursor: st === 'activo' || st === 'inactivo' ? 'pointer' : 'default' }}
                      onClick={() => (st === 'activo' || st === 'inactivo') && toggleActive(c)}
                      title={st === 'activo' || st === 'inactivo' ? 'Clic para cambiar estado' : undefined}
                    >
                      {cfg.label}
                    </span>
                  </td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(c.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Edit modal */}
      {modal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-head">
              <h3>{editing ? 'Editar Cupón' : 'Nuevo Cupón'}</h3>
              <button className="modal-close" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Código *</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      value={form.codigo}
                      onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                      placeholder="NELLA20"
                      maxLength={16}
                      style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }}
                    />
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setForm({ ...form, codigo: genCode() })} style={{ whiteSpace: 'nowrap' }}>
                      🎲 Auto
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Tipo de descuento</label>
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as 'porcentaje' | 'monto' })}>
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="monto">Monto fijo ($)</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Valor del descuento *</label>
                  <input
                    type="number" min="0" step={form.tipo === 'porcentaje' ? '1' : '0.01'}
                    max={form.tipo === 'porcentaje' ? '100' : undefined}
                    value={form.descuento}
                    onChange={(e) => setForm({ ...form, descuento: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Mínimo de compra ($)</label>
                  <input
                    type="number" min="0" step="0.01" value={form.minimoCompra}
                    onChange={(e) => setForm({ ...form, minimoCompra: parseFloat(e.target.value) || 0 })}
                    placeholder="0 = sin mínimo"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Usos máximos</label>
                  <input
                    type="number" min="0" value={form.usosMaximos}
                    onChange={(e) => setForm({ ...form, usosMaximos: parseInt(e.target.value) || 0 })}
                    placeholder="0 = ilimitado"
                  />
                </div>
                <div className="form-group">
                  <label>Fecha de expiración</label>
                  <input
                    type="date" value={form.expiracion}
                    onChange={(e) => setForm({ ...form, expiracion: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="form-check" style={{ marginTop: 4 }}>
                <input type="checkbox" id="activo" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                <label htmlFor="activo">Cupón activo</label>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-outline" onClick={close}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.codigo.trim()}>
                {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear cupón'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmId && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-head"><h3>Eliminar cupón</h3></div>
            <div className="modal-body"><p style={{ fontSize: 16 }}>¿Seguro que deseas eliminar este cupón? No se puede deshacer.</p></div>
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
