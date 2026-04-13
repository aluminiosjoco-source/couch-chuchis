import React, { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Users, PlusCircle, User, Loader2, Edit2, Trash2, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import RoutineWizard from './Trainer/RoutineWizard';
import ClientFormModal from './Trainer/ClientFormModal';

export default function TrainerDashboard() {
  const { user, authFetch } = useAuth();
  const [data, setData] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedClientForWizard, setSelectedClientForWizard] = useState(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // client id to confirm
  const [filterActivos, setFilterActivos] = useState(true);

  const isOwner = user?.rol === 'gym_owner' || user?.rol === 'super_admin';

  const fetchClients = async () => {
    if (!authFetch) return;
    const rClients = await authFetch('http://localhost:5000/api/clients');
    if (rClients.ok) setClients(await rClients.json());
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rDash = await fetch('http://localhost:5000/api/v1/trainers/dashboard');
        if (rDash.ok) setData(await rDash.json());

        await fetchClients();
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authFetch]);

  const handleDeleteClient = async (clientId) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/clients/${clientId}`, { method: 'DELETE' });
      if (res.ok) {
        setClients(prev => prev.filter(c => c.id !== clientId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleClientSaved = () => {
    fetchClients();
  };

  const visibleClients = clients.filter(c => filterActivos ? c.is_active !== false : !c.is_active);

  if (loading) return <div className="flex-center" style={{ height: '100%' }}><Loader2 className="animate-spin" size={48} /></div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient">Buenos días, {user?.nombre || 'Coach'}</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Gym: {user?.gym_id || 'FitZone'} | Múltiples alertas requieren tu atención.</p>
      </header>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel text-center flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
          <Users size={36} color="var(--color-accent)" />
          <h3 style={{ fontSize: '2rem' }}>{clients.filter(c => c.is_active !== false).length || data?.active_clients || 0}</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>Clientes Activos</p>
        </div>
        <div className="glass-panel text-center flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
          <TrendingUp size={36} color="var(--color-secondary)" />
          <h3 className="text-gradient-green" style={{ fontSize: '2rem' }}>{data?.avg_adherence || 85}%</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>Adherencia Promedio</p>
        </div>
        <div className="glass-panel text-center flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
          <UserX size={36} color="#ff6b6b" />
          <h3 style={{ fontSize: '2rem', color: '#ff6b6b' }}>{clients.filter(c => c.is_active === false).length}</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>Clientes Inactivos</p>
        </div>
      </div>

      {/* Alertas Motor de Decisiones */}
      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle color="#FBC02D" /> Alertas del Motor de Decisiones
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {data?.alerts?.map((alert, i) => (
            <div key={i} className={`glass-panel flex-between ${alert.type === 'critical' ? 'alert-critical' : 'alert-warning'}`} style={{ padding: '1rem' }}>
              <div>
                <strong>{alert.client}</strong> - <span style={{ color: 'var(--color-text-muted)' }}>{alert.issue}</span>
              </div>
              <button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>Revisar Contexto</button>
            </div>
          ))}
          {(!data?.alerts || data.alerts.length === 0) && (
            <p style={{ color: 'var(--color-text-muted)' }}>No hay alertas críticas por ahora.</p>
          )}
        </div>
      </section>

      {/* Lista de Clientes */}
      <section>
        <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users /> Mis Clientes</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filtro activo/inactivo */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '3px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setFilterActivos(true)} style={{ padding: '0.4rem 0.9rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', background: filterActivos ? 'var(--color-accent)' : 'transparent', color: filterActivos ? 'white' : 'var(--color-text-muted)', transition: 'all 0.2s' }}>
                <UserCheck size={14} style={{ display: 'inline', marginRight: '4px' }} />Activos
              </button>
              <button onClick={() => setFilterActivos(false)} style={{ padding: '0.4rem 0.9rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', background: !filterActivos ? '#ff6b6b' : 'transparent', color: !filterActivos ? 'white' : 'var(--color-text-muted)', transition: 'all 0.2s' }}>
                <UserX size={14} style={{ display: 'inline', marginRight: '4px' }} />Inactivos
              </button>
            </div>

            <button className="btn-primary flex-center" style={{ gap: '0.5rem' }}
              onClick={() => { setSelectedClientForWizard(null); setShowWizard(true); }}>
              <PlusCircle size={18} /> Nueva Rutina
            </button>

            <button className="btn-primary flex-center" style={{ gap: '0.5rem', background: 'rgba(0,230,118,0.15)', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)' }}
              onClick={() => { setEditingClient(null); setShowClientForm(true); }}>
              <PlusCircle size={18} /> Nuevo Cliente
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          {visibleClients.map(client => (
            <div key={client.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', opacity: client.is_active === false ? 0.65 : 1, transition: 'opacity 0.2s' }}>
              {/* Botón + Rutina */}
              <button
                title="Nueva Rutina"
                onClick={() => { setSelectedClientForWizard(client); setShowWizard(true); }}
                style={{ background: 'rgba(255,107,0,0.1)', color: 'var(--color-accent)', padding: '0.5rem', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                <PlusCircle size={20} />
              </button>

              {/* Info cliente */}
              <div style={{ flex: 1, minWidth: '180px' }}>
                <Link to={`/trainer/clients/${client.id}`} style={{ textDecoration: 'none', color: 'white', fontWeight: 'bold', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {client.nombre} <User size={14} color="var(--color-text-muted)" />
                </Link>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                  {client.email} &nbsp;·&nbsp;
                  Sem {client.estado?.week || 1} &nbsp;·&nbsp;
                  Adherencia: {Math.round((client.estado?.adherencia_promedio || 0) * 100)}% &nbsp;·&nbsp;
                  Riesgo: {Math.round((client.estado?.riesgo_abandono || 0) * 100)}%
                </div>
              </div>

              {/* Badges de estado */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {client.is_active === false && (
                  <span style={{ background: 'rgba(100,100,100,0.2)', color: '#aaa', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem' }}>Inactivo</span>
                )}
                {client.estado?.riesgo_abandono > 0.5 && (
                  <span style={{ background: 'rgba(255,0,0,0.2)', color: '#ff6b6b', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem' }}>Riesgo Alto</span>
                )}
                {client.estado?.fatiga_ultima >= 7 && (
                  <span style={{ background: 'rgba(255,165,0,0.2)', color: 'orange', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem' }}>Fatiga Alta</span>
                )}
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button title="Editar"
                  onClick={() => { setEditingClient(client); setShowClientForm(true); }}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: '8px', padding: '0.4rem 0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                  <Edit2 size={14} />
                </button>
                {isOwner && (
                  <button title="Desactivar"
                    onClick={() => setConfirmDelete(client.id)}
                    style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', color: '#ff6b6b', borderRadius: '8px', padding: '0.4rem 0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {visibleClients.length === 0 && (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              {filterActivos ? (
                <>No tienes clientes activos. <button onClick={() => { setEditingClient(null); setShowClientForm(true); }} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}>Crear el primero →</button></>
              ) : 'No hay clientes inactivos.'}
            </div>
          )}
        </div>
      </section>

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <Trash2 size={40} color="#ff6b6b" style={{ marginBottom: '1rem' }} />
            <h3>¿Desactivar este cliente?</h3>
            <p style={{ color: 'var(--color-text-muted)', margin: '0.5rem 0 1.5rem' }}>El cliente quedará inactivo pero sus datos se conservarán.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
              <button onClick={() => handleDeleteClient(confirmDelete)} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,50,50,0.2)', border: '1px solid rgba(255,50,50,0.4)', color: '#ff6b6b', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Sí, desactivar</button>
            </div>
          </div>
        </div>
      )}

      {/* Routine Wizard */}
      {showWizard && (
        <RoutineWizard
          client={selectedClientForWizard}
          onClose={() => setShowWizard(false)}
        />
      )}

      {/* Client Form Modal */}
      {showClientForm && (
        <ClientFormModal
          client={editingClient}
          onClose={() => { setShowClientForm(false); setEditingClient(null); }}
          onSuccess={handleClientSaved}
        />
      )}
    </div>
  );
}
