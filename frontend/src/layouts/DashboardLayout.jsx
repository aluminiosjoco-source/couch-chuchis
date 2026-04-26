import React from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Dumbbell, CheckCircle2,
  ShieldCheck, LogOut, ChevronRight, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const role = user?.rol;

  // Navigation items per role
  const navMap = {
    client: [
      { path: '/client', icon: LayoutDashboard, label: 'Inicio' },
      { path: '/client/workout', icon: Dumbbell, label: 'Rutina' },
      { path: '/client/checkin', icon: CheckCircle2, label: 'Check-In' },
    ],
    trainer: [
      { path: '/trainer', icon: LayoutDashboard, label: 'Clientes' },
      { path: '/trainer/rutinas', icon: Dumbbell, label: 'Rutinas' },
    ],
    gym_owner: [
      { path: '/trainer', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/trainer/entrenadores', icon: Users, label: 'Equipo' },
      { path: '/trainer/rutinas', icon: Dumbbell, label: 'Rutinas' },
    ],
    super_admin: [
      { path: '/admin', icon: ShieldCheck, label: 'Admin' },
      { path: '/trainer', icon: LayoutDashboard, label: 'Trainers' },
    ],
  };

  const navItems = navMap[role] || navMap.trainer;

  const isActive = (path) => {
    if (path === location.pathname) return true;
    if (path !== '/' && location.pathname.startsWith(path) && path.length > 1) return true;
    return false;
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
      {/* ── Top App Bar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: '60px',
        background: 'rgba(13,15,18,0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 var(--s4)',
        gap: 'var(--s3)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>
            Coach<span style={{ color: 'var(--brand)' }}>SaaS</span>
          </span>
        </div>

        {/* User pill */}
        {user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--s2)',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-full)', padding: '4px 12px 4px 4px',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--brand), var(--amber))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem',
              color: '#fff', flexShrink: 0,
            }}>
              {user.nombre?.charAt(0).toUpperCase()}
            </div>
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.nombre?.split(' ')[0]}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user.rol?.replace('_', ' ')}
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            background: 'none', border: 'none',
            color: 'var(--text-muted)', padding: '6px',
            borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center',
            transition: 'color .2s',
          }}
          title="Cerrar sesión"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* ── Main Content ── */}
      <main style={{ paddingBottom: 'calc(var(--nav-h) + var(--safe-bottom) + 16px)' }}>
        <Outlet />
      </main>

      {/* ── Bottom Navigation ── */}
      <nav className="bottom-nav">
        <div className="bottom-nav__inner">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link key={path} to={path} className={`bottom-nav__item ${isActive(path) ? 'active' : ''}`}>
              <span className="bottom-nav__icon">
                <Icon size={22} strokeWidth={isActive(path) ? 2.2 : 1.8} />
              </span>
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}