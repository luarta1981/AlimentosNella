import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

type Empresa = {
  id:            string;
  razon:         string;
  rif:           string;
  representante: string;
  telefono:      string;
  correo:        string;
  direccion:     string;
  ciudad:        string;
  createdAt:     any;
};

function fmt(ts: any) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ClientesEmpresas() {
  const [empresas, setEmpresas]   = useState<Empresa[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search,    setSearch]    = useState('');
  const [searchRif, setSearchRif] = useState('');
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'empresas'), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Empresa));
      all.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds ?? 0;
        return tb - ta;
      });
      setEmpresas(all);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'empresas', id));
    setConfirmId(null);
    if (expanded === id) setExpanded(null);
  };

  const filtered = empresas.filter((e) => {
    const q  = search.toLowerCase();
    const qr = searchRif.replace(/[-\s]/g, '').toUpperCase();
    const matchGeneral = !q || (
      e.razon?.toLowerCase().includes(q) ||
      e.correo?.toLowerCase().includes(q) ||
      e.representante?.toLowerCase().includes(q)
    );
    const matchRif = !qr || e.rif?.replace(/[-\s]/g, '').toUpperCase().includes(qr);
    return matchGeneral && matchRif;
  });

  if (loading) return <div className="loading">Cargando clientes empresa…</div>;

  return (
    <>
      <div className="page-header">
        <h2>Clientes Empresa ({empresas.length})</h2>
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Buscar por Razón Social, correo o representante…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="search-input"
          placeholder="Buscar por RIF…"
          value={searchRif}
          onChange={(e) => setSearchRif(e.target.value)}
          style={{ maxWidth: 200 }}
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Razón Social</th>
              <th>RIF</th>
              <th>Representante Legal</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="icon">🏢</div>
                    <p>{search ? 'Sin resultados para esta búsqueda' : 'No hay clientes empresa registrados'}</p>
                  </div>
                </td>
              </tr>
            ) : filtered.map((e) => (
              <>
                <tr
                  key={e.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>🏢</span>
                      <div>
                        <div style={{ fontWeight: 700, color: '#8B0000' }}>{e.razon || '—'}</div>
                        {e.ciudad && <div style={{ fontSize: 12, color: '#6B7280' }}>{e.ciudad}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontFamily: 'monospace', fontWeight: 700,
                      background: 'rgba(200,144,26,0.12)', color: '#8B4513',
                      padding: '3px 8px', borderRadius: 6, fontSize: 13,
                    }}>
                      {e.rif || '—'}
                    </span>
                  </td>
                  <td style={{ fontSize: 14 }}>{e.representante || '—'}</td>
                  <td style={{ fontSize: 14 }}>
                    {e.telefono
                      ? <a href={`tel:${e.telefono}`} style={{ color: '#1D4ED8', textDecoration: 'none' }}>{e.telefono}</a>
                      : '—'
                    }
                  </td>
                  <td style={{ fontSize: 14 }}>
                    {e.correo
                      ? <a href={`mailto:${e.correo}`} style={{ color: '#1D4ED8', textDecoration: 'none' }}>{e.correo}</a>
                      : '—'
                    }
                  </td>
                  <td style={{ fontSize: 13, color: '#6B7280' }}>{fmt(e.createdAt)}</td>
                  <td onClick={(ev) => ev.stopPropagation()}>
                    <div className="td-actions">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setConfirmId(e.id)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                      <span style={{ fontSize: 12, color: '#C8901A', marginLeft: 4 }}>
                        {expanded === e.id ? '▲' : '▼'}
                      </span>
                    </div>
                  </td>
                </tr>

                {/* Fila expandida con dirección fiscal */}
                {expanded === e.id && (
                  <tr key={`${e.id}-detail`} className="order-items-row">
                    <td colSpan={7}>
                      <div className="order-items-inner">
                        <h4 style={{ marginBottom: 12, color: '#8B0000' }}>Datos completos de la empresa</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                          <DetailField icon="🏢" label="Razón Social"        value={e.razon} />
                          <DetailField icon="📋" label="RIF"                  value={e.rif} mono />
                          <DetailField icon="👤" label="Representante Legal"  value={e.representante} />
                          <DetailField icon="📞" label="Teléfono"             value={e.telefono} href={`tel:${e.telefono}`} />
                          <DetailField icon="✉️" label="Correo electrónico"   value={e.correo} href={`mailto:${e.correo}`} />
                          <DetailField icon="📍" label="Dirección Fiscal"     value={`${e.direccion}${e.ciudad ? `, ${e.ciudad}` : ''}`} />
                        </div>
                        <div style={{ marginTop: 10, fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                          Registrado el {fmt(e.createdAt)}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm delete */}
      {confirmId && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-head"><h3>Eliminar empresa</h3></div>
            <div className="modal-body">
              <p style={{ fontSize: 16 }}>
                ¿Seguro que deseas eliminar este cliente empresa? Esta acción no se puede deshacer.
              </p>
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

function DetailField({
  icon, label, value, href, mono,
}: {
  icon: string; label: string; value: string; href?: string; mono?: boolean;
}) {
  return (
    <div style={{
      background: 'rgba(251,243,226,0.7)',
      border: '1px solid rgba(200,144,26,0.25)',
      borderRadius: 8,
      padding: '10px 14px',
    }}>
      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
        {icon} {label}
      </div>
      {href ? (
        <a href={href} style={{ fontWeight: 700, color: '#1D4ED8', fontSize: 15, textDecoration: 'none', fontFamily: mono ? 'monospace' : 'inherit' }}>
          {value || '—'}
        </a>
      ) : (
        <div style={{ fontWeight: 700, color: '#1F2937', fontSize: 15, fontFamily: mono ? 'monospace' : 'inherit' }}>
          {value || '—'}
        </div>
      )}
    </div>
  );
}
