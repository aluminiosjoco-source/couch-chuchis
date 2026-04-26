import React, { useEffect, useState } from 'react';
import {
  AlertTriangle, TrendingUp, Users, PlusCircle, User,
  Loader2, Edit2, Trash2, UserCheck, UserX, ChevronRight,
  Bell, Dumbbell, Utensils
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import ClientFormModal from './Trainer/ClientFormModal';

function RiskBadge({ riesgo }) {
  if (!riesgo || riesgo < 0.3) return null;
  const high = riesgo > 0.5;
  return (
    <span className={`badge ${high ? 'badge-red' : 'badge-amber'}`}>
      {high ? '⚠ Riesgo alto' : '⚡ Revisar'}
    </span>
  );
}

export default function TrainerDashboard() {
  const { user, authFetch } = useAuth();
  const [data, setData] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filterActivos, setFilterActivos] = useState(true);

  const isOwner = user?.rol === 'gym_owner' || user?.rol === 'super_admin';

  const fetchClients = async () => {
    const r = await authFetch('http://localhost:5000/api/clients');
    if (r.ok) setClients(await r.json());
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('http://localhost:5000/api/v1/trainers/dashboard');
        if (r.ok) setData(await r.json());
        await fetchClients();
      } catch { /* offline */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleDelete = async (id) => {
    await authFetch(`http://localhost:5000/api/clients/${id}`, { method: 'DELETE' });
    setClients(p => p.filter(c => c.id !== id));
    setConfirmDelete(null);
  };

  const visible = clients.filter(c => filterActivos ? c.is_active !== false : !c.is_active);
  const activeCount = clients.filter(c => c.is_active !== false).length;
  const inactiveCount = clients.filter(c => c.is_active === false).length;
  const riskCount = clients.filter(c => (c.estado?.riesgo_abandono || 0) > 0.5).length;

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} color="var(--brand)" className="spin" />
    </div>
  );

  return (
    <div className="anim-fade-up">
      {/* ── Page Header ── */}
      <div style={{ padding: 'var(--s5) var(--s4) 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s1)' }}>
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2 }}>
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
            <h1 style={{ fontSize: '1.5rem' }}>Hola, {user?.nombre?.split(' ')[0]} 👋</h1>
          </div>
          {riskCount > 0 && (
            <div style={{ position: 'relative' }}>
              <Bell size={22} color="var(--text-muted)" />
              <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--red)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, borderRadius: '999px', minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                {riskCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{ padding: 'var(--s4)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--s2)' }} className="stagger">
        {[
          { label: 'Activos', value: activeCount, color: 'var(--blue)', icon: <Users size={16} /> },
          { label: 'Adherencia', value: `${data?.avg_adherence || 85}%`, color: 'var(--green)', icon: <TrendingUp size={16} /> },
          { label: 'Alertas', value: riskCount, color: riskCount > 0 ? 'var(--red)' : 'var(--text-muted)', icon: <AlertTriangle size={16} /> },
        ].map(k => (
          <div key={k.label} className="card anim-fade-up" style={{ textAlign: 'center', padding: 'var(--s4) var(--s2)' }}>
            <div style={{ color: k.color, display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{k.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Alerts ── */}
      {data?.alerts?.length > 0 && (
        <div style={{ padding: '0 var(--s4)', marginBottom: 'var(--s2)' }}>
          <div className="section-header">
            <span className="section-title">Requieren atención</span>
            <span className="badge badge-red">{data.alerts.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
            {data.alerts.map((a, i) => (
              <div key={i} className="card" style={{ borderColor: 'rgba(255,75,85,0.2)', background: 'rgba(255,75,85,0.05)', padding: 'var(--s3) var(--s4)', display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
                <AlertTriangle size={16} color="var(--red)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.client}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{a.issue}</p>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Clients Section ── */}
      <div style={{ padding: '0 var(--s4)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s3)', marginTop: 'var(--s2)' }}>
          <div className="section-header" style={{ margin: 0, flex: 1 }}>
            <span className="section-title">Mis clientes</span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--s2)' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setEditingClient(null); setShowClientForm(true); }}
            >
              <PlusCircle size={15} /> Nuevo
            </button>
            <Link to="/trainer/rutinas" className="btn btn-primary btn-sm">
              <Dumbbell size={15} /> Plantillas
            </Link>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 'var(--s2)', marginBottom: 'var(--s3)', background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', padding: '4px' }}>
          {[
            { active: filterActivos, label: `Activos (${activeCount})`, action: () => setFilterActivos(true) },
            { active: !filterActivos, label: `Inactivos (${inactiveCount})`, action: () => setFilterActivos(false) },
          ].map(t => (
            <button
              key={t.label}
              onClick={t.action}
              style={{
                flex: 1, padding: 'var(--s2)', borderRadius: 'var(--r-sm)',
                border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                fontFamily: 'var(--font-display)',
                background: t.active ? 'var(--bg-card)' : 'transparent',
                color: t.active ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'all .2s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Client list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)', paddingBottom: 'var(--s4)' }}>
          {visible.map(c => (
            <div key={c.id} className="card" style={{ padding: 'var(--s3) var(--s4)', opacity: c.is_active === false ? 0.55 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, var(--brand), var(--amber))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#fff',
                }}>
                  {c.nombre?.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/trainer/clients/${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.nombre}
                    </span>
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </Link>
                  <div style={{ display: 'flex', gap: 'var(--s2)', marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Sem {c.estado?.week || 1}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--green)', fontWeight: 600 }}>
                      {Math.round((c.estado?.adherencia_promedio || 0) * 100)}% adh.
                    </span>
                    <RiskBadge riesgo={c.estado?.riesgo_abandono} />
                    {c.estado?.fatiga_ultima >= 7 && (
                      <span className="badge badge-amber" style={{ padding: '2px 7px', fontSize: '0.65rem' }}>
                        Fatiga alta
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 'var(--s1)' }}>
                  <Link
                    to={`/trainer/clients/${c.id}/plan`}
                    className="btn-icon"
                    style={{ width: 36, height: 36 }}
                    title="Diseñar Plan Estratégico"
                  >
                    <Dumbbell size={15} />
                  </Link>
                  <Link
                    to={`/trainer/clients/${c.id}/plan`}
                    className="btn-icon"
                    style={{ width: 36, height: 36, color: 'var(--amber)' }}
                    title="Nueva dieta"
                  >
                    <Utensils size={15} />
                  </Link>
                  <button
                    className="btn-icon"
                    style={{ width: 36, height: 36 }}
                    onClick={() => { setEditingClient(c); setShowClientForm(true); }}
                    title="Editar"
                  >
                    <Edit2 size={15} />
                  </button>
                  {isOwner && (
                    <button
                      className="btn-icon"
                      style={{ width: 36, height: 36, color: 'var(--red)', borderColor: 'rgba(255,75,85,0.2)' }}
                      onClick={() => setConfirmDelete(c.id)}
                      title="Desactivar"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {visible.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--s8) var(--s4)' }}>
              <User size={36} color="var(--text-muted)" style={{ margin: '0 auto var(--s3)' }} />
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--s4)', fontSize: '0.9rem' }}>
                {filterActivos ? 'Sin clientes activos aún' : 'Sin clientes inactivos'}
              </p>
              {filterActivos && (
                <button className="btn btn-primary btn-sm" onClick={() => { setEditingClient(null); setShowClientForm(true); }}>
                  <PlusCircle size={15} /> Agregar primer cliente
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Confirm Delete Modal ── */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div style={{ textAlign: 'center', padding: 'var(--s2) 0 var(--s4)' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,75,85,0.12)', border: '1px solid rgba(255,75,85,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--s4)' }}>
                <Trash2 size={24} color="var(--red)" />
              </div>
              <h3 style={{ marginBottom: 'var(--s2)' }}>¿Desactivar cliente?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--s6)' }}>
                Sus datos se conservarán. Podrás reactivarlo más adelante.
              </p>
              <div style={{ display: 'flex', gap: 'var(--s3)' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancelar</button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(confirmDelete)}>Sí, desactivar</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {showClientForm && (
        <ClientFormModal
          client={editingClient}
          onClose={() => { setShowClientForm(false); setEditingClient(null); }}
          onSuccess={() => fetchClients()}
        />
      )}
    </div>
  );
}