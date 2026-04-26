import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Lock, Calendar, Ruler, Target, Dumbbell, 
  Clock, AlertCircle, Plus, Trash2, Heart, Zap, Coffee, 
  ChevronRight, ChevronLeft, Phone, Briefcase, Activity, Scale
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const OBJETIVOS = [
  { value: 'hipertrofia', label: '💪 Hipertrofia' },
  { value: 'perdida_grasa', label: '🔥 Pérdida de Grasa' },
  { value: 'fuerza', label: '🏋️ Fuerza' },
  { value: 'recomposicion', label: '⚖️ Recomposición' },
  { value: 'rendimiento', label: '🏃 Rendimiento' },
  { value: 'rehabilitacion', label: '🩹 Rehabilitación' },
];

const EXPERIENCIA = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
];

const EQUIPAMIENTO = [
  { value: 'gym', label: '🏋️ Gimnasio completo' },
  { value: 'casa_minimal', label: '🏠 Casa (básico)' },
  { value: 'bandas', label: '🎗️ Bandas elásticas' },
  { value: 'sin_equipo', label: '🧘 Sin equipo' },
];

const ESTILO_VIDA = [
  { value: 'sedentario', label: '🛋️ Sedentario' },
  { value: 'activo', label: '🚶 Activo' },
  { value: 'muy_activo', label: '🔥 Muy activo' },
];

const EMPTY_FORM = {
  nombre: '', email: '', password: '', edad: '', altura_cm: '', peso_inicial: '',
  telefono: '', ocupacion: '', meta_especifica: '', tiempo_objetivo: '',
  objetivo: 'hipertrofia', experiencia: 'principiante',
  dias_disponibles: 4, tiempo_sesion: '60 min', horario_preferido: 'Mañana',
  equipamiento: 'gym', tipo_entrenamiento_preferido: 'pesas',
  limitaciones: [], lesiones_pasadas: '', dolor_frecuente: '', condicion_medica: '',
  estilo_vida: 'sedentario', horas_sueno: '7-8', nivel_estres: 'medio',
  comidas_dia: 3, restricciones_alimentarias: [], alcohol: 'no',
  ejercicios_disgusto: '', motivacion_principal: '', nivel_compromiso: 'medio',
  porcentaje_grasa_inicial: '', medida_cintura: '', medida_cadera: '',
  observaciones_posturales: '', notas_entrenador: ''
};

const TABS = [
  { id: 'basicos', label: 'Personal', icon: <User size={16}/> },
  { id: 'salud', label: 'Salud', icon: <Heart size={16}/> },
  { id: 'lifestyle', label: 'Hábitos', icon: <Coffee size={16}/> },
  { id: 'fitness', label: 'Fitness', icon: <Zap size={16}/> },
  { id: 'medidas', label: 'Medidas', icon: <Scale size={16}/> },
];

