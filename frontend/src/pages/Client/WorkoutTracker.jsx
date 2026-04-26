import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, CheckCheck, ChevronDown, ChevronUp, Timer, Dumbbell, TrendingUp, X, RotateCcw } from 'lucide-react';

const DEMO_WORKOUT = {
  nombre: 'Upper A — Tren Superior',
  split_name: 'Upper/Lower',
  ejercicios: [
    { nombre: 'Press de Banca', series: 4, repeticiones: '8-10', peso_sugerido_kg: 70, rpe_objetivo: 8, nota: 'Agarre levemente más ancho que hombros. Baja lento 3s.' },
    { nombre: 'Remo con Barra', series: 4, repeticiones: '8-10', peso_sugerido_kg: 60, rpe_objetivo: 8, nota: 'Retracción escapular al subir. No balancees el torso.' },
    { nombre: 'Dominadas Asistidas', series: 3, repeticiones: 'AMRAP', peso_sugerido_kg: null, rpe_objetivo: 9, nota: 'Baja de forma controlada.' },
    { nombre: 'Press Militar', series: 3, repeticiones: '10-12', peso_sugerido_kg: 22, rpe_objetivo: 7, nota: 'Gira ligeramente las manos al subir.' },
    { nombre: 'Curl de Bíceps', series: 3, repeticiones: '12-15', peso_sugerido_kg: 30, rpe_objetivo: 7, nota: 'Mantén los codos pegados al cuerpo.' },
    { nombre: 'Extensión Tríceps Polea', series: 3, repeticiones: '12-15', peso_sugerido_kg: 25, rpe_objetivo: 7, nota: 'Exhala al bajar. Codos fijos.' },
  ],
};

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function WorkoutTracker({ workout = DEMO_WORKOUT }) {
  const [sets, setSets] = useState(() =>
    workout.ejercicios.map(ej => Array.from({ length: ej.series }, () => ({
      done: false, reps: '', weight: ej.peso_sugerido_kg || '',
    })))
  );
  const [expanded, setExpanded] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const [restTime, setRestTime] = useState(90);
  const [timerOn, setTimerOn] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(0);
  const timerRef = useRef(null);
  const restRef = useRef(null);

  // Main timer
  useEffect(() => {
    if (timerOn) { timerRef.current = setInterval(() => setWorkoutTime(t => t + 1), 1000); }
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [timerOn]);

  // Rest timer
  useEffect(() => {
    if (restActive) {
      restRef.current = setInterval(() => setRestTime(t => {
        if (t <= 1) { setRestActive(false); clearInterval(restRef.current); return 90; }
        return t - 1;
      }), 1000);
    } else clearInterval(restRef.current);
    return () => clearInterval(restRef.current);
  }, [restActive]);

  const markSet = (ejIdx, sIdx) => {
    setSets(prev => {
      const next = prev.map(s => [...s]);
      next[ejIdx][sIdx] = { ...next[ejIdx][sIdx], done: !next[ejIdx][sIdx].done };
      return next;
    });
    if (!sets[ejIdx][sIdx].done) { setRestActive(true); setRestTime(90); }
  };

  const updateField = (ejIdx, sIdx, field, val) => {
    setSets(prev => {
      const next = prev.map(s => [...s]);
      next[ejIdx][sIdx] = { ...next[ejIdx][sIdx], [field]: val };
      return next;
    });
  };

  const totalSets = sets.flat().length;
  const doneSets = sets.flat().filter(s => s.done).length;
  const pct = Math.round((doneSets / totalSets) * 100);
  const allDone = pct === 100;

  return (
    <div className="anim-fade-up" style={{ maxWidth: 540, margin: '0 auto' }}>
      {/* ── Sticky Header ── */}
      <div style={{
        position: 'sticky', top: 60, zIndex: 40,
        background: 'rgba(13,15,18,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: 'var(--s3) var(--s4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s3)' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>{workout.nombre}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{workout.split_name} · {workout.ejercicios.length} ejercicios</p>
          </div>

          {/* Timer */}
          <button
            id="toggle-timer"
            onClick={() => setTimerOn(t => !t)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 'var(--r-full)',
              background: timerOn ? 'var(--green-dim)' : 'var(--bg-hover)',
              border: `1px solid ${timerOn ? 'rgba(34,214,122,0.3)' : 'var(--border)'}`,
              color: timerOn ? 'var(--green)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {timerOn ? <Pause size={14} /> : <Play size={14} />}
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.04em' }}>
              {fmt(workoutTime)}
            </span>
          </button>
        </div>

        {/* Progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{doneSets}/{totalSets} series</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: allDone ? 'var(--green)' : 'var(--text-primary)' }}>{pct}%</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-bar"
              style={{
                width: `${pct}%`,
                background: allDone ? 'var(--green)' : 'linear-gradient(90deg, var(--brand), var(--amber))',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Exercise List ── */}
      <div style={{ padding: 'var(--s3) var(--s4)', display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
        {workout.ejercicios.map((ej, ejIdx) => {
          const ejSets = sets[ejIdx];
          const ejDone = ejSets.filter(s => s.done).length;
          const complete = ejDone === ejSets.length;
          const isOpen = expanded === ejIdx;

          return (
            <div
              key={ejIdx}
              className="card"
              style={{
                padding: 0, overflow: 'hidden',
                borderColor: complete ? 'rgba(34,214,122,0.25)' : 'var(--border)',
                background: complete ? 'rgba(34,214,122,0.03)' : undefined,
              }}
            >
              {/* Exercise header */}
              <button
                onClick={() => setExpanded(isOpen ? -1 : ejIdx)}
                style={{
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 'var(--s3)',
                  padding: 'var(--s3) var(--s4)', textAlign: 'left',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Status indicator */}
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--r-sm)', flexShrink: 0,
                  background: complete ? 'var(--green-dim)' : 'var(--bg-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {complete
                    ? <CheckCheck size={18} color="var(--green)" />
                    : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ejIdx + 1}</span>
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{ej.nombre}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {ej.series}×{ej.repeticiones}
                    {ej.peso_sugerido_kg ? ` · ${ej.peso_sugerido_kg}kg` : ''}
                    {' · '}RPE {ej.rpe_objetivo}
                  </p>
                </div>

                <span style={{ fontSize: '0.75rem', color: complete ? 'var(--green)' : 'var(--text-muted)', marginRight: 4, fontWeight: 600 }}>
                  {ejDone}/{ejSets.length}
                </span>
                {isOpen ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{ padding: 'var(--s1) var(--s4) var(--s4)', borderTop: '1px solid var(--border)' }}>
                  {ej.nota && (
                    <div style={{ margin: 'var(--s3) 0', padding: 'var(--s2) var(--s3)', background: 'rgba(61,169,252,0.07)', borderRadius: 'var(--r-sm)', borderLeft: '3px solid var(--blue)' }}>
                      <p style={{ fontSize: '0.78rem', color: 'var(--blue)', lineHeight: 1.4 }}>💡 {ej.nota}</p>
                    </div>
                  )}

                  {ejSets.map((set, sIdx) => (
                    <div
                      key={sIdx}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--s2)',
                        padding: 'var(--s2) var(--s3)', marginTop: 'var(--s2)',
                        background: set.done ? 'rgba(34,214,122,0.06)' : 'var(--bg-input)',
                        borderRadius: 'var(--r-md)',
                        border: `1px solid ${set.done ? 'rgba(34,214,122,0.2)' : 'var(--border)'}`,
                        transition: 'all .2s',
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', width: 44, flexShrink: 0 }}>Serie {sIdx + 1}</span>

                      <input
                        type="number"
                        placeholder="Peso"
                        value={set.weight}
                        onChange={e => updateField(ejIdx, sIdx, 'weight', e.target.value)}
                        style={{
                          width: 64, padding: '6px 8px', textAlign: 'center',
                          background: 'transparent', border: 'none',
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none',
                        }}
                      />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>kg</span>

                      <input
                        type="number"
                        placeholder="Reps"
                        value={set.reps}
                        onChange={e => updateField(ejIdx, sIdx, 'reps', e.target.value)}
                        style={{
                          width: 52, padding: '6px 8px', textAlign: 'center',
                          background: 'transparent', border: 'none',
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none',
                        }}
                      />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flex: 1 }}>reps</span>

                      <button
                        id={`set-${ejIdx}-${sIdx}`}
                        onClick={() => markSet(ejIdx, sIdx)}
                        style={{
                          padding: '7px 14px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
                          background: set.done ? 'var(--green)' : 'var(--bg-hover)',
                          color: set.done ? '#0D0F12' : 'var(--text-secondary)',
                          fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-display)',
                          transition: 'all .2s', flexShrink: 0,
                        }}
                      >
                        {set.done ? '✓' : 'OK'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Complete Banner ── */}
      {allDone && (
        <div style={{ padding: '0 var(--s4) var(--s6)' }} className="anim-fade-up">
          <div className="card card--green" style={{ textAlign: 'center', padding: 'var(--s6)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--s2)' }}>🎉</div>
            <h2 style={{ marginBottom: 'var(--s2)' }}>¡Entreno completado!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--s4)' }}>
              {fmt(workoutTime)} · {totalSets} series
            </p>
            <button className="btn btn-green" style={{ margin: '0 auto', display: 'inline-flex', gap: 8 }}>
              <TrendingUp size={18} /> Guardar progreso
            </button>
          </div>
        </div>
      )}

      {/* ── Rest Timer (floating) ── */}
      {restActive && (
        <div style={{
          position: 'fixed', bottom: 'calc(var(--nav-h) + var(--safe-bottom) + 16px)',
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 90, width: 'calc(100% - 32px)', maxWidth: 300,
          background: 'var(--bg-raised)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)', padding: 'var(--s4)',
          boxShadow: 'var(--shadow-md)', backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', gap: 'var(--s3)',
        }}>
          <Timer size={20} color={restTime <= 15 ? 'var(--red)' : 'var(--brand)'} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tiempo de descanso</p>
            <p style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', lineHeight: 1,
              color: restTime <= 15 ? 'var(--red)' : 'var(--text-primary)',
            }}>{fmt(restTime)}</p>
          </div>
          <button
            onClick={() => { setRestActive(false); setRestTime(90); }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}