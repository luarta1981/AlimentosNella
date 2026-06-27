import {
  addDoc, collection, deleteDoc, doc,
  onSnapshot, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';

type TipoCuenta = 'cuenta' | 'transferencia' | 'pago_movil' | 'zelle';

type CuentaBancaria = {
  id: string;
  tipo: TipoCuenta;
  activo: boolean;
  createdAt?: any;
  // cuenta + transferencia
  banco?: string;
  tipoCuenta?: string;
  numeroCuenta?: string;
  titular?: string;
  cedulaRif?: string;
  // pago_movil
  telefono?: string;
  cedula?: string;
  // zelle
  emailOTelefono?: string;
  nombre?: string;
};

type FormData = Omit<CuentaBancaria, 'id' | 'createdAt'>;

const EMPTY: Record<TipoCuenta, FormData> = {
  cuenta:        { tipo: 'cuenta',        banco: '', tipoCuenta: 'Corriente', numeroCuenta: '', titular: '', cedulaRif: '', activo: true },
  transferencia: { tipo: 'transferencia', banco: '', numeroCuenta: '', titular: '', cedulaRif: '', activo: true },
  pago_movil:    { tipo: 'pago_movil',    banco: '', telefono: '', cedula: '', activo: true },
  zelle:         { tipo: 'zelle',         emailOTelefono: '', nombre: '', activo: true },
};

const TIPO_CUENTA_OPTIONS = ['Corriente', 'Ahorro', 'Nómina'];

const BANCOS_VE = [
  'Banco de Venezuela', 'Banesco', 'Mercantil', 'BBVA Provincial',
  'Banco Nacional de Crédito (BNC)', 'Bancaribe', 'Banco del Tesoro',
  'Bicentenario', 'Bancrecer', 'Mi Banco', 'Exterior',
  'Banco Activo', 'Fondo Común', 'Bancamiga', 'Otro',
];

const TIPO_META: Record<TipoCuenta, { label: string; icon: string; color: string }> = {
  cuenta:        { label: 'Cuenta Bancaria',       icon: '🏦', color: '#8B0000' },
  transferencia: { label: 'Transferencia Bancaria', icon: '🔄', color: '#1D4ED8' },
  pago_movil:    { label: 'Pago Móvil',             icon: '📱', color: '#7C3AED' },
  zelle:         { label: 'Zelle',                  icon: '💚', color: '#059669' },
};

function isValid(tipo: TipoCuenta, f: FormData): boolean {
  if (tipo === 'cuenta')        return !!(f.banco && f.numeroCuenta && f.titular && f.cedulaRif);
  if (tipo === 'transferencia') return !!(f.banco && f.numeroCuenta && f.titular && f.cedulaRif);
  if (tipo === 'pago_movil')    return !!(f.banco && f.telefono && f.cedula);
  if (tipo === 'zelle')         return !!(f.emailOTelefono && f.nombre);
  return false;
}

function StatusBadge({ activo, onClick }: { activo: boolean; onClick: () => void }) {
  return (
    <span
      onClick={onClick}
      title="Clic para cambiar estado"
      style={{
        display: 'inline-flex', alignItems: 'center', padding: '4px 10px',
        borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
        background: activo ? '#DCFCE7' : '#F3F4F6',
        color: activo ? '#166534' : '#6B7280',
        border: `1.5px solid ${activo ? '#166534' : '#6B7280'}`,
      }}
    >
      {activo ? '✓ Activa' : '○ Inactiva'}
    </span>
  );
}

function SectionHeader({ tipo, count }: { tipo: TipoCuenta; count: number }) {
  const m = TIPO_META[tipo];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
      paddingBottom: 10, borderBottom: '2px solid #C8901A22',
    }}>
      <span style={{ fontSize: 22 }}>{m.icon}</span>
      <h3 style={{ margin: 0, color: m.color, fontSize: 18 }}>{m.label}</h3>
      <span style={{
        background: '#FBF3E2', border: '1.5px solid #C8901A55',
        borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700, color: '#8B0000',
      }}>{count}</span>
    </div>
  );
}

