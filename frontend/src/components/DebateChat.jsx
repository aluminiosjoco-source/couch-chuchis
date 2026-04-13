import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DebateChat({ routineId, initialLog = [] }) {
  const { authFetch } = useAuth();
  const [log, setLog] = useState(initialLog);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [log]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;

    const userMsg = msg;
    setMsg('');
    setLog(prev => [...prev, { autor: 'coach', mensaje: userMsg }]);
    setLoading(true);

    try {
      const res = await authFetch(`http://localhost:5000/api/agents/routine/${routineId}/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: userMsg })
      });
      const data = await res.json();
      if (data.routine) {
        setLog(data.routine.debate_log);
      }
    } catch (err) {
      console.error(err);
      alert("Error en la conexión del debate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '400px', background: 'rgba(0,0,0,0.5)' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
         <Bot color="var(--color-primary)" />
         <h4 style={{ margin: 0 }}>Debate Biomecánico vs IA</h4>
      </div>
      
      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {log.map((m, i) => (
          <div key={i} style={{ 
              alignSelf: m.autor === 'coach' ? 'flex-end' : 'flex-start',
              background: m.autor === 'coach' ? 'rgba(255,107,0,0.2)' : 'rgba(255,255,255,0.05)',
              border: m.autor === 'coach' ? '1px solid var(--color-accent)' : '1px solid #333',
              padding: '1rem',
              borderRadius: '12px',
              maxWidth: '80%'
            }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', opacity: 0.8, fontSize: '0.8rem' }}>
               {m.autor === 'coach' ? <User size={14}/> : <Bot size={14} color="var(--color-primary)"/>}
               <strong style={{textTransform:'uppercase'}}>{m.autor}</strong>
             </div>
             <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{m.mensaje}</div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
             <Loader2 size={16} className="animate-spin"/> <em>El agente está analizando...</em>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', padding: '1rem', borderTop: '1px solid #333', gap: '0.5rem' }}>
         <input 
            type="text" 
            className="form-control" 
            value={msg} 
            onChange={e => setMsg(e.target.value)} 
            placeholder="Argumenta una mejora o pide un cambio..."
            style={{ flex: 1 }}
            disabled={loading}
         />
         <button type="submit" className="btn-primary flex-center" disabled={loading || !msg.trim()} style={{ padding: '0 1.5rem' }}>
            <Send size={18} />
         </button>
      </form>
    </div>
  );
}
