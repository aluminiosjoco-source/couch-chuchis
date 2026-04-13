import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Activity, Dumbbell, Eye, EyeOff, User, Mail, Lock, ChevronRight, AlertCircle } from 'lucide-react';

export default function Login({ onSwitch }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-dark)', padding: '2rem' }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(255,90,0,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(0,230,118,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '3rem' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--color-primary), #FF8A00)', borderRadius: '12px', padding: '10px', display: 'flex' }}>
              <Dumbbell size={28} color="#fff" />
            </div>
            <h1 className="text-gradient" style={{ fontSize: '1.75rem', margin: 0 }}>Coach SaaS</h1>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Bienvenido de vuelta. Tu equipo te espera.</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,90,0,0.12)', border: '1px solid rgba(255,90,0,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#FF8A00', fontSize: '0.875rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                id="login-email"
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="tu@email.com"
                required
                style={inputStyle}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                required
                style={{ ...inputStyle, paddingRight: '3rem' }}
              />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button id="login-submit" type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.9rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {loading ? <div style={spinnerStyle} /> : <><Activity size={18} /> Entrar al Dashboard</>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          ¿No tienes cuenta?{' '}
          <button onClick={onSwitch} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600' }}>Crear cuenta gratis</button>
        </div>

        {/* Demo credentials */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,176,255,0.07)', borderRadius: '10px', border: '1px solid rgba(0,176,255,0.15)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          <strong style={{ color: 'var(--color-accent)' }}>Demo:</strong> trainer@fitzone.com / demo1234
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.85rem', paddingBottom: '0.85rem',
  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: '10px',
  color: 'var(--color-text-main)', fontSize: '0.95rem', outline: 'none', fontFamily: 'var(--font-body)',
  transition: 'border-color 0.2s',
};

const spinnerStyle = {
  width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
  borderRadius: '50%', animation: 'spin 0.8s linear infinite',
};
