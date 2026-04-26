/**
 * anthropicExecutor.js
 * Único punto de contacto con la API de Anthropic.
 * Reemplaza a ollamaExecutor.js — misma interfaz pública: enqueue(), getStatus(), _resetForTesting()
 *
 * Estrategia dual-modelo:
 *   • claude-sonnet-4-5  → tareas de razonamiento complejo (workout_structure, nutrition)
 *   • claude-haiku-4-5   → tareas repetitivas/formateadas  (workout_day, engagement, social, debate, evaluation)
 *
 * Responsabilidades:
 *  1. Cola FIFO con límite de concurrencia configurable
 *  2. Routing de modelo por tipo de tarea
 *  3. Reintentos con backoff exponencial
 *  4. Circuit breaker: si Anthropic falla N veces seguidas, rechaza nuevas tareas
 *  5. Registro de tokens consumidos por llamada (auditoría de costo)
 */

const Anthropic = require('@anthropic-ai/sdk');

// ── Configuración dinámica ────────────────────────────────────────────────────
const getApiKey        = () => process.env.ANTHROPIC_API_KEY || '';
const getMaxConcurrency= () => parseInt(process.env.ANTHROPIC_MAX_CONCURRENCY || '3', 10);
const getMaxRetries    = () => parseInt(process.env.ANTHROPIC_MAX_RETRIES    || '4', 10);
const getCbThreshold   = () => parseInt(process.env.ANTHROPIC_CB_THRESHOLD   || '5', 10);
const getCbRecoveryMs  = () => parseInt(process.env.ANTHROPIC_CB_RECOVERY_MS || '30000', 10);

const getModelSonnet   = () => (process.env.ANTHROPIC_MODEL_SONNET || 'claude-3-7-sonnet-20250219').trim();
const getModelHaiku    = () => (process.env.ANTHROPIC_MODEL_HAIKU  || 'claude-3-5-haiku-20241022').trim();

/**
 * Routing: qué modelo usa cada tipo de tarea.
 * 'sonnet' → razonamiento complejo / decisiones clínicas
 * 'haiku'  → generación formateada / texto corto
 */
const TASK_MODEL_ROUTING = {
    workout:           'sonnet',  // (legacy) plan completo
    workout_structure: 'sonnet',  // split, días, músculos foco — decisión clínica
    workout_day:       'haiku',   // ejercicios por día — formato repetitivo
    nutrition:         'sonnet',  // cálculos metabólicos — razonamiento
    engagement:        'haiku',   // mensaje corto motivacional
    social:            'haiku',   // post para redes
    debate:            'haiku',   // respuesta conversacional
    evaluation:        'haiku',   // evaluación de borrador
};

/**
 * Límite de tokens de salida por tipo de tarea.
 */
const MAX_TOKENS_MAP = {
    workout:           4096,
    workout_structure: 2048,   // JSON de estructura
    workout_day:       2048,   // Ejercicios en JSON
    nutrition:         4096,
    engagement:         512,
    social:             512,
    debate:            1024,
    evaluation:        1024,
};

// ── Estado interno ────────────────────────────────────────────────────────────
let _running = 0;
const _queue = [];   // { task, resolve, reject }

// Circuit Breaker
let _cbFailures  = 0;
let _cbOpenUntil = 0;

// Acumulador de tokens para auditoría
const _tokenUsage = { input: 0, output: 0, calls: 0 };

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const isCircuitOpen = () => {
    const threshold = getCbThreshold();
    if (_cbFailures >= threshold && Date.now() < _cbOpenUntil) return true;
    if (_cbOpenUntil > 0 && Date.now() >= _cbOpenUntil) { _cbFailures = 0; }
    return false;
};

const recordSuccess = () => { _cbFailures = 0; };
const recordFailure = () => {
    _cbFailures++;
    const threshold = getCbThreshold();
    if (_cbFailures >= threshold) {
        const recoveryMs = getCbRecoveryMs();
        _cbOpenUntil = Date.now() + recoveryMs;
        console.error(`[AnthropicExecutor] ⛔ Circuit OPEN. Bloqueado por ${recoveryMs / 1000}s`);
    }
};

// ── Dispatch ──────────────────────────────────────────────────────────────────
const dispatch = () => {
    const max = getMaxConcurrency();
    while (_queue.length > 0 && _running < max) {
        const { task, resolve, reject } = _queue.shift();
        _running++;
        executeWithRetry(task)
            .then(resolve)
            .catch(reject)
            .finally(() => { _running--; dispatch(); });
    }
};

