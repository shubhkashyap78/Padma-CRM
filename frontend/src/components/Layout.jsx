import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/leads', label: 'Leads', icon: '🧭' },
  { to: '/quotations', label: 'Quotations', icon: '📄' },
  { to: '/bookings', label: 'Bookings', icon: '🧳' },
  { to: '/payments', label: 'Payments', icon: '💳' },
];

const linkCls = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
    isActive ? 'bg-gold/20 text-gold font-semibold' : 'hover:bg-white/10'
  }`;

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-navy text-white flex items-center justify-between px-4 py-3">
        <span className="font-bold">Padma Tourism CRM</span>
        <button onClick={() => setOpen(!open)} className="text-xl" aria-label="Menu">
          {open ? '✕' : '☰'}
        </button>
      </div>

      <aside
        className={`fixed md:static z-30 inset-y-0 left-0 w-64 bg-navy text-white flex flex-col shrink-0 transition-transform pt-14 md:pt-0 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-white/10 hidden md:block">
          <h1 className="text-lg font-bold tracking-wide">Padma Tourism</h1>
          <p className="text-xs text-gold">CRM</p>
        </div>
        <nav className="flex-1 p-3 space-y-1" onClick={() => setOpen(false)}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkCls}>
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/staff" className={linkCls}>
              <span>👥</span>
              Staff
            </NavLink>
          )}
          <NavLink to="/account" className={linkCls}>
            <span>🔑</span>
            My Account
          </NavLink>
        </nav>
        <div className="p-4 border-t border-white/10 text-sm">
          <p className="font-medium">{user?.name}</p>
          <p className="text-xs text-white/60 capitalize mb-2">{user?.role}</p>
          <button onClick={handleLogout} className="w-full text-xs bg-white/10 hover:bg-white/20 rounded-md py-1.5">
            Logout
          </button>
        </div>
      </aside>

      {open && <div className="md:hidden fixed inset-0 bg-black/40 z-20" onClick={() => setOpen(false)} />}

      <main className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-auto min-w-0">{children}</main>
    </div>
  );
};

export default Layout;
