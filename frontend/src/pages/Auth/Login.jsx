import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, Activity, AlertCircle } from 'lucide-react';

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
    try { await login(form.email, form.password); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-base)', padding: 'var(--s4)',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '-30%', left: '-20%', width: '70vw', height: '70vw',
        background: 'radial-gradient(circle, rgba(255,90,0,0.06) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ paddingTop: '10vh', marginBottom: 'var(--s8)' }} className="text-center anim-fade-up">
        <div style={{
          width: 64, height: 64, borderRadius: 'var(--r-lg)',
          background: 'var(--brand)', margin: '0 auto var(--s4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(255,90,0,0.35)',
        }}>
          <Activity size={32} color="#fff" />
        </div>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', marginBottom: 'var(--s2)' }}>
          Bienvenido
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Accede a tu plataforma de coaching
        </p>
      </div>

      {/* Form Card */}
      <div className="card anim-fade-up" style={{ animationDelay: '.1s', maxWidth: 440, width: '100%', margin: '0 auto', padding: 'var(--s6)' }}>
        {error && (
          <div className="alert alert-error mb-4" style={{ marginBottom: 'var(--s4)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
          {/* Email */}
          <div className="field">
            <label className="field-label">Correo electrónico</label>
            <div className="input-icon">
              <Mail size={16} className="icon" />
              <input
                id="login-email"
                className="input"
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="field">
            <label className="field-label">Contraseña</label>
            <div className="input-icon" style={{ position: 'relative' }}>
              <Lock size={16} className="icon" />
              <input
                id="login-password"
                className="input"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                required
                style={{ paddingRight: 48 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4,
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ marginTop: 'var(--s2)' }}
          >
            {loading
              ? <span className="spin" style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
              : 'Entrar al dashboard'
            }
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{
          marginTop: 'var(--s5)', padding: 'var(--s3) var(--s4)',
          background: 'var(--bg-input)', borderRadius: 'var(--r-md)',
          border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Demo rápido:</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--blue)' }}>trainer@fitzone.com</span>
            {' / '}
            <span>demo1234</span>
          </p>
        </div>
      </div>

      {/* Switch */}
      <p style={{ textAlign: 'center', marginTop: 'var(--s5)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        ¿No tienes cuenta?{' '}
        <button
          onClick={onSwitch}
          style={{ background: 'none', border: 'none', color: 'var(--brand)', fontWeight: 600, fontSize: 'inherit' }}
        >
          Crear cuenta gratis
        </button>
      </p>
    </div>
  );
}
