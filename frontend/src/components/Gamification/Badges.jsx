import React from 'react';
import { Flame, Shield, Sword, Crown, Star, Zap, Target, Award } from 'lucide-react';

const BADGE_CONFIG = {
  first_week: { icon: <Zap size={20} />, label: 'Iniciando el Viaje', color: '#00B0FF', desc: 'Primera semana completada' },
  streak_4: { icon: <Flame size={20} />, label: 'Consistente', color: '#FF8A00', desc: '4 semanas seguidas' },
  streak_12: { icon: <Crown size={20} />, label: 'Dedicación de Hierro', color: '#FFD700', desc: '12 semanas consecutivas' },
  meta_peso_5: { icon: <Target size={20} />, label: 'Transformación -5kg', color: '#00E676', desc: '5kg perdidos' },
  meta_peso_10: { icon: <Shield size={20} />, label: 'Transformación -10kg', color: '#00E676', desc: '10kg perdidos' },
  fuerza_primer_1rm: { icon: <Sword size={20} />, label: 'Primero de Muchos', color: '#FF5A00', desc: 'Primer 1RM registrado' },
  adherencia_100: { icon: <Star size={20} />, label: 'Perfecto', color: '#FFD700', desc: 'Semana con 100% adherencia' },
  elite_level: { icon: <Award size={20} />, label: 'Atleta Elite', color: '#FF5A00', desc: 'Nivel Elite alcanzado' },
};

/**
 * Grilla de badges del cliente.
 * @param {string[]} unlockedBadges - Array de IDs de badges desbloqueados
 */
export function BadgesGrid({ unlockedBadges = ['first_week', 'streak_4', 'fuerza_primer_1rm'] }) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>🏅 Mis Logros</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
        {Object.entries(BADGE_CONFIG).map(([id, cfg]) => {
          const unlocked = unlockedBadges.includes(id);
          return (
            <div key={id} title={cfg.desc}
              style={{ textAlign: 'center', padding: '1rem 0.75rem', borderRadius: '12px', border: `1px solid ${unlocked ? cfg.color + '40' : 'var(--glass-border)'}`, background: unlocked ? `${cfg.color}0D` : 'rgba(255,255,255,0.02)', opacity: unlocked ? 1 : 0.35, transition: 'all 0.2s', cursor: 'default' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '50%', background: unlocked ? `${cfg.color}22` : 'rgba(255,255,255,0.05)', color: unlocked ? cfg.color : 'var(--color-text-muted)', marginBottom: '0.6rem', filter: unlocked ? 'none' : 'grayscale(1)' }}>
                {cfg.icon}
              </div>
              <p style={{ fontSize: '0.72rem', fontWeight: '700', color: unlocked ? 'var(--color-text-main)' : 'var(--color-text-muted)', lineHeight: '1.3' }}>{cfg.label}</p>
              {unlocked && <p style={{ fontSize: '0.65rem', color: cfg.color, marginTop: '0.2rem' }}>✓ Desbloqueado</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Widget de racha de fuego con indicador visual animado.
 */
export function StreakWidget({ streakCurrent = 3, streakLongest = 12, level = 'Intermedio' }) {
  const LEVELS = { Principiante: '#9BA3AF', Intermedio: '#00B0FF', Avanzado: '#00E676', Elite: '#FFD700', Atleta: '#FF5A00' };
  const levelColor = LEVELS[level] || '#9BA3AF';

  // Generar últimas 8 semanas (simuladas como activas si están en racha)
  const weeks = Array.from({ length: 8 }, (_, i) => ({
    label: `S${8 - i}`,
    active: i < streakCurrent,
  })).reverse();

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', margin: 0 }}>🔥 Racha Activa</h3>
        <span style={{ fontSize: '0.75rem', padding: '0.3em 0.8em', borderRadius: '20px', background: `${levelColor}20`, color: levelColor, fontWeight: '700', border: `1px solid ${levelColor}40` }}>
          Nivel: {level}
        </span>
      </div>

      {/* Contador grande */}
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '3.5rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: streakCurrent >= 4 ? '#FF8A00' : 'var(--color-text-main)', lineHeight: 1 }}>
          {streakCurrent}
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>semanas consecutivas</p>
      </div>

      {/* Barras visuales de semanas */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '1rem' }}>
        {weeks.map((w, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: w.active ? 'linear-gradient(135deg, #FF5A00, #FF8A00)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', transition: 'all 0.3s' }}>
              {w.active ? '🔥' : '○'}
            </div>
            <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>{w.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Mejor racha</span>
        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#FFD700' }}>🏆 {streakLongest} semanas</span>
      </div>
    </div>
  );
}

/**
 * Indicador de nivel del cliente con barra de progreso.
 */
export function LevelIndicator({ semanas = 4, adherenciaPromedio = 0.84 }) {
  const base = semanas * adherenciaPromedio;
  let nivel = 'Principiante', nextNivel = 'Intermedio', progress = base / 10, nextBase = 10;
  if (base >= 100) { nivel = 'Atleta'; nextNivel = null; progress = 1; }
  else if (base >= 60) { nivel = 'Elite'; nextNivel = 'Atleta'; progress = (base - 60) / 40; nextBase = 100; }
  else if (base >= 30) { nivel = 'Avanzado'; nextNivel = 'Elite'; progress = (base - 30) / 30; nextBase = 60; }
  else if (base >= 10) { nivel = 'Intermedio'; nextNivel = 'Avanzado'; progress = (base - 10) / 20; nextBase = 30; }

  const LEVELS_CONFIG = { Principiante: '#9BA3AF', Intermedio: '#00B0FF', Avanzado: '#00E676', Elite: '#FFD700', Atleta: '#FF5A00' };
  const color = LEVELS_CONFIG[nivel];

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Tu nivel actual</p>
          <h3 style={{ fontSize: '1.5rem', color, margin: 0 }}>{nivel}</h3>
        </div>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', border: `3px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
          {nivel === 'Atleta' ? '🏆' : nivel === 'Elite' ? '⭐' : nivel === 'Avanzado' ? '💪' : nivel === 'Intermedio' ? '📈' : '🌱'}
        </div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '99px', height: '8px', overflow: 'hidden', marginBottom: '0.5rem' }}>
        <div style={{ height: '100%', width: `${Math.min(progress * 100, 100)}%`, background: `linear-gradient(90deg, ${color}, ${color}99)`, borderRadius: '99px', transition: 'width 1s ease' }} />
      </div>
      {nextNivel && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>Próximo nivel: <strong style={{ color }}>{nextNivel}</strong></p>}
    </div>
  );
}
