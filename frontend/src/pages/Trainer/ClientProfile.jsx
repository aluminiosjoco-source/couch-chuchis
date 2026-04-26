import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Loader2, Activity, Target, AlertTriangle, FileText, Dumbbell, Apple, Calendar, ChevronRight } from 'lucide-react';

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [data, setData] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, routinesRes] = await Promise.all([
          authFetch(`http://localhost:5000/api/clients/${id}`),
          authFetch(`http://localhost:5000/api/clients/${id}/routines`)
        ]);
        if (profileRes.ok) setData(await profileRes.json());
        if (routinesRes.ok) setRoutines(await routinesRes.json());
      } catch (err) {
        console.error("Error fetching client profile:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, authFetch]);

  if (loading) return <div className="page flex-center" style={{ minHeight: '60vh' }}><Loader2 className="animate-spin" size={48} color="var(--brand)" /></div>;
  if (!data?.user) return <div className="page flex-center"><h3>Cliente no encontrado</h3></div>;

  const { user, state } = data;
  const current = state?.current_state || {};
  const profile = state?.profile_info || {};
  
  const activeRoutine = routines.find(r => r.estado === 'activa' || r.estado === 'aprobada') || routines[0];

  return (
    <div className="page anim-fade-up">
      <button className="btn-ghost btn-sm" onClick={() => navigate('/trainer')} style={{ marginBottom: 'var(--s4)', border: 'none', padding: 0 }}>
         <ArrowLeft size={16} /> Volver a Clientes
      </button>

      {/* ── Wow Header ── */}
      <header className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: 'var(--s6)', background: 'var(--bg-raised)', border: 'none' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(255,90,0,0.15) 0%, transparent 100%)', padding: 'var(--s6) var(--s6) var(--s4)' }}>
          <div className="flex justify-between items-start" style={{ flexWrap: 'wrap', gap: 'var(--s4)' }}>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 style={{ fontSize: '2.5rem', lineHeight: 1, margin: 0 }}>{user.nombre}</h1>
                {(current.riesgo_abandono > 0.5) && <span className="badge badge-red"><AlertTriangle size={12}/> Riesgo Alto</span>}
              </div>
              <p className="color-muted text-lg">
                Objetivo: <strong className="color-brand">{profile.objetivo || 'Recomposición'}</strong> • 
                {profile.experiencia || 'Intermedio'} • Semana {current.week || 1}
              </p>
            </div>
            <div className="flex gap-2">
              <Link to={`/trainer/clients/${id}/plan`} className="btn btn-primary btn-lg" style={{ height: 50, padding: '0 24px' }}>
                 Diseñar Plan Estratégico →
              </Link>
            </div>
          </div>
        </div>
        
        {/* Quick Stats Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1px', background: 'var(--border)' }}>
          {[
            { label: 'Peso Actual', val: `${current.peso || '--'} kg` },
            { label: 'Adherencia', val: `${Math.round((current.adherencia_promedio || 0) * 100)}%`, color: 'var(--green)' },
            { label: 'Fatiga', val: `${current.fatiga_ultima || '--'}/10`, color: current.fatiga_ultima >= 7 ? 'var(--red)' : '' },
            { label: 'TDEE Objetivo', val: `${current.tdee_adjusted || '--'} kcal` }
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-raised)', padding: 'var(--s4)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: s.color || 'var(--text-primary)', marginTop: 4 }}>{s.val}</div>
            </div>
          ))}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--s4)' }}>
        
        {/* ── Seguimiento de Rutina ── */}
        <div className="card flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="flex items-center gap-2"><Dumbbell color="var(--brand)"/> Entrenamiento Activo</h3>
            <Link to={`/trainer/clients/${id}/plan`} className="text-sm color-brand font-bold">Editar Plan</Link>
          </div>
          
          {activeRoutine ? (
            <div>
              <div style={{ background: 'var(--brand-dim)', padding: 'var(--s3)', borderRadius: 'var(--r-sm)', marginBottom: 'var(--s4)' }}>
                <strong>{activeRoutine.plan?.split_name || 'Rutina Personalizada'}</strong>
                <p className="text-sm color-muted mt-1">{activeRoutine.plan?.bloque_semanas || 4} Semanas • {activeRoutine.plan?.dias_totales || '?'} días/semana</p>
              </div>
              <div className="flex-col gap-2">
                {activeRoutine.plan?.dias?.map((d, i) => (
                  <div key={i} className="list-item" style={{ padding: 'var(--s3)', borderRadius: 'var(--r-sm)' }}>
                    <div style={{ flex: 1 }}>
                      <strong className="text-sm">Día {d.dia}: {d.nombre}</strong>
                      <div className="text-xs color-muted mt-1">{d.ejercicios?.length} ejercicios ({d.musculos_foco?.join(', ')})</div>
                    </div>
                    {/* Placeholder progresion */}
                    <div style={{ width: 100, height: 6, background: 'var(--bg-input)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: '0%', height: '100%', background: 'var(--green)' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-center flex-col text-center" style={{ flex: 1, padding: 'var(--s6)', background: 'var(--bg-raised)', border: '1px dashed var(--border)', borderRadius: 'var(--r-md)' }}>
              <Dumbbell size={32} color="var(--text-muted)" className="mb-3" />
              <p className="color-muted mb-4">El cliente no tiene una rutina activa estructurada en este momento.</p>
              <Link to={`/trainer/clients/${id}/plan`} className="btn btn-primary btn-sm">Asignar Rutina</Link>
            </div>
          )}
        </div>

        {/* ── Seguimiento Nutricional ── */}
        <div className="card flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="flex items-center gap-2"><Apple color="var(--green)"/> Nutrición y Macros</h3>
            <Link to={`/trainer/clients/${id}/plan`} className="text-sm color-green font-bold">Ajustar</Link>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
             <div style={{ padding: 'var(--s4)', background: 'var(--green-dim)', borderRadius: 'var(--r-sm)' }}>
               <div className="text-xs color-green font-bold mb-1">OBJETIVO DIARIO</div>
               <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                 {current.tdee_adjusted || '--'} <span className="text-sm color-muted font-body">kcal</span>
               </div>
             </div>

             <div className="flex-col gap-3">
               <div>
                  <div className="flex justify-between text-sm mb-1"><span>Proteína</span> <span className="font-bold">140g / 180g</span></div>
                  <div className="progress-track"><div className="progress-bar progress-bar--green" style={{ width: '75%' }}></div></div>
               </div>
               <div>
                  <div className="flex justify-between text-sm mb-1"><span>Carbohidratos</span> <span className="font-bold">200g / 250g</span></div>
                  <div className="progress-track"><div className="progress-bar progress-bar--brand" style={{ width: '80%' }}></div></div>
               </div>
               <div>
                  <div className="flex justify-between text-sm mb-1"><span>Grasas</span> <span className="font-bold">50g / 65g</span></div>
                  <div className="progress-track"><div className="progress-bar" style={{ width: '60%', background: 'var(--amber)' }}></div></div>
               </div>
             </div>

             <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--border)' }}>
               <p className="text-sm color-muted"><AlertTriangle size={14} style={{ display: 'inline', marginRight: 4 }} color="var(--amber)"/> Requiere adaptación cultural basada en cuestionario: {profile.estilo_vida}</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
