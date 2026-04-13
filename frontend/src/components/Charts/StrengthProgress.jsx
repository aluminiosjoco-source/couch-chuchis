import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';

// ── Custom Tooltip compartido
const CustomTooltip = ({ active, payload, label, unit = 'kg' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(20,24,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, fontWeight: '700' }}>
          {p.name}: {p.value}{unit}
        </p>
      ))}
    </div>
  );
};

/**
 * Gráfica de evolución de fuerza (1RM estimados por ejercicio a través de semanas).
 * @param {Array} data  - [{week: 'Sem 1', squat:80, bench:65, deadlift:90, ohp:40}, ...]
 */
export function StrengthProgressChart({ data = [] }) {
  const LIFTS = [
    { key: 'squat', name: 'Sentadilla', color: '#FF5A00' },
    { key: 'bench', name: 'Press Banca', color: '#00E676' },
    { key: 'deadlift', name: 'Peso Muerto', color: '#00B0FF' },
    { key: 'ohp', name: 'Press Militar', color: '#FFB300' },
  ];

  // Demo data si no se provee
  const chartData = data.length > 0 ? data : [
    { week: 'Sem 1', squat: 80, bench: 65, deadlift: 90, ohp: 40 },
    { week: 'Sem 2', squat: 85, bench: 70, deadlift: 100, ohp: 40 },
    { week: 'Sem 3', squat: 90, bench: 70, deadlift: 105, ohp: 45 },
    { week: 'Sem 4', squat: 95, bench: 75, deadlift: 110, ohp: 45 },
    { week: 'Sem 5 (Deload)', squat: 75, bench: 60, deadlift: 90, ohp: 37.5 },
    { week: 'Sem 6', squat: 100, bench: 77.5, deadlift: 115, ohp: 47.5 },
  ];

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <h3 style={{ marginBottom: '0.35rem', fontSize: '1rem' }}>📈 Progresión de Fuerza (1RM Estimado)</h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Cargas máximas estimadas por ejercicio</p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="week" tick={{ fill: '#9BA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis unit="kg" tick={{ fill: '#9BA3AF', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
          <Tooltip content={<CustomTooltip unit="kg" />} />
          <Legend formatter={(v) => <span style={{ color: '#9BA3AF', fontSize: '0.8rem' }}>{v}</span>} />
          {LIFTS.map(l => (
            <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2.5}
              dot={{ r: 4, fill: l.color, strokeWidth: 0 }} activeDot={{ r: 6 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Gráfica de adherencia semanal (barras).
 */
export function AdherenceChart({ data = [] }) {
  const chartData = data.length > 0 ? data : [
    { week: 'Sem 1', adherencia: 95 },
    { week: 'Sem 2', adherencia: 88 },
    { week: 'Sem 3', adherencia: 85 },
    { week: 'Sem 4', adherencia: 90 },
    { week: 'Sem 5', adherencia: 72 },
    { week: 'Sem 6', adherencia: 91 },
  ];

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <h3 style={{ marginBottom: '0.35rem', fontSize: '1rem' }}>📊 Adherencia Semanal</h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Porcentaje de adherencia por semana</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: '#9BA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis unit="%" domain={[0, 100]} tick={{ fill: '#9BA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip unit="%" />} />
          <ReferenceLine y={80} stroke="#FFB300" strokeDasharray="4 4" label={{ value: 'Meta 80%', fill: '#FFB300', fontSize: 10 }} />
          <Bar dataKey="adherencia" name="Adherencia" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E676" />
              <stop offset="100%" stopColor="#00B0FF" stopOpacity={0.6} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Calculadora de 1RM integrada (Fórmula de Epley).
 */
export function OneRMCalculator() {
  const [weight, setWeight] = React.useState('');
  const [reps, setReps] = React.useState('');

  const oneRM = useMemo(() => {
    const w = parseFloat(weight), r = parseInt(reps);
    if (!w || !r || r <= 0) return null;
    if (r === 1) return w;
    return Math.round(w * (1 + r / 30)); // Epley formula
  }, [weight, reps]);

  const percentages = oneRM ? [100, 95, 90, 85, 80, 75, 70, 65].map(p => ({
    pct: p, peso: Math.round(oneRM * p / 100 * 2) / 2,
    reps: p >= 95 ? '1-2' : p >= 90 ? '2-3' : p >= 85 ? '3-4' : p >= 80 ? '4-6' : p >= 75 ? '6-8' : p >= 70 ? '8-10' : p >= 65 ? '10-12' : '12-15',
    objetivo: p >= 90 ? 'Fuerza Máx.' : p >= 75 ? 'Hipertrofia' : 'Resistencia',
  })) : [];

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>🏋️ Calculadora 1RM (Fórmula de Epley)</h3>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[{ label: 'Peso levantado (kg)', id: 'rm-weight', val: weight, set: setWeight, ph: 'ej. 80' }, { label: 'Repeticiones', id: 'rm-reps', val: reps, set: setReps, ph: 'ej. 5' }].map(f => (
          <div key={f.id} style={{ flex: 1, minWidth: '140px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{f.label}</label>
            <input id={f.id} type="number" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} min="0"
              style={{ width: '100%', padding: '0.7rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--color-text-main)', fontSize: '1rem', outline: 'none' }} />
          </div>
        ))}
      </div>

      {oneRM && (
        <>
          <div style={{ textAlign: 'center', marginBottom: '1rem', padding: '1rem', background: 'linear-gradient(135deg, rgba(255,90,0,0.1), rgba(255,138,0,0.05))', borderRadius: '12px', border: '1px solid rgba(255,90,0,0.2)' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>1RM Estimado</p>
            <p className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>{oneRM} kg</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead><tr style={{ color: 'var(--color-text-muted)' }}>
                {['%', 'Peso', 'Reps', 'Objetivo'].map(h => <th key={h} style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {percentages.map(row => (
                  <tr key={row.pct} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: '700', color: row.pct === 100 ? 'var(--color-primary)' : 'var(--color-text-main)' }}>{row.pct}%</td>
                    <td style={{ padding: '0.5rem', fontWeight: '600' }}>{row.peso} kg</td>
                    <td style={{ padding: '0.5rem', color: 'var(--color-text-muted)' }}>{row.reps}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', padding: '0.2em 0.6em', borderRadius: '6px', background: row.objetivo === 'Fuerza Máx.' ? 'rgba(255,90,0,0.15)' : row.objetivo === 'Hipertrofia' ? 'rgba(0,230,118,0.12)' : 'rgba(0,176,255,0.12)', color: row.objetivo === 'Fuerza Máx.' ? 'var(--color-primary)' : row.objetivo === 'Hipertrofia' ? 'var(--color-secondary)' : 'var(--color-accent)' }}>{row.objetivo}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