export default function InformacionBancaria() {
  const [cuentas, setCuentas]     = useState<CuentaBancaria[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState<CuentaBancaria | null>(null);
  const [tipo, setTipo]           = useState<TipoCuenta>('cuenta');
  const [form, setForm]           = useState<FormData>(EMPTY.cuenta);
  const [saving, setSaving]       = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cuentas_bancarias'), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CuentaBancaria));
      all.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));
      setCuentas(all);
      setLoading(false);
    });
    return unsub;
  }, []);

  const openAdd = () => {
    setEditing(null);
    setTipo('cuenta');
    setForm({ ...EMPTY.cuenta });
    setModal(true);
  };

  const openEdit = (c: CuentaBancaria) => {
    setEditing(c);
    setTipo(c.tipo);
    const { id: _id, createdAt: _ts, ...rest } = c;
    setForm(rest);
    setModal(true);
  };

  const handleTipoChange = (t: TipoCuenta) => {
    setTipo(t);
    setForm({ ...EMPTY[t] });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form, tipo };
      if (editing) {
        await updateDoc(doc(db, 'cuentas_bancarias', editing.id), data);
      } else {
        await addDoc(collection(db, 'cuentas_bancarias'), { ...data, createdAt: serverTimestamp() });
      }
      setModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'cuentas_bancarias', id));
    setConfirmId(null);
  };

  const toggleActivo = (c: CuentaBancaria) =>
    updateDoc(doc(db, 'cuentas_bancarias', c.id), { activo: !c.activo });

  const byTipo = (t: TipoCuenta) => cuentas.filter((c) => c.tipo === t);

  const actionBtns = (c: CuentaBancaria) => (
    <div className="td-actions">
      <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}>✏️</button>
      <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(c.id)}>🗑️</button>
    </div>
  );

  if (loading) return <div className="loading">Cargando información bancaria…</div>;

  return (
    <>
      <div className="page-header">
        <h2>Información Bancaria ({cuentas.length})</h2>
        <button className="btn btn-primary" onClick={openAdd}>＋ Agregar cuenta</button>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        {(Object.keys(TIPO_META) as TipoCuenta[]).map((t) => (
          <div key={t} className="stat-card">
            <div className="label">{TIPO_META[t].icon} {TIPO_META[t].label}</div>
            <div className="value" style={{ color: TIPO_META[t].color }}>{byTipo(t).length}</div>
          </div>
        ))}
      </div>

      {/* ── Cuentas Bancarias ── */}
      <div style={{ marginBottom: 36 }}>
        <SectionHeader tipo="cuenta" count={byTipo('cuenta').length} />
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Banco</th><th>Tipo</th><th>N° de Cuenta</th><th>Titular</th><th>Cédula / RIF</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              {byTipo('cuenta').length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="icon">🏦</div><p>Sin cuentas bancarias registradas</p></div></td></tr>
              ) : byTipo('cuenta').map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700, color: '#8B0000' }}>{c.banco || '—'}</td>
                  <td><span style={{ background: '#F0E4C8', borderRadius: 6, padding: '3px 9px', fontSize: 12, fontWeight: 700, color: '#8B0000' }}>{c.tipoCuenta}</span></td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{c.numeroCuenta || '—'}</td>
                  <td>{c.titular || '—'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{c.cedulaRif || '—'}</td>
                  <td><StatusBadge activo={c.activo} onClick={() => toggleActivo(c)} /></td>
                  <td>{actionBtns(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Transferencia Bancaria ── */}
      <div style={{ marginBottom: 36 }}>
        <SectionHeader tipo="transferencia" count={byTipo('transferencia').length} />
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Banco</th><th>N° de Cuenta</th><th>Titular</th><th>Cédula / RIF</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              {byTipo('transferencia').length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="icon">🔄</div><p>Sin cuentas de transferencia registradas</p></div></td></tr>
              ) : byTipo('transferencia').map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700, color: '#1D4ED8' }}>{c.banco || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{c.numeroCuenta || '—'}</td>
                  <td>{c.titular || '—'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{c.cedulaRif || '—'}</td>
                  <td><StatusBadge activo={c.activo} onClick={() => toggleActivo(c)} /></td>
                  <td>{actionBtns(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pago Móvil ── */}
      <div style={{ marginBottom: 36 }}>
        <SectionHeader tipo="pago_movil" count={byTipo('pago_movil').length} />
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Banco</th><th>Teléfono</th><th>Cédula</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              {byTipo('pago_movil').length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state"><div className="icon">📱</div><p>Sin cuentas de Pago Móvil registradas</p></div></td></tr>
              ) : byTipo('pago_movil').map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700, color: '#7C3AED' }}>{c.banco || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{c.telefono || '—'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{c.cedula || '—'}</td>
                  <td><StatusBadge activo={c.activo} onClick={() => toggleActivo(c)} /></td>
                  <td>{actionBtns(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Zelle ── */}
      <div style={{ marginBottom: 36 }}>
        <SectionHeader tipo="zelle" count={byTipo('zelle').length} />
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Email / Teléfono</th><th>Nombre</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              {byTipo('zelle').length === 0 ? (
                <tr><td colSpan={4}><div className="empty-state"><div className="icon">💚</div><p>Sin cuentas Zelle registradas</p></div></td></tr>
              ) : byTipo('zelle').map((c) => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>{c.emailOTelefono || '—'}</td>
                  <td>{c.nombre || '—'}</td>
                  <td><StatusBadge activo={c.activo} onClick={() => toggleActivo(c)} /></td>
                  <td>{actionBtns(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal agregar / editar ── */}
      {modal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-head">
              <h3>{editing ? `Editar ${TIPO_META[tipo].label}` : 'Nueva cuenta'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Tipo selector (solo al agregar) */}
              {!editing && (
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label>Tipo de cuenta</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                    {(Object.keys(TIPO_META) as TipoCuenta[]).map((t) => {
                      const m = TIPO_META[t];
                      const active = tipo === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleTipoChange(t)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                            fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
                            border: active ? `2px solid ${m.color}` : '1.5px solid #D1D5DB',
                            background: active ? `${m.color}12` : '#F9FAFB',
                            color: active ? m.color : '#4B5563',
                          }}
                        >
                          <span style={{ fontSize: 18 }}>{m.icon}</span>
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cuenta Bancaria */}
              {tipo === 'cuenta' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Banco *</label>
                      <select value={form.banco ?? ''} onChange={(e) => setForm({ ...form, banco: e.target.value })}>
                        <option value="">Seleccionar banco…</option>
                        {BANCOS_VE.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Tipo de cuenta *</label>
                      <select value={form.tipoCuenta ?? 'Corriente'} onChange={(e) => setForm({ ...form, tipoCuenta: e.target.value })}>
                        {TIPO_CUENTA_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Número de cuenta *</label>
                    <input type="text" value={form.numeroCuenta ?? ''} onChange={(e) => setForm({ ...form, numeroCuenta: e.target.value })} placeholder="0000-0000-00-0000000000" maxLength={30} style={{ fontFamily: 'monospace' }} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Titular *</label>
                      <input type="text" value={form.titular ?? ''} onChange={(e) => setForm({ ...form, titular: e.target.value })} placeholder="Nombre completo del titular" />
                    </div>
                    <div className="form-group">
                      <label>Cédula / RIF *</label>
                      <input type="text" value={form.cedulaRif ?? ''} onChange={(e) => setForm({ ...form, cedulaRif: e.target.value })} placeholder="J-123456789" maxLength={20} style={{ fontFamily: 'monospace' }} />
                    </div>
                  </div>
                </>
              )}

              {/* Transferencia Bancaria */}
              {tipo === 'transferencia' && (
                <>
                  <div className="form-group">
                    <label>Banco *</label>
                    <select value={form.banco ?? ''} onChange={(e) => setForm({ ...form, banco: e.target.value })}>
                      <option value="">Seleccionar banco…</option>
                      {BANCOS_VE.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Número de cuenta *</label>
                    <input type="text" value={form.numeroCuenta ?? ''} onChange={(e) => setForm({ ...form, numeroCuenta: e.target.value })} placeholder="0000-0000-00-0000000000" maxLength={30} style={{ fontFamily: 'monospace' }} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Titular *</label>
                      <input type="text" value={form.titular ?? ''} onChange={(e) => setForm({ ...form, titular: e.target.value })} placeholder="Nombre completo del titular" />
                    </div>
                    <div className="form-group">
                      <label>Cédula / RIF *</label>
                      <input type="text" value={form.cedulaRif ?? ''} onChange={(e) => setForm({ ...form, cedulaRif: e.target.value })} placeholder="J-123456789" maxLength={20} style={{ fontFamily: 'monospace' }} />
                    </div>
                  </div>
                </>
              )}

              {/* Pago Móvil */}
              {tipo === 'pago_movil' && (
                <>
                  <div className="form-group">
                    <label>Banco *</label>
                    <select value={form.banco ?? ''} onChange={(e) => setForm({ ...form, banco: e.target.value })}>
                      <option value="">Seleccionar banco…</option>
                      {BANCOS_VE.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Teléfono *</label>
                      <input type="tel" value={form.telefono ?? ''} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="0412-1234567" maxLength={16} style={{ fontFamily: 'monospace' }} />
                    </div>
                    <div className="form-group">
                      <label>Cédula *</label>
                      <input type="text" value={form.cedula ?? ''} onChange={(e) => setForm({ ...form, cedula: e.target.value })} placeholder="V-12345678" maxLength={15} style={{ fontFamily: 'monospace' }} />
                    </div>
                  </div>
                </>
              )}

              {/* Zelle */}
              {tipo === 'zelle' && (
                <>
                  <div className="form-group">
                    <label>Email o Teléfono *</label>
                    <input type="text" value={form.emailOTelefono ?? ''} onChange={(e) => setForm({ ...form, emailOTelefono: e.target.value })} placeholder="ejemplo@correo.com o +1-555-0000" />
                  </div>
                  <div className="form-group">
                    <label>Nombre *</label>
                    <input type="text" value={form.nombre ?? ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre completo" />
                  </div>
                </>
              )}

              <div className="form-check" style={{ marginTop: 8 }}>
                <input type="checkbox" id="activo" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                <label htmlFor="activo">Cuenta activa (visible en la app)</label>
              </div>
            </div>

            <div className="modal-foot">
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !isValid(tipo, form)}
              >
                {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm delete ── */}
      {confirmId && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-head"><h3>Eliminar cuenta</h3></div>
            <div className="modal-body">
              <p style={{ fontSize: 16 }}>¿Seguro que deseas eliminar esta cuenta? Esta acción no se puede deshacer.</p>
            </div>
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
