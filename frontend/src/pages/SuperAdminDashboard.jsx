import React, { useState } from 'react';
import { Globe, Building2, Users, TrendingUp, DollarSign, AlertCircle, BarChart3, Shield } from 'lucide-react';

const MOCK = {
  platform: { total_gyms: 47, total_trainers: 186, total_clients: 2840, mrr_mxn: 284_500, avg_adherence: 82.3, churn_rate: 3.1 },
  gyms: [
    { id: 'fitzone-mty', nombre: 'FitZone Monterrey', plan: 'enterprise', clientes: 312, adherencia: 87, status: 'active' },
    { id: 'elite-cdmx', nombre: 'Elite Fitness CDMX', plan: 'profesional', clientes: 98, adherencia: 81, status: 'active' },
    { id: 'power-gdl', nombre: 'PowerGym Guadalajara', plan: 'basico', clientes: 18, adherencia: 76, status: 'trial' },
    { id: 'iron-pue', nombre: 'Iron Temple Puebla', plan: 'profesional', clientes: 73, adherencia: 84, status: 'past_due' },
    { id: 'sport-tijuana', nombre: 'Sport Zone Tijuana', plan: 'enterprise', clientes: 224, adherencia: 88, status: 'active' },
  ],
};

const PLAN_COLOR = { enterprise: '#FFD700', profesional: '#00E676', basico: '#00B0FF' };
const STATUS_COLOR = { active: '#00E676', trial: '#00B0FF', past_due: '#FF5A00', inactive: '#9BA3AF' };

export default function SuperAdminDashboard() {
  const [tab, setTab] = useState('overview');
  const d = MOCK;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Shield size={24} color="var(--color-primary)" />
          <h1 className="text-gradient" style={{ fontSize: '1.75rem' }}>Super Admin — Plataforma Global</h1>
        </div>
        <p style={{ color: 'var(--color-text-muted)' }}>Vista centralizada de todos los tenants, suscripciones y salud del negocio.</p>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '0.4rem' }}>
        {[{ id: 'overview', label: '📊 Overview' }, { id: 'gyms', label: '🏢 Gimnasios' }, { id: 'billing', label: '💳 Facturación' }].map(t => (
          <button key={t.id} id={`admin-tab-${t.id}`} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '9px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: tab === t.id ? '700' : '400', fontSize: '0.88rem', background: tab === t.id ? 'rgba(255,255,255,0.1)' : 'transparent', color: tab === t.id ? 'var(--color-text-main)' : 'var(--color-text-muted)', transition: 'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { icon: <Building2 size={22} />, label: 'Gimnasios Activos', value: d.platform.total_gyms, color: 'var(--color-primary)', suffix: '' },
              { icon: <Users size={22} />, label: 'Clientes Totales', value: d.platform.total_clients.toLocaleString(), color: 'var(--color-accent)', suffix: '' },
              { icon: <DollarSign size={22} />, label: 'MRR (MXN)', value: `$${(d.platform.mrr_mxn / 1000).toFixed(0)}k`, color: '#FFD700', suffix: '' },
              { icon: <TrendingUp size={22} />, label: 'Adherencia Plataforma', value: d.platform.avg_adherence, color: 'var(--color-secondary)', suffix: '%' },
            ].map((kpi, i) => (
              <div key={i} className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ color: kpi.color, marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>{kpi.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: kpi.color }}>{kpi.value}{kpi.suffix}</div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Distribución de planes */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>📦 Distribución por Plan</h3>
            {['enterprise', 'profesional', 'basico'].map(plan => {
              const count = d.gyms.filter(g => g.plan === plan).length;
              const pct = Math.round(count / d.gyms.length * 100);
              return (
                <div key={plan} style={{ marginBottom: '1rem' }}>
                  <div className="flex-between" style={{ marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.85rem', textTransform: 'capitalize', fontWeight: '600' }}>{plan}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{count} gyms ({pct}%)</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: PLAN_COLOR[plan], borderRadius: '99px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'gyms' && (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>🏢 Todos los Gimnasios ({d.gyms.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead><tr style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--glass-border)' }}>
                {['Nombre', 'Plan', 'Clientes', 'Adherencia', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {d.gyms.map(gym => (
                  <tr key={gym.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '1rem', fontWeight: '600' }}>{gym.nombre}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.72rem', padding: '0.25em 0.75em', borderRadius: '20px', background: `${PLAN_COLOR[gym.plan]}20`, color: PLAN_COLOR[gym.plan], fontWeight: '700', textTransform: 'capitalize' }}>{gym.plan}</span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{gym.clientes}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ color: gym.adherencia >= 85 ? 'var(--color-secondary)' : gym.adherencia >= 75 ? '#FFB300' : 'var(--color-primary)', fontWeight: '700' }}>{gym.adherencia}%</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.72rem', padding: '0.25em 0.75em', borderRadius: '20px', background: `${STATUS_COLOR[gym.status]}15`, color: STATUS_COLOR[gym.status], fontWeight: '700' }}>{gym.status}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button id={`admin-view-${gym.id}`} style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer' }}>Ver Detalle</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'billing' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>💳 Resumen de Ingresos</h3>
            {[{ label: 'MRR Total', val: `$${d.platform.mrr_mxn.toLocaleString()} MXN` }, { label: 'ARR (proyectado)', val: `$${(d.platform.mrr_mxn * 12).toLocaleString()} MXN` }, { label: 'Churn Rate', val: `${d.platform.churn_rate}%` }, { label: 'Gyms en Past Due', val: d.gyms.filter(g => g.status === 'past_due').length }].map(item => (
              <div key={item.label} className="flex-between" style={{ padding: '0.85rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{item.label}</span>
                <span style={{ fontWeight: '700' }}>{item.val}</span>
              </div>
            ))}
          </div>
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <AlertCircle size={18} color="#FF5A00" /> Pagos con Problema
            </h3>
            {d.gyms.filter(g => g.status === 'past_due').map(gym => (
              <div key={gym.id} style={{ padding: '0.85rem', background: 'rgba(255,90,0,0.07)', borderRadius: '10px', border: '1px solid rgba(255,90,0,0.2)', marginBottom: '0.75rem' }}>
                <p style={{ fontWeight: '700', marginBottom: '0.25rem' }}>{gym.nombre}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Plan {gym.plan} · Pago pendiente</p>
                <button style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: '8px', border: 'none', background: 'rgba(255,90,0,0.2)', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '700' }}>Contactar Dueño</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
