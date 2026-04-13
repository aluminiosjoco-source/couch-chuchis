import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, CheckCheck, RotateCcw, ChevronDown, ChevronUp, Timer, Dumbbell, TrendingUp } from 'lucide-react';

const DEMO_WORKOUT = {
  nombre: 'Upper A — Tren Superior',
  split_name: 'Upper/Lower',
  ejercicios: [
    { nombre: 'Press de Banca', series: 4, repeticiones: '8-10', peso_sugerido_kg: 70, rpe_objetivo: 8, nota: 'Agarre levemente más ancho que hombros. Baja lento 3s.' },
    { nombre: 'Remo con Barra', series: 4, repeticiones: '8-10', peso_sugerido_kg: 60, rpe_objetivo: 8, nota: 'Retracción escapular al subir. No balancees el torso.' },
    { nombre: 'Dominadas Asistidas', series: 3, repeticiones: 'AMRAP', peso_sugerido_kg: null, rpe_objetivo: 9, nota: 'Baja de forma controlada. Cuenta 2 segundos.' },
    { nombre: 'Press Militar con Mancuernas', series: 3, repeticiones: '10-12', peso_sugerido_kg: 22, rpe_objetivo: 7, nota: 'Gira ligeramente las manos al subir.' },
    { nombre: 'Curl de Bíceps con Barra', series: 3, repeticiones: '12-15', peso_sugerido_kg: 30, rpe_objetivo: 7, nota: 'Mantén los codos pegados al cuerpo.' },
    { nombre: 'Extensión de Tríceps en Polea', series: 3, repeticiones: '12-15', peso_sugerido_kg: 25, rpe_objetivo: 7, nota: 'Exhala al bajar. Mantén codos fijos.' },
  ],
};

