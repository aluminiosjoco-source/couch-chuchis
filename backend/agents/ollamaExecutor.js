/**
 * ollamaExecutor.js
 * Único punto de contacto con Ollama. NADIE más llama a Ollama directamente.
 *
 * Responsabilidades:
 *  1. Cola FIFO con límite de concurrencia configurable
 *  2. Routing de modelo por tipo de tarea (fast vs. deep)
 *  3. Reintentos con backoff exponencial
 *  4. Circuit breaker: si Ollama falla N veces seguidas, rechaza nuevas tareas
 *  5. Timeout individual por tarea (no un global de 10 min para todo)
 */

// ── Configuración (Dinámica para permitir cambios en runtime) ─────────────────
const getUrl = () => (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').trim();
const getMaxConcurrency = () => parseInt(process.env.OLLAMA_MAX_CONCURRENCY || '1', 10);
const getMaxRetries = () => parseInt(process.env.OLLAMA_MAX_RETRIES || '4', 10);
const getCbThreshold = () => parseInt(process.env.OLLAMA_CB_THRESHOLD || '5', 10);
const getCbRecoveryMs = () => parseInt(process.env.OLLAMA_CB_RECOVERY_MS || '30000', 10);

const verifyConnection = async () => {
    try {
        const res = await fetch(getUrl());
        return res.ok;
    } catch (e) {
        return false;
    }
};

/**
 * Mapa de modelos por tipo de tarea.
 */
const getModelMap = () => ({
    deep: (process.env.OLLAMA_MODEL_DEEP || process.env.OLLAMA_MODEL || 'gemma2:9b').trim(),
    fast: (process.env.OLLAMA_MODEL_FAST || process.env.OLLAMA_MODEL || 'gemma2:9b').trim(),
});

const TASK_MODEL_ROUTING = {
    workout: 'deep',   // Planificación kinesiológica → necesita razonamiento
    workout_structure: 'deep',   // Estructura del split → razonamiento
    workout_day: 'deep',   // Ejercicios por día → razonamiento
    nutrition: 'deep',   // Cálculos + adaptación cultural → necesita razonamiento
    engagement: 'fast',   // Texto corto emocional → velocidad > profundidad
    social: 'fast',   // Copy creativo → velocidad > profundidad
    debate: 'fast',   // Respuesta conversacional → velocidad
    evaluation: 'fast',   // Evaluación de borrador → rápido
};

/**
 * Límite de tokens de generación por tipo de tarea.
 * Evita OOM en modelos locales con prompts complejos.
 */
const NUM_PREDICT_MAP = {
    workout: 1536,     // Rutina completa (legacy, por si se usa directo)
    workout_structure: 256,  // Solo estructura: split, días, músculos
    workout_day: 512,        // Ejercicios para un solo día
    nutrition: 1536,   // Plan nutricional similar
    engagement: 512,   // Mensaje corto
    social: 512,       // Post corto
    debate: 768,       // Respuesta conversacional
    evaluation: 512,   // Evaluación breve
};

// ── Estado interno ───────────────────────────────────────────────────────────
let _running = 0;
const _queue = [];        // { task, resolve, reject }

// Circuit Breaker
let _cbFailures = 0;
let _cbOpenUntil = 0;

// ── Helpers ──────────────────────────────────────────────────────────────────
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
        console.error(`[OllamaExecutor] ⛔ Circuit OPEN. Ollama bloqueado por ${recoveryMs / 1000}s`);
    }
};

// ── Dispatch: saca tareas de la cola cuando hay slot libre ───────────────────
const dispatch = () => {
    const maxConcurrency = getMaxConcurrency();
    while (_queue.length > 0 && _running < maxConcurrency) {
        const { task, resolve, reject } = _queue.shift();
        _running++;
        executeWithRetry(task)
            .then(resolve)
            .catch(reject)
            .finally(() => { _running--; dispatch(); });
    }
};

