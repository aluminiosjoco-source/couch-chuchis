/**
 * engagementAgent.js (refactorizado)
 * Modelo fast-tier: texto corto emocional, no necesita razonamiento profundo.
 */

const { submitTask } = require('./agentOrchestrator');

const generateEngagementMessage = async (engagementContext) => {
  const {
    nombre = 'amigo/a',
    abandono_risk = 0.3,
    streak_current = 0,
    streak_longest = 0,
    adherencia_ultima_semana = 0.75,
    fatiga_percibida = 5,
    semanas_activo = 4,
    ultimo_milestone = null,
    motivo_alerta = 'adherencia_baja',
    canal = 'push',
  } = engagementContext;

  let tono = 'motivacional_suave';
  if (abandono_risk > 0.6) tono = 'empatico_urgente';
  else if (abandono_risk > 0.4) tono = 'motivacional_directo';
  else if (streak_current >= 4) tono = 'celebratorio';

  const systemPrompt = `Eres un psicólogo deportivo especializado en motivación y retención fitness.
Tu comunicación es empática, directa, nunca genérica ni robótica.
REGLA ABSOLUTA: Responde ÚNICAMENTE con JSON válido.`;

  const userPrompt = `Genera un mensaje de engagement personalizado:

CLIENTE: ${nombre}
- Riesgo de abandono: ${Math.round(abandono_risk * 100)}%
- Racha actual: ${streak_current} semanas | Mejor racha: ${streak_longest}
- Adherencia última semana: ${Math.round(adherencia_ultima_semana * 100)}%
- Fatiga percibida: ${fatiga_percibida}/10
- Semanas activo: ${semanas_activo}
- Motivo de alerta: ${motivo_alerta}
- Tono requerido: ${tono}
- Canal: ${canal}
${ultimo_milestone ? `- Último milestone: ${ultimo_milestone}` : ''}

LÍMITES POR CANAL:
- push: título ≤120 chars, cuerpo ≤200 chars
- email: hasta 3 párrafos elaborados
- whatsapp: informal, emojis moderados

Si riesgo > 60%: incluye CTA clara.

Responde con este JSON exacto:
{
  "canal": "${canal}",
  "tono": "${tono}",
  "titulo": "string",
  "cuerpo": "string",
  "cta": "string o null",
  "cta_link": "/dashboard o null",
  "emoji_principal": "string o null",
  "urgencia": "alta | media | baja"
}`;

  return submitTask({
    taskType: 'engagement',
    systemPrompt,
    userPrompt,
    expectedFormat: 'json',
    fallbackFn: () => generateFallbackMessage(nombre, abandono_risk, streak_current, canal),
  });
};

const generateFallbackMessage = (nombre, riesgo, racha, canal) => {
  const nivel = riesgo > 0.6 ? 'alta' : riesgo > 0.4 ? 'media' : 'baja';
  const msgs = {
    alta: { titulo: `${nombre}, te extrañamos 💙`, cuerpo: 'Tu plan sigue esperándote. Un paso de vuelta es todo lo que necesitas.', cta: 'Volver ahora', urgencia: 'alta' },
    media: { titulo: `¡Sigue así, ${nombre}!`, cuerpo: 'La semana fue difícil. La constancia supera a la perfección. ¡Vamos!', cta: 'Ver mi plan', urgencia: 'media' },
    baja: { titulo: `🔥 ${racha} semanas, ${nombre}!`, cuerpo: 'Eso es dedicación real. Tu cuerpo está respondiendo. ¡Sigue así!', cta: null, urgencia: 'baja' },
  };
  return { canal, tono: 'fallback', ...msgs[nivel], cta_link: '/dashboard', emoji_principal: '💪' };
};

module.exports = { generateEngagementMessage };