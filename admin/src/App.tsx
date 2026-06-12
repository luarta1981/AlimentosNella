import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { auth } from './lib/firebase';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Offers from './pages/Offers';
import ClientesEmpresas from './pages/ClientesEmpresas';
import Inventario from './pages/Inventario';
import ClientesNaturales from './pages/ClientesNaturales';
import Reportes from './pages/Reportes';
import NotificacionesMasivas from './pages/NotificacionesMasivas';
import Cupones from './pages/Cupones';
import Favoritos from './pages/Favoritos';
import GestionEntregas from './pages/GestionEntregas';
import PedidosProgramados from './pages/PedidosProgramados';

// ─── Auth context ─────────────────────────────────────────────────────────────

type AuthCtx = { user: User | null; loading: boolean };
export const AuthContext = createContext<AuthCtx>({ user: null, loading: true });
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

// ─── Protected route ──────────────────────────────────────────────────────────

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Cargando…</div>;
  if (!user)   return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <Protected>
                <Layout>
                  <Routes>
                    <Route index                element={<Dashboard />}           />
                    <Route path="products"      element={<Products />}            />
                    <Route path="inventario"    element={<Inventario />}          />
                    <Route path="offers"        element={<Offers />}              />
                    <Route path="orders"        element={<Orders />}              />
                    <Route path="entregas"      element={<GestionEntregas />}     />
                    <Route path="programados"   element={<PedidosProgramados />}  />
                    <Route path="reportes"      element={<Reportes />}            />
                    <Route path="users"         element={<Users />}               />
                    <Route path="clientes"      element={<ClientesNaturales />}   />
                    <Route path="empresas"      element={<ClientesEmpresas />}    />
                    <Route path="notificaciones" element={<NotificacionesMasivas />} />
                    <Route path="cupones"       element={<Cupones />}             />
                    <Route path="favoritos"     element={<Favoritos />}           />
                    <Route path="*"             element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </Protected>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
