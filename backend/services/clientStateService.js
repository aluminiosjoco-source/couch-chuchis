const CheckIn = require('../models/CheckIn');
const ClientProfile = require('../models/ClientProfile');

/**
 * Calcula el estado derivado del cliente basado en su perfil y su historial inmutable de check-ins.
 * @param {String} clientId 
 * @returns {Object} Estado completo derivado
 */
exports.getClientState = async (clientId) => {
  const profile = await ClientProfile.findOne({ client_id: clientId });
  const checkins = await CheckIn.find({ client_id: clientId }).sort({ week: 1 });

  // Si no hay perfil, retorna base nula
  if (!profile) return null;

  const currentWeek = checkins.length > 0 ? checkins[checkins.length - 1].week + 1 : 1;
  const lastCheckIn = checkins.length > 0 ? checkins[checkins.length - 1] : null;

  // Calculo de Adherencia Promedio
  const avgAdherence = checkins.length > 0
    ? checkins.reduce((acc, curr) => acc + curr.adherencia, 0) / checkins.length
    : 1.0;

  // Cálculo de Riesgo de abandono
  // - adherencia_baja: -0.1 por cada 10% bajo 0.8
  // - fatiga_alta: +0.1 si > 7
  let riskScore = 0;
  if (avgAdherence < 0.8) {
    riskScore += ((0.8 - avgAdherence) / 0.1) * 0.1;
  }
  if (lastCheckIn && lastCheckIn.fatiga > 7) {
    riskScore += 0.1;
  }
  
  // Limitar a máximo 1.0
  riskScore = Math.min(1.0, riskScore);

  return {
    client_id: clientId,
    profile_info: profile,
    current_state: {
      week: currentWeek,
      peso: lastCheckIn ? lastCheckIn.peso : null,
      adherencia_promedio: avgAdherence,
      fatiga_ultima: lastCheckIn ? lastCheckIn.fatiga : null,
      riesgo_abandono: riskScore,
      last_checkin_date: lastCheckIn ? lastCheckIn.created_at : null
    },
    history: checkins
  };
};
