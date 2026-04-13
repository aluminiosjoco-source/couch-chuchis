import React, { useState } from 'react';
import { Send, CheckCircle, Activity, Moon, Dumbbell } from 'lucide-react';

export default function CheckInFlow() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    peso: 80,
    adherencia: 1,
    fatiga_percibida: 5,
    horas_sueno: 7,
    dolor_muscular: 3
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const resp = await fetch('http://localhost:5000/api/v1/clients/cl-123/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await resp.json();
      setResult(data);
      setStep(4);
    } catch (err) {
      console.error(err);
      setResult({ error: "Error conectando al motor autónomo. ¿El backend está corriendo?" });
      setStep(4);
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '2rem' }}>
      <h1 className="text-gradient text-center" style={{ marginBottom: '2rem' }}>Check-In Semanal</h1>

      <div className="glass-panel">
        {step === 1 && (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity color="var(--color-primary)"/> Métricas Básicas
            </h3>
            <label style={{ display: 'block', marginBottom: '1rem' }}>
              Peso Actual (kg): <strong style={{ color: 'var(--color-primary)' }}>{formData.peso}</strong>
              <input 
                type="range" min="60" max="120" step="0.5" 
                value={formData.peso}
                onChange={e => setFormData({...formData, peso: e.target.value})}
                style={{ width: '100%', marginTop: '0.5rem', accentColor: 'var(--color-primary)' }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: '1.5rem' }}>
              Adherencia al plan (0 - 1.0): <strong style={{ color: 'var(--color-secondary)' }}>{formData.adherencia * 100}%</strong>
              <input 
                type="range" min="0" max="1" step="0.05" 
                value={formData.adherencia}
                onChange={e => setFormData({...formData, adherencia: e.target.value})}
                style={{ width: '100%', marginTop: '0.5rem', accentColor: 'var(--color-secondary)' }}
              />
            </label>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setStep(2)}>Siguiente</button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Dumbbell color="var(--color-primary)"/> Esfuerzo y Recuperación
            </h3>
            <label style={{ display: 'block', marginBottom: '1rem' }}>
              Fatiga Percibida (1-10): <strong>{formData.fatiga_percibida}</strong>
              <input 
                type="range" min="1" max="10" step="1" 
                value={formData.fatiga_percibida}
                onChange={e => setFormData({...formData, fatiga_percibida: e.target.value})}
                style={{ width: '100%', marginTop: '0.5rem' }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: '1.5rem' }}>
              Dolor Muscular (DOMS) (1-10): <strong>{formData.dolor_muscular}</strong>
              <input 
                type="range" min="1" max="10" step="1" 
                value={formData.dolor_muscular}
                onChange={e => setFormData({...formData, dolor_muscular: e.target.value})}
                style={{ width: '100%', marginTop: '0.5rem' }}
              />
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)', flex: 1 }} onClick={() => setStep(1)}>Atrás</button>
              <button className="btn-primary" style={{ flex: 2 }} onClick={() => setStep(3)}>Siguiente</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Moon color="var(--color-primary)"/> Sueño y Wearables
            </h3>
            <label style={{ display: 'block', marginBottom: '1.5rem' }}>
              Horas de Sueño: <strong>{formData.horas_sueno}h</strong>
              <input 
                type="range" min="3" max="12" step="0.5" 
                value={formData.horas_sueno}
                onChange={e => setFormData({...formData, horas_sueno: e.target.value})}
                style={{ width: '100%', marginTop: '0.5rem' }}
              />
            </label>
            
            <div className="alert-warning" style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
               💡 Las métricas de pasos (<strong>8,240</strong>) y calidad de sueño han sido precargadas automáticamente desde tu Apple Watch.
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)', flex: 1 }} onClick={() => setStep(2)}>Atrás</button>
              <button 
                className="btn-primary" 
                style={{ flex: 2, display: 'flex', justifyContent: 'center', gap: '8px' }} 
                onClick={handleSubmit} 
                disabled={loading}
              >
                {loading ? 'Procesando...' : <><Send size={18}/> Enviar al Motor Autónomo</>}
              </button>
            </div>
          </div>
        )}

        {step === 4 && result && (
          <div className="animate-fade-in text-center">
            {result.error ? (
               <div className="alert-critical" style={{ padding: '1.5rem', borderRadius: '8px' }}>
                 <h3>Error</h3>
                 <p>{result.error}</p>
                 <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setStep(1)}>Reintentar</button>
               </div>
            ) : (
               <div>
                 <CheckCircle size={64} color="var(--color-secondary)" style={{ margin: '0 auto 1.5rem auto' }} />
                 <h2 style={{ marginBottom: '1rem' }}>¡Check-in Completado!</h2>
                 <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{result.message}</p>
                 <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'left' }}>
                    <strong>Acción del Motor:</strong> {result.action_taken} <br/>
                    <strong>TDEE Ajustado:</strong> {result.new_state?.tdee_adjusted} kcal <br/>
                    <strong>Nuevos Flags:</strong> {result.new_state?.flags?.join(', ') || 'Ninguno'}
                 </div>
                 <button className="btn-primary" onClick={() => { setStep(1); setFormData({...formData, peso: result.new_state?.peso || formData.peso}) }}>Hacer otro de prueba</button>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
