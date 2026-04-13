import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Activity, Dumbbell, User as UserIcon, Loader2 } from 'lucide-react';

export default function ClientDashboard() {
  const { user, authFetch } = useAuth();
  const [clientState, setClientState] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resState = await authFetch(`http://localhost:5000/api/clients/${user.id || user._id}`);
        const resRoutines = await authFetch(`http://localhost:5000/api/clients/${user.id || user._id}/routines`);
        
        if (resState.ok) {
           const data = await resState.json();
           setClientState(data.state);
        }
        if (resRoutines.ok) setRoutines(await resRoutines.json());
      } catch (err) {
        console.error("Error cargando dashboard del cliente");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, authFetch]);

  if (loading) return <div className="flex-center" style={{height:'100%'}}><Loader2 className="animate-spin" size={48} /></div>;

  const activeRoutine = routines.find(r => r.estado === 'activa');

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem', maxWidth: '800px', margin: '0 auto' }}>
      <header className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        <UserIcon size={48} color="var(--color-accent)" style={{ margin: '0 auto 1rem' }} />
        <h1 className="text-gradient" style={{ margin: 0 }}>¡Hola, {user?.nombre}!</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Semana actual: {clientState?.current_state?.week || 1}</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/client/checkin" className="glass-panel flex-center text-center" style={{ padding: '1.5rem', flexDirection: 'column', gap: '0.5rem', textDecoration: 'none', color: 'white', border: '1px solid var(--color-accent)', background: 'linear-gradient(45deg, rgba(255,107,0,0.1), transparent)' }}>
           <Activity size={32} color="var(--color-accent)" />
           <h3>Hacer Check-In</h3>
           <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Requerido para avanzar al siguiente bloque</span>
        </Link>

        {activeRoutine ? (
          <Link to={`/client/workout`} className="glass-panel flex-center text-center" style={{ padding: '1.5rem', flexDirection: 'column', gap: '0.5rem', textDecoration: 'none', color: 'white' }}>
             <Dumbbell size={32} color="var(--color-secondary)" />
             <h3>Rutina Activa</h3>
             <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{activeRoutine.plan?.dias_totales || '?'} días programados</span>
          </Link>
        ) : (
          <div className="glass-panel flex-center text-center" style={{ padding: '1.5rem', flexDirection: 'column', gap: '0.5rem', opacity: 0.5 }}>
             <Dumbbell size={32} />
             <h3>Sin Rutina Activa</h3>
             <span style={{ fontSize: '0.875rem' }}>Tu coach debe aprobarla</span>
          </div>
        )}
      </div>

      <section>
        <h3>Tu Progreso</h3>
        <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <div className="flex-between">
              <span>Adherencia Promedio</span>
              <strong style={{color:'var(--color-secondary)'}}>{Math.round((clientState?.current_state?.adherencia_promedio || 0) * 100)}%</strong>
           </div>
           <div className="flex-between">
              <span>Último peso registrado</span>
              <strong>{clientState?.current_state?.peso || '--'} kg</strong>
           </div>
           <div className="flex-between">
              <span>Última fatiga percibida</span>
              <strong>{clientState?.current_state?.fatiga_ultima || '--'}/10</strong>
           </div>
        </div>
      </section>
    </div>
  );
}
