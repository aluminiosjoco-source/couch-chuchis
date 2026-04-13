import React, { useEffect, useState } from 'react';
import { Users, PlusCircle, Edit2, Trash2, UserCheck, UserX, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TrainerFormModal from './TrainerFormModal';

export default function TrainersPage() {
  const { authFetch } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showInactive, setShowInactive] = useState(false);

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const res = await authFetch('http://localhost:5000/api/trainers');
      if (res.ok) setTrainers(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrainers(); }, []);

  const handleToggleActive = async (trainer) => {
    try {
      if (trainer.is_active) {
        await authFetch(`http://localhost:5000/api/trainers/${trainer._id}`, { method: 'DELETE' });
      } else {
        await authFetch(`http://localhost:5000/api/trainers/${trainer._id}`, {
          method: 'PUT', body: JSON.stringify({ is_active: true }),
        });
      }
      fetchTrainers();
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmDelete(null);
    }
  };

  const visible = trainers.filter(t => showInactive ? !t.is_active : t.is_active !== false);

  if (loading) return <div className="flex-center" style={{ height: '100%' }}><Loader2 className="animate-spin" size={48} /></div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient">Gestión de Entrenadores</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Administra el equipo de entrenadores de tu gimnasio.</p>
      </header>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel text-center flex-center" style={{ flexDirection: 'column', gap: '0.75rem' }}>
          <Users size={32} color="var(--color-accent)" />
          <h3 style={{ fontSize: '2rem' }}>{trainers.filter(t => t.is_active !== false).length}</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Entrenadores Activos</p>
        </div>
        <div className="glass-panel text-center flex-center" style={{ flexDirection: 'column', gap: '0.75rem' }}>
          <UserCheck size={32} color="var(--color-secondary)" />
          <h3 style={{ fontSize: '2rem', color: 'var(--color-secondary)' }}>
            {trainers.reduce((acc, t) => acc + (t.clientes_asignados || 0), 0)}
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Total Clientes Gestionados</p>
        </div>
        <div className="glass-panel text-center flex-center" style={{ flexDirection: 'column', gap: '0.75rem' }}>
          <UserX size={32} color="#888" />
          <h3 style={{ fontSize: '2rem', color: '#888' }}>{trainers.filter(t => t.is_active === false).length}</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Entrenadores Inactivos</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setShowInactive(false)} style={{ padding: '0.4rem 0.9rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', background: !showInactive ? 'var(--color-accent)' : 'rgba(255,255,255,0.06)', color: !showInactive ? 'white' : 'var(--color-text-muted)' }}>
            <UserCheck size={14} style={{ display: 'inline', marginRight: '4px' }} />Activos
          </button>
          <button onClick={() => setShowInactive(true)} style={{ padding: '0.4rem 0.9rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', background: showInactive ? '#888' : 'rgba(255,255,255,0.06)', color: showInactive ? 'white' : 'var(--color-text-muted)' }}>
            <UserX size={14} style={{ display: 'inline', marginRight: '4px' }} />Inactivos
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={fetchTrainers} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: '10px', padding: '0.5rem 0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
            <RefreshCw size={15} />
          </button>
          <button className="btn-primary flex-center" style={{ gap: '0.5rem' }}
            onClick={() => { setEditingTrainer(null); setShowForm(true); }}>
            <PlusCircle size={18} /> Nuevo Entrenador
          </button>
        </div>
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {visible.map(trainer => (
          <div key={trainer._id} className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', opacity: trainer.is_active === false ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            {/* Avatar placeholder */}
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.1rem', flexShrink: 0 }}>
              {trainer.nombre?.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'white' }}>{trainer.nombre}</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginTop: '0.15rem' }}>
                {trainer.email} &nbsp;·&nbsp;
                <span style={{ color: 'var(--color-secondary)' }}>{trainer.clientes_asignados || 0} clientes asignados</span>
              </div>
              {trainer.is_active === false && (
                <span style={{ display: 'inline-block', marginTop: '0.3rem', background: 'rgba(100,100,100,0.2)', color: '#aaa', padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.72rem' }}>Inactivo</span>
              )}
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Link to={`/trainer/entrenadores/${trainer._id}`}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: '8px', padding: '0.4rem 0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                Ver detalle <ChevronRight size={14} />
              </Link>
              <button title="Editar"
                onClick={() => { setEditingTrainer(trainer); setShowForm(true); }}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: '8px', padding: '0.4rem 0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Edit2 size={15} />
              </button>
              <button title={trainer.is_active === false ? 'Reactivar' : 'Desactivar'}
                onClick={() => setConfirmDelete(trainer)}
                style={{ background: trainer.is_active === false ? 'rgba(0,230,118,0.1)' : 'rgba(255,50,50,0.1)', border: `1px solid ${trainer.is_active === false ? 'rgba(0,230,118,0.3)' : 'rgba(255,50,50,0.3)'}`, color: trainer.is_active === false ? 'var(--color-secondary)' : '#ff6b6b', borderRadius: '8px', padding: '0.4rem 0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                {trainer.is_active === false ? <UserCheck size={15} /> : <Trash2 size={15} />}
              </button>
            </div>
          </div>
        ))}

        {visible.length === 0 && (
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            {showInactive ? 'No hay entrenadores inactivos.' : (
              <>No tienes entrenadores activos. <button onClick={() => { setEditingTrainer(null); setShowForm(true); }} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}>Agregar el primero →</button></>
            )}
          </div>
        )}
      </div>

      {/* Confirm toggle dialog */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
            {confirmDelete.is_active === false ? (
              <UserCheck size={40} color="var(--color-secondary)" style={{ marginBottom: '1rem' }} />
            ) : (
              <Trash2 size={40} color="#ff6b6b" style={{ marginBottom: '1rem' }} />
            )}
            <h3>{confirmDelete.is_active === false ? '¿Reactivar entrenador?' : '¿Desactivar entrenador?'}</h3>
            <p style={{ color: 'var(--color-text-muted)', margin: '0.5rem 0 1.5rem' }}>
              {confirmDelete.is_active === false
                ? `${confirmDelete.nombre} volverá a estar activo y podrá acceder al sistema.`
                : `${confirmDelete.nombre} quedará inactivo. Sus clientes asignados se conservarán.`}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
              <button onClick={() => handleToggleActive(confirmDelete)}
                style={{ padding: '0.75rem 1.5rem', background: confirmDelete.is_active === false ? 'rgba(0,230,118,0.2)' : 'rgba(255,50,50,0.2)', border: `1px solid ${confirmDelete.is_active === false ? 'rgba(0,230,118,0.4)' : 'rgba(255,50,50,0.4)'}`, color: confirmDelete.is_active === false ? 'var(--color-secondary)' : '#ff6b6b', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                {confirmDelete.is_active === false ? 'Sí, reactivar' : 'Sí, desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <TrainerFormModal
          trainer={editingTrainer}
          onClose={() => { setShowForm(false); setEditingTrainer(null); }}
          onSuccess={fetchTrainers}
        />
      )}
    </div>
  );
}
