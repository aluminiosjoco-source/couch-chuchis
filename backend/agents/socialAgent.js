/**
 * socialAgent.js (refactorizado)
 * Modelo fast-tier: copy creativo, no requiere razonamiento profundo.
 */

const { submitTask } = require('./agentOrchestrator');

const generateSocialPost = async (milestoneData) => {
  const {
    nombre_entrenador = 'Tu entrenador',
    nombre_cliente_anonimo = null,
    tipo_milestone = 'perdida_peso',
    valor_logro = '',
    semanas_entrenando = 8,
    plataforma = 'instagram',
    gym_nombre = 'el gimnasio',
    estilo_coach = 'motivacional',
  } = milestoneData;

  const clienteRef = nombre_cliente_anonimo
    ? `El cliente se llama ${nombre_cliente_anonimo} y autorizó mencionarse.`
    : 'No menciones el nombre (usa "uno de mis atletas" por privacidad).';

  const systemPrompt = `Eres un experto en marketing digital para fitness coaches.
Creas contenido viral auténtico que genera leads y posiciona al entrenador como experto.
El contenido debe sentirse genuino y humano, NUNCA corporativo.
REGLA ABSOLUTA: Responde ÚNICAMENTE con JSON válido.`;

  const userPrompt = `Genera un post para redes sociales:

ENTRENADOR: ${nombre_entrenador} | GYM: ${gym_nombre}
PLATAFORMA: ${plataforma} | ESTILO: ${estilo_coach}
LOGRO: ${tipo_milestone} - ${valor_logro} (${semanas_entrenando} semanas)
PRIVACIDAD: ${clienteRef}

REGLAS POR PLATAFORMA:
- Instagram: 3 párrafos + 20-30 hashtags variados
- TikTok: gancho-historia-CTA corto + hashtags trending
- Facebook: historia larga emocional, pocos hashtags

ESTRUCTURA OBLIGATORIA:
1. Primera línea = GANCHO que detenga el scroll
2. Storytelling breve del proceso
3. CTA que invite a contactar al entrenador

Responde con este JSON exacto:
{
  "plataforma": "${plataforma}",
  "estilo": "${estilo_coach}",
  "copy_principal": "string",
  "gancho_alternativo": "string",
  "hashtags": ["string"],
  "sugerencia_visual": "string",
  "mejor_hora_publicacion": "string",
  "tip_engagement": "string"
}`;

  return submitTask({
    taskType: 'social',
    systemPrompt,
    userPrompt,
    expectedFormat: 'json',
    fallbackFn: () => generateFallbackPost(nombre_entrenador, tipo_milestone, valor_logro, plataforma),
  });
};

const generateFallbackPost = (entrenador, milestone, valor, plataforma) => ({
  plataforma,
  estilo: 'motivacional',
  copy_principal: `¡Lo logramos juntos! 💪\n\nUno de mis atletas acaba de alcanzar: ${valor}.\n${milestone === 'perdida_peso' ? 'Ciencia aplicada y disciplina real.' : 'Meses de trabajo que dan frutos.'}\n\n¿Listo para escribir tu historia? DM o link en bio 👇`,
  gancho_alternativo: 'Esto es lo que pasa cuando la ciencia y el compromiso se juntan…',
  hashtags: ['#FitnessCoach', '#TransformacionFisica', '#EntrenadorPersonal', '#Motivacion', '#ResultadosReales'],
  sugerencia_visual: '[FALLBACK] Foto de progreso o video de ejercicio en acción',
  mejor_hora_publicacion: 'Martes o Jueves 6-8pm',
  tip_engagement: 'Pregunta al final: "¿Cuál es tu próximo objetivo?" para generar comentarios',
});

module.exports = { generateSocialPost };