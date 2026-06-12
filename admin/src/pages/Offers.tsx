import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useEffect, useRef, useState } from 'react';
import { db, storage } from '../lib/firebase';

type Offer = {
  id: string; title: string; description: string;
  badge: string; discount: number;
  originalPrice: number; salePrice: number;
  imgUrl: string; active: boolean; createdAt?: any;
};

const EMPTY: Omit<Offer, 'id'> = {
  title: '', description: '', badge: '', discount: 0,
  originalPrice: 0, salePrice: 0, imgUrl: '', active: true,
};

export default function Offers() {
  const [offers, setOffers]   = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm]       = useState<Omit<Offer, 'id'>>(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'ofertas'), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Offer));
      all.sort((a, b) => {
        const ta = (a.createdAt as any)?.toMillis?.() ?? 0;
        const tb = (b.createdAt as any)?.toMillis?.() ?? 0;
        return tb - ta;
      });
      setOffers(all);
      setLoading(false);
    });
    return unsub;
  }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setPreviewUrl(''); setModal(true); };

  const openEdit = (o: Offer) => {
    setEditing(o);
    setForm({ title: o.title, description: o.description, badge: o.badge ?? '', discount: o.discount, originalPrice: o.originalPrice ?? 0, salePrice: o.salePrice ?? 0, imgUrl: o.imgUrl, active: o.active });
    setPreviewUrl(o.imgUrl);
    setModal(true);
  };

  const closeModal = () => { setModal(false); setUploadPct(null); };

  const handleFile = (file: File) => {
    const storageRef = ref(storage, `ofertas/${Date.now()}_${file.name}`);
    const task = uploadBytesResumable(storageRef, file);
    task.on('state_changed',
      (snap) => setUploadPct(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      () => setUploadPct(null),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setForm((f) => ({ ...f, imgUrl: url }));
        setPreviewUrl(url);
        setUploadPct(null);
      }
    );
  };

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      if (editing) {
        await updateDoc(doc(db, 'ofertas', editing.id), { ...form });
      } else {
        await addDoc(collection(db, 'ofertas'), { ...form, createdAt: new Date() });
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'ofertas', id));
    setConfirmId(null);
  };

  const toggleActive = async (o: Offer) => {
    await updateDoc(doc(db, 'ofertas', o.id), { active: !o.active });
  };

  if (loading) return <div className="loading">Cargando ofertas…</div>;

  return (
    <>
      <div className="page-header">
        <h2>Ofertas ({offers.length})</h2>
        <button className="btn btn-primary" onClick={openAdd}>＋ Nueva oferta</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Imagen</th><th>Título</th><th>Precios</th><th>Badge</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {offers.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><div className="icon">🏷️</div><p>Sin ofertas creadas</p></div></td></tr>
            ) : offers.map((o) => (
              <tr key={o.id}>
                <td>
                  {o.imgUrl
                    ? <img src={o.imgUrl} className="thumb" alt={o.title} />
                    : <div className="thumb-placeholder">🏷️</div>
                  }
                </td>
                <td style={{ fontWeight: 700, color: '#8B0000' }}>
                  {o.title}
                  {o.description && <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 400, marginTop: 2, maxWidth: 160 }}>{o.description}</div>}
                </td>
                <td>
                  {o.salePrice > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {o.originalPrice > 0 && (
                        <span style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'line-through' }}>${o.originalPrice.toFixed(2)}</span>
                      )}
                      <span style={{ fontWeight: 700, color: '#8B0000' }}>${o.salePrice.toFixed(2)}</span>
                    </div>
                  ) : o.originalPrice > 0 ? (
                    <span style={{ fontWeight: 700, color: '#8B0000' }}>${o.originalPrice.toFixed(2)}</span>
                  ) : (
                    <span style={{ color: '#6B7280', fontSize: 13 }}>—</span>
                  )}
                </td>
                <td>
                  {o.badge
                    ? <span className="badge badge-process">{o.badge}</span>
                    : o.discount > 0
                      ? <span className="badge badge-process">-{o.discount}%</span>
                      : <span style={{ color: '#6B7280', fontSize: 13 }}>—</span>
                  }
                </td>
                <td>
                  <span
                    className={o.active ? 'badge badge-active' : 'badge badge-inactive'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleActive(o)}
                    title="Clic para cambiar estado"
                  >
                    {o.active ? '✓ Activa' : '✕ Inactiva'}
                  </span>
                </td>
                <td>
                  <div className="td-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(o)}>✏️ Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(o.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Add/Edit Modal ── */}
      {modal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-head">
              <h3>{editing ? 'Editar Oferta' : 'Nueva Oferta'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Título *</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Pancitos Franceses" />
                </div>
                <div className="form-group">
                  <label>Badge (etiqueta)</label>
                  <input type="text" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="Ej: 20% OFF, 2×1, COMBO" />
                </div>
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe la oferta…" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Precio original (USD)</label>
                  <input type="number" step="0.01" min="0" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                  <label>Precio oferta (USD)</label>
                  <input type="number" step="0.01" min="0" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Descuento (%)</label>
                  <input type="number" min="0" max="100" value={form.discount} onChange={(e) => setForm({ ...form, discount: parseInt(e.target.value) || 0 })} placeholder="Opcional si hay badge" />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                  <div className="form-check">
                    <input type="checkbox" id="active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                    <label htmlFor="active">Oferta activa</label>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Imagen de la oferta</label>
                <div className="img-upload-wrap" onClick={() => fileRef.current?.click()}>
                  <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  {previewUrl
                    ? <img src={previewUrl} className="img-preview" alt="preview" />
                    : <p>📸 Haz clic para subir una imagen</p>
                  }
                  {uploadPct !== null && <p className="upload-progress">Subiendo… {uploadPct}%</p>}
                </div>
                <input type="url" value={form.imgUrl} onChange={(e) => { setForm({ ...form, imgUrl: e.target.value }); setPreviewUrl(e.target.value); }} placeholder="O pega una URL de imagen" style={{ marginTop: 8 }} />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-outline" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || uploadPct !== null}>
                {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear oferta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm delete ── */}
      {confirmId && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-head"><h3>Eliminar oferta</h3></div>
            <div className="modal-body"><p style={{ fontSize: 16 }}>¿Seguro que deseas eliminar esta oferta? Esta acción no se puede deshacer.</p></div>
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
