import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

type User = {
  uid: string; email: string; displayName: string;
  role: string; phone: string; address: string; createdAt: any;
};

function fmt(ts: any) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Users() {
  const [users, setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'usuarios'), (snap) => {
      const all = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as User));
      all.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds ?? 0;
        return tb - ta;
      });
      setUsers(all);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleRole = async (uid: string, role: string) => {
    await updateDoc(doc(db, 'usuarios', uid), { role });
  };

  const filtered = users.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading">Cargando usuarios…</div>;

  return (
    <>
      <div className="page-header"><h2>Usuarios ({users.length})</h2></div>

      <div className="filter-bar">
        <input className="search-input" placeholder="Buscar por nombre o correo…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Rol</th><th>Registro</th><th>Cambiar rol</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><div className="icon">👥</div><p>Sin usuarios registrados</p></div></td></tr>
            ) : filtered.map((u) => (
              <tr key={u.uid}>
                <td style={{ fontWeight: 700, color: '#8B0000' }}>{u.displayName || '—'}</td>
                <td style={{ fontSize: 14, color: '#6B7280' }}>{u.email}</td>
                <td style={{ fontSize: 14 }}>{u.phone || '—'}</td>
                <td>
                  <span className={u.role === 'admin' ? 'badge badge-process' : 'badge badge-active'}>
                    {u.role === 'admin' ? '⚙️ Admin' : '👤 Cliente'}
                  </span>
                </td>
                <td style={{ fontSize: 13 }}>{fmt(u.createdAt)}</td>
                <td>
                  <select
                    className="status-select"
                    value={u.role || 'cliente'}
                    onChange={(e) => handleRole(u.uid, e.target.value)}
                  >
                    <option value="cliente">Cliente</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
