/**
 * Test de conexión completa con Ollama Docker
 */
require('dotenv').config();

const OLLAMA_URL = process.env.OLLAMA_BASE_URL?.trim() || 'http://127.0.0.1:11434';
const MODEL = process.env.OLLAMA_MODEL?.trim() || 'gemma2:9b';

async function testBasicConnection() {
  console.log('═══════════════════════════════════════════');
  console.log('  TEST 1: Conexión básica con Ollama');
  console.log('═══════════════════════════════════════════');
  console.log(`  URL: ${OLLAMA_URL}`);
  try {
    const res = await fetch(`${OLLAMA_URL}/`);
    const txt = await res.text();
    console.log(`  ✅ Respuesta: ${txt.trim()}`);
    return true;
  } catch (e) {
    console.error(`  ❌ FALLO: ${e.message}`);
    return false;
  }
}

async function testModelAvailable() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  TEST 2: Modelo disponible');
  console.log('═══════════════════════════════════════════');
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await res.json();
    const models = data.models.map(m => m.name);
    console.log(`  Modelos instalados: ${models.join(', ')}`);
    const found = models.includes(MODEL);
    console.log(`  ${found ? '✅' : '❌'} Modelo objetivo "${MODEL}" ${found ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
    return found;
  } catch (e) {
    console.error(`  ❌ FALLO: ${e.message}`);
    return false;
  }
}

async function testChatCompletion() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  TEST 3: Chat completion (prompt simple)');
  console.log('═══════════════════════════════════════════');
  console.log(`  Modelo: ${MODEL}`);
  console.log('  Enviando petición... (puede tardar 15-60s)');
  const start = Date.now();
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: 'Responde SOLO con este JSON exacto: {"status":"ok","model":"gemma2"}' }],
        stream: false,
        format: 'json',
        options: { temperature: 0.1 }
      })
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  HTTP Status: ${res.status}`);
    if (!res.ok) {
      const errText = await res.text();
      console.error(`  ❌ Error del servidor: ${errText}`);
      return false;
    }
    const data = await res.json();
    console.log(`  ✅ Respuesta en ${elapsed}s:`);
    console.log(`  ${data.message?.content}`);
    return true;
  } catch (e) {
    console.error(`  ❌ FALLO: ${e.message}`);
    return false;
  }
}

async function testWorkoutAgent() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  TEST 4: workoutAgent (generateWorkoutPlan)');
  console.log('═══════════════════════════════════════════');
  try {
    const { generateWorkoutPlan } = require('./agents/workoutAgent');
    console.log('  Enviando petición al agente... (puede tardar 30-90s)');
    const start = Date.now();
    const result = await generateWorkoutPlan({
      objetivo: 'hipertrofia',
      experiencia: 'intermedio',
      dias_disponibles: 4,
      equipamiento: 'gimnasio',
      peso: 80,
      fatiga_percibida: 5,
      adherencia: 0.85
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const isFallback = result.notas_generales?.includes('[FALLBACK]');
    console.log(`  Tiempo: ${elapsed}s`);
    console.log(`  Split: ${result.split_name}`);
    console.log(`  Días: ${result.dias_totales}`);
    console.log(`  ${isFallback ? '⚠️ FALLBACK (no usó IA)' : '✅ Generado por IA'}`);
    if (!isFallback && result.dias) {
      console.log(`  Días estructurados: ${result.dias.length}`);
      result.dias.forEach(d => console.log(`    - Día ${d.dia}: ${d.nombre} (${d.ejercicios?.length || 0} ejercicios)`));
    }
    return !isFallback;
  } catch (e) {
    console.error(`  ❌ FALLO: ${e.message}`);
    return false;
  }
}

async function testNutritionAgent() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  TEST 5: nutritionAgent (generateMealPlan)');
  console.log('═══════════════════════════════════════════');
  try {
    const { generateMealPlan } = require('./agents/nutritionAgent');
    console.log('  Enviando petición al agente... (puede tardar 30-90s)');
    const start = Date.now();
    const result = await generateMealPlan({
      kcal_target: 2200,
      protein_g: 140,
      objetivo: 'perdida_grasa',
      region: 'mexico',
      nombre_cliente: 'Cliente Test'
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const isFallback = result.nota_nutricionista?.includes('[FALLBACK]');
    console.log(`  Tiempo: ${elapsed}s`);
    console.log(`  Kcal: ${result.resumen_diario?.kcal}`);
    console.log(`  ${isFallback ? '⚠️ FALLBACK (no usó IA)' : '✅ Generado por IA'}`);
    return !isFallback;
  } catch (e) {
    console.error(`  ❌ FALLO: ${e.message}`);
    return false;
  }
}

(async () => {
  console.log('\n🔍 SUITE DE PRUEBAS - OLLAMA + AGENTES\n');
  
  const r1 = await testBasicConnection();
  if (!r1) { console.log('\n💀 Ollama no está accesible. Abortando.'); process.exit(1); }
  
  const r2 = await testModelAvailable();
  if (!r2) { console.log('\n💀 Modelo no disponible. Abortando.'); process.exit(1); }
  
  const r3 = await testChatCompletion();
  if (!r3) { console.log('\n💀 Chat completion falló. Abortando.'); process.exit(1); }
  
  const r4 = await testWorkoutAgent();
  const r5 = await testNutritionAgent();

  console.log('\n═══════════════════════════════════════════');
  console.log('  RESUMEN');
  console.log('═══════════════════════════════════════════');
  console.log(`  Conexión:     ${r1 ? '✅' : '❌'}`);
  console.log(`  Modelo:       ${r2 ? '✅' : '❌'}`);
  console.log(`  Chat básico:  ${r3 ? '✅' : '❌'}`);
  console.log(`  WorkoutAgent: ${r4 ? '✅' : '❌'}`);
  console.log(`  NutritionAgent: ${r5 ? '✅' : '❌'}`);
  console.log('═══════════════════════════════════════════\n');
})();
