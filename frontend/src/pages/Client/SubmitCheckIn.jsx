import React, { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SubmitCheckIn() {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('general'); // general | fisiologico | diario
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
     peso: '', adherencia: 1.0, fatiga: 5, sueno: 7, entrenamientos_realizados: 0, notas: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
         ...formData,
         week: 1, // Esto lo calcularía el backend idealmente, o lo sacamos del state local
         peso: parseFloat(formData.peso),
         adherencia: parseFloat(formData.adherencia),
         fatiga: parseInt(formData.fatiga),
         sueno: parseFloat(formData.sueno),
         entrenamientos_realizados: parseInt(formData.entrenamientos_realizados)
      };
      
      // Llamada usando el client ID real (del contexto de user)
      const res = await authFetch(`http://localhost:5000/api/clients/${user.id || user._id}/checkin`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar checkin');
      
      alert(data.message || 'Checkin enviado con exito');
      navigate('/client');
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h2 className="text-gradient">Check-In Semanal</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>Registra tu estado actual para que la IA y tu coach adapten tu plan.</p>
      </header>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #333' }}>
        <button className={`btn-icon ${tab === 'general' ? 'text-gradient' : ''}`} onClick={() => setTab('general')} style={{ flex: 1, padding: '0.5rem', borderRadius: 0, borderBottom: tab === 'general' ? '2px solid var(--color-accent)' : 'none', color: tab !== 'general' && '#888' }}>
           Básico
        </button>
        <button className={`btn-icon ${tab === 'fisiologico' ? 'text-gradient' : ''}`} onClick={() => setTab('fisiologico')} style={{ flex: 1, padding: '0.5rem', borderRadius: 0, borderBottom: tab === 'fisiologico' ? '2px solid var(--color-accent)' : 'none', color: tab !== 'fisiologico' && '#888' }}>
           Estado Físico
        </button>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '1.5rem' }}>
        
        {tab === 'general' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             <div>
               <label className="form-label">Peso Corporal Promedio (kg)</label>
               <input type="number" step="0.1" className="form-control" placeholder="Ej: 75.5" value={formData.peso} onChange={e => setFormData({...formData, peso: e.target.value})} required max={300} min={30} />
             </div>
             <div>
               <label className="form-label">Adherencia al plan Nutricional (0 al 100%)</label>
               <select className="form-control" value={formData.adherencia} onChange={e => setFormData({...formData, adherencia: e.target.value})}>
                 <option value={1.0}>Perfecto (100%)</option>
                 <option value={0.9}>Muy Bien (90%)</option>
                 <option value={0.7}>Regular (70%)</option>
                 <option value={0.5}>Pobre (50%)</option>
                 <option value={0.2}>Malo (20%)</option>
               </select>
             </div>
             <button type="button" className="btn-secondary" onClick={() => setTab('fisiologico')} style={{ width: '100%', marginTop: '1rem' }}>Siguiente</button>
          </div>
        )}

        {tab === 'fisiologico' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             <div>
               <label className="form-label">Nivel de Fatiga/Estrés (1 = Fresco, 10 = Exhausto)</label>
               <input type="range" min="1" max="10" className="form-control" value={formData.fatiga} onChange={e => setFormData({...formData, fatiga: e.target.value})} />
               <div className="text-center" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Nivel: {formData.fatiga}</div>
             </div>
             <div>
               <label className="form-label">Horas Promedio de Sueño</label>
               <input type="number" step="0.5" className="form-control" value={formData.sueno} onChange={e => setFormData({...formData, sueno: e.target.value})} min={0} max={24} />
             </div>
             <div>
               <label className="form-label">Entrenamientos Realizados</label>
               <input type="number" className="form-control" value={formData.entrenamientos_realizados} onChange={e => setFormData({...formData, entrenamientos_realizados: e.target.value})} min={0} max={14} />
             </div>
             <div>
               <label className="form-label">Notas Adicionales / Molestias</label>
               <textarea className="form-control" rows={3} placeholder="Siento molestia en la rodilla izquierda..." value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})}></textarea>
             </div>
             
             <button type="submit" className="btn-primary flex-center" disabled={loading} style={{ width: '100%', marginTop: '1rem', gap: '8px' }}>
                {loading ? <Loader2 className="animate-spin" /> : <><Send size={18}/> Enviar Check-In</>}
             </button>
          </div>
        )}
      </form>
    </div>
  );
}
