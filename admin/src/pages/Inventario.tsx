import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

type Product = {
  id:        string;
  name:      string;
  category:  string;
  imgUrl:    string;
  available: boolean;
  stock?:    number;
};

const CAT_LABEL: Record<string, string> = {
  panes: 'Panes', baguettes: 'Baguettes', dulces: 'Dulces', pizza: 'Pizza',
};

const LOW  = 10;
const VERY_LOW = 5;

type StockStatus = 'ok' | 'low' | 'very_low' | 'empty' | 'unknown';

function getStatus(stock: number | undefined): StockStatus {
  if (stock === undefined || stock === null) return 'unknown';
  if (stock === 0)        return 'empty';
  if (stock <= VERY_LOW)  return 'very_low';
  if (stock <= LOW)       return 'low';
  return 'ok';
}

const STATUS_CFG: Record<StockStatus, { label: string; bg: string; color: string; border: string }> = {
  ok:       { label: '✓ En stock',    bg: '#DCFCE7', color: '#166534', border: '#166534' },
  low:      { label: '⚠ Stock bajo',  bg: '#FEF3C7', color: '#92400E', border: '#D97706' },
  very_low: { label: '⚠ Crítico',     bg: '#FEE2E2', color: '#991B1B', border: '#DC2626' },
  empty:    { label: '✕ Sin stock',   bg: '#F3F4F6', color: '#374151', border: '#6B7280' },
  unknown:  { label: '— No definido', bg: '#F9FAFB', color: '#9CA3AF', border: '#D1D5DB' },
};

type FilterType = 'todos' | 'alerta' | 'empty';

