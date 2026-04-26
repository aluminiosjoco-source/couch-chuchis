/**
 * nutritionAgent.js (refactorizado)
 * Solo construye el payload. El AgentOrchestrator gestiona la ejecución.
 */

const { submitTask } = require('./agentOrchestrator');

const generateMealPlan = async (nutritionProfile) => {
  const {
    kcal_target = 2200,
    protein_g = 140,
    fat_percentage = 0.25,
    carbs_g = 220,
    region = 'mexico',
    restricciones = [],
    objetivo = 'perdida_grasa',
    nombre_cliente = 'el cliente',
    alimentos_disponibles = [],
  } = nutritionProfile;

  const restriccionesStr = restricciones.length > 0
    ? `Restricciones/alergias: ${restricciones.join(', ')}.`
    : 'Sin restricciones alimenticias.';

  const disponiblesStr = alimentos_disponibles.length > 0
    ? `Preferencias del cliente: ${alimentos_disponibles.join(', ')}.`
    : '';

  const systemPrompt = `Eres un nutriólogo clínico especializado en nutrición deportiva y gastronomía latinoamericana.
Regla 80/20: 80% estructura científica validada, 20% adaptación cultural local.
REGLA ABSOLUTA: Responde ÚNICAMENTE con JSON válido sin texto adicional.`;

  const userPrompt = `Diseña un plan de alimentación semanal para ${nombre_cliente}:

MACROS OBJETIVO (80% Científico):
- Calorías: ${kcal_target} kcal/día
- Proteína: ${protein_g}g/día
- Grasa: ${Math.round(kcal_target * fat_percentage / 9)}g/día (${Math.round(fat_percentage * 100)}%)
- Carbohidratos: ${carbs_g}g/día
- Objetivo: ${objetivo}

ADAPTACIÓN CULTURAL (20%):
- Región: ${region}
- ${restriccionesStr}
- ${disponiblesStr}

INSTRUCCIONES:
1. 7 días con desayuno, colación 1, almuerzo, colación 2, cena
2. Cada comida con desglose de macros aproximado
3. Ingredientes típicos de ${region} (México: tortilla, frijoles, chiles, aguacate)
4. Sugiere intercambios si no consigue algún ingrediente

Responde EXACTAMENTE con este JSON:
{
  "resumen_diario": { "kcal": number, "proteina_g": number, "carbs_g": number, "grasa_g": number },
  "estructura_comidas": {
    "desayuno":   { "kcal": number, "opciones": ["string"] },
    "colacion_1": { "kcal": number, "opciones": ["string"] },
    "almuerzo":   { "kcal": number, "opciones": ["string"] },
    "colacion_2": { "kcal": number, "opciones": ["string"] },
    "cena":       { "kcal": number, "opciones": ["string"] }
  },
  "plan_semanal": [
    {
      "dia": "string",
      "desayuno": "string",
      "colacion_1": "string",
      "almuerzo": "string",
      "colacion_2": "string",
      "cena": "string",
      "total_kcal_estimado": number
    }
  ],
  "intercambios_sugeridos": ["string"],
  "notas_culturales": "string",
  "nota_nutricionista": "string"
}`;

  return submitTask({
    taskType: 'nutrition',
    systemPrompt,
    userPrompt,
    expectedFormat: 'json',
    fallbackFn: () => generateFallbackMealPlan(kcal_target, protein_g, region),
  });
};

// ── Fallback determinístico ───────────────────────────────────────────────────
const generateFallbackMealPlan = (kcal, proteina, region) => ({
  resumen_diario: {
    kcal,
    proteina_g: proteina,
    carbs_g: Math.round((kcal * 0.45) / 4),
    grasa_g: Math.round((kcal * 0.25) / 9),
  },
  estructura_comidas: {
    desayuno: { kcal: Math.round(kcal * 0.25), opciones: ['Huevos revueltos + tortilla de maíz + frijoles + aguacate'] },
    colacion_1: { kcal: Math.round(kcal * 0.10), opciones: ['Fruta + puño de nueces'] },
    almuerzo: { kcal: Math.round(kcal * 0.35), opciones: ['Pechuga de pollo + arroz + frijoles + ensalada'] },
    colacion_2: { kcal: Math.round(kcal * 0.10), opciones: ['Yogur natural + fruta'] },
    cena: { kcal: Math.round(kcal * 0.20), opciones: ['Pescado al limón + verduras al vapor + tortilla'] },
  },
  plan_semanal: [],
  intercambios_sugeridos: ['Tortilla de maíz > tortilla de harina', 'Frijoles negros > bayos (mejor perfil proteico)'],
  notas_culturales: `Adaptado para región: ${region}`,
  nota_nutricionista: '[FALLBACK] Plan base. Ollama no disponible.',
});

module.exports = { generateMealPlan };