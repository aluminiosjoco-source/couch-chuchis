import React, { useState } from 'react';
import { Loader2, Send, ChevronRight, ChevronLeft, Check, Scale, Zap, Moon, Dumbbell, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  { id: 'peso', icon: Scale, title: 'Peso', color: 'var(--blue)' },
  { id: 'estado', icon: Zap, title: 'Estado', color: 'var(--amber)' },
  { id: 'sueno', icon: Moon, title: 'Sueño', color: 'var(--brand)' },
  { id: 'entreno', icon: Dumbbell, title: 'Entreno', color: 'var(--green)' },
  { id: 'notas', icon: MessageSquare, title: 'Notas', color: 'var(--text-secondary)' },
];

function SliderField({ label, value, min, max, step = 1, unit, onChange, low, high, description }) {
  const pct = ((value - min) / (max - min)) * 100;
  const color = low !== undefined && value <= low ? 'var(--red)'
    : high !== undefined && value >= high ? 'var(--green)'
      : 'var(--brand)';

  return (
    <div style={{ marginBottom: 'var(--s5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--s2)' }}>
        <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</label>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color }}>
          {value}<span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 3 }}>{unit}</span>
        </span>
      </div>
      {description && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--s3)' }}>{description}</p>}
      <input
        type="range" min={min} max={max} step={step}
        value={value} onChange={e => onChange(+e.target.value)}
        style={{ width: '100%', accentColor: color }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{min}{unit}</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function SubmitCheckIn() {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    peso: 75, adherencia: 0.8, fatiga: 5,
    sueno: 7, entrenamientos: 3, notas: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const uid = user?.id || user?._id;
      const res = await authFetch(`http://localhost:5000/api/clients/${uid}/checkin`, {
        method: 'POST',
        body: JSON.stringify({
          peso: form.peso, adherencia: form.adherencia,
          fatiga: form.fatiga, sueno: form.sueno,
          entrenamientos_realizados: form.entrenamientos, notas: form.notas, week: 1,
        }),
      });
      if (!res.ok) throw new Error('Error al enviar');
      setSuccess(true);
      setTimeout(() => navigate('/client'), 2200);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--s6)', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--green-dim)', border: '2px solid rgba(34,214,122,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--s4)', animation: 'fadeIn .4s ease' }}>
        <Check size={36} color="var(--green)" />
      </div>
      <h2 style={{ marginBottom: 'var(--s2)' }}>¡Check-in enviado!</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Tu entrenador analizará tus datos y adaptará tu plan.</p>
    </div>
  );

  const totalSteps = STEPS.length;
  const currentStep = STEPS[step];
  const Icon = currentStep.icon;
  const progress = ((step) / (totalSteps - 1)) * 100;

  return (
    <div style={{ padding: 'var(--s4)', maxWidth: 480, margin: '0 auto' }} className="anim-fade-up">
      {/* Progress */}
      <div style={{ marginBottom: 'var(--s5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--s2)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Check-In Semanal</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{step + 1} / {totalSteps}</span>
        </div>
        <div className="progress-track">
          <div className="progress-bar progress-bar--gradient" style={{ width: `${progress}%`, transition: 'width .4s ease' }} />
        </div>

        {/* Step pills */}
        <div style={{ display: 'flex', gap: 'var(--s2)', marginTop: 'var(--s3)', overflowX: 'auto', paddingBottom: 4 }}>
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => i < step + 1 && setStep(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 'var(--r-full)', border: 'none',
                background: i === step ? s.color : i < step ? 'var(--green-dim)' : 'var(--bg-input)',
                color: i === step ? '#fff' : i < step ? 'var(--green)' : 'var(--text-muted)',
                fontSize: '0.72rem', fontWeight: 600, cursor: i <= step ? 'pointer' : 'default',
                flexShrink: 0, transition: 'all .2s',
              }}
            >
              {i < step ? <Check size={11} /> : <s.icon size={11} />}
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="card" style={{ padding: 'var(--s5)', marginBottom: 'var(--s4)', minHeight: 280 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s5)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: `${currentStep.color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={22} color={currentStep.color} />
          </div>
          <h2 style={{ fontSize: '1.2rem' }}>{currentStep.title}</h2>
        </div>

        {/* Step 0: Peso */}
        {step === 0 && (
          <div className="anim-fade-up">
            <SliderField label="Peso corporal" value={form.peso} min={40} max={160} step={0.5} unit="kg" onChange={v => set('peso', v)} description="Pésate en ayunas, sin ropa." />
            <div className="divider" />
            <SliderField
              label="Adherencia al plan nutricional" value={Math.round(form.adherencia * 10)} min={0} max={10} unit="/10"
              onChange={v => set('adherencia', v / 10)}
              description="¿Qué tan fiel fuiste a tu plan esta semana?"
              low={4} high={8}
            />
          </div>
        )}

        {/* Step 1: Estado físico */}
        {step === 1 && (
          <div className="anim-fade-up">
            <SliderField label="Fatiga percibida" value={form.fatiga} min={1} max={10} unit="/10" onChange={v => set('fatiga', v)} description="1 = Fresco y lleno de energía · 10 = Agotado completamente" high={8} />
          </div>
        )}

        {/* Step 2: Sueño */}
        {step === 2 && (
          <div className="anim-fade-up">
            <SliderField label="Horas de sueño promedio" value={form.sueno} min={3} max={12} step={0.5} unit="hrs" onChange={v => set('sueno', v)} description="Promedio de horas de sueño por noche esta semana." low={5} high={7} />
            {form.sueno < 6 && (
              <div className="alert alert-warning" style={{ marginTop: 'var(--s3)' }}>
                Dormir menos de 6 horas afecta tu recuperación y progreso. Prioriza el sueño esta semana.
              </div>
            )}
          </div>
        )}

        {/* Step 3: Entrenamientos */}
        {step === 3 && (
          <div className="anim-fade-up">
            <SliderField label="Entrenamientos realizados" value={form.entrenamientos} min={0} max={7} unit="días" onChange={v => set('entrenamientos', v)} description="¿Cuántos días entrenas esta semana?" low={1} high={3} />
          </div>
        )}

        {/* Step 4: Notas */}
        {step === 4 && (
          <div className="anim-fade-up">
            <div className="field">
              <label className="field-label">Notas adicionales (opcional)</label>
              <textarea
                className="textarea"
                style={{ minHeight: 120 }}
                placeholder="Ej: siento molestia en la rodilla izquierda, tuve mucho estrés laboral, visité al médico..."
                value={form.notas}
                onChange={e => set('notas', e.target.value)}
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tu entrenador leerá estas notas. Se específico/a.</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 'var(--s3)' }}>
        {step > 0 && (
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>
            <ChevronLeft size={18} /> Anterior
          </button>
        )}

        {step < totalSteps - 1 ? (
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setStep(s => s + 1)}>
            Continuar <ChevronRight size={18} />
          </button>
        ) : (
          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <Loader2 size={18} className="spin" />
              : <><Send size={18} /> Enviar Check-In</>
            }
          </button>
        )}
      </div>
    </div>
  );
}
