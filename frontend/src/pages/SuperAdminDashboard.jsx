import React, { useState } from 'react';
import { Globe, Building2, Users, TrendingUp, DollarSign, AlertCircle, Shield, ChevronRight } from 'lucide-react';

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

const PLAN_COLOR = { enterprise: 'var(--amber)', profesional: 'var(--green)', basico: 'var(--blue)' };
const STATUS_MAP = {
  active: { color: 'var(--green)', label: 'Activo' },
  trial: { color: 'var(--blue)', label: 'Trial' },
  past_due: { color: 'var(--red)', label: 'Pago pendiente' },
  inactive: { color: 'var(--text-muted)', label: 'Inactivo' },
};

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'gyms', label: 'Gimnasios' },
  { id: 'billing', label: 'Facturación' },
];

export default function SuperAdminDashboard() {
  const [tab, setTab] = useState('overview');
  const { platform: p, gyms } = MOCK;

  return (
    <div className="anim-fade-up">
      {/* Header */}
      <div style={{ padding: 'var(--s5) var(--s4) var(--s3)', display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
        <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'var(--brand-dim)', border: '1px solid var(--brand-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={22} color="var(--brand)" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.3rem' }}>Super Admin</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vista global de la plataforma</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 var(--s4)', marginBottom: 'var(--s4)' }}>
        <div style={{ display: 'flex', gap: 'var(--s2)', background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', padding: '3px' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              id={`admin-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: 'var(--s2)', borderRadius: 'var(--r-sm)', border: 'none',
                background: tab === t.id ? 'var(--bg-card)' : 'transparent',
                color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.8rem',
                cursor: 'pointer', transition: 'all .2s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 var(--s4)', paddingBottom: 'var(--s8)' }}>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div className="stagger">
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s2)', marginBottom: 'var(--s4)' }}>
              {[
                { icon: <Building2 size={18} />, label: 'Gimnasios', value: p.total_gyms, color: 'var(--brand)' },
                { icon: <Users size={18} />, label: 'Clientes', value: p.total_clients.toLocaleString(), color: 'var(--blue)' },
                { icon: <DollarSign size={18} />, label: 'MRR', value: `$${(p.mrr_mxn / 1000).toFixed(0)}k`, color: 'var(--amber)' },
                { icon: <TrendingUp size={18} />, label: 'Adherencia', value: `${p.avg_adherence}%`, color: 'var(--green)' },
              ].map(k => (
                <div key={k.label} className="card anim-fade-up" style={{ padding: 'var(--s4)' }}>
                  <div style={{ color: k.color, marginBottom: 'var(--s2)' }}>{k.icon}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', color: k.color, lineHeight: 1 }}>{k.value}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* Plan distribution */}
            <div className="card anim-fade-up">
              <p style={{ fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 'var(--s4)' }}>Distribución por plan</p>
              {['enterprise', 'profesional', 'basico'].map(plan => {
                const count = gyms.filter(g => g.plan === plan).length;
                const pct = Math.round(count / gyms.length * 100);
                return (
                  <div key={plan} style={{ marginBottom: 'var(--s4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>{plan}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{count} gyms · {pct}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-bar" style={{ width: `${pct}%`, background: PLAN_COLOR[plan] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Gyms ── */}
        {tab === 'gyms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
            {gyms.map(gym => {
              const st = STATUS_MAP[gym.status] || STATUS_MAP.inactive;
              return (
                <div key={gym.id} className="card" style={{ padding: 'var(--s4)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s3)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', marginBottom: 4 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{gym.nombre}</p>
                        <span className="badge" style={{ background: `${PLAN_COLOR[gym.plan]}20`, color: PLAN_COLOR[gym.plan], border: `1px solid ${PLAN_COLOR[gym.plan]}40`, padding: '2px 8px', fontSize: '0.65rem' }}>
                          {gym.plan}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--s3)', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <Users size={11} style={{ display: 'inline', marginRight: 3 }} />
                          {gym.clientes} clientes
                        </span>
                        <span style={{ fontSize: '0.72rem', color: gym.adherencia >= 85 ? 'var(--green)' : gym.adherencia >= 75 ? 'var(--amber)' : 'var(--red)', fontWeight: 600 }}>
                          <TrendingUp size={11} style={{ display: 'inline', marginRight: 3 }} />
                          {gym.adherencia}% adh.
                        </span>
                        <span style={{ fontSize: '0.72rem', color: st.color, fontWeight: 600 }}>
                          ● {st.label}
                        </span>
                      </div>
                    </div>
                    <button id={`admin-view-${gym.id}`} className="btn-icon" style={{ width: 34, height: 34, flexShrink: 0 }}>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Billing ── */}
        {tab === 'billing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
            <div className="card">
              <p style={{ fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 'var(--s4)' }}>Resumen de ingresos</p>
              {[
                { label: 'MRR Total', val: `$${p.mrr_mxn.toLocaleString()} MXN` },
                { label: 'ARR (proyectado)', val: `$${(p.mrr_mxn * 12).toLocaleString()} MXN` },
                { label: 'Churn Rate', val: `${p.churn_rate}%` },
                { label: 'Pagos pendientes', val: `${gyms.filter(g => g.status === 'past_due').length} gyms` },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--s3) 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.val}</span>
                </div>
              ))}
            </div>

            {/* Past due alerts */}
            <div>
              <div className="section-header">
                <span className="section-title">Pagos con problema</span>
                <AlertCircle size={14} color="var(--red)" />
              </div>
              {gyms.filter(g => g.status === 'past_due').map(gym => (
                <div key={gym.id} className="card" style={{ borderColor: 'rgba(255,75,85,0.2)', background: 'rgba(255,75,85,0.04)', padding: 'var(--s4)', marginBottom: 'var(--s2)' }}>
                  <p style={{ fontWeight: 700, marginBottom: 4 }}>{gym.nombre}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 'var(--s3)' }}>Plan {gym.plan} · Pago pendiente</p>
                  <button className="btn btn-danger btn-sm">Contactar dueño</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}