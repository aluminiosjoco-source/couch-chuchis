import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Calendar, Ruler, Target, Dumbbell, Clock, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const OBJETIVOS = [
  { value: 'hipertrofia', label: '💪 Hipertrofia' },
  { value: 'perdida_grasa', label: '🔥 Pérdida de Grasa' },
  { value: 'fuerza', label: '🏋️ Fuerza' },
  { value: 'recomposicion', label: '⚖️ Recomposición' },
  { value: 'rendimiento', label: '🏃 Rendimiento' },
];

const EXPERIENCIA = [
  { value: 'principiante', label: 'Principiante (0-1 año)' },
  { value: 'intermedio', label: 'Intermedio (1-3 años)' },
  { value: 'avanzado', label: 'Avanzado (+3 años)' },
];

const EQUIPAMIENTO = [
  { value: 'gym', label: '🏋️ Gimnasio completo' },
  { value: 'casa_minimal', label: '🏠 Casa (básico)' },
  { value: 'bandas', label: '🎗️ Bandas elásticas' },
  { value: 'sin_equipo', label: '🧘 Sin equipo' },
];

const EMPTY_FORM = {
  nombre: '', email: '', password: '', edad: '', altura_cm: '',
  objetivo: 'hipertrofia', experiencia: 'principiante',
  dias_disponibles: 4, equipamiento: 'gym',
  limitaciones: [], restricciones_alimentarias: [],
};

export default function ClientFormModal({ client, onClose, onSuccess }) {
  const { authFetch } = useAuth();
  const isEditing = !!client;

  const [form, setForm] = useState(EMPTY_FORM);
  const [newLimitacion, setNewLimitacion] = useState('');
  const [newRestriccion, setNewRestriccion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basicos');

  // Pre-fill when editing
  useEffect(() => {
    if (isEditing && client) {
      setForm({
        nombre: client.nombre || '',
        email: client.email || '',
        password: '',
        edad: client.edad || '',
        altura_cm: client.altura_cm || '',
        objetivo: client.profile?.objetivo || 'hipertrofia',
        experiencia: client.profile?.experiencia || 'principiante',
        dias_disponibles: client.profile?.dias_disponibles || 4,
        equipamiento: client.profile?.equipamiento || 'gym',
        limitaciones: client.profile?.limitaciones || [],
        restricciones_alimentarias: client.profile?.restricciones_alimentarias || [],
      });
    }
  }, [client, isEditing]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const addTag = (field, value, setter) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!form[field].includes(trimmed)) {
      set(field, [...form[field], trimmed]);
    }
    setter('');
  };

  const removeTag = (field, tag) => set(field, form[field].filter(t => t !== tag));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { ...form };
      if (isEditing && !payload.password) delete payload.password;

      let res;
      if (isEditing) {
        // Actualizar datos básicos
        res = await authFetch(`http://localhost:5000/api/clients/${client.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            nombre: payload.nombre, email: payload.email,
            edad: payload.edad, altura_cm: payload.altura_cm,
          }),
        });
        // Actualizar perfil fitness por separado
        if (res.ok) {
          await authFetch(`http://localhost:5000/api/clients/${client.id}/profile`, {
            method: 'PUT',
            body: JSON.stringify({
              objetivo: payload.objetivo, experiencia: payload.experiencia,
              dias_disponibles: payload.dias_disponibles, equipamiento: payload.equipamiento,
              limitaciones: payload.limitaciones,
              restricciones_alimentarias: payload.restricciones_alimentarias,
            }),
          });
        }
      } else {
        res = await authFetch('http://localhost:5000/api/clients', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

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
  const labelStyle = { display: 'block', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' };
  const tabBtnStyle = (active) => ({
    padding: '0.5rem 1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem',
    background: active ? 'var(--color-accent)' : 'rgba(255,255,255,0.06)',
    color: active ? 'white' : 'var(--color-text-muted)',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 className="text-gradient" style={{ margin: 0, fontSize: '1.6rem' }}>
              {isEditing ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
              {isEditing ? `Modificando: ${client.nombre}` : 'Registro y perfil fitness inicial'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', padding: '0.5rem', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button style={tabBtnStyle(activeTab === 'basicos')} onClick={() => setActiveTab('basicos')}>📋 Datos Básicos</button>
          <button style={tabBtnStyle(activeTab === 'fitness')} onClick={() => setActiveTab('fitness')}>💪 Perfil Fitness</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,50,50,0.15)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#ff6b6b', fontSize: '0.9rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ── Tab: Datos Básicos ── */}
          {activeTab === 'basicos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={labelStyle}><User size={12} style={{ display: 'inline', marginRight: '4px' }} />Nombre completo</label>
                <input style={inputStyle} value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Juan Pérez" required />
              </div>
              <div>
                <label style={labelStyle}><Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />Email</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="juan@ejemplo.com" required />
              </div>
              {!isEditing && (
                <div>
                  <label style={labelStyle}><Lock size={12} style={{ display: 'inline', marginRight: '4px' }} />Contraseña inicial</label>
                  <input style={inputStyle} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" required={!isEditing} minLength={6} />
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}><Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />Edad (años)</label>
                  <input style={inputStyle} type="number" value={form.edad} onChange={e => set('edad', e.target.value)} placeholder="28" min={12} max={80} required />
                </div>
                <div>
                  <label style={labelStyle}><Ruler size={12} style={{ display: 'inline', marginRight: '4px' }} />Altura (cm)</label>
                  <input style={inputStyle} type="number" value={form.altura_cm} onChange={e => set('altura_cm', e.target.value)} placeholder="175" min={100} max={230} required />
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Perfil Fitness ── */}
          {activeTab === 'fitness' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={labelStyle}><Target size={12} style={{ display: 'inline', marginRight: '4px' }} />Objetivo principal</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
                  {OBJETIVOS.map(o => (
                    <button key={o.value} type="button"
                      onClick={() => set('objetivo', o.value)}
                      style={{ padding: '0.65rem', borderRadius: '10px', border: `2px solid ${form.objetivo === o.value ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)'}`, background: form.objetivo === o.value ? 'rgba(255,107,0,0.15)' : 'rgba(255,255,255,0.03)', color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: form.objetivo === o.value ? '700' : '400', transition: 'all 0.2s' }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Nivel de experiencia</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {EXPERIENCIA.map(e => (
                    <button key={e.value} type="button"
                      onClick={() => set('experiencia', e.value)}
                      style={{ flex: 1, padding: '0.65rem', borderRadius: '10px', border: `2px solid ${form.experiencia === e.value ? 'var(--color-secondary)' : 'rgba(255,255,255,0.1)'}`, background: form.experiencia === e.value ? 'rgba(0,230,118,0.1)' : 'rgba(255,255,255,0.03)', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: form.experiencia === e.value ? '700' : '400', transition: 'all 0.2s', textAlign: 'center' }}>
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />Días disponibles/sem</label>
                  <input style={inputStyle} type="number" value={form.dias_disponibles} onChange={e => set('dias_disponibles', parseInt(e.target.value))} min={1} max={7} />
                </div>
                <div>
                  <label style={labelStyle}><Dumbbell size={12} style={{ display: 'inline', marginRight: '4px' }} />Equipamiento</label>
                  <select value={form.equipamiento} onChange={e => set('equipamiento', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {EQUIPAMIENTO.map(eq => <option key={eq.value} value={eq.value} style={{ background: '#1a1a1a' }}>{eq.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Limitaciones (tags) */}
              <div>
                <label style={labelStyle}>Limitaciones físicas / lesiones</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input style={{ ...inputStyle, flex: 1 }} value={newLimitacion} onChange={e => setNewLimitacion(e.target.value)} placeholder="Ej: rodilla derecha, lumbar" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag('limitaciones', newLimitacion, setNewLimitacion))} />
                  <button type="button" onClick={() => addTag('limitaciones', newLimitacion, setNewLimitacion)} style={{ background: 'rgba(255,107,0,0.2)', border: '1px solid var(--color-accent)', color: 'var(--color-accent)', borderRadius: '10px', padding: '0 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Plus size={16} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {form.limitaciones.map(tag => (
                    <span key={tag} style={{ background: 'rgba(255,107,0,0.15)', color: 'var(--color-accent)', border: '1px solid rgba(255,107,0,0.3)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {tag} <Trash2 size={11} style={{ cursor: 'pointer' }} onClick={() => removeTag('limitaciones', tag)} />
                    </span>
                  ))}
                </div>
              </div>

              {/* Restricciones alimentarias (tags) */}
              <div>
                <label style={labelStyle}>Restricciones alimentarias</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input style={{ ...inputStyle, flex: 1 }} value={newRestriccion} onChange={e => setNewRestriccion(e.target.value)} placeholder="Ej: lactosa, gluten, mariscos" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag('restricciones_alimentarias', newRestriccion, setNewRestriccion))} />
                  <button type="button" onClick={() => addTag('restricciones_alimentarias', newRestriccion, setNewRestriccion)} style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', borderRadius: '10px', padding: '0 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Plus size={16} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {form.restricciones_alimentarias.map(tag => (
                    <span key={tag} style={{ background: 'rgba(0,230,118,0.1)', color: 'var(--color-secondary)', border: '1px solid rgba(0,230,118,0.3)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {tag} <Trash2 size={11} style={{ cursor: 'pointer' }} onClick={() => removeTag('restricciones_alimentarias', tag)} />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.8rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.75rem 1.8rem', minWidth: '140px' }}>
              {loading ? '⏳ Guardando...' : isEditing ? '💾 Guardar Cambios' : '✅ Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
