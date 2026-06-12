import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

type RankEntry = {
  productId:   string;
  productName: string;
  count:       number;
};

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Favoritos() {
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'favoritos'), (snap) => {
      const map = new Map<string, { name: string; count: number }>();
      snap.docs.forEach((d) => {
        const { productId, productName } = d.data() as { productId: string; productName: string };
        const cur = map.get(productId);
        if (cur) {
          cur.count++;
        } else {
          map.set(productId, { name: productName, count: 1 });
        }
      });
      const sorted = Array.from(map.entries())
        .map(([productId, { name, count }]) => ({ productId, productName: name, count }))
        .sort((a, b) => b.count - a.count);
      setRanking(sorted);
      setLoading(false);
    });
    return unsub;
  }, []);

  const total = ranking.reduce((acc, r) => acc + r.count, 0);

  return (
    <div>
      <div className="page-header">
        <h2>Productos Favoritos</h2>
        <span>
          {loading ? '…' : `${total} me gusta · ${ranking.length} productos`}
        </span>
      </div>

      {loading ? (
        <p style={{ color: 'var(--gray)', fontStyle: 'italic' }}>Cargando ranking…</p>
      ) : ranking.length === 0 ? (
        <div className="empty-state">
          <div className="icon">❤️</div>
          <p>Aún no hay productos marcados como favoritos.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Posición</th>
                <th>Producto</th>
                <th style={{ width: 140, textAlign: 'center' }}>❤️ Me gusta</th>
                <th style={{ width: 160, textAlign: 'center' }}>% del total</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((item, i) => {
                const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={item.productId}>
                    <td style={{ textAlign: 'center', fontSize: 22 }}>
                      {MEDALS[i] ?? <span style={{ color: 'var(--gray)' }}>#{i + 1}</span>}
                    </td>
                    <td>
                      <strong>{item.productName}</strong>
                      <br />
                      <span style={{ fontSize: 11, color: 'var(--gray)' }}>ID: {item.productId}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          background: '#FEE2E2',
                          color: '#DC2626',
                          border: '1.5px solid #DC2626',
                          borderRadius: 20,
                          padding: '3px 12px',
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {item.count}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            maxWidth: 80,
                            height: 6,
                            background: '#F3F4F6',
                            borderRadius: 3,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: '#DC2626',
                              borderRadius: 3,
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--gray)', minWidth: 36 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