export default function ClientFormModal({ client, onClose, onSuccess }) {
  const { authFetch } = useAuth();
  const isEditing = !!client;

  const [form, setForm] = useState(EMPTY_FORM);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basicos');

  useEffect(() => {
    if (isEditing && client) {
      const fetchFull = async () => {
        try {
          setLoading(true);
          const res = await authFetch(`http://localhost:5000/api/clients/${client.id}`);
          if (res.ok) {
            const data = await res.json();
            const p = data.profile || {};
            setForm({
              nombre: data.user?.nombre || client.nombre || '',
              email: data.user?.email || client.email || '',
              password: '',
              edad: data.user?.edad || client.edad || '',
              altura_cm: data.user?.altura_cm || client.altura_cm || '',
              peso_inicial: p.peso_inicial || '',
              telefono: p.telefono || '',
              ocupacion: p.ocupacion || '',
              meta_especifica: p.meta_especifica || '',
              tiempo_objetivo: p.tiempo_objetivo || '',
              objetivo: p.objetivo || 'hipertrofia',
              experiencia: p.experiencia || 'principiante',
              dias_disponibles: p.dias_disponibles || 4,
              tiempo_sesion: p.tiempo_sesion || '60 min',
              horario_preferido: p.horario_preferido || 'Mañana',
              equipamiento: p.equipamiento || 'gym',
              tipo_entrenamiento_preferido: p.tipo_entrenamiento_preferido || 'pesas',
              limitaciones: p.limitaciones || [],
              lesiones_pasadas: p.lesiones_pasadas || '',
              dolor_frecuente: p.dolor_frecuente || '',
              condicion_medica: p.condicion_medica || '',
              estilo_vida: p.estilo_vida || 'sedentario',
              horas_sueno: p.horas_sueno || '7-8',
              nivel_estres: p.nivel_estres || 'medio',
              comidas_dia: p.comidas_dia || 3,
              restricciones_alimentarias: p.restricciones_alimentarias || [],
              alcohol: p.alcohol || 'no',
              ejercicios_disgusto: p.ejercicios_disgusto || '',
              motivacion_principal: p.motivacion_principal || '',
              nivel_compromiso: p.nivel_compromiso || 'medio',
              porcentaje_grasa_inicial: p.porcentaje_grasa_inicial || '',
              medida_cintura: p.medida_cintura || '',
              medida_cadera: p.medida_cadera || '',
              observaciones_posturales: p.observaciones_posturales || '',
              notas_entrenador: p.notas_entrenador || ''
            });
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchFull();
    }
  }, [client, isEditing, authFetch]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { ...form };
      if (isEditing && !payload.password) delete payload.password;

      let res;
      if (isEditing) {
        res = await authFetch(`http://localhost:5000/api/clients/${client.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            nombre: payload.nombre, email: payload.email,
            edad: payload.edad, altura_cm: payload.altura_cm,
          }),
        });
        if (res.ok) {
          await authFetch(`http://localhost:5000/api/clients/${client.id}/profile`, {
            method: 'PUT',
            body: JSON.stringify(payload),
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
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = { display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.4rem', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' };
  
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(8px)' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '700px', maxHeight: '95vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
        
        {/* Header Fixed */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="text-gradient" style={{ margin: 0, fontSize: '1.5rem' }}>
                {isEditing ? '✏️ Expediente de Cliente' : '🚀 Nueva Entrevista Inicial'}
              </h2>
            </div>
            <button onClick={onClose} className="btn-icon" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <X size={20} />
            </button>
          </div>
          
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} 
                style={{ 
                  display:'flex', alignItems:'center', gap:'8px', padding: '0.6rem 1rem', borderRadius: '10px', whiteSpace: 'nowrap',
                  background: activeTab === t.id ? 'var(--color-accent)' : 'rgba(255,255,255,0.04)',
                  color: activeTab === t.id ? 'white' : 'var(--color-text-muted)',
                  border: 'none', cursor: 'pointer', transition: '0.2s', fontSize: '0.8rem', fontWeight: 600
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          {error && (
            <div style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.2)', padding: '0.8rem', borderRadius: '10px', marginBottom: '1.5rem', color: '#ff6b6b', fontSize: '0.85rem', display: 'flex', gap: '8px' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form id="interview-form" onSubmit={handleSubmit}>
            {/* ── SECCIÓN: BÁSICOS ── */}
            {activeTab === 'basicos' && (
              <div className="animate-fade-in" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}><User size={12}/> Nombre Completo</label>
                  <input style={inputStyle} value={form.nombre} onChange={e=>set('nombre', e.target.value)} required />
                </div>
                <div>
                  <label style={labelStyle}><Mail size={12}/> Email</label>
                  <input style={inputStyle} type="email" value={form.email} onChange={e=>set('email', e.target.value)} required />
                </div>
                <div>
                  <label style={labelStyle}><Phone size={12}/> Teléfono</label>
                  <input style={inputStyle} value={form.telefono} onChange={e=>set('telefono', e.target.value)} placeholder="000 000 0000" />
                </div>
                {!isEditing && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}><Lock size={12}/> Contraseña Temporal</label>
                    <input style={inputStyle} type="password" value={form.password} onChange={e=>set('password', e.target.value)} required={!isEditing} />
                  </div>
                )}
                <div>
                  <label style={labelStyle}><Calendar size={12}/> Edad</label>
                  <input style={inputStyle} type="number" value={form.edad} onChange={e=>set('edad', parseInt(e.target.value))} required />
                </div>
                <div>
                  <label style={labelStyle}><Ruler size={12}/> Estatura (cm)</label>
                  <input style={inputStyle} type="number" value={form.altura_cm} onChange={e=>set('altura_cm', parseInt(e.target.value))} required />
                </div>
                <div>
                  <label style={labelStyle}><Scale size={12}/> Peso Actual (kg)</label>
                  <input style={inputStyle} type="number" step="0.1" value={form.peso_inicial} onChange={e=>set('peso_inicial', parseFloat(e.target.value))} />
                </div>
                <div>
                  <label style={labelStyle}><Briefcase size={12}/> Ocupación</label>
                  <input style={inputStyle} value={form.ocupacion} onChange={e=>set('ocupacion', e.target.value)} />
                </div>
              </div>
            )}

            {/* ── SECCIÓN: SALUD ── */}
            {activeTab === 'salud' && (
              <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                <div>
                  <label style={labelStyle}>Lesiones Pasadas / Cirugías</label>
                  <textarea style={{...inputStyle, height:'80px', resize:'none'}} value={form.lesiones_pasadas} onChange={e=>set('lesiones_pasadas', e.target.value)} placeholder="Describe brevemente..."></textarea>
                </div>
                <div>
                  <label style={labelStyle}>Dolores Frecuentes (Rodillas, Espalda, etc.)</label>
                  <input style={inputStyle} value={form.dolor_frecuente} onChange={e=>set('dolor_frecuente', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Condiciones Médicas / Medicamentos</label>
                  <input style={inputStyle} value={form.condicion_medica} onChange={e=>set('condicion_medica', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Limitaciones para la IA (Tags)</label>
                  <div style={{ display:'flex', gap:'8px', marginBottom:'8px' }}>
                    <input style={{...inputStyle, flex:1}} value={newTag} onChange={e=>setNewTag(e.target.value)} onKeyDown={e=>e.key==='Enter' && (e.preventDefault(), form.limitaciones.includes(newTag)||set('limitaciones', [...form.limitaciones, newTag.trim()]), setNewTag(''))}/>
                    <button type="button" onClick={() => {if(newTag.trim()) set('limitaciones', [...form.limitaciones, newTag.trim()]); setNewTag('');}} className="btn-secondary" style={{padding:'0 1rem'}}><Plus size={16}/></button>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                    {form.limitaciones.map(t => <span key={t} className="badge badge-amber" style={{display:'flex', gap:'6px'}}>{t} <X size={10} style={{cursor:'pointer'}} onClick={()=>set('limitaciones', form.limitaciones.filter(x=>x!==t))}/></span>)}
                  </div>
                </div>
              </div>
            )}

            {/* ── SECCIÓN: HÁBITOS ── */}
            {activeTab === 'lifestyle' && (
              <div className="animate-fade-in" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Nivel de Actividad Diaria</label>
                  <div style={{ display:'flex', gap:'8px' }}>
                    {ESTILO_VIDA.map(ev => <button key={ev.value} type="button" onClick={()=>set('estilo_vida', ev.value)} style={{ flex:1, padding:'0.8rem', borderRadius:'12px', border: `2px solid ${form.estilo_vida === ev.value ? 'var(--color-secondary)' : 'rgba(255,255,255,0.05)'}`, background: form.estilo_vida === ev.value ? 'rgba(0,230,118,0.1)' : 'transparent', color: 'white', cursor:'pointer' }}>{ev.label}</button>)}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Horas sueño</label>
                  <select style={inputStyle} value={form.horas_sueno} onChange={e=>set('horas_sueno', e.target.value)}>
                    {['<5', '5-6', '6-7', '7-8', '8+'].map(h => <option key={h} value={h}>{h} horas</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Estrés</label>
                  <select style={inputStyle} value={form.nivel_estres} onChange={e=>set('nivel_estres', e.target.value)}>
                    <option value="bajo">Bajo</option><option value="medio">Medio</option><option value="alto">Alto</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Comidas al día</label>
                  <input style={inputStyle} type="number" value={form.comidas_dia} onChange={e=>set('comidas_dia', parseInt(e.target.value))} />
                </div>
                <div>
                  <label style={labelStyle}>Alcohol</label>
                  <select style={inputStyle} value={form.alcohol} onChange={e=>set('alcohol', e.target.value)}>
                    <option value="no">Nada</option><option value="ocasional">Ocasional</option><option value="frecuente">Frecuente</option>
                  </select>
                </div>
              </div>
            )}

            {/* ── SECCIÓN: FITNESS ── */}
            {activeTab === 'fitness' && (
              <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                <div>
                  <label style={labelStyle}>Objetivo Principal</label>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px' }}>
                    {OBJETIVOS.map(o => <button key={o.value} type="button" onClick={()=>set('objetivo', o.value)} style={{ padding:'0.8rem', borderRadius:'12px', border: `2px solid ${form.objetivo === o.value ? 'var(--color-accent)' : 'rgba(255,255,255,0.05)'}`, background: form.objetivo === o.value ? 'rgba(255,107,0,0.1)' : 'transparent', color: 'white', cursor:'pointer', fontSize:'0.8rem' }}>{o.label}</button>)}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
                  <div>
                    <label style={labelStyle}>Experiencia</label>
                    <select style={inputStyle} value={form.experiencia} onChange={e=>set('experiencia', e.target.value)}>
                      {EXPERIENCIA.map(ex => <option key={ex.value} value={ex.value}>{ex.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Equipamiento</label>
                    <select style={inputStyle} value={form.equipamiento} onChange={e=>set('equipamiento', e.target.value)}>
                      {EQUIPAMIENTO.map(eq => <option key={eq.value} value={eq.value}>{eq.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Días/Semana</label>
                    <input style={inputStyle} type="number" min="1" max="7" value={form.dias_disponibles} onChange={e=>set('dias_disponibles', parseInt(e.target.value))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Tiempo Sesión</label>
                    <select style={inputStyle} value={form.tiempo_sesion} onChange={e=>set('tiempo_sesion', e.target.value)}>
                      {['30 min', '45 min', '60 min', '90 min'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Meta Específica</label>
                  <input style={inputStyle} value={form.meta_especifica} onChange={e=>set('meta_especifica', e.target.value)} placeholder="Ej: Bajar 5kg para mi boda" />
                </div>
                <div>
                  <label style={labelStyle}>Motivación Principal</label>
                  <input style={inputStyle} value={form.motivacion_principal} onChange={e=>set('motivacion_principal', e.target.value)} />
                </div>
              </div>
            )}

            {/* ── SECCIÓN: MEDIDAS ── */}
            {activeTab === 'medidas' && (
              <div className="animate-fade-in" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
                <div>
                  <label style={labelStyle}>% Grasa Estimado</label>
                  <input style={inputStyle} type="number" value={form.porcentaje_grasa_inicial} onChange={e=>set('porcentaje_grasa_inicial', parseFloat(e.target.value))} />
                </div>
                <div>
                  <label style={labelStyle}>Cintura (cm)</label>
                  <input style={inputStyle} type="number" value={form.medida_cintura} onChange={e=>set('medida_cintura', parseFloat(e.target.value))} />
                </div>
                <div>
                  <label style={labelStyle}>Cadera (cm)</label>
                  <input style={inputStyle} type="number" value={form.medida_cadera} onChange={e=>set('medida_cadera', parseFloat(e.target.value))} />
                </div>
                <div>
                  <label style={labelStyle}>Compromiso (1-10)</label>
                  <select style={inputStyle} value={form.nivel_compromiso} onChange={e=>set('nivel_compromiso', e.target.value)}>
                    <option value="bajo">Bajo (1-3)</option><option value="medio">Medio (4-7)</option><option value="alto">Alto (8-10)</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Observaciones Posturales</label>
                  <textarea style={{...inputStyle, height:'60px', resize:'none'}} value={form.observaciones_posturales} onChange={e=>set('observaciones_posturales', e.target.value)}></textarea>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Notas adicionales del Coach</label>
                  <textarea style={{...inputStyle, height:'60px', resize:'none'}} value={form.notas_entrenador} onChange={e=>set('notas_entrenador', e.target.value)}></textarea>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer Fixed */}
        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
             Pestaña {TABS.findIndex(t=>t.id===activeTab)+1} de {TABS.length}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '0.7rem 1.2rem' }}>Cancelar</button>
            <button type="submit" form="interview-form" className="btn-primary" disabled={loading} style={{ padding: '0.7rem 2rem' }}>
               {loading ? 'Guardando...' : isEditing ? 'Guardar Expediente' : 'Finalizar Registro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
