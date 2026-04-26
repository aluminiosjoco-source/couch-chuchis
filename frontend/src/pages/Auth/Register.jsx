import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Building2, AlertCircle, Activity } from 'lucide-react';

const ROLES = [
  { value: 'client', emoji: '🏃', label: 'Atleta', desc: 'Sigue tu plan y registra check-ins' },
  { value: 'trainer', emoji: '🎯', label: 'Entrenador', desc: 'Gestiona tu cartera de clientes' },
  { value: 'gym_owner', emoji: '🏢', label: 'Dueño Gym', desc: 'Administra tu gimnasio completo' },
];

export default function Register({ onSwitch }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'trainer', nombre_gym: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    if (form.rol === 'gym_owner' && !form.nombre_gym) { setError('Ingresa el nombre de tu gimnasio'); return; }
    setLoading(true);
    try { await register(form); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-base)', padding: 'var(--s4)',
      overflowY: 'auto',
    }}>
      <div style={{ position: 'fixed', bottom: '-20%', right: '-20%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(34,214,122,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ paddingTop: '8vh', marginBottom: 'var(--s6)' }} className="text-center anim-fade-up">
        <div style={{ width: 56, height: 56, borderRadius: 'var(--r-lg)', background: 'var(--green)', margin: '0 auto var(--s3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 28px rgba(34,214,122,0.3)' }}>
          <Activity size={28} color="#0D0F12" />
        </div>
        <h1 style={{ fontSize: '1.7rem', fontFamily: 'var(--font-display)', marginBottom: 'var(--s1)' }}>
          Crear cuenta
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>14 días gratis · Sin tarjeta</p>
      </div>

      <div className="card anim-fade-up" style={{ animationDelay: '.1s', maxWidth: 440, width: '100%', margin: '0 auto', padding: 'var(--s6)' }}>
        {/* Role selector */}
        <div style={{ display: 'flex', gap: 'var(--s2)', marginBottom: 'var(--s5)' }}>
          {ROLES.map(r => (
            <button
              key={r.value}
              type="button"
              id={`role-${r.value}`}
              onClick={() => set('rol', r.value)}
              style={{
                flex: 1, padding: 'var(--s3) var(--s2)',
                background: form.rol === r.value ? 'rgba(34,214,122,0.08)' : 'var(--bg-input)',
                border: `2px solid ${form.rol === r.value ? 'var(--green)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)', color: 'var(--text-primary)',
                cursor: 'pointer', textAlign: 'center',
                transition: 'all .2s',
              }}
            >
              <div style={{ fontSize: '1.3rem', lineHeight: 1, marginBottom: 4 }}>{r.emoji}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{r.label}</div>
            </button>
          ))}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 'var(--s5)', textAlign: 'center' }}>
          {ROLES.find(r => r.value === form.rol)?.desc}
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--s4)' }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
          {/* Nombre */}
          <div className="field">
            <label className="field-label">Nombre completo</label>
            <div className="input-icon">
              <User size={15} className="icon" />
              <input id="register-nombre" className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Carlos Mendoza" required />
            </div>
          </div>

          {/* Email */}
          <div className="field">
            <label className="field-label">Correo electrónico</label>
            <div className="input-icon">
              <Mail size={15} className="icon" />
              <input id="register-email" className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="coach@fitzone.com" required autoComplete="email" />
            </div>
          </div>

          {/* Password */}
          <div className="field">
            <label className="field-label">Contraseña (mín. 8 caracteres)</label>
            <div className="input-icon" style={{ position: 'relative' }}>
              <Lock size={15} className="icon" />
              <input id="register-password" className="input" type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required style={{ paddingRight: 48 }} />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4 }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Gym name */}
          {form.rol === 'gym_owner' && (
            <div className="field">
              <label className="field-label">Nombre del gimnasio</label>
              <div className="input-icon">
                <Building2 size={15} className="icon" />
                <input id="register-gym" className="input" value={form.nombre_gym} onChange={e => set('nombre_gym', e.target.value)} placeholder="FitZone Monterrey" required />
              </div>
            </div>
          )}

          <button
            id="register-submit"
            type="submit"
            className="btn btn-green btn-lg"
            disabled={loading}
            style={{ marginTop: 'var(--s2)' }}
          >
            {loading
              ? <span className="spin" style={{ width: 20, height: 20, border: '2px solid rgba(13,15,18,0.3)', borderTopColor: '#0D0F12', borderRadius: '50%', display: 'inline-block' }} />
              : 'Comenzar prueba gratuita'
            }
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: 'var(--s5)', marginBottom: 'var(--s6)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        ¿Ya tienes cuenta?{' '}
        <button onClick={onSwitch} style={{ background: 'none', border: 'none', color: 'var(--green)', fontWeight: 600, fontSize: 'inherit' }}>
          Iniciar sesión
        </button>
      </p>
    </div>
  );
}
