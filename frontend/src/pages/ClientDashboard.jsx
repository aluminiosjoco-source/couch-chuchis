import React, { useEffect, useState } from 'react';
import { Activity, Dumbbell, Flame, Apple, Watch } from 'lucide-react';

export default function ClientDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch inicial plano para simular visualizacion
    fetch('http://localhost:5000/api/v1/clients/cl-123/plan')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(err => console.error("Error", err));
  }, []);

  if (!data) return <div className="flex-center" style={{height:'100%'}}><h2>Sincronizando Plan...</h2></div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2rem', display:'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>¡A darle, Juan!</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Meso-ciclo: {data.block_type} (Semana {data.week_on_block})</p>
        </div>
        <div className="glass-panel flex-center hover-glow" style={{ padding: '0.5rem 1rem', gap:'0.5rem', borderRadius: '50px' }}>
          <Watch size={18} color="var(--color-accent)" />
          <span style={{ fontSize: '0.875rem' }}>{data.wearable_status} (Garmin Connect)</span>
        </div>
      </header>

      {data.flags_actives && data.flags_actives.length > 0 && (
        <div className="glass-panel alert-warning" style={{ marginBottom: '1.5rem', padding: '1rem', borderLeft: '4px solid var(--color-primary)' }}>
           <strong>Nota del Entrenador Autónomo:</strong> Se detectaron indicadores de <span style={{textTransform:'uppercase'}}>{data.flags_actives.join(', ').replace('_', ' ')}</span>. Hemos re-balanceado tu plan para óptima recuperación esta semana.
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) minmax(250px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Entrenamiento de Hoy */}
        <section className="glass-panel">
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
             <h3 style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><Dumbbell color="var(--color-primary)"/> Entrenamiento de Hoy</h3>
             <span className="badge">Día 1 - Upper Body</span>
          </div>
          
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
             {['Press Banca (4x10 - 70kg)', 'Remo c/Barra (4x10 - 60kg)', 'Dominadas (4xAMRAP)'].map((ex, i) => (
                <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding:'1rem', borderRadius:'8px', display:'flex', justifyContent:'space-between' }}>
                  <span>{ex}</span>
                  <input type="checkbox" style={{ transform: 'scale(1.5)', accentColor: 'var(--color-secondary)', cursor: 'pointer' }} />
                </div>
             ))}
          </div>

          <button className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>Completar Sesión</button>
        </section>

        {/* Nutrición */}
        <section className="glass-panel">
           <h3 style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.5rem' }}><Apple color="var(--color-secondary)"/> Macros Diarios</h3>
           
           <div className="flex-center" style={{ flexDirection: 'column', marginBottom: '1.5rem' }}>
              <Flame size={48} color="var(--color-primary)" style={{ filter: 'drop-shadow(0 0 10px rgba(255,90,0,0.5))'}} />
              <h2 style={{ fontSize: '2.5rem' }}>{data.nutrition.kcal_target}</h2>
              <span style={{ color: 'var(--color-text-muted)' }}>Kcal Mantenimiento</span>
           </div>

           <div style={{ display:'flex', justifyContent:'space-between', textAlign:'center', background: 'rgba(0,0,0,0.2)', padding:'1rem', borderRadius:'8px', marginBottom: '1rem' }}>
              <div><strong>{data.nutrition.macros.p}g</strong> <br/><small style={{color:'var(--color-text-muted)'}}>Proteína</small></div>
              <div><strong>{data.nutrition.macros.c}g</strong> <br/><small style={{color:'var(--color-text-muted)'}}>Carbs</small></div>
              <div><strong>{data.nutrition.macros.f}g</strong> <br/><small style={{color:'var(--color-text-muted)'}}>Grasas</small></div>
           </div>

           <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
             <em>Adaptación Cultural:</em> {data.nutrition.cultural_adaptation}
           </p>
        </section>
      </div>
    </div>
  );
}
