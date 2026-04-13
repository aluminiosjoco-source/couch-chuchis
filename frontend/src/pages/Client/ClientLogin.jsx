import React, { useState } from 'react';
import { Mail, Lock, Loader2, Dumbbell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ClientLogin({ onSwitch }) {
  const { loginClient } = useAuth(); // Asumiremos que AuthContext tiene un método loginClient o adaptamos login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await loginClient(email, password);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'var(--color-bg-dark)' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem' }}>
        <div className="text-center" style={{ marginBottom: '2rem' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Dumbbell size={32} color="white" />
          </div>
          <h2 style={{ margin: 0 }}>Acceso Atletas</h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Visualiza tus rutinas y registra check-ins</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label className="form-label">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
              <input type="email" required className="form-control" style={{ paddingLeft: '3rem' }} placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
              <input type="password" required className="form-control" style={{ paddingLeft: '3rem' }} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            {loading ? <Loader2 className="animate-spin" /> : 'Ingresar'}
          </button>
        </form>

        <div className="text-center" style={{ marginTop: '2rem', fontSize: '0.875rem' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>¿No tienes una cuenta de atleta?</p>
          <button className="btn-link" onClick={onSwitch}>Contacta a tu entrenador</button>
        </div>
      </div>
    </div>
  );
}
