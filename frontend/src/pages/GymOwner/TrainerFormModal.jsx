import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ESPECIALIDADES = [
  { value: 'hipertrofia', label: '💪 Hipertrofia' },
  { value: 'perdida_grasa', label: '🔥 Pérdida de Grasa' },
  { value: 'fuerza', label: '🏋️ Fuerza' },
  { value: 'resistencia', label: '🏃 Resistencia/Cardio' },
  { value: 'rehabilitacion', label: '🩺 Rehabilitación' },
  { value: 'funcional', label: '⚡ Entrenamiento Funcional' },
];

const EMPTY_FORM = {
  nombre: '', email: '', password: '',
  certificaciones: '', especialidades: [],
};

export default function TrainerFormModal({ trainer, onClose, onSuccess }) {
  const { authFetch } = useAuth();
  const isEditing = !!trainer;

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing && trainer) {
      setForm({
        nombre: trainer.nombre || '',
        email: trainer.email || '',
        password: '',
        certificaciones: trainer.certificaciones || '',
        especialidades: trainer.especialidades || [],
      });
    }
  }, [trainer, isEditing]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggleEspecialidad = (esp) => {
    const curr = form.especialidades;
    set('especialidades', curr.includes(esp)
      ? curr.filter(e => e !== esp)
      : [...curr, esp]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (isEditing && !payload.password) delete payload.password;

      const url = isEditing
        ? `http://localhost:5000/api/trainers/${trainer._id}`
        : 'http://localhost:5000/api/trainers';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await authFetch(url, { method, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');

      onSuccess?.(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white',
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = {
    display: 'block', color: 'var(--color-text-muted)', fontSize: '0.78rem',
    marginBottom: '0.4rem', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 className="text-gradient" style={{ margin: 0, fontSize: '1.6rem' }}>
              {isEditing ? '✏️ Editar Entrenador' : '➕ Nuevo Entrenador'}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
              {isEditing ? `Modificando: ${trainer.nombre}` : 'Dar de alta en el gym'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', padding: '0.5rem', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,50,50,0.15)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#ff6b6b', fontSize: '0.9rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={labelStyle}><User size={12} style={{ display: 'inline', marginRight: '4px' }} />Nombre completo</label>
            <input style={inputStyle} value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Carlos Mendoza" required />
          </div>

          <div>
            <label style={labelStyle}><Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />Email</label>
            <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="carlos@gymfitzone.com" required />
          </div>

          {!isEditing && (
            <div>
              <label style={labelStyle}><Lock size={12} style={{ display: 'inline', marginRight: '4px' }} />Contraseña inicial</label>
              <input style={inputStyle} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" required={!isEditing} minLength={6} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.3rem' }}>El entrenador puede cambiarla en su primer login.</p>
            </div>
          )}

          <div>
            <label style={labelStyle}>Certificaciones (opcional)</label>
            <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }} value={form.certificaciones} onChange={e => set('certificaciones', e.target.value)} placeholder="Ej: NSCA-CPT, ACSM, Olympic Weightlifting Level 1..." />
          </div>

          <div>
            <label style={labelStyle}>Especialidades</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
              {ESPECIALIDADES.map(esp => {
                const active = form.especialidades.includes(esp.value);
                return (
                  <button key={esp.value} type="button"
                    onClick={() => toggleEspecialidad(esp.value)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.9rem', borderRadius: '10px', border: `2px solid ${active ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)'}`, background: active ? 'rgba(255,107,0,0.12)' : 'rgba(255,255,255,0.03)', color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: active ? '700' : '400', transition: 'all 0.2s', textAlign: 'left' }}>
                    {active ? <CheckSquare size={16} color="var(--color-accent)" /> : <Square size={16} color="#666" />}
                    {esp.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.75rem 1.8rem', minWidth: '160px' }}>
              {loading ? '⏳ Guardando...' : isEditing ? '💾 Guardar Cambios' : '✅ Crear Entrenador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
