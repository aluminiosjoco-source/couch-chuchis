import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Dumbbell, User, Mail, Lock, Building2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const ROLES = [
  { value: 'client', label: '🏃 Cliente / Atleta', desc: 'Accede a tu plan y check-in semanal' },
  { value: 'trainer', label: '🎯 Entrenador', desc: 'Gestiona tu cartera de clientes' },
  { value: 'gym_owner', label: '🏢 Dueño de Gym', desc: 'Administra tu gimnasio completo' },
];

export default function Register({ onSwitch }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'trainer', nombre_gym: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('La contraseña debe tener mínimo 8 caracteres'); return; }
    if (form.rol === 'gym_owner' && !form.nombre_gym) { setError('El nombre del gimnasio es requerido'); return; }
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-dark)', padding: '2rem' }}>
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(0,230,118,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #00E676, #00B0FF)', borderRadius: '12px', padding: '10px', display: 'flex' }}>
              <Dumbbell size={28} color="#fff" />
            </div>
            <h1 className="text-gradient-green" style={{ fontSize: '1.75rem', margin: 0 }}>Crear Cuenta</h1>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>14 días gratis. Sin tarjeta de crédito.</p>
        </div>

        {/* Selector de Rol */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.75rem' }}>
          {ROLES.map(r => (
            <button key={r.value} type="button" id={`role-${r.value}`}
              onClick={() => setForm(p => ({ ...p, rol: r.value }))}
              style={{ padding: '0.75rem 0.5rem', borderRadius: '10px', border: `2px solid ${form.rol === r.value ? 'var(--color-secondary)' : 'var(--glass-border)'}`, background: form.rol === r.value ? 'rgba(0,230,118,0.08)' : 'transparent', color: 'var(--color-text-main)', cursor: 'pointer', textAlign: 'center', fontSize: '0.75rem', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{r.label.split(' ')[0]}</div>
              <div style={{ fontWeight: '600', fontSize: '0.8rem' }}>{r.label.substring(2)}</div>
            </button>
          ))}
        </div>

        {error && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,90,0,0.12)', border: '1px solid rgba(255,90,0,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#FF8A00', fontSize: '0.875rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Nombre completo" id="register-nombre"><User size={15} />
            <input id="register-nombre" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Carlos Mendoza" required style={inputStyle} />
          </Field>

          <Field label="Email" id="register-email"><Mail size={15} />
            <input id="register-email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="coach@fitzone.com" required style={inputStyle} />
          </Field>

          <Field label="Contraseña (mín. 8 caracteres)" id="register-password"><Lock size={15} />
            <input id="register-password" type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" required style={{ ...inputStyle, paddingRight: '3rem' }} />
            <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </Field>

          {form.rol === 'gym_owner' && (
            <Field label="Nombre del Gimnasio" id="register-gym"><Building2 size={15} />
              <input id="register-gym" value={form.nombre_gym} onChange={e => setForm(p => ({ ...p, nombre_gym: e.target.value }))} placeholder="FitZone Monterrey" required style={inputStyle} />
            </Field>
          )}

          <button id="register-submit" type="submit" className="btn-primary" disabled={loading}
            style={{ marginTop: '0.5rem', padding: '0.9rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #00E676, #00B0FF)' }}>
            {loading ? <div style={spinnerStyle} /> : <><CheckCircle2 size={18} /> Empezar prueba gratuita</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          ¿Ya tienes cuenta?{' '}
          <button onClick={onSwitch} style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer', fontWeight: '600' }}>Iniciar sesión</button>
        </p>
      </div>
    </div>
  );
}

function Field({ label, id, children }) {
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: '14px', color: 'var(--color-text-muted)', display: 'flex' }}>{children[0]}</span>
        {children[1]}
        {children[2]}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.8rem', paddingBottom: '0.8rem',
  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: '10px',
  color: 'var(--color-text-main)', fontSize: '0.9rem', outline: 'none', fontFamily: 'var(--font-body)',
};

const spinnerStyle = {
  width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
  borderRadius: '50%', animation: 'spin 0.8s linear infinite',
};
