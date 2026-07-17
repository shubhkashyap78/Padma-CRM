import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/padma-logo.png';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/leads', label: 'Leads', icon: '🧭' },
  { to: '/bookings', label: 'Bookings', icon: '🧳' },
  { to: '/payments', label: 'Payments', icon: '💳' },
  { to: '/quotations', label: 'Quotations', icon: '📄' },
  { to: '/vehicles', label: 'Vehicles', icon: '🚗' },
];

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  const navLinkClass = ({ isActive }) =>
    `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
      isActive ? 'bg-white/10 text-gold font-semibold border-l-2 border-gold pl-[10px]' : 'text-white/75 hover:bg-white/5 hover:text-white'
    }`;

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        <img src={logo} alt="Padma Tourism" className="w-11 h-11 object-contain rounded-full bg-white/95 p-0.5 shadow" />
        <div>
          <h1 className="font-display text-xl font-semibold leading-tight tracking-wide">Padma Tourism</h1>
          <p className="text-[10px] text-gold uppercase tracking-[0.2em]">CRM</p>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 mt-2">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass} onClick={() => setSidebarOpen(false)}>
            <span className="text-base opacity-90">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/staff" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
            <span className="text-base opacity-90">👥</span>
            Staff
          </NavLink>
        )}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gold text-navy text-xs font-bold flex items-center justify-center shrink-0">{initials}</div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-[11px] text-white/50 capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full text-xs bg-white/10 hover:bg-maroon/80 transition-colors rounded-md py-2 font-medium">
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-cream">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-navy text-white flex-col shrink-0 relative">
        <div className="absolute top-0 right-0 h-full w-[3px] bg-gradient-to-b from-gold via-maroon to-gold" />
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile slide-in sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-navy text-white flex flex-col z-50 transition-transform duration-300 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="absolute top-0 right-0 h-full w-[3px] bg-gradient-to-b from-gold via-maroon to-gold" />
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden bg-navy text-white flex items-center justify-between px-4 py-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-white text-xl p-1">☰</button>
          <div className="flex items-center gap-2">
            <img src={logo} alt="Padma Tourism" className="w-7 h-7 object-contain rounded-full bg-white/95 p-0.5" />
            <span className="font-display text-sm font-semibold">Padma Tourism</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gold text-navy text-xs font-bold flex items-center justify-center">{initials}</div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
