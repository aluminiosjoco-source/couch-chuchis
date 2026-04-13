import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Users, CheckCircle, Dumbbell, ShieldCheck, LogOut, Wand2, UserCog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const allNavItems = [
    { name: 'Dashboard Trainer', path: '/trainer', icon: <Users size={20} />, roles: ['trainer', 'gym_owner', 'super_admin'] },
    { name: 'Entrenadores', path: '/trainer/entrenadores', icon: <UserCog size={20} />, roles: ['gym_owner', 'super_admin'] },
    { name: 'Editor de Rutinas', path: '/trainer/rutinas', icon: <Wand2 size={20} />, roles: ['trainer', 'gym_owner', 'super_admin'] },
    { name: 'Dashboard Cliente', path: '/client', icon: <Activity size={20} />, roles: ['client', 'trainer', 'gym_owner', 'super_admin'] },
    { name: 'Entrenamiento Live', path: '/client/workout', icon: <Dumbbell size={20} />, roles: ['client', 'trainer', 'gym_owner', 'super_admin'] },
    { name: 'Check-In Semanal', path: '/check-in', icon: <CheckCircle size={20} />, roles: ['client', 'trainer', 'gym_owner', 'super_admin'] },
    { name: 'Super Admin', path: '/admin', icon: <ShieldCheck size={20} />, roles: ['super_admin'] },
  ];

  const navItems = allNavItems.filter(item =>
    !user || item.roles.includes(user.rol)
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', maxWidth: '100%' }}>
      {/* Sidebar */}
      <aside className="glass-panel animate-fade-in" style={{ width: '260px', margin: '20px 0 20px 20px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Logo */}
        <h2 className="text-gradient" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem' }}>
          <Activity size={24} color="var(--color-primary)" /> Coach SaaS
        </h2>
        {user && (
          <div style={{ marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{user.nombre}</p>
            <span style={{ fontSize: '0.65rem', padding: '0.2em 0.6em', borderRadius: '20px', background: 'rgba(255,90,0,0.15)', color: 'var(--color-primary)', fontWeight: '700', textTransform: 'capitalize' }}>{user.rol?.replace('_', ' ')}</span>
          </div>
        )}

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path) && item.path.length > 1);
            return (
              <Link key={item.name} to={item.path}
                style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', borderRadius: '12px', textDecoration: 'none', color: isActive ? '#fff' : 'var(--color-text-muted)', background: isActive ? 'linear-gradient(90deg, rgba(255,90,0,0.15) 0%, transparent 100%)' : 'transparent', borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent', transition: 'all 0.2s ease', fontWeight: isActive ? '600' : '400', fontSize: '0.88rem' }}>
                {item.icon} {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', marginTop: 'auto' }}>
          <button onClick={handleLogout} id="sidebar-logout"
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', borderRadius: '12px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.88rem', transition: 'color 0.2s' }}>
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '20px 36px', overflowY: 'auto', position: 'relative' }}>
        <Outlet />
      </main>
    </div>
  );
}
