import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Dumbbell, Apple, Loader2, Cpu, ArrowLeft, Pill, Clock, Calendar } from 'lucide-react';

export default function ClientPlanEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [activeTab, setActiveTab] = useState('rutina'); // rutina, nutricion, suplementos
  const [client, setClient] = useState(null);
  const [loadingClient, setLoadingClient] = useState(true);

  // States for Routine Generation
  const [routineLoading, setRoutineLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [routineResult, setRoutineResult] = useState(null);
  const [bloqueSemanas, setBloqueSemanas] = useState(4);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch(`http://localhost:5000/api/clients/${id}`);
        if (res.ok) setClient(await res.json());
      } catch (err) { }
      finally { setLoadingClient(false); }
    })();
  }, [id]);

  useEffect(() => {
    let interval;
    if (routineLoading) interval = setInterval(() => setElapsedTime(p => p + 1), 1000);
    else setElapsedTime(0);
    return () => clearInterval(interval);
  }, [routineLoading]);

  const handleGenerateRoutine = async (isRetry = false) => {
    setRoutineLoading(true);
    try {
      const body = { bloque_semanas: bloqueSemanas };
      if (isRetry && routineResult) {
        body.draft_plan = routineResult.plan;
        body.routine_id = routineResult._id;
      }
      
      const res = await authFetch(`http://localhost:5000/api/agents/routine/existing/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setRoutineResult(data.routine);
    } catch (err) {
      alert("Error generando rutina");
    } finally {
      setRoutineLoading(false);
    }
  };

  const handleApproveRoutine = async () => {
    try {
      await authFetch(`http://localhost:5000/api/agents/routine/${routineResult._id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: 'Aprobado desde Editor' })
      });
      alert('Rutina aprobada e implementada al cliente.');
      navigate(`/trainer/clients/${id}`);
    } catch (err) {
      alert("Error aprobando");
    }
  };

  if (loadingClient) {
    return (
      <div className="page flex-center" style={{ minHeight: '60vh' }}>
        <Loader2 className="animate-spin" size={40} color="var(--brand)" />
      </div>
    );
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="page anim-fade-up">
      {/* ── Header ── */}
      <div style={{ marginBottom: 'var(--s6)' }}>
        <button className="btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 'var(--s3)', border: 'none', padding: 0 }}>
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="page-title">Diseño de Plan Estratégico</h1>
            <p className="page-subtitle">Configuración del motor para {client?.nombre}</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 'var(--s2)', marginBottom: 'var(--s4)', borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'rutina', icon: Dumbbell, label: 'Entrenamiento' },
          { id: 'nutricion', icon: Apple, label: 'Nutrición' },
          { id: 'suplementos', icon: Pill, label: 'Suplementos' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: 'var(--s3) var(--s4)',
              background: 'none', border: 'none',
              borderBottom: activeTab === t.id ? '2px solid var(--brand)' : '2px solid transparent',
              color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <t.icon size={18} color={activeTab === t.id ? 'var(--brand)' : 'currentColor'} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content: Rutina ── */}
      {activeTab === 'rutina' && (
        <div className="card">
          {!routineResult && !routineLoading && (
            <div className="flex-col gap-4">
              <h3 className="flex items-center gap-2"><Cpu color="var(--brand)" /> Generación Asistida</h3>
              <p className="text-muted text-sm">El motor leerá el expediente de salud, la experiencia y la meta para estructurar un bloque de entrenamiento progresivo.</p>

              <div style={{ padding: 'var(--s4)', background: 'var(--bg-input)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 'var(--s4)' }}>
                <div>
                  <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> Duración del Bloque</label>
                  <select className="select mt-2" style={{ minWidth: 200 }} value={bloqueSemanas} onChange={e => setBloqueSemanas(parseInt(e.target.value))}>
                    <option value={2}>2 Semanas</option>
                    <option value={4}>4 Semanas (Estándar)</option>
                    <option value={6}>6 Semanas</option>
                    <option value={8}>8 Semanas</option>
                  </select>
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: 'fit-content' }} onClick={handleGenerateRoutine}>
                Generar Bloque de {bloqueSemanas} Semanas
              </button>
            </div>
          )}

          {routineLoading && (
            <div className="flex-col items-center justify-center gap-4" style={{ height: 300 }}>
              <Loader2 className="animate-spin" size={48} color="var(--brand)" />
              <h3 style={{ color: 'var(--text-primary)' }}>Estructurando bloque de {bloqueSemanas} semanas...</h3>
              <p className="text-muted text-sm">Analizando biometría y asignando parámetros de hipertrofia/fuerza.</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--bg-raised)', padding: '8px 16px', borderRadius: '12px' }}>
                <Clock size={16} color="var(--amber)" />
                <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 'bold' }}>{formatTime(elapsedTime)}</span>
              </div>
            </div>
          )}

          {routineResult && (
            <div className="anim-fade-in flex-col gap-4">
              <div style={{ padding: 'var(--s4)', background: routineResult.plan?.is_partial ? 'var(--bg-card)' : 'var(--brand-dim)', border: routineResult.plan?.is_partial ? '1px solid var(--amber)' : '1px solid var(--brand-border)', borderRadius: 'var(--r-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ color: routineResult.plan?.is_partial ? 'var(--amber)' : 'var(--brand)' }}>
                    {routineResult.plan?.split_name || 'Bloque Generado'} 
                    {routineResult.plan?.is_partial && ' (Incompleto)'}
                  </h3>
                  <p className="text-sm mt-1">{routineResult.plan?.notas_generales}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {routineResult.plan?.is_partial ? (
                     <span className="badge" style={{ background: 'var(--amber-dim)', color: 'var(--amber)', borderColor: 'var(--amber)' }}>Avance Parcial Guardado</span>
                  ) : (
                     <span className="badge badge-brand">Bloque: {routineResult.plan?.bloque_semanas || bloqueSemanas} Semanas</span>
                  )}
                </div>
              </div>

              {routineResult.plan?.is_partial && (
                <div style={{ background: 'var(--amber-dim)', color: 'var(--amber)', padding: 'var(--s3)', borderRadius: 'var(--r-md)', fontSize: '0.9rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Cpu size={16} /> Hubo una interrupción con el motor de IA. Puedes hacer clic en "Reintentar" para continuar desde donde se quedó.
                </div>
              )}

              <div className="flex-col gap-3">
                {routineResult.plan?.dias?.map((dia, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 'var(--s4)' }}>
                    <h4 className="color-amber mb-3">Día {dia.dia}: {dia.nombre} ({dia.musculos_foco?.join(', ')})</h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Ejercicio</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>Series x Reps</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>RPE / Peso</th>
                            <th style={{ padding: '8px', textAlign: 'left', width: '40%' }}>Justificación Restringida (Coach)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dia.ejercicios.map((ej, ejIdx) => (
                            <tr key={ejIdx} style={{ borderBottom: '1px solid var(--border-hover)' }}>
                              <td style={{ padding: '12px 8px', verticalAlign: 'top', fontWeight: 600 }}>{ej.nombre}</td>
                              <td style={{ padding: '12px 8px', textAlign: 'center', verticalAlign: 'top' }}>{ej.series} x {ej.repeticiones}</td>
                              <td style={{ padding: '12px 8px', textAlign: 'center', verticalAlign: 'top' }}>
                                <span className="color-brand font-bold">RPE {ej.rpe_objetivo}</span>
                                {ej.peso_sugerido_kg && <div className="text-xs color-muted mt-1">{ej.peso_sugerido_kg}kg</div>}
                              </td>
                              <td style={{ padding: '12px 8px', verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                                <div style={{ marginBottom: 4, fontStyle: 'italic' }}>{ej.explicacion_tecnica || 'Sin justificación'}</div>
                                {ej.nota && <div className="text-xs color-amber">Nota: {ej.nota}</div>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                {routineResult.plan?.is_partial ? (
                  <>
                    <button className="btn btn-ghost" onClick={() => setRoutineResult(null)}>Descartar todo</button>
                    <button className="btn btn-primary" onClick={() => handleGenerateRoutine(true)}>🔄 Reintentar (Continuar desde el Día {routineResult.plan.dias.length + 1})</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-secondary" onClick={() => setRoutineResult(null)}>Descartar y Regenerar</button>
                    <button className="btn btn-primary" onClick={handleApproveRoutine}>✅ Aprobar e Implementar al Cliente</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: Nutrición ── */}
      {activeTab === 'nutricion' && (
        <div className="card text-center" style={{ padding: 'var(--s10)' }}>
          <Apple size={48} color="var(--text-muted)" style={{ margin: '0 auto var(--s4)' }} />
          <h3>Cálculo Metabólico y Macros</h3>
          <p className="text-muted mt-2 mb-6">El motor utilizará la ecuación de Mifflin-St Jeor para asignar los macros automáticos basados en la actividad del paciente. (Próximamente activo tras refactorización)</p>
          <button className="btn btn-secondary" disabled>Generar Dieta Automática</button>
        </div>
      )}

      {/* ── Tab Content: Suplementos ── */}
      {activeTab === 'suplementos' && (
        <div className="card text-center" style={{ padding: 'var(--s10)' }}>
          <Pill size={48} color="var(--text-muted)" style={{ margin: '0 auto var(--s4)' }} />
          <h3>Protocolo de Suplementación</h3>
          <p className="text-muted mt-2">Permite recetar creatina, cafeína, omega 3, etc., basado estrictamente en el historial médico y las contraindicaciones del paciente.</p>
        </div>
      )}
    </div>
  );
}
