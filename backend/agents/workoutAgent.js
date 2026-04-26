/**
 * workoutAgent.js (Split & Merge - prompts profesionales)
 *
 * Cada sub-prompt mantiene el contexto clínico completo (lesiones, estrés,
 * biomecánica) para que la prescripción sea profesional y diferenciada.
 *
 * Optimizado para llama3 8B en CPU mediante:
 *   - Split & Merge: divide la generación en llamadas pequeñas
 *   - num_ctx: 2048 (configurado en ollamaExecutor)
 *   - num_predict ajustado por tipo de sub-tarea
 *
 * Flujo:
 *   1. ESTRUCTURA: split, días, músculos foco, ajustes de volumen
 *   2. DÍA x N: ejercicios con justificación biomecánica
 *   3. MERGE local en JS (sin IA)
 */

const { submitTask } = require('./agentOrchestrator');

const generateWorkoutPlan = async (clientState, draftPlan = null) => {
  const {
    objetivo = 'hipertrofia',
    experiencia = 'intermedio',
    dias_disponibles = 4,
    equipamiento = 'gym',
    peso = 80,
    fatiga_percibida = 5,
    adherencia = 0.85,
    limitaciones = [],
    max_estimates = {},
    week_on_block = 1,
    lesiones_pasadas = '',
    dolor_frecuente = '',
    condicion_medica = '',
    estilo_vida = 'sedentario',
    horas_sueno = '7-8',
    nivel_estres = 'medio',
    tipo_entrenamiento_preferido = 'pesas',
    ejercicios_disgusto = '',
  } = clientState;

  // ── Contexto clínico compartido (se reutiliza en cada sub-llamada) ──
  const fichaClinica = [
    `Objetivo: ${objetivo}`,
    `Experiencia: ${experiencia}`,
    `Días: ${dias_disponibles}/sem`,
    `Equipo: ${equipamiento}`,
    `Peso: ${peso}kg`,
    `Fatiga: ${fatiga_percibida}/10`,
    `Adherencia: ${Math.round(adherencia * 100)}%`,
    `Semana bloque: ${week_on_block}`,
    `Estilo vida: ${estilo_vida}`,
    `Sueño: ${horas_sueno}h`,
    `Estrés: ${nivel_estres}`,
    `Preferencia: ${tipo_entrenamiento_preferido}`,
    limitaciones.length > 0 ? `Limitaciones: ${limitaciones.join(', ')}` : null,
    lesiones_pasadas ? `Lesiones previas: ${lesiones_pasadas}` : null,
    dolor_frecuente ? `Dolor frecuente: ${dolor_frecuente}` : null,
    condicion_medica ? `Condición médica: ${condicion_medica}` : null,
    ejercicios_disgusto ? `Evitar: ${ejercicios_disgusto}` : null,
    Object.keys(max_estimates).length > 0 ? `1RM: ${JSON.stringify(max_estimates)}` : null,
  ].filter(Boolean).join('. ');

  const reglasSeguridad = nivel_estres === 'alto' || parseFloat(horas_sueno) < 6
    ? 'REGLA: Estrés alto o sueño bajo detectado. Reduce RPE en 1 punto y volumen en 20%.'
    : '';

  // ══════════════════════════════════════════════════════════════════════
  // PASO 1: ESTRUCTURA (split, distribución muscular, notas clínicas)
  // ══════════════════════════════════════════════════════════════════════
  let structure = null;
  
  if (draftPlan && draftPlan.split_name && Array.isArray(draftPlan.dias)) {
    console.log(`[WorkoutAgent] 🔄 Reanudando generación de rutina desde un draft previo (Paso 1 Omitido)`);
    structure = { ...draftPlan };
  } else {
    console.log(`[WorkoutAgent] 🚀 Iniciando generación de rutina: Paso 1/2 - Estructura (Progreso: 0%)`);
    structure = await submitTask({
      taskType: 'workout_structure',
      systemPrompt: 'Eres kinesiólogo y entrenador experto. Diseña splits seguros basados en datos clínicos del paciente. Si hay lesiones, evita esa zona. Responde SOLO JSON.',
      userPrompt: `Diseña la estructura de un split de ${dias_disponibles} días.

Ficha: ${fichaClinica}
${reglasSeguridad}

Responde con este JSON (sin ejercicios, solo estructura):
{"split_name":"nombre del split","dias_totales":${dias_disponibles},"bloque_semanas":4,"volumen_ajustado":false,"razon_ajuste":"razón o null","dias":[{"dia":1,"nombre":"Nombre","musculos_foco":["músculo1","músculo2"]}],"notas_generales":"observaciones clínicas"}`,
      expectedFormat: 'json',
      fallbackFn: () => {
        throw new Error('Motor de IA no disponible para estructura de rutina. Reintenta en un momento.');
      },
    });

    console.log(`[WorkoutAgent] ✓ Estructura generada: ${structure.split_name} (${structure.dias?.length || 0} días) (Progreso: 20%)`);

    if (!structure.dias || !Array.isArray(structure.dias) || structure.dias.length === 0) {
      throw new Error('La IA devolvió una estructura sin días válidos.');
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // PASO 2: EJERCICIOS POR DÍA (con justificación biomecánica)
  // ══════════════════════════════════════════════════════════════════════
  const diasCompletos = draftPlan && Array.isArray(draftPlan.dias) 
    ? draftPlan.dias.filter(d => Array.isArray(d.ejercicios) && d.ejercicios.length > 0) 
    : [];
    
  let is_partial = false;

  for (const dayInfo of structure.dias) {
    // Si este día ya fue completado previamente, lo saltamos
    if (diasCompletos.some(d => d.dia === dayInfo.dia)) {
      console.log(`[WorkoutAgent] ⏭️ Omitiendo Día ${dayInfo.dia} (Ya fue completado en un draft previo)`);
      continue;
    }

    const musculos = Array.isArray(dayInfo.musculos_foco)
      ? dayInfo.musculos_foco.join(', ')
      : dayInfo.musculos_foco || 'general';

    // Generar contexto de los días anteriores para mantener coherencia en la rutina completa
    let contextoDiasPrevios = '';
    if (diasCompletos.length > 0) {
        contextoDiasPrevios = `\nIMPORTANTE PARA COHERENCIA: Para evitar repeticiones innecesarias, ten en cuenta que el paciente YA TIENE los siguientes ejercicios prescritos en los días previos:\n`;
        diasCompletos.forEach(d => {
            const ejNombres = d.ejercicios.map(e => e.nombre).join(', ');
            contextoDiasPrevios += `- Día ${d.dia} (${d.nombre}): ${ejNombres}\n`;
        });
    }

    try {
      const dayResult = await submitTask({
        taskType: 'workout_day',
        systemPrompt: 'Eres kinesiólogo. Prescribe ejercicios seguros con justificación biomecánica. Si hay lesiones o dolor en la ficha, adapta o sustituye. Responde SOLO JSON.',
        userPrompt: `Prescribe 4-6 ejercicios para: ${dayInfo.nombre} (${musculos}).

Ficha: ${fichaClinica}
${reglasSeguridad}
${contextoDiasPrevios}

Reglas biomecánicas:
- Si hay lesión/dolor: sustituye por ejercicio que no estrese esa zona.
- Prioriza seguridad sobre carga.
- Incluye explicación técnica de POR QUÉ eliges cada ejercicio para este paciente.

JSON:
{"ejercicios":[{"nombre":"string","series":3,"repeticiones":"8-10","peso_sugerido_kg":null,"rpe_objetivo":7,"nota":"indicación técnica","explicacion_tecnica":"razón biomecánica para este paciente","explicacion_cliente":"explicación motivadora para el cliente"}]}`,
        expectedFormat: 'json',
        fallbackFn: () => {
          throw new Error(`Motor de IA no disponible para Día ${dayInfo.dia}.`);
        },
      });

      const ejercicios = dayResult.ejercicios || dayResult || [];

      diasCompletos.push({
        dia: dayInfo.dia,
        nombre: dayInfo.nombre,
        musculos_foco: dayInfo.musculos_foco,
        ejercicios: Array.isArray(ejercicios) ? ejercicios : [],
      });

      // Calcular progreso: empieza en 20% y el 80% restante se divide por los días
      const remainingProgress = 80;
      const progressPerDay = remainingProgress / structure.dias.length;
      const currentProgress = Math.round(20 + (progressPerDay * diasCompletos.length));

      console.log(`[WorkoutAgent] ✓ Día ${dayInfo.dia} completado: ${dayInfo.nombre} → ${Array.isArray(ejercicios) ? ejercicios.length : 0} ejercicios (Progreso: ${currentProgress}%)`);
    } catch (err) {
      console.error(`[WorkoutAgent] ⚠️ Error crítico generando el Día ${dayInfo.dia}: ${err.message}. Entregando resultado parcial.`);
      is_partial = true;
      break; // Abortamos los días restantes y devolvemos el draft
    }
  }

  if (is_partial) {
    console.log(`[WorkoutAgent] ⏸️ Generación de rutina pausada (Progreso Parcial). Entregando borrador.`);
  } else {
    console.log(`[WorkoutAgent] 🎉 Generación de rutina finalizada exitosamente (Progreso: 100%)`);
  }

  // ══════════════════════════════════════════════════════════════════════
  // PASO 3: MERGE LOCAL (sin IA, solo ensamblaje en JS)
  // ══════════════════════════════════════════════════════════════════════
  return {
    split_name: structure.split_name,
    dias_totales: structure.dias_totales || dias_disponibles,
    bloque_semanas: structure.bloque_semanas || 4,
    volumen_ajustado: structure.volumen_ajustado || false,
    razon_ajuste: structure.razon_ajuste || null,
    dias: diasCompletos,
    notas_generales: structure.notas_generales || '',
    is_partial: is_partial,
  };
};

module.exports = { generateWorkoutPlan };