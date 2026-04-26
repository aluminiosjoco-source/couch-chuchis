/**
 * Test rápido: verificar que num_predict=1536 funciona con el prompt completo
 */
require('dotenv').config();

const OLLAMA_URL = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').trim();
const MODEL = (process.env.OLLAMA_MODEL || 'llama3:latest').trim();

(async () => {
  console.log(`Modelo: ${MODEL} | URL: ${OLLAMA_URL}`);
  console.log('Enviando prompt completo del workoutAgent con num_predict=1536...\n');

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 180000); // 3 min

    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        format: 'json',
        options: { temperature: 0.1, top_p: 0.5, num_predict: 1536 },
        messages: [
          { role: 'system', content: `Eres un entrenador personal y kinesiólogo experto. 
Tu objetivo es diseñar rutinas seguras y efectivas basadas en datos. 
Considera seriamente el historial de lesiones y el nivel de estrés para ajustar la intensidad.
IMPORTANTE: Estructura rutinas por BLOQUES. El estándar es un bloque de 4 semanas.
REGLA ABSOLUTA: Responde ÚNICAMENTE con JSON válido.` },
          { role: 'user', content: `Genera una rutina semanal personalizada:

CONTEXTO FISIOLÓGICO Y SALUD:
- Limitaciones inmediatas: Ninguna.
- Historial de lesiones: Ninguno.
- Dolores frecuentes: Ninguno.
- Condición médica: Ninguna.
- Estilo de vida: sedentario.
- Sueño: 7-8 hrs.
- Estrés actual: medio.
- Preferencia: pesas.
- Ejercicios a evitar: Ninguno.

ESTADO DE ENTRENAMIENTO:
- Objetivo: hipertrofia
- Experiencia: intermedio
- Días/sem: 4
- Equipo: gym
- Semana en bloque: 1
- Fatiga (1-10): 5
- Adherencia: 85%

Formato JSON esperado:
{
  "split_name": "string",
  "dias_totales": 4,
  "bloque_semanas": 4,
  "volumen_ajustado": false,
  "razon_ajuste": null,
  "dias": [
    {
      "dia": 1,
      "nombre": "string",
      "musculos_foco": ["string"],
      "ejercicios": [
        {
          "nombre": "string",
          "series": 3,
          "repeticiones": "8-10",
          "peso_sugerido_kg": null,
          "rpe_objetivo": 7,
          "nota": "string",
          "explicacion_tecnica": "string",
          "explicacion_cliente": "string"
        }
      ]
    }
  ],
  "notas_generales": "string"
}` }
        ],
      }),
    });
    clearTimeout(timer);

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`HTTP: ${res.status} (${elapsed}s)`);

    if (!res.ok) {
      const errText = await res.text().catch(() => 'sin detalle');
      console.log(`❌ Error: ${errText.substring(0, 500)}`);
      process.exit(1);
    }

    const data = await res.json();
    const content = data.message?.content || '';
    console.log(`✅ Respuesta (${content.length} chars):`);
    
    try {
      const parsed = JSON.parse(content);
      console.log(`  Split: ${parsed.split_name}`);
      console.log(`  Días: ${parsed.dias_totales}`);
      console.log(`  Días generados: ${parsed.dias?.length}`);
      if (parsed.dias) {
        parsed.dias.forEach(d => {
          console.log(`    Día ${d.dia}: ${d.nombre} (${d.ejercicios?.length} ejercicios)`);
        });
      }
      console.log(`\n🎉 ¡Funciona! El fix de num_predict resuelve el problema.`);
    } catch (e) {
      console.log(`  Raw: ${content.substring(0, 300)}`);
      console.log(`  ⚠️ No es JSON válido pero Ollama respondió sin crash.`);
    }
  } catch (e) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`❌ ${e.name}: ${e.message} (${elapsed}s)`);
    process.exit(1);
  }
})();