export default function WorkoutTracker({ workout = DEMO_WORKOUT }) {
  const [sets, setSets] = useState(() =>
    workout.ejercicios.map(ej => Array.from({ length: ej.series }, () => ({ done: false, reps: '', weight: ej.peso_sugerido_kg || '' })))
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [expanded, setExpanded] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const [restTime, setRestTime] = useState(90);
  const [timerActive, setTimerActive] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(0);
  const intervalRef = useRef(null);
  const restRef = useRef(null);

  // Cronómetro de entrenamiento
  useEffect(() => {
    if (timerActive) {
      intervalRef.current = setInterval(() => setWorkoutTime(t => t + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerActive]);

  // Temporizador de descanso
  useEffect(() => {
    if (restActive && restTime > 0) {
      restRef.current = setInterval(() => setRestTime(t => { if (t <= 1) { setRestActive(false); clearInterval(restRef.current); return 90; } return t - 1; }), 1000);
    } else {
      clearInterval(restRef.current);
    }
    return () => clearInterval(restRef.current);
  }, [restActive]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const markSet = (ejIdx, setIdx) => {
    setSets(prev => {
      const next = prev.map(s => [...s]);
      next[ejIdx][setIdx] = { ...next[ejIdx][setIdx], done: !next[ejIdx][setIdx].done };
      return next;
    });
    setRestActive(true);
    setRestTime(90);
  };

  const updateSetField = (ejIdx, setIdx, field, val) => {
    setSets(prev => {
      const next = prev.map(s => [...s]);
      next[ejIdx][setIdx] = { ...next[ejIdx][setIdx], [field]: val };
      return next;
    });
  };

  const totalSets = sets.flat().length;
  const doneSets = sets.flat().filter(s => s.done).length;
  const pct = Math.round((doneSets / totalSets) * 100);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{workout.nombre}</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{workout.split_name} · {workout.ejercicios.length} ejercicios</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Cronómetro */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: timerActive ? 'var(--color-secondary)' : 'var(--color-text-muted)' }}>{fmt(workoutTime)}</div>
              <button id="toggle-timer" onClick={() => setTimerActive(t => !t)} style={{ background: 'none', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.3rem 0.75rem', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto' }}>
                {timerActive ? <><Pause size={12} /> Pausar</> : <><Play size={12} /> Iniciar</>}
              </button>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div>
          <div className="flex-between" style={{ marginBottom: '0.4rem', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Series completadas: {doneSets}/{totalSets}</span>
            <span style={{ fontWeight: '700', color: pct === 100 ? 'var(--color-secondary)' : 'var(--color-text-main)' }}>{pct}%</span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'linear-gradient(90deg,#00E676,#00B0FF)' : 'linear-gradient(90deg,var(--color-primary),#FF8A00)', borderRadius: '99px', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>

      {/* Temporizador de descanso flotante */}
      {restActive && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 999, background: 'rgba(20,24,30,0.95)', border: '2px solid var(--color-primary)', borderRadius: '16px', padding: '1rem 1.5rem', textAlign: 'center', backdropFilter: 'blur(12px)' }}>
          <Timer size={20} color="var(--color-primary)" style={{ marginBottom: '0.25rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: '800', color: restTime <= 15 ? 'var(--color-primary)' : 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>{fmt(restTime)}</div>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Tiempo de descanso</p>
          <button onClick={() => { setRestActive(false); setRestTime(90); }} style={{ background: 'none', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.25rem 0.75rem', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.72rem' }}>
            Saltar
          </button>
        </div>
      )}

      {/* Lista de ejercicios */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {workout.ejercicios.map((ej, ejIdx) => {
          const ejSets = sets[ejIdx];
          const ejDone = ejSets.filter(s => s.done).length;
          const ejComplete = ejDone === ejSets.length;
          const isExpanded = expanded === ejIdx;

          return (
            <div key={ejIdx} className="glass-panel" style={{ padding: '1.25rem', border: ejComplete ? '1px solid rgba(0,230,118,0.3)' : '1px solid var(--glass-border)', background: ejComplete ? 'rgba(0,230,118,0.03)' : undefined }}>
              {/* Cabecera del ejercicio */}
              <button onClick={() => setExpanded(isExpanded ? -1 : ejIdx)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: ejComplete ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {ejComplete ? <CheckCheck size={18} color="var(--color-secondary)" /> : <Dumbbell size={18} color="var(--color-text-muted)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '0.15rem' }}>{ej.nombre}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    {ej.series} series × {ej.repeticiones} reps {ej.peso_sugerido_kg ? `· ${ej.peso_sugerido_kg}kg` : ''} · RPE {ej.rpe_objetivo}
                  </p>
                </div>
                <span style={{ fontSize: '0.78rem', color: ejComplete ? 'var(--color-secondary)' : 'var(--color-text-muted)', marginRight: '0.5rem' }}>{ejDone}/{ejSets.length}</span>
                {isExpanded ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
              </button>

              {/* Detalle expandido */}
              {isExpanded && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                  {ej.nota && <p style={{ fontSize: '0.8rem', color: 'var(--color-accent)', marginBottom: '1rem', padding: '0.5rem 0.75rem', background: 'rgba(0,176,255,0.07)', borderRadius: '8px', borderLeft: '3px solid var(--color-accent)' }}>💡 {ej.nota}</p>}

                  {/* Tabla de series */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {ejSets.map((set, setIdx) => (
                      <div key={setIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: '10px', background: set.done ? 'rgba(0,230,118,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${set.done ? 'rgba(0,230,118,0.25)' : 'var(--glass-border)'}` }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-text-muted)', width: '48px', flexShrink: 0 }}>Serie {setIdx + 1}</span>

                        <input type="number" placeholder="Peso" value={set.weight} onChange={e => updateSetField(ejIdx, setIdx, 'weight', e.target.value)}
                          style={{ width: '70px', padding: '0.35rem 0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--color-text-main)', fontSize: '0.82rem', textAlign: 'center', outline: 'none' }} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>kg</span>

                        <input type="number" placeholder="Reps" value={set.reps} onChange={e => updateSetField(ejIdx, setIdx, 'reps', e.target.value)}
                          style={{ width: '60px', padding: '0.35rem 0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--color-text-main)', fontSize: '0.82rem', textAlign: 'center', outline: 'none' }} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', flex: 1 }}>reps</span>

                        <button id={`set-${ejIdx}-${setIdx}`} onClick={() => markSet(ejIdx, setIdx)}
                          style={{ padding: '0.4rem 0.9rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: set.done ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.08)', color: set.done ? 'var(--color-secondary)' : 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: '700', transition: 'all 0.2s' }}>
                          {set.done ? '✓ OK' : 'Hecha'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botón finalizar */}
      {pct === 100 && (
        <div className="glass-panel animate-fade-in" style={{ marginTop: '1.5rem', textAlign: 'center', padding: '2rem', border: '1px solid rgba(0,230,118,0.3)', background: 'rgba(0,230,118,0.05)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
          <h2 className="text-gradient-green" style={{ marginBottom: '0.5rem' }}>¡Entrenamiento Completado!</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Duración: {fmt(workoutTime)} · {totalSets} series completadas</p>
          <button className="btn-primary" style={{ background: 'linear-gradient(135deg,#00E676,#00B0FF)', display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
            <TrendingUp size={18} /> Guardar y Ver Progreso
          </button>
        </div>
      )}
    </div>
  );
}
