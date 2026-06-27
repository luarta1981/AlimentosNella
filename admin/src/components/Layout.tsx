import { signOut } from 'firebase/auth';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { useAuth } from '../App';

type NavEntry =
  | { to: string; icon: string; label: string }
  | { divider: string };

const NAV: NavEntry[] = [
  { to: '/',             icon: '🏠', label: 'Dashboard'          },
  { divider: 'Catálogo'                                           },
  { to: '/products',     icon: '🥖', label: 'Productos'          },
  { to: '/inventario',   icon: '📦', label: 'Inventario'         },
  { to: '/offers',       icon: '🏷️', label: 'Ofertas'            },
  { divider: 'Ventas'                                             },
  { to: '/programados',  icon: '📅', label: 'Programar Pedidos'  },
  { to: '/orders',       icon: '📋', label: 'Pedidos'            },
  { to: '/entregas',     icon: '🚚', label: 'Entregas'           },
  { to: '/reportes',     icon: '📊', label: 'Reportes'           },
  { divider: 'Clientes'                                           },
  { to: '/users',        icon: '👥', label: 'Usuarios'           },
  { to: '/clientes',     icon: '👤', label: 'Personas Naturales' },
  { to: '/empresas',     icon: '🏢', label: 'Empresas'           },
  { divider: 'Marketing'                                          },
  { to: '/notificaciones', icon: '🔔', label: 'Notificaciones'   },
  { to: '/cupones',      icon: '🎟️', label: 'Cupones'            },
  { to: '/favoritos',    icon: '❤️', label: 'Productos Favoritos' },
  { divider: 'Configuración'                                        },
  { to: '/bancaria',     icon: '🏦', label: 'Info. Bancaria'       },
];

const PAGE_TITLES: Record<string, string> = {
  '/':               'Dashboard',
  '/products':       'Gestión de Productos',
  '/inventario':     'Inventario',
  '/offers':         'Gestión de Ofertas',
  '/orders':         'Gestión de Pedidos',
  '/entregas':       'Gestión de Entregas',
  '/programados':    'Programar Pedidos',
  '/reportes':       'Reportes de Ventas',
  '/users':          'Gestión de Usuarios',
  '/clientes':       'Clientes Personas Naturales',
  '/empresas':       'Clientes Empresa',
  '/notificaciones': 'Notificaciones Masivas',
  '/cupones':        'Cupones de Descuento',
  '/favoritos':      'Productos Favoritos',
  '/bancaria':       'Información Bancaria',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Admin';

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Alimentos Nella</h1>
          <span>Panel Administrativo</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item, i) => {
            if ('divider' in item) {
              return (
                <div key={`div-${i}`} className="nav-divider">{item.divider}</div>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <p>Lifetime Style LLC<br />(Mobile App Development)</p>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-area">
        <header className="topbar">
          <span className="topbar-title">{pageTitle}</span>
          <div className="topbar-user">
            <span className="topbar-email">{user?.email}</span>
            <button className="btn-logout" onClick={handleLogout}>Salir</button>
          </div>
        </header>
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
}
