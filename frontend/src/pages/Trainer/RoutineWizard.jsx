import React, { useState, useEffect } from 'react';
import { X, Bot, Cpu, User, FileText, Loader2, Send, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DebateChat from '../../components/DebateChat';

export default function RoutineWizard({ client, onClose }) {
  const { authFetch } = useAuth();
  const [step, setStep] = useState(1);
  const [type, setType] = useState(''); // 'ia_pura', 'cliente_nuevo', 'sin_cliente', 'propuesta_coach'
  const [formData, setFormData] = useState({ bloque_semanas: 4 });
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [result, setResult] = useState(null);

  const isAnonymous = !client;

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleCreate = async (overrideType) => {
    setLoading(true);
    setElapsedTime(0);
    try {
      const currentType = typeof overrideType === 'string' ? overrideType : type;
      let endpoint = '';
      let payload = {};

      if (currentType === 'cliente_nuevo' || currentType === 'sin_cliente') {
        endpoint = currentType === 'cliente_nuevo' ? '/api/agents/routine/new-client' : '/api/agents/routine/anonymous';
        payload = { profile_info: formData, client_id: client?.id };
      } else if (currentType === 'ia_pura') {
        endpoint = `/api/agents/routine/existing/${client.id}`;
        // Para ia_pura también pasamos los parámetros que hayamos decidido
        payload = { bloque_semanas: formData.bloque_semanas };
      } else if (currentType === 'propuesta_coach') {
        endpoint = '/api/agents/routine/coach-draft';
        payload = { draftText: formData.draft, client_id: client?.id };
      }

      if (!endpoint) {
        throw new Error("No se pudo determinar el endpoint (tipo inválido)");
      }

      const res = await authFetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResult(data.routine);
      setStep(3);
    } catch (err) {
      console.error(err);
      alert("Error generando rutina");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await authFetch(`http://localhost:5000/api/agents/routine/${result._id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: 'Aprobado desde wizard' })
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error aprobando");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
      background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(5px)'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: step === 3 ? '1000px' : '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', background: '#111' }}>
        <button className="btn-icon" onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.05)' }}>
          <X color="white"/>
        </button>
        
        <div style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu color="var(--color-accent)"/> {step === 3 ? 'Revisión Técnica' : 'Creador de Rutinas IA'}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
            {step === 3 ? 'Por favor revisa la estructura biomecánica antes de aprobar la rutina.' : client ? `Generando para ${client.nombre}` : 'Generando rutina libre (Sin cliente asociado)'}
          </p>

          {/* PASO 1: SELECCION DE TIPO */}
          {step === 1 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 <label style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}><Calendar size={14}/> Duración del Bloque:</label>
                 <select className="form-control" style={{ width: 'auto' }} value={formData.bloque_semanas} onChange={e => setFormData({...formData, bloque_semanas: parseInt(e.target.value)})}>
                    <option value={2}>2 Semanas</option>
                    <option value={4}>4 Semanas (Estándar)</option>
                    <option value={6}>6 Semanas</option>
                    <option value={8}>8 Semanas</option>
                 </select>
               </div>

               {!isAnonymous && (
                 <button className={`glass-panel text-left ${type === 'ia_pura' ? 'border-accent' : ''}`} onClick={() => { setType('ia_pura'); setStep(2); handleCreate('ia_pura'); }} style={{ padding: '1.5rem', cursor: 'pointer', transition: '0.2s', border: type === 'ia_pura' ? '2px solid var(--color-accent)' : '1px solid #333' }}>
                    <h3 style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><Cpu color="var(--color-accent)"/> IA Pura (1 Click)</h3>
                    <p style={{ color: 'var(--color-text-muted)' }}>Utiliza el expediente completo y el historial más reciente para generar un plan de {formData.bloque_semanas} semanas perfecto.</p>
                 </button>
               )}
               <button className={`glass-panel text-left ${type === 'cliente_nuevo' ? 'border-accent' : ''}`} onClick={() => { setType(isAnonymous ? 'sin_cliente' : 'cliente_nuevo'); setStep(2); }} style={{ padding: '1.5rem', cursor: 'pointer', transition: '0.2s' }}>
                  <h3 style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><User color="var(--color-secondary)"/> Parámetros Manuales</h3>
                  <p style={{ color: 'var(--color-text-muted)' }}>Llena un formulario rápido para definir el objetivo antes de la generación.</p>
               </button>
               <button className={`glass-panel text-left ${type === 'propuesta_coach' ? 'border-accent' : ''}`} onClick={() => { setType('propuesta_coach'); setStep(2); }} style={{ padding: '1.5rem', cursor: 'pointer', transition: '0.2s' }}>
                  <h3 style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><FileText color="#FBC02D"/> Propuesta Coach (Debate Copiloto)</h3>
                  <p style={{ color: 'var(--color-text-muted)' }}>Pega o escribe tu propia rutina. La IA la validará biomecánicamente.</p>
               </button>
            </div>
          )}

          {/* PASO 2: FORMULARIO Y LOADING */}
          {step === 2 && type !== 'ia_pura' && !loading && (
            <div className="animate-fade-in">
              {type === 'propuesta_coach' ? (
                <div>
                   <h3 style={{marginBottom:'1rem'}}>Redacta la rutina</h3>
                   <textarea className="form-control" rows={10} placeholder="Ej: Lunes pecho/bicep. Sentadillas 4x10..." onChange={e => setFormData({...formData, draft: e.target.value})} style={{width:'100%', marginBottom:'1rem'}}></textarea>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                   <div>
                     <label className="form-label">Objetivo</label>
                     <select className="form-control" onChange={e => setFormData({...formData, objetivo: e.target.value})}>
                       <option value="hipertrofia">Hipertrofia</option><option value="fuerza">Fuerza</option><option value="perdida_grasa">Pérdida de Grasa</option>
                     </select>
                   </div>
                   <div>
                     <label className="form-label">Experiencia</label>
                     <select className="form-control" onChange={e => setFormData({...formData, experiencia: e.target.value})}>
                       <option value="principiante">Principiante</option><option value="intermedio">Intermedio</option><option value="avanzado">Avanzado</option>
                     </select>
                   </div>
                   <div>
                     <label className="form-label">Días Disponibles</label>
                     <input type="number" min="1" max="7" className="form-control" defaultValue={4} onChange={e => setFormData({...formData, dias_disponibles: parseInt(e.target.value)})} />
                   </div>
                   <div>
                     <label className="form-label">Equipamiento</label>
                     <select className="form-control" onChange={e => setFormData({...formData, equipamiento: e.target.value})}>
                       <option value="gimnasio">Gimnasio Comercial</option><option value="casa">Casa (Mancuernas)</option><option value="sin_equipo">Peso Corporal</option>
                     </select>
                   </div>
                </div>
              )}
              
              <div className="flex-between">
                <button className="btn-secondary" onClick={() => setStep(1)}>Atrás</button>
                <button className="btn-primary" onClick={handleCreate} disabled={loading}>
                   Generar Bloque de {formData.bloque_semanas} Semanas
                </button>
              </div>
            </div>
          )}

          {/* LOADING STATE - TIMER */}
          {loading && (
            <div className="flex-center animate-fade-in" style={{ flexDirection: 'column', gap: '1.5rem', height: '300px' }}>
              <Loader2 className="animate-spin" size={64} color="var(--color-accent)" />
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '0.5rem', color: 'white' }}>La IA está analizando el expediente y generando la rutina...</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Evitando lesiones, ajustando variables biomecánicas y redactando explicaciones.</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '10px' }}>
                  <Clock size={16} color="var(--color-secondary)" />
                  <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: 'white', fontWeight: 'bold' }}>{formatTime(elapsedTime)}</span>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: RESULTADO / DEBATE */}
          {step === 3 && result && (
             <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,107,0,0.05)', border: '1px solid var(--color-accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <h3 style={{color:'var(--color-accent)', marginBottom:'0.5rem'}}>{result.plan?.split_name || 'Rutina Generada'}</h3>
                     <p style={{color:'white', fontSize:'0.9rem'}}>{result.plan?.notas_generales || 'Rutina procesada correctamente'}</p>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <strong style={{color:'var(--color-text-muted)', display: 'block'}}>Bloque: {result.plan?.bloque_semanas || formData.bloque_semanas} Semanas</strong>
                     <strong style={{color:'var(--color-text-muted)', display: 'block'}}>Días por sem: {result.plan?.dias_totales || '?'}</strong>
                   </div>
                </div>

                {/* Tabla de Ejercicios */}
                {result.plan?.dias && result.plan.dias.map((dia, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--color-secondary)' }}>Día {dia.dia}: {dia.nombre} ({dia.musculos_foco?.join(', ')})</h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <th style={{ padding: '0.8rem', textAlign: 'left', borderRadius: '8px 0 0 8px' }}>Ejercicio</th>
                            <th style={{ padding: '0.8rem', textAlign: 'center' }}>Volumen</th>
                            <th style={{ padding: '0.8rem', textAlign: 'center' }}>RPE / Peso</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', borderRadius: '0 8px 8px 0', width: '40%' }}>Justificación / Técnica (Coach Only)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dia.ejercicios.map((ej, ejIdx) => (
                            <tr key={ejIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '0.8rem', verticalAlign: 'top' }}><strong>{ej.nombre}</strong></td>
                              <td style={{ padding: '0.8rem', textAlign: 'center', verticalAlign: 'top' }}>{ej.series} x {ej.repeticiones}</td>
                              <td style={{ padding: '0.8rem', textAlign: 'center', verticalAlign: 'top' }}>
                                <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>RPE {ej.rpe_objetivo}</span>
                                {ej.peso_sugerido_kg && <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{ej.peso_sugerido_kg}kg</div>}
                              </td>
                              <td style={{ padding: '0.8rem', verticalAlign: 'top' }}>
                                <div style={{ marginBottom: '4px', fontStyle: 'italic', color: '#999' }}>{ej.explicacion_tecnica || 'Sin justificación'}</div>
                                {ej.nota && <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary)' }}>Nota: {ej.nota}</div>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {/* Si fue propuesta coach, abrir el chat de debate */}
                {type === 'propuesta_coach' && (
                  <DebateChat routineId={result._id} initialLog={result.debate_log} />
                )}

                <div className="flex-between" style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                  <button className="btn-secondary" onClick={() => {
                    if (window.confirm("¿Descartar esta rutina?")) {
                      authFetch(`http://localhost:5000/api/agents/routine/${result._id}`, { method: 'DELETE' });
                      onClose();
                    }
                  }}>Descartar</button>
                  <button className="btn-primary" onClick={handleApprove} style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>✅ Aprobar e Implementar ({result.plan?.bloque_semanas || formData.bloque_semanas} Semanas)</button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