export default function Inventario() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<FilterType>('todos');
  const [search, setSearch]     = useState('');
  // pendingStock: productId → new value being edited
  const [pending, setPending]   = useState<Record<string, number>>({});
  const [saving, setSaving]     = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'productos'), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
      all.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(all);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleStockChange = (id: string, value: string) => {
    const n = parseInt(value, 10);
    if (!isNaN(n) && n >= 0) {
      setPending((p) => ({ ...p, [id]: n }));
    } else if (value === '') {
      setPending((p) => { const copy = { ...p }; delete copy[id]; return copy; });
    }
  };

  const saveStock = async (id: string) => {
    const val = pending[id];
    if (val === undefined) return;
    setSaving((s) => ({ ...s, [id]: true }));
    try {
      await updateDoc(doc(db, 'productos', id), { stock: val });
      setPending((p) => { const copy = { ...p }; delete copy[id]; return copy; });
    } finally {
      setSaving((s) => ({ ...s, [id]: false }));
    }
  };

  // Stats
  const total    = products.length;
  const okCount  = products.filter((p) => getStatus(p.stock) === 'ok').length;
  const lowCount = products.filter((p) => ['low', 'very_low'].includes(getStatus(p.stock))).length;
  const emptyCount = products.filter((p) => getStatus(p.stock) === 'empty').length;
  const alertItems = products.filter((p) => ['low', 'very_low', 'empty'].includes(getStatus(p.stock)));

  const filtered = products.filter((p) => {
    const st = getStatus(p.stock);
    const matchFilter =
      filter === 'todos' ? true :
      filter === 'alerta' ? ['low', 'very_low'].includes(st) :
      st === 'empty';
    const matchSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (CAT_LABEL[p.category] ?? p.category).toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) return <div className="loading">Cargando inventario…</div>;

  return (
    <>
      <div className="page-header">
        <h2>Inventario ({total} productos)</h2>
      </div>

      {/* ── Alert banner ── */}
      {alertItems.length > 0 && (
        <div style={{
          background: '#FEF3C7', border: '2px solid #D97706', borderRadius: 10,
          padding: '14px 20px', marginBottom: 22,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: '#92400E', fontSize: 16 }}>
              Atención: {alertItems.length} producto{alertItems.length > 1 ? 's' : ''} necesitan reposición
            </div>
            <div style={{ fontSize: 13, color: '#78350F', marginTop: 3 }}>
              {alertItems.filter((p) => getStatus(p.stock) === 'empty').length > 0 && (
                <span style={{ marginRight: 16 }}>
                  🔴 <b>{emptyCount}</b> sin stock
                </span>
              )}
              {alertItems.filter((p) => ['low', 'very_low'].includes(getStatus(p.stock))).length > 0 && (
                <span>
                  🟡 <b>{lowCount}</b> stock bajo (≤{LOW} unidades)
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Summary cards ── */}
      <div className="stat-grid" style={{ marginBottom: 22 }}>
        <StatCard label="Total productos"  value={total}      color="#8B0000" />
        <StatCard label="En stock"         value={okCount}    color="#166534" sub={`>${LOW} unidades`} />
        <StatCard label="Stock bajo"       value={lowCount}   color="#D97706" sub={`1–${LOW} unidades`} />
        <StatCard label="Sin stock"        value={emptyCount} color="#DC2626" sub="0 unidades" />
      </div>

      {/* ── Filters ── */}
      <div className="filter-bar">
        {([
          { key: 'todos',  label: 'Todos' },
          { key: 'alerta', label: `⚠ Stock bajo (${lowCount})` },
          { key: 'empty',  label: `✕ Sin stock (${emptyCount})` },
        ] as { key: FilterType; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            className={`filter-chip${filter === key ? ' active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
        <input
          className="search-input"
          placeholder="Buscar producto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Table ── */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th style={{ textAlign: 'center' }}>Stock actual</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'center' }}>Actualizar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <div className="icon">📦</div>
                    <p>
                      {search
                        ? 'Sin resultados para esta búsqueda'
                        : filter === 'alerta'
                          ? 'No hay productos con stock bajo'
                          : 'No hay productos sin stock'
                      }
                    </p>
                  </div>
                </td>
              </tr>
            ) : filtered.map((p) => {
              const status  = getStatus(p.stock);
              const cfg     = STATUS_CFG[status];
              const current = p.stock;
              const edited  = pending[p.id];
              const hasPending = edited !== undefined && edited !== current;
              const isSaving   = saving[p.id] ?? false;

              return (
                <tr key={p.id}>
                  {/* Producto */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.imgUrl ? (
                        <img src={p.imgUrl} className="thumb" alt={p.name} />
                      ) : (
                        <div className="thumb-placeholder">🥖</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, color: '#8B0000' }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>
                          {p.available ? '● Disponible' : '○ No disponible'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Categoría */}
                  <td style={{ fontSize: 14, color: '#6B7280' }}>
                    {CAT_LABEL[p.category] ?? p.category}
                  </td>

                  {/* Stock actual */}
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      fontSize: 22, fontWeight: 700,
                      color: cfg.color,
                      minWidth: 40, display: 'inline-block',
                    }}>
                      {current !== undefined ? current : '—'}
                    </span>
                    <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 4 }}>uds</span>
                  </td>

                  {/* Estado */}
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '4px 12px', borderRadius: 20,
                      fontSize: 12, fontWeight: 700,
                      background: cfg.bg, color: cfg.color,
                      border: `1.5px solid ${cfg.border}`,
                    }}>
                      {cfg.label}
                    </span>
                  </td>

                  {/* Actualizar */}
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={edited !== undefined ? edited : (current ?? '')}
                        onChange={(e) => handleStockChange(p.id, e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && hasPending && saveStock(p.id)}
                        style={{
                          width: 80, textAlign: 'center', padding: '6px 8px',
                          fontSize: 15, fontWeight: 700,
                          border: `1.5px solid ${hasPending ? '#D97706' : '#D1D5DB'}`,
                          borderRadius: 8,
                          background: hasPending ? '#FFFBEB' : '#fff',
                          outline: 'none',
                        }}
                      />
                      <button
                        className={`btn btn-sm ${hasPending ? 'btn-gold' : 'btn-outline'}`}
                        onClick={() => saveStock(p.id)}
                        disabled={!hasPending || isSaving}
                        style={{ minWidth: 72, opacity: hasPending ? 1 : 0.4 }}
                      >
                        {isSaving ? '…' : 'Guardar'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StatCard({
  label, value, color, sub,
}: { label: string; value: number; color: string; sub?: string }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value" style={{ color }}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}
