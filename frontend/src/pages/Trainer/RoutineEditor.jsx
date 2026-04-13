import React, { useState } from 'react';
import { Dumbbell, ChevronDown, ChevronUp, Plus, Trash2, Save, Wand2, CheckCircle, AlertCircle } from 'lucide-react';

const DEMO_PLAN = {
  split_name: 'Upper/Lower',
  dias_totales: 4,
  volumen_ajustado: false,
  dias: [
    {
      dia: 1, nombre: 'Upper A — Empuje/Jalón',
      ejercicios: [
        { nombre: 'Press de Banca', series: 4, repeticiones: '8-10', peso_sugerido_kg: 70, rpe_objetivo: 8, nota: 'Control en la bajada' },
        { nombre: 'Remo con Barra', series: 4, repeticiones: '8-10', peso_sugerido_kg: 60, rpe_objetivo: 8, nota: 'Retracción escapular al subir' },
        { nombre: 'Press Militar', series: 3, repeticiones: '10-12', peso_sugerido_kg: 40, rpe_objetivo: 7, nota: '' },
      ],
    },
    {
      dia: 2, nombre: 'Lower A — Cuádriceps/Glúteos',
      ejercicios: [
        { nombre: 'Sentadilla con Barra', series: 4, repeticiones: '6-8', peso_sugerido_kg: 90, rpe_objetivo: 8, nota: 'Profundidad paralela mínima' },
        { nombre: 'Prensa de Piernas', series: 3, repeticiones: '10-12', peso_sugerido_kg: 150, rpe_objetivo: 7, nota: '' },
        { nombre: 'Glute Kickback', series: 3, repeticiones: '12-15', peso_sugerido_kg: 25, rpe_objetivo: 7, nota: '' },
      ],
    },
  ],
};

export default function RoutineEditor({ plan: initialPlan = DEMO_PLAN, clientName = 'Juan Pérez' }) {
  const [plan, setPlan] = useState(initialPlan);
  const [expandedDay, setExpandedDay] = useState(0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateEj = (dayIdx, ejIdx, field, val) => {
    setPlan(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.dias[dayIdx].ejercicios[ejIdx][field] = val;
      return next;
    });
    setSaved(false);
  };

  const addEj = (dayIdx) => {
    setPlan(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.dias[dayIdx].ejercicios.push({ nombre: '', series: 3, repeticiones: '10-12', peso_sugerido_kg: '', rpe_objetivo: 7, nota: '' });
      return next;
    });
    setSaved(false);
  };

  const removeEj = (dayIdx, ejIdx) => {
    setPlan(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.dias[dayIdx].ejercicios.splice(ejIdx, 1);
      return next;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setLoading(true);
    // Aquí se conectaría con la API para persistir el plan
    await new Promise(r => setTimeout(r, 800));
    setSaved(true);
    setLoading(false);
  };

  const handleRegenerateAI = async () => {
    setLoading(true);
    // Simula llamada a /api/agents/workout
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    alert('En producción: llama a POST /api/agents/workout con el estado del cliente y reemplaza el plan.');
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>Editor de Rutina</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Cliente: <strong style={{ color: 'var(--color-text-main)' }}>{clientName}</strong> · {plan.split_name} · {plan.dias_totales} días</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button id="regenerate-ai" onClick={handleRegenerateAI} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.25rem', borderRadius: '10px', border: '1px solid rgba(0,176,255,0.4)', background: 'rgba(0,176,255,0.08)', color: 'var(--color-accent)', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', fontFamily: 'var(--font-heading)' }}>
            <Wand2 size={16} /> {loading ? 'Generando...' : 'Regenerar con IA'}
          </button>
          <button id="save-routine" onClick={handleSave} disabled={loading}
            className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {saved ? <><CheckCircle size={16} /> Guardado</> : <><Save size={16} /> Guardar Cambios</>}
          </button>
        </div>
      </div>

      {plan.volumen_ajustado && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,179,0,0.1)', border: '1px solid rgba(255,179,0,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#FFB300', fontSize: '0.875rem' }}>
          <AlertCircle size={16} /> Volumen reducido automáticamente por alta fatiga del cliente.
        </div>
      )}

      {/* Días */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {plan.dias.map((day, dayIdx) => (
          <div key={dayIdx} className="glass-panel" style={{ padding: '1.25rem' }}>
            <button onClick={() => setExpandedDay(expandedDay === dayIdx ? -1 : dayIdx)}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,90,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontWeight: '800', fontFamily: 'var(--font-heading)', flexShrink: 0 }}>D{dayIdx + 1}</div>
              <div style={{ flex: 1 }}>
                <input value={day.nombre} onChange={e => { const n = JSON.parse(JSON.stringify(plan)); n.dias[dayIdx].nombre = e.target.value; setPlan(n); setSaved(false); }}
                  onClick={e => e.stopPropagation()}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-main)', fontWeight: '700', fontSize: '1rem', fontFamily: 'var(--font-heading)', width: '100%', outline: 'none', cursor: 'text' }} />
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{day.ejercicios.length} ejercicios</p>
              </div>
              {expandedDay === dayIdx ? <ChevronUp size={18} color="var(--color-text-muted)" /> : <ChevronDown size={18} color="var(--color-text-muted)" />}
            </button>

            {expandedDay === dayIdx && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {day.ejercicios.map((ej, ejIdx) => (
                  <div key={ejIdx} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: '0.5rem', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                    <input value={ej.nombre} onChange={e => updateEj(dayIdx, ejIdx, 'nombre', e.target.value)} placeholder="Nombre del ejercicio"
                      style={{ ...inputSt, fontWeight: '600' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <label style={labelSt}>Series</label>
                      <input type="number" value={ej.series} onChange={e => updateEj(dayIdx, ejIdx, 'series', parseInt(e.target.value))} style={{ ...inputSt, width: '60px', textAlign: 'center' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <label style={labelSt}>Reps</label>
                      <input value={ej.repeticiones} onChange={e => updateEj(dayIdx, ejIdx, 'repeticiones', e.target.value)} style={{ ...inputSt, width: '70px', textAlign: 'center' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <label style={labelSt}>kg</label>
                      <input type="number" value={ej.peso_sugerido_kg} onChange={e => updateEj(dayIdx, ejIdx, 'peso_sugerido_kg', e.target.value)} style={{ ...inputSt, width: '60px', textAlign: 'center' }} />
                    </div>
                    <button onClick={() => removeEj(dayIdx, ejIdx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.35rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button onClick={() => addEj(dayIdx)} id={`add-ej-day-${dayIdx}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderRadius: '10px', border: '1px dashed var(--glass-border)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}>
                  <Plus size={16} /> Agregar ejercicio
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const inputSt = { padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--color-text-main)', fontSize: '0.85rem', outline: 'none', fontFamily: 'var(--font-body)' };
const labelSt = { fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '3px', letterSpacing: '0.05em' };
