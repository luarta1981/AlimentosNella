import { addDoc, collection, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

type NotifType = 'general' | 'cupon';

type Cupon = {
  id: string; codigo: string;
  tipo: 'porcentaje' | 'monto';
  descuento: number; minimoCompra: number;
  usosMaximos: number; usosActuales: number;
  activo: boolean; expiracion: string;
};

type NotifHistory = {
  id: string; titulo: string; mensaje: string;
  enviados: number; fallidos: number;
  cuponCodigo?: string; createdAt: any;
};

function fmt(ts: any) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function isExpired(exp: string) {
  if (!exp) return false;
  const d = new Date(exp); d.setHours(23, 59, 59, 999);
  return d < new Date();
}

function statusOf(c: Cupon) {
  if (isExpired(c.expiracion)) return 'expirado';
  if (c.usosMaximos > 0 && c.usosActuales >= c.usosMaximos) return 'agotado';
  if (!c.activo) return 'inactivo';
  return 'activo';
}

function descLabel(c: Cupon) {
  return c.tipo === 'porcentaje' ? `${c.descuento}% de descuento` : `$${c.descuento.toFixed(2)} de descuento`;
}

async function sendExpoPushBatch(messages: object[]): Promise<{ ok: number; fail: number }> {
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Accept-encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
  if (!res.ok) return { ok: 0, fail: messages.length };
  const data = await res.json();
  const results: any[] = Array.isArray(data?.data) ? data.data : [data];
  const ok = results.filter((r) => r?.status === 'ok').length;
  return { ok, fail: results.length - ok };
}

export default function NotificacionesMasivas() {
  const [notifType, setNotifType] = useState<NotifType>('general');
  const [titulo,    setTitulo]    = useState('');
  const [mensaje,   setMensaje]   = useState('');
  const [cupones,   setCupones]   = useState<Cupon[]>([]);
  const [selectedCuponId, setSelectedCuponId] = useState('');
  const [sending,  setSending]  = useState(false);
  const [progress, setProgress] = useState<{ sent: number; total: number } | null>(null);
  const [result,   setResult]   = useState<{ ok: number; fail: number } | null>(null);
  const [history,  setHistory]  = useState<NotifHistory[]>([]);

  // Load active cupones
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cupones'), (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Cupon))
        .filter((c) => statusOf(c) === 'activo')
        .sort((a, b) => a.codigo.localeCompare(b.codigo));
      setCupones(all);
    });
    return unsub;
  }, []);

  // Load history
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'notificaciones_historial'), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotifHistory));
      all.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds ?? 0;
        return tb - ta;
      });
      setHistory(all);
    });
    return unsub;
  }, []);

  const selectedCupon = cupones.find((c) => c.id === selectedCuponId) ?? null;

  // Auto-fill title/message when a coupon is selected
  const handleSelectCupon = (id: string) => {
    setSelectedCuponId(id);
    const c = cupones.find((x) => x.id === id);
    if (!c) return;
    setTitulo(`🎟️ ¡Cupón exclusivo para ti!`);
    setMensaje(`Usa el código ${c.codigo} y obtén ${descLabel(c)} en tu próximo pedido.${c.minimoCompra > 0 ? ` Compra mínima $${c.minimoCompra.toFixed(2)}.` : ''}`);
  };

  const handleTypeChange = (t: NotifType) => {
    setNotifType(t);
    setTitulo('');
    setMensaje('');
    setSelectedCuponId('');
    setResult(null);
  };

  const canSend = titulo.trim() && mensaje.trim() && (notifType === 'general' || !!selectedCuponId);

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setResult(null);

    try {
      const snap = await getDocs(collection(db, 'usuarios'));
      const tokens = snap.docs
        .map((d) => d.data().pushToken as string | undefined)
        .filter((t): t is string => !!t && t.startsWith('ExponentPushToken'));

      if (tokens.length === 0) {
        setResult({ ok: 0, fail: 0 });
        setSending(false);
        return;
      }

      setProgress({ sent: 0, total: tokens.length });

      const notifData: Record<string, string> = { type: notifType };
      if (notifType === 'cupon' && selectedCupon) {
        notifData.cuponCodigo   = selectedCupon.codigo;
        notifData.cuponDescuento = String(selectedCupon.descuento);
        notifData.cuponTipo     = selectedCupon.tipo;
      }

      const BATCH = 100;
      let totalOk = 0, totalFail = 0;

      for (let i = 0; i < tokens.length; i += BATCH) {
        const batch = tokens.slice(i, i + BATCH).map((to) => ({
          to,
          title:     titulo.trim(),
          body:      mensaje.trim(),
          sound:     'default',
          channelId: 'pedidos',
          data:      notifData,
        }));
        const { ok, fail } = await sendExpoPushBatch(batch);
        totalOk   += ok;
        totalFail += fail;
        setProgress({ sent: Math.min(i + BATCH, tokens.length), total: tokens.length });
      }

      await addDoc(collection(db, 'notificaciones_historial'), {
        titulo:      titulo.trim(),
        mensaje:     mensaje.trim(),
        ...(notifType === 'cupon' && selectedCupon ? { cuponCodigo: selectedCupon.codigo } : {}),
        enviados:    totalOk,
        fallidos:    totalFail,
        createdAt:   serverTimestamp(),
      });

      setResult({ ok: totalOk, fail: totalFail });
      setTitulo('');
      setMensaje('');
      setSelectedCuponId('');
    } catch {
      setResult({ ok: 0, fail: -1 });
    } finally {
      setSending(false);
      setProgress(null);
    }
  };

  const pct = progress ? Math.round((progress.sent / progress.total) * 100) : 0;

  return (
    <>
      <div className="page-header"><h2>Notificaciones Masivas</h2></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 32 }}>

        {/* Form */}
        <div className="table-wrap" style={{ padding: 24 }}>
          <h3 style={{ fontStyle: 'italic', color: '#8B0000', marginBottom: 20, fontSize: 18 }}>
            🔔 Enviar notificación
          </h3>

          {/* Type toggle */}
          <div className="form-group">
            <label>Tipo de notificación</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['general', 'cupon'] as NotifType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`filter-chip${notifType === t ? ' active' : ''}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {t === 'general' ? '📣 General' : '🎟️ Con Cupón'}
                </button>
              ))}
            </div>
          </div>

          {/* Coupon selector */}
          {notifType === 'cupon' && (
            <div className="form-group">
              <label>Seleccionar cupón *</label>
              {cupones.length === 0 ? (
                <div style={{
                  padding: '12px 16px', borderRadius: 10,
                  background: '#FEF3C7', border: '1.5px solid #D97706',
                  fontSize: 14, color: '#92400E',
                }}>
                  ⚠️ No hay cupones activos disponibles. Crea uno en la sección <strong>Cupones</strong>.
                </div>
              ) : (
                <select value={selectedCuponId} onChange={(e) => handleSelectCupon(e.target.value)}>
                  <option value="">— Seleccionar cupón —</option>
                  {cupones.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} — {descLabel(c)}{c.minimoCompra > 0 ? ` (mín. $${c.minimoCompra.toFixed(2)})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Coupon summary badge */}
          {notifType === 'cupon' && selectedCupon && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 12, marginBottom: 16,
              background: 'linear-gradient(135deg, #8B0000, #6B0000)',
              border: '1.5px solid #C8901A',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: '#C8901A', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, flexShrink: 0,
              }}>🎟️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#FFF', letterSpacing: 1.5 }}>
                  {selectedCupon.codigo}
                </div>
                <div style={{ fontSize: 13, color: '#FFD9A0' }}>
                  {descLabel(selectedCupon)}
                  {selectedCupon.minimoCompra > 0 ? ` · mín. $${selectedCupon.minimoCompra.toFixed(2)}` : ''}
                  {selectedCupon.usosMaximos > 0 ? ` · ${selectedCupon.usosMaximos - selectedCupon.usosActuales} usos restantes` : ''}
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Título *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: ¡Nueva oferta disponible!"
              maxLength={80}
            />
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3, textAlign: 'right' }}>
              {titulo.length}/80
            </div>
          </div>

          <div className="form-group">
            <label>Mensaje *</label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder={notifType === 'cupon'
                ? 'El mensaje se auto-completa al seleccionar un cupón. Puedes editarlo.'
                : 'Escribe aquí el mensaje que recibirán todos los usuarios…'}
              maxLength={200}
              style={{ minHeight: 90 }}
            />
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3, textAlign: 'right' }}>
              {mensaje.length}/200
            </div>
          </div>

          {/* Progress bar */}
          {sending && progress && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5, color: '#8B0000' }}>
                <span>Enviando notificaciones…</span>
                <span>{progress.sent}/{progress.total}</span>
              </div>
              <div style={{ background: '#F0E4C8', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, background: '#8B0000', height: '100%', borderRadius: 6, transition: 'width .3s' }} />
              </div>
            </div>
          )}

          {/* Result feedback */}
          {result && (
            <div style={{
              padding: '12px 16px', borderRadius: 10, marginBottom: 16,
              background: result.fail === -1 ? '#FEE2E2' : '#DCFCE7',
              border: `1.5px solid ${result.fail === -1 ? '#FCA5A5' : '#86EFAC'}`,
              fontSize: 14, fontWeight: 700,
              color: result.fail === -1 ? '#B91C1C' : '#166534',
            }}>
              {result.fail === -1
                ? '❌ Error al enviar. Verifica la conexión.'
                : result.ok === 0 && result.fail === 0
                  ? '⚠️ No hay usuarios con notificaciones habilitadas.'
                  : `✅ Enviado a ${result.ok} usuario${result.ok !== 1 ? 's' : ''}${result.fail > 0 ? ` · ${result.fail} fallido${result.fail !== 1 ? 's' : ''}` : ''}`
              }
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 17 }}
            onClick={handleSend}
            disabled={sending || !canSend}
          >
            {sending ? '⏳ Enviando…' : notifType === 'cupon' ? '🎟️ Enviar cupón a todos' : '🔔 Enviar a todos los usuarios'}
          </button>
        </div>

        {/* Preview */}
        <div className="table-wrap" style={{ padding: 24 }}>
          <h3 style={{ fontStyle: 'italic', color: '#8B0000', marginBottom: 20, fontSize: 18 }}>
            👁 Vista previa
          </h3>
          <div style={{ background: '#1F2937', borderRadius: 16, padding: '14px 16px', maxWidth: 320, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#8B0000', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 16,
              }}>🥖</div>
              <div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>Alimentos Nella</div>
                <div style={{ fontSize: 10, color: '#6B7280' }}>ahora</div>
              </div>
            </div>
            <div style={{ color: '#F9FAFB', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              {titulo || 'Título de la notificación'}
            </div>
            <div style={{ color: '#D1D5DB', fontSize: 13, lineHeight: 1.4, marginBottom: notifType === 'cupon' && selectedCupon ? 12 : 0 }}>
              {mensaje || 'El mensaje aparecerá aquí tal como lo verán los usuarios en su dispositivo.'}
            </div>

            {/* Coupon pill in preview */}
            {notifType === 'cupon' && selectedCupon && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#C8901A22', border: '1px solid #C8901A',
                borderRadius: 8, padding: '8px 12px', marginTop: 8,
              }}>
                <span style={{ fontSize: 18 }}>🎟️</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#FFD9A0', fontSize: 13, letterSpacing: 1 }}>
                    {selectedCupon.codigo}
                  </div>
                  <div style={{ color: '#9CA3AF', fontSize: 11 }}>{descLabel(selectedCupon)}</div>
                </div>
              </div>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 14, textAlign: 'center', fontStyle: 'italic' }}>
            Así verán la notificación en iOS y Android
          </p>

          {notifType === 'cupon' && !selectedCuponId && cupones.length > 0 && (
            <p style={{ fontSize: 12, color: '#C8901A', marginTop: 8, textAlign: 'center', fontStyle: 'italic' }}>
              ← Selecciona un cupón para ver la vista previa completa
            </p>
          )}
        </div>
      </div>

      {/* History */}
      <div className="page-header"><h2>Historial de notificaciones</h2></div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Título</th><th>Mensaje</th><th>Cupón</th><th>Enviados</th><th>Fallidos</th><th>Fecha</th></tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr><td colSpan={6}>
                <div className="empty-state"><div className="icon">🔔</div><p>Sin notificaciones enviadas aún</p></div>
              </td></tr>
            ) : history.map((n) => (
              <tr key={n.id}>
                <td style={{ fontWeight: 700, color: '#8B0000' }}>{n.titulo}</td>
                <td style={{ fontSize: 13, color: '#6B7280', maxWidth: 240 }}>{n.mensaje}</td>
                <td>
                  {n.cuponCodigo
                    ? <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                        background: '#FEF3C7', color: '#B45309', border: '1.5px solid #B45309',
                        fontWeight: 700, fontSize: 12, letterSpacing: 1,
                      }}>🎟️ {n.cuponCodigo}</span>
                    : <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>}
                </td>
                <td><span className="badge badge-delivered">✓ {n.enviados}</span></td>
                <td>
                  {n.fallidos > 0
                    ? <span className="badge badge-cancelled">✕ {n.fallidos}</span>
                    : <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>}
                </td>
                <td style={{ fontSize: 13, color: '#6B7280' }}>{fmt(n.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
