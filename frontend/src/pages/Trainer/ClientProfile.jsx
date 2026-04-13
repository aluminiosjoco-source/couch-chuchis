import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Loader2, Activity, Target, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function ClientProfile() {
  const { id } = useParams();
  const { authFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authFetch(`http://localhost:5000/api/clients/${id}`);
        if (res.ok) {
          const profileData = await res.json();
          setData(profileData);
        }
      } catch (err) {
        console.error("Error fetching client profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, authFetch]);

  if (loading) return <div className="flex-center" style={{ height: '100%' }}><Loader2 className="animate-spin" size={48} /></div>;
  if (!data?.user) return <div className="flex-center" style={{ height: '100%' }}><h3>Cliente no encontrado</h3></div>;

  const { user, state } = data;
  const current = state?.current_state || {};
  const profile = state?.profile_info || {};

  const weightHistory = state?.history?.map(h => ({ semana: `Sem ${h.week}`, peso: h.peso })) || [];
  
  const adherenceHistory = state?.history?.map(h => ({ semana: `Sem ${h.week}`, adherencia: Math.round(h.adherencia * 100) })) || [];

  const strengthData = [
    { subject: 'Squat', A: state?.exercise_history?.max_estimates?.Squat || 100, fullMark: 150 },
    { subject: 'Bench', A: state?.exercise_history?.max_estimates?.Bench || 80, fullMark: 150 },
    { subject: 'Deadlift', A: state?.exercise_history?.max_estimates?.Deadlift || 120, fullMark: 150 },
    { subject: 'OHP', A: state?.exercise_history?.max_estimates?.OHP || 50, fullMark: 150 },
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <Link to="/trainer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent)', textDecoration: 'none', marginBottom: '1.5rem', fontWeight: 'bold' }}>
         <ArrowLeft size={20} /> Volver al Dashboard
      </Link>

      <header className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <h1 className="text-gradient" style={{ margin: 0, fontSize: '2.5rem' }}>{user.nombre}</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
            Objetivo: <strong style={{color:'white'}}>{profile.objetivo || 'No definido'}</strong> • 
            {profile.experiencia || 'Principiante'}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap:'wrap' }}>
            {current.flags?.map(f => (
               <span key={f} style={{ background: 'rgba(255,0,0,0.2)', color: '#ff6b6b', padding: '0.3rem 0.8rem', borderRadius: '12px', fontSize: '0.875rem' }}>
                 <AlertTriangle size={14} style={{ display: 'inline', marginRight:'4px' }}/>{f}
               </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap:'wrap' }}>
           <div className="text-center">
             <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>SEMANA ACTUAL</div>
             <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-accent)' }}>{current.week || 1}</div>
           </div>
           <div className="text-center">
             <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>PESO ACTUAL</div>
             <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>{current.peso || '--'} <span style={{fontSize:'1rem'}}>kg</span></div>
           </div>
           <div className="text-center">
             <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>ADHERENCIA</div>
             <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
               {Math.round((current.adherencia_promedio || 0) * 100)}<span style={{fontSize:'1rem'}}>%</span>
             </div>
           </div>
        </div>
      </header>

      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
         <Activity color="var(--color-accent)" /> Rendimiento y Gráficas
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Progreso de Peso */}
        <div className="glass-panel" style={{ padding: '1.5rem', height: '350px' }}>
          <h4>Evolución de Peso (kg)</h4>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={weightHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="semana" stroke="#888" />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333' }} />
              <Legend />
              <Line type="monotone" dataKey="peso" stroke="var(--color-accent)" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Adherencia */}
        <div className="glass-panel" style={{ padding: '1.5rem', height: '350px' }}>
          <h4>Adherencia Semanal (%)</h4>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={adherenceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="semana" stroke="#888" />
              <YAxis domain={[0, 100]} stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333' }} />
              <Legend />
              <Bar dataKey="adherencia" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar de Fuerza */}
        <div className="glass-panel" style={{ padding: '1.5rem', height: '350px' }}>
          <h4>Perfil de Fuerza (RM Estimado)</h4>
          <ResponsiveContainer width="100%" height="90%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={strengthData}>
              <PolarGrid stroke="#444" />
              <PolarAngleAxis dataKey="subject" stroke="#aaa" />
              <PolarRadiusAxis stroke="#666" />
              <Radar name="RM Estimado" dataKey="A" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.6} />
              <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Perfil Físico */}
        <div className="glass-panel" style={{ padding: '1.5rem', height: '350px', overflowY: 'auto' }}>
          <h4>Datos Fisiológicos Diarios</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
             <li className="flex-between"><span>Fatiga Última (1-10)</span> <strong style={{color:'white'}}>{current.fatiga_ultima || '--'}</strong></li>
             <li className="flex-between"><span>Estrés</span> <strong style={{color:'white'}}>{current.estres || '--'}</strong></li>
             <li className="flex-between"><span>Dolor Muscular</span> <strong style={{color:'white'}}>{current.dolor_muscular || '--'}</strong></li>
             <li className="flex-between"><span>Horas Sueño Promedio</span> <strong style={{color:'white'}}>{current.horas_sueno || '--'} hrs</strong></li>
             <li className="flex-between"><span>Calorías TDEE</span> <strong style={{color:'white'}}>{current.tdee_adjusted || '--'} kcal</strong></li>
             <li className="flex-between"><span>Disponibilidad</span> <strong style={{color:'white'}}>{profile.dias_disponibles || '--'} días/sem</strong></li>
             <li className="flex-between"><span>Equipamiento</span> <strong style={{color:'white', textTransform:'capitalize'}}>{profile.equipamiento || '--'}</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