// ── Llamada HTTP real a Anthropic ─────────────────────────────────────────────
const callAnthropic = async (task) => {
    const { systemPrompt, userPrompt, expectedFormat, timeoutMs, modelTier, taskType } = task;

    const model = modelTier === 'sonnet' ? getModelSonnet() : getModelHaiku();
    const maxTokens = MAX_TOKENS_MAP[taskType] || 1024;

    const client = new Anthropic({ apiKey: getApiKey() });

    console.log(`[AnthropicExecutor] → ${taskType} | modelo: ${model} | max_tokens: ${maxTokens} | timeout: ${timeoutMs}ms`);

    // Para JSON forzado, añadimos instrucción explícita al system prompt
    const systemContent = expectedFormat === 'json'
        ? `${systemPrompt || ''}\n\nIMPORTANTE: Tu respuesta debe ser ÚNICAMENTE un objeto JSON válido, sin texto adicional, sin bloques de markdown, sin explicaciones.`.trim()
        : (systemPrompt || '');

    const requestPromise = client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature: 0.1,
        system: systemContent,
        messages: [{ role: 'user', content: userPrompt }],
    });

    // Timeout manual
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`TIMEOUT (>${timeoutMs}ms) en tarea ${taskType}`)), timeoutMs)
    );

    const response = await Promise.race([requestPromise, timeoutPromise]);

    const content = response.content?.[0]?.text;
    if (!content) throw new Error('Anthropic retornó contenido vacío');

    // Registrar tokens consumidos
    const inputTokens  = response.usage?.input_tokens  || 0;
    const outputTokens = response.usage?.output_tokens || 0;
    _tokenUsage.input  += inputTokens;
    _tokenUsage.output += outputTokens;
    _tokenUsage.calls  += 1;

    console.log(`[AnthropicExecutor] ✓ ${taskType} completado | tokens: ${inputTokens}↑ ${outputTokens}↓ | acumulado sesión: ${_tokenUsage.input}↑ ${_tokenUsage.output}↓ (${_tokenUsage.calls} llamadas)`);

    return content;
};

// ── Reintentos con backoff exponencial ────────────────────────────────────────
const executeWithRetry = async (task, attempt = 1) => {
    try {
        console.log(`[AnthropicExecutor] ⏳ [Intento ${attempt}/${getMaxRetries()}] Iniciando tarea: ${task.taskType}`);
        const result = await callAnthropic(task);
        recordSuccess();
        console.log(`[AnthropicExecutor] ✅ Tarea ${task.taskType} completada con éxito`);
        return result;
    } catch (err) {
        const maxRetries = getMaxRetries();
        console.warn(`[AnthropicExecutor] ⚠️ Error en tarea ${task.taskType} (Intento ${attempt}/${maxRetries}): ${err.message}`);

        if (attempt >= maxRetries) {
            recordFailure();
            console.error(`[AnthropicExecutor] ❌ ${task.taskType} falló tras ${maxRetries} intentos. Abortando.`);
            throw err;
        }

        const backoff = Math.pow(2, attempt) * 2000; // 4s, 8s, 16s…
        console.log(`[AnthropicExecutor] ⏳ Reintentando en ${backoff / 1000}s...`);
        await sleep(backoff);
        return executeWithRetry(task, attempt + 1);
    }
};

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Encola una tarea para ser ejecutada por Anthropic.
 * Misma interfaz que ollamaExecutor para compatibilidad total.
 *
 * @param {Object} task
 * @param {string} task.taskType       - Tipo de tarea
 * @param {string} task.systemPrompt   - Prompt de sistema
 * @param {string} task.userPrompt     - Prompt del usuario
 * @param {string} task.expectedFormat - 'json' | 'text'
 * @param {number} task.timeoutMs      - Timeout en ms
 * @param {string} [task.modelTier]    - Sobreescribir tier: 'sonnet' | 'haiku'
 * @returns {Promise<string>} Contenido raw de la respuesta
 */
const enqueue = (task) => {
    if (!getApiKey()) {
        return Promise.reject(new Error('[AnthropicExecutor] ANTHROPIC_API_KEY no configurada en .env'));
    }

    if (isCircuitOpen()) {
        return Promise.reject(new Error(
            `[AnthropicExecutor] Circuit OPEN: API no disponible. Reintenta en ${Math.ceil((_cbOpenUntil - Date.now()) / 1000)}s`
        ));
    }

    // Asignar tier si no viene explícito
    if (!task.modelTier) {
        task.modelTier = TASK_MODEL_ROUTING[task.taskType] || 'haiku';
    }

    return new Promise((resolve, reject) => {
        _queue.push({ task, resolve, reject });
        dispatch();
    });
};

/**
 * Estado de diagnóstico del executor.
 */
const getStatus = () => ({
    provider: 'anthropic',
    running: _running,
    queued: _queue.length,
    max_concurrency: getMaxConcurrency(),
    models: {
        sonnet: getModelSonnet(),
        haiku:  getModelHaiku(),
    },
    circuit_breaker: {
        failures:   _cbFailures,
        threshold:  getCbThreshold(),
        open:       isCircuitOpen(),
        open_until: _cbOpenUntil > Date.now() ? new Date(_cbOpenUntil).toISOString() : null,
    },
    token_usage_session: _tokenUsage,
});

/**
 * Reinicia el estado interno para propósitos de test.
 */
const _resetForTesting = () => {
    _running = 0;
    _queue.length = 0;
    _cbFailures = 0;
    _cbOpenUntil = 0;
    _tokenUsage.input = 0;
    _tokenUsage.output = 0;
    _tokenUsage.calls = 0;
};

module.exports = { enqueue, getStatus, _resetForTesting };