// ── Llamada HTTP real a Ollama ────────────────────────────────────────────────
const callOllama = async (task) => {
    const { systemPrompt, userPrompt, expectedFormat, timeoutMs, modelTier } = task;
    const modelMap = getModelMap();
    const model = modelMap[modelTier] || modelMap.deep;
    const url = `${getUrl()}/api/chat`;
    const numPredict = NUM_PREDICT_MAP[task.taskType] || 1024;

    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeoutMs);

    const body = {
        model,
        stream: false,
        options: { temperature: 0.1, top_p: 0.5, num_predict: numPredict, num_ctx: 2048 },
        messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: userPrompt },
        ],
    };

    if (expectedFormat === 'json') {
        body.format = 'json';
    }

    console.log(`[OllamaExecutor] → ${task.taskType} | modelo: ${model} | tokens: ${numPredict} | timeout: ${timeoutMs}ms`);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const detail = await res.text().catch(() => 'sin detalle');
            throw new Error(`Ollama HTTP ${res.status}: ${detail}`);
        }

        const data = await res.json();
        const content = data.message?.content;

        if (!content) throw new Error('Ollama retornó contenido vacío');

        console.log(`[OllamaExecutor] ✓ ${task.taskType} completado (${content.length} chars)`);
        return content;

    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error(`TIMEOUT (>${timeoutMs}ms) en tarea ${task.taskType}`);
        }
        throw err;
    } finally {
        clearTimeout(timerId);
    }
};

// ── Reintentos con backoff exponencial ───────────────────────────────────────
const executeWithRetry = async (task, attempt = 1) => {
    try {
        console.log(`[OllamaExecutor] ⏳ [Intento ${attempt}/${getMaxRetries()}] Iniciando tarea: ${task.taskType}`);
        const result = await callOllama(task);
        recordSuccess();
        console.log(`[OllamaExecutor] ✅ Tarea ${task.taskType} completada con éxito`);
        return result;
    } catch (err) {
        const maxRetries = getMaxRetries();
        console.warn(`[OllamaExecutor] ⚠️ Error en tarea ${task.taskType} (Intento ${attempt}/${maxRetries}): ${err.message}`);

        if (attempt >= maxRetries) {
            recordFailure();
            console.error(`[OllamaExecutor] ❌ ${task.taskType} falló tras ${maxRetries} intentos. Abortando.`);
            throw err;
        }

        console.log(`[OllamaExecutor] 🔄 Verificando estado de conexión con el motor IA...`);
        const isConnected = await verifyConnection();
        
        if (!isConnected) {
            console.error(`[OllamaExecutor] 🔌 Sin conexión con Ollama. Esperando para reestablecer...`);
        } else {
            console.log(`[OllamaExecutor] ⚡ Conexión confirmada (Ollama responde). El modelo falló, reintentando...`);
        }

        const backoff = Math.pow(2, attempt) * 2000; // 4s, 8s, 16s…
        console.log(`[OllamaExecutor] ⏳ Reintentando petición en ${backoff/1000}s...`);
        await sleep(backoff);
        return executeWithRetry(task, attempt + 1);
    }
};

// ── API pública ──────────────────────────────────────────────────────────────

/**
 * Encola una tarea para ser ejecutada por Ollama.
 * @param {Object} task
 * @param {string} task.taskType      - 'workout' | 'nutrition' | 'engagement' | 'social' | 'debate' | 'evaluation'
 * @param {string} task.systemPrompt  - Prompt de sistema (rol del agente)
 * @param {string} task.userPrompt    - Prompt del usuario (instrucción concreta)
 * @param {string} task.expectedFormat- 'json' | 'text'
 * @param {number} task.timeoutMs     - Timeout específico para esta tarea
 * @param {string} [task.modelTier]   - Sobreescribir el tier: 'deep' | 'fast'
 * @returns {Promise<string>} - Contenido raw de la respuesta
 */
const enqueue = (task) => {
    if (isCircuitOpen()) {
        return Promise.reject(new Error(
            `[OllamaExecutor] Circuit OPEN: Ollama no disponible. Reintenta en ${Math.ceil((_cbOpenUntil - Date.now()) / 1000)}s`
        ));
    }

    // Asignar tier de modelo si no viene explícito
    if (!task.modelTier) {
        task.modelTier = TASK_MODEL_ROUTING[task.taskType] || 'deep';
    }

    return new Promise((resolve, reject) => {
        _queue.push({ task, resolve, reject });
        dispatch();
    });
};

/**
 * Estado de diagnóstico del ejecutor (para health check o admin panel).
 */
const getStatus = () => ({
    running: _running,
    queued: _queue.length,
    max_concurrency: getMaxConcurrency(),
    circuit_breaker: {
        failures: _cbFailures,
        threshold: getCbThreshold(),
        open: isCircuitOpen(),
        open_until: _cbOpenUntil > Date.now() ? new Date(_cbOpenUntil).toISOString() : null,
    },
    models: getModelMap(),
});

/**
 * Reinicia el estado interno para propósitos de test.
 */
const _resetForTesting = () => {
    _running = 0;
    _queue.length = 0;
    _cbFailures = 0;
    _cbOpenUntil = 0;
};

module.exports = { enqueue, getStatus, _resetForTesting, getModelMap };