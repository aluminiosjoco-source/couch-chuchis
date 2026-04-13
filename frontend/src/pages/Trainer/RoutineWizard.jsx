import React, { useState } from 'react';
import { X, Bot, Cpu, User, FileText, Loader2, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DebateChat from '../../components/DebateChat';

export default function RoutineWizard({ client, onClose }) {
  const { authFetch } = useAuth();
  const [step, setStep] = useState(1);
  const [type, setType] = useState(''); // 'ia_pura', 'cliente_nuevo', 'sin_cliente', 'propuesta_coach'
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const isAnonymous = !client;

  const handleCreate = async (overrideType) => {
    setLoading(true);
    try {
      const currentType = typeof overrideType === 'string' ? overrideType : type;
      let endpoint = '';
      let payload = {};

      if (currentType === 'cliente_nuevo' || currentType === 'sin_cliente') {
        endpoint = currentType === 'cliente_nuevo' ? '/api/agents/routine/new-client' : '/api/agents/routine/anonymous';
        payload = { profile_info: formData, client_id: client?.id };
      } else if (currentType === 'ia_pura') {
        endpoint = `/api/agents/routine/existing/${client.id}`;
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

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
      background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', pading: '1rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', background: '#111' }}>
        <button className="btn-icon" onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent' }}>
          <X color="white"/>
        </button>
        
        <div style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Creador de Rutinas IA</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
            {client ? `Generando para ${client.nombre}` : 'Generando rutina libre (Sin cliente asociado)'}
          </p>

          {/* PASO 1: SELECCION DE TIPO */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {!isAnonymous && (
                 <button className={`glass-panel text-left ${type === 'ia_pura' ? 'border-accent' : ''}`} onClick={() => { setType('ia_pura'); setStep(2); handleCreate('ia_pura'); }} style={{ padding: '1.5rem', cursor: 'pointer', transition: '0.2s', border: type === 'ia_pura' ? '2px solid var(--color-accent)' : '1px solid #333' }}>
                    <h3 style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><Cpu color="var(--color-accent)"/> IA Pura (1 Click)</h3>
                    <p style={{ color: 'var(--color-text-muted)' }}>Utiliza el contexto y el historial más reciente de la base de datos para generar la semana actual.</p>
                 </button>
               )}
               <button className={`glass-panel text-left ${type === 'cliente_nuevo' ? 'border-accent' : ''}`} onClick={() => { setType(isAnonymous ? 'sin_cliente' : 'cliente_nuevo'); setStep(2); }} style={{ padding: '1.5rem', cursor: 'pointer', transition: '0.2s' }}>
                  <h3 style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><User color="var(--color-secondary)"/> Parámetros Manuales</h3>
                  <p style={{ color: 'var(--color-text-muted)' }}>Llena un formulario rápido con las características para esta rutina.</p>
               </button>
               <button className={`glass-panel text-left ${type === 'propuesta_coach' ? 'border-accent' : ''}`} onClick={() => { setType('propuesta_coach'); setStep(2); }} style={{ padding: '1.5rem', cursor: 'pointer', transition: '0.2s' }}>
                  <h3 style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><FileText color="#FBC02D"/> Propuesta Coach (Debate Copiloto)</h3>
                  <p style={{ color: 'var(--color-text-muted)' }}>Pega o escribe tu propia rutina. La IA la validará biomecánicamente y podrán conversar sobre mejoras.</p>
               </button>
            </div>
          )}

          {/* PASO 2: FORMULARIO */}
          {step === 2 && type !== 'ia_pura' && (
            <div className="animate-fade-in">
              {type === 'propuesta_coach' ? (
                <div>
                   <h3 style={{marginBottom:'1rem'}}>Redacta la rutina</h3>
                   <textarea className="form-control" rows={10} placeholder="Ej: Lunes pecho/bicep. Sentadillas 4x10..." onChange={e => setFormData({draft: e.target.value})} style={{width:'100%', marginBottom:'1rem'}}></textarea>
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
                  {loading ? <Loader2 className="animate-spin" /> : 'Generar / Validar con IA'}
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: RESULTADO / DEBATE */}
          {step === 3 && result && (
             <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,107,0,0.05)', border: '1px solid var(--color-accent)' }}>
                   <h3 style={{color:'var(--color-accent)', marginBottom:'0.5rem'}}>{result.plan?.split_name || 'Rutina Generada'}</h3>
                   <p style={{color:'white'}}>{result.plan?.notas_generales || 'Rutina procesada correctamente'}</p>
                   {result.plan?.dias && (
                     <div style={{marginTop:'1rem'}}>
                       <strong style={{color:'var(--color-text-muted)'}}>Días estructurados: {result.plan.dias_totales}</strong>
                     </div>
                   )}
                </div>

                {/* Si fue propuesta coach, abrir el chat de debate */}
                {type === 'propuesta_coach' && (
                  <DebateChat routineId={result._id} initialLog={result.debate_log} />
                )}

                <div className="flex-between" style={{ marginTop: '1rem' }}>
                  <button className="btn-secondary" onClick={onClose}>Cerrar</button>
                  <button className="btn-primary" onClick={handleApprove}>Aprobar e Implementar</button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
