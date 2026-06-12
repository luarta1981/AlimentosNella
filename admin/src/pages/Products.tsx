import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useEffect, useRef, useState } from 'react';
import { db, storage } from '../lib/firebase';

type Product = {
  id: string; name: string; price: number; weight: string;
  category: string; subcat: string; presentacion: string;
  imgUrl: string; available: boolean;
};

const EMPTY: Omit<Product, 'id'> = {
  name: '', price: 0, weight: '', category: 'panes', subcat: '',
  presentacion: '', imgUrl: '', available: true,
};

const CATS = ['panes', 'baguettes', 'dulces', 'pizza'];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState<Product | null>(null);
  const [form, setForm]         = useState<Omit<Product, 'id'>>(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [dragging, setDragging]   = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [search, setSearch]       = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'productos'), (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setPreviewUrl('');
    setModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, price: p.price, weight: p.weight, category: p.category, subcat: p.subcat, presentacion: p.presentacion, imgUrl: p.imgUrl, available: p.available });
    setPreviewUrl(p.imgUrl);
    setModal(true);
  };

  const closeModal = () => { setModal(false); setUploadPct(null); setUploadError(''); setDragging(false); };

  const handleFile = (file: File) => {
    setUploadError('');
    if (!file.type.startsWith('image/')) { setUploadError('Solo se permiten archivos de imagen (JPG, PNG, WEBP).'); return; }
    if (file.size > 5 * 1024 * 1024)    { setUploadError('La imagen no puede superar 5 MB.'); return; }

    const storageRef = ref(storage, `productos/${Date.now()}_${file.name}`);
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      'state_changed',
      (snap) => setUploadPct(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => { setUploadError(`Error al subir: ${err.message}`); setUploadPct(null); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setForm((f) => ({ ...f, imgUrl: url }));
        setPreviewUrl(url);
        setUploadPct(null);
      }
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const removeImage = () => {
    setForm((f) => ({ ...f, imgUrl: '' }));
    setPreviewUrl('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      if (editing) {
        await updateDoc(doc(db, 'productos', editing.id), { ...form });
      } else {
        await addDoc(collection(db, 'productos'), { ...form });
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const p = products.find((x) => x.id === id);
    await deleteDoc(doc(db, 'productos', id));
    if (p?.imgUrl?.startsWith('https://firebasestorage')) {
      try { await deleteObject(ref(storage, p.imgUrl)); } catch { /* already deleted */ }
    }
    setConfirmId(null);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading">Cargando productos…</div>;

  return (
    <>
      <div className="page-header">
        <h2>Productos ({products.length})</h2>
        <button className="btn btn-primary" onClick={openAdd}>＋ Agregar producto</button>
      </div>

      <div className="filter-bar">
        <input className="search-input" placeholder="Buscar producto…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Imagen</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Peso</th><th>Disponible</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><div className="icon">🥖</div><p>Sin productos</p></div></td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.imgUrl
                    ? <img src={p.imgUrl} className="thumb" alt={p.name} />
                    : <div className="thumb-placeholder">🥖</div>
                  }
                </td>
                <td style={{ fontWeight: 700, color: '#8B0000' }}>{p.name}</td>
                <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                <td style={{ fontWeight: 700 }}>${Number(p.price).toFixed(2)}</td>
                <td>{p.weight}</td>
                <td><span className={p.available ? 'badge badge-active' : 'badge badge-inactive'}>{p.available ? 'Sí' : 'No'}</span></td>
                <td>
                  <div className="td-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>✏️ Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(p.id)}>🗑️</button>
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
              <h3>{editing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Pancitos Franceses" />
                </div>
                <div className="form-group">
                  <label>Precio (USD) *</label>
                  <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Categoría</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATS.map((c) => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subcategoría</label>
                  <input type="text" value={form.subcat} onChange={(e) => setForm({ ...form, subcat: e.target.value })} placeholder="Ej: baguette_plain" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Peso / Cantidad</label>
                  <input type="text" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="Ej: 250 g" />
                </div>
                <div className="form-group">
                  <label>Presentación</label>
                  <input type="text" value={form.presentacion} onChange={(e) => setForm({ ...form, presentacion: e.target.value })} placeholder="Ej: 5 unidades" />
                </div>
              </div>
              <div className="form-group">
                <div className="form-check">
                  <input type="checkbox" id="available" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
                  <label htmlFor="available">Disponible en catálogo</label>
                </div>
              </div>
              <div className="form-group">
                <label>Imagen del producto</label>

                {/* Drop zone */}
                <div
                  className="img-upload-wrap"
                  style={{ borderColor: dragging ? '#8B0000' : undefined, background: dragging ? '#f0e4c8' : undefined }}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} className="img-preview" alt="preview" />
                      <p style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>Haz clic para cambiar la imagen</p>
                    </>
                  ) : (
                    <div style={{ padding: '10px 0' }}>
                      <p style={{ fontSize: 28, marginBottom: 6 }}>📸</p>
                      <p style={{ fontWeight: 700, color: '#8B0000' }}>Haz clic o arrastra una imagen aquí</p>
                      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>JPG, PNG o WEBP · máx. 5 MB</p>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {uploadPct !== null && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#C8901A', marginBottom: 4 }}>
                      <span>Subiendo imagen…</span>
                      <span>{uploadPct}%</span>
                    </div>
                    <div style={{ height: 6, background: '#F0E4C8', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${uploadPct}%`, background: '#C8901A', borderRadius: 3, transition: 'width .2s' }} />
                    </div>
                  </div>
                )}

                {/* Error */}
                {uploadError && (
                  <p style={{ marginTop: 6, fontSize: 13, color: '#DC2626', background: '#FEE2E2', padding: '6px 10px', borderRadius: 6 }}>
                    ⚠️ {uploadError}
                  </p>
                )}

                {/* Remove button */}
                {previewUrl && uploadPct === null && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(); }}
                    style={{ marginTop: 6, background: 'none', border: 'none', color: '#DC2626', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}
                  >
                    ✕ Quitar imagen
                  </button>
                )}

                {/* URL manual */}
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>o pega una URL</span>
                  <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                </div>
                <input
                  type="url"
                  value={form.imgUrl}
                  onChange={(e) => { setForm({ ...form, imgUrl: e.target.value }); setPreviewUrl(e.target.value); }}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  style={{ marginTop: 8 }}
                />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-outline" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || uploadPct !== null} title={uploadPct !== null ? 'Espera a que termine la carga' : ''}>
                {saving ? 'Guardando…' : uploadPct !== null ? `Subiendo ${uploadPct}%…` : editing ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm delete ── */}
      {confirmId && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-head"><h3>Eliminar producto</h3></div>
            <div className="modal-body"><p style={{ fontSize: 16 }}>¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer.</p></div>
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
