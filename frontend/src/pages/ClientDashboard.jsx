import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Dumbbell, CheckCircle2, TrendingUp, Flame, Activity,
  ChevronRight, Loader2, Moon, Zap, Target, Apple, Calendar, Utensils
} from 'lucide-react';

function MetricCard({ icon, label, value, unit, color = 'var(--text-primary)', sub }) {
  return (
    <div className="card" style={{ padding: 'var(--s4)', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', marginBottom: 'var(--s2)' }}>
        <div style={{ color }}>{icon}</div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', color, lineHeight: 1 }}>
        {value}<span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 3 }}>{unit}</span>
      </div>
      {sub && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

export default function ClientDashboard() {
  const { user, authFetch } = useAuth();
  const [clientState, setClientState] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    (async () => {
      try {
        const uid = user?.id || user?._id;
        const [rs, rr] = await Promise.all([
          authFetch(`http://localhost:5000/api/clients/${uid}`),
          authFetch(`http://localhost:5000/api/clients/${uid}/routines`),
        ]);
        if (rs.ok) { const d = await rs.json(); setClientState(d.state); }
        if (rr.ok) setRoutines(await rr.json());
      } catch { /* offline */ }
      finally { setLoading(false); }
    })();
  }, [user]);

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} color="var(--brand)" className="spin" />
    </div>
  );

  const cs = clientState?.current_state || {};
  const adherencia = Math.round((cs.adherencia_promedio || 0) * 100);
  const semana = cs.week || 1;
  const activeRoutine = routines.find(r => r.estado === 'activa' || r.estado === 'aprobada') || routines[0]; // Temporalmente mostrar la primera si no hay activa

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '¡Buenos días' : hour < 19 ? '¡Buenas tardes' : '¡Buenas noches';

  const renderDashboard = () => (
    <>
      <div style={{ padding: '0 var(--s4)', marginBottom: 'var(--s4)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s3)' }}>
        <Link to="/client/checkin" style={{ textDecoration: 'none' }}>
          <div className="card card--brand" style={{ padding: 'var(--s4)', display: 'flex', flexDirection: 'column', gap: 'var(--s2)', minHeight: 100 }}>
            <CheckCircle2 size={22} color="var(--brand)" />
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>Check-In</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Registrar semana</p>
            </div>
            <ChevronRight size={14} color="var(--brand)" style={{ alignSelf: 'flex-end', marginTop: 'auto' }} />
          </div>
        </Link>
        <div className="card" onClick={() => setActiveTab('rutinas')} style={{ padding: 'var(--s4)', display: 'flex', flexDirection: 'column', gap: 'var(--s2)', minHeight: 100, borderColor: activeRoutine ? 'rgba(34,214,122,0.25)' : 'var(--border)', background: activeRoutine ? 'rgba(34,214,122,0.04)' : undefined, cursor: 'pointer' }}>
          <Dumbbell size={22} color={activeRoutine ? 'var(--green)' : 'var(--text-muted)'} />
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>
              {activeRoutine ? 'Entrenar' : 'Sin rutina'}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {activeRoutine ? `${activeRoutine.plan?.dias_totales || '?'} días / semana` : 'Espera a tu coach'}
            </p>
          </div>
          <ChevronRight size={14} color={activeRoutine ? 'var(--green)' : 'var(--text-muted)'} style={{ alignSelf: 'flex-end', marginTop: 'auto' }} />
        </div>
      </div>

      <div style={{ padding: '0 var(--s4)', marginBottom: 'var(--s4)' }}>
        <div className="section-header">
          <span className="section-title">Tu progreso</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s2)' }}>
          <MetricCard icon={<Activity size={16} />} label="Peso actual" value={cs.peso || '—'} unit="kg" color="var(--blue)" />
          <MetricCard icon={<TrendingUp size={16} />} label="Adherencia" value={adherencia} unit="%" color={adherencia >= 80 ? 'var(--green)' : 'var(--amber)'} />
          <MetricCard icon={<Zap size={16} />} label="Fatiga" value={cs.fatiga_ultima || '—'} unit="/10" color={cs.fatiga_ultima >= 7 ? 'var(--red)' : 'var(--text-primary)'} sub={cs.fatiga_ultima >= 7 ? 'Descansa bien 🛌' : undefined} />
          <MetricCard icon={<Moon size={16} />} label="Sueño prom." value={cs.horas_sueno || '—'} unit="hrs" color={cs.horas_sueno >= 7 ? 'var(--green)' : 'var(--amber)'} sub={cs.horas_sueno < 7 ? 'Objetivo: 7-8h' : undefined} />
        </div>
      </div>

      {cs.tdee_adjusted && (
        <div style={{ padding: 'var(--s4) var(--s4) 0' }}>
          <div className="card" onClick={() => setActiveTab('nutricion')} style={{ cursor: 'pointer', padding: 'var(--s4)', display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'rgba(245,166,35,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Flame size={20} color="var(--amber)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Calorías objetivo hoy</p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>
                {cs.tdee_adjusted.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>kcal</span>
              </p>
            </div>
            <ChevronRight size={20} color="var(--amber)" />
          </div>
        </div>
      )}
    </>
  );

  const renderRutinas = () => (
    <div style={{ padding: '0 var(--s4)' }}>
      {activeRoutine ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
           <div className="card card--green" style={{ padding: 'var(--s4)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '4px' }}>{activeRoutine.plan?.split_name || 'Tu Rutina'}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Esta rutina es tu objetivo para el bloque de {activeRoutine.plan?.bloque_semanas || 4} semanas.</p>
           </div>
           
           {activeRoutine.plan?.dias?.map((dia, idx) => (
             <div key={idx} className="card" style={{ padding: '1rem' }}>
               <h4 style={{ color: 'var(--green)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                 Día {dia.dia}: {dia.nombre}
               </h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {dia.ejercicios.map((ej, ejIdx) => (
                   <div key={ejIdx} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                       <strong style={{ fontSize: '0.95rem' }}>{ej.nombre}</strong>
                       <span style={{ fontSize: '0.8rem', color: 'var(--amber)', fontWeight: 'bold' }}>{ej.series} x {ej.repeticiones}</span>
                     </div>
                     {ej.explicacion_cliente && (
                       <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '8px' }}>
                         "{ej.explicacion_cliente}"
                       </p>
                     )}
                     <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                       <span style={{ color: 'var(--brand)' }}>Esfuerzo: RPE {ej.rpe_objetivo}</span>
                       {ej.peso_sugerido_kg && <span style={{ color: 'var(--blue)' }}>Peso Sugerido: {ej.peso_sugerido_kg}kg</span>}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <Dumbbell size={32} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3>No tienes rutina activa</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Dile a tu entrenador que te asigne una nueva rutina desde su panel.</p>
        </div>
      )}
    </div>
  );

  const renderNutricion = () => (
    <div style={{ padding: '0 var(--s4)' }}>
      <div className="card" style={{ padding: '2rem', textAlign: 'center', borderColor: 'var(--amber)' }}>
         <Utensils size={32} color="var(--amber)" style={{ margin: '0 auto 1rem' }} />
         <h3>Próximamente</h3>
         <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
           Tu entrenador podrá enviarte tu dieta detallada con opciones para Desayuno, Almuerzo, Cena y Colaciones en esta sección pronto.
         </p>
         {cs.tdee_adjusted && (
           <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--amber)', fontWeight: 'bold' }}>TU META ACTUAL</span>
              <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{cs.tdee_adjusted} kcal</span>
           </div>
         )}
      </div>
    </div>
  );

  return (
    <div className="anim-fade-up" style={{ paddingBottom: 'calc(var(--s4) + 60px)' }}> {/* padding bottom for fixed tabs */}
      {/* ── Hero Header ── */}
      <div style={{
        padding: 'var(--s5) var(--s4) var(--s4)',
        background: 'linear-gradient(180deg, rgba(255,90,0,0.07) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
        marginBottom: 'var(--s4)',
      }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Semana {semana}
        </p>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--s1)' }}>
          {greeting}, {user?.nombre?.split(' ')[0]}! 💪
        </h1>

        <div style={{ marginTop: 'var(--s3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Adherencia semanal</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: adherencia >= 80 ? 'var(--green)' : 'var(--amber)' }}>{adherencia}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-bar" style={{ width: `${adherencia}%`, background: adherencia >= 80 ? 'var(--green)' : adherencia >= 60 ? 'var(--amber)' : 'var(--brand)' }} />
          </div>
        </div>
      </div>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'rutinas' && renderRutinas()}
      {activeTab === 'nutricion' && renderNutricion()}

      {/* FIXED BOTTOM TABS */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, width: '100%',
        background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
        display: 'flex', padding: '0.5rem', zIndex: 100
      }}>
        <button className="btn-icon" onClick={() => setActiveTab('dashboard')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'transparent', color: activeTab === 'dashboard' ? 'var(--brand)' : 'var(--text-muted)' }}>
          <Activity size={20} />
          <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Mi Día</span>
        </button>
        <button className="btn-icon" onClick={() => setActiveTab('rutinas')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'transparent', color: activeTab === 'rutinas' ? 'var(--green)' : 'var(--text-muted)' }}>
          <Dumbbell size={20} />
          <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Rutinas</span>
        </button>
        <button className="btn-icon" onClick={() => setActiveTab('nutricion')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'transparent', color: activeTab === 'nutricion' ? 'var(--amber)' : 'var(--text-muted)' }}>
          <Apple size={20} />
          <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Dieta</span>
        </button>
      </div>

    </div>
  );
}