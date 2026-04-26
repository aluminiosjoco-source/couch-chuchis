/**
 * agentOrchestrator.js
 * Gestor del ciclo de vida de tareas de agentes.
 *
 * Ciclo de vida:
 *   PENDING  → tarea encolada, esperando slot en OllamaExecutor
 *   RUNNING  → OllamaExecutor está procesando
 *   COMPLETED→ resultado disponible
 *   FAILED   → error irrecuperable (tras reintentos)
 *   TIMEOUT  → tarea cancelada por tiempo de espera total (cola + ejecución)
 *
 * Cada agente (workoutAgent, nutritionAgent, etc.) NO llama a Ollama directamente.
 * Construye un payload estructurado y llama a `submitTask()`.
 *
 * El orquestador devuelve el resultado parseado o ejecuta el fallback inteligente.
 */

const { enqueue } = require('./anthropicExecutor');

// ── Tipos de tarea con sus timeouts individuales ─────────────────────────────
const TASK_CONFIGS = {
    workout: { timeoutMs: 6 * 60 * 1000, label: 'Plan de entrenamiento' },
    workout_structure: { timeoutMs: 2 * 60 * 1000, label: 'Estructura de rutina' },
    workout_day: { timeoutMs: 3 * 60 * 1000, label: 'Día de rutina' },
    nutrition: { timeoutMs: 6 * 60 * 1000, label: 'Plan nutricional' },
    engagement: { timeoutMs: 60 * 1000, label: 'Mensaje de engagement' },
    social: { timeoutMs: 90 * 1000, label: 'Post para redes sociales' },
    debate: { timeoutMs: 90 * 1000, label: 'Debate de rutina' },
    evaluation: { timeoutMs: 60 * 1000, label: 'Evaluación de borrador' },
};

// ── Registro de tareas activas ───────────────────────────────────────────────
// Map<taskId, TaskRecord>
const _taskRegistry = new Map();

// Limpieza automática de tareas completadas después de TTL
const TASK_TTL_MS = 5 * 60 * 1000; // 5 minutos

const cleanupTask = (taskId) => {
    setTimeout(() => _taskRegistry.delete(taskId), TASK_TTL_MS);
};

// ── Generador de ID determinístico sin dependencia externa ───────────────────
let _seq = 0;
const generateTaskId = () => `task_${Date.now()}_${(++_seq).toString().padStart(4, '0')}`;

// ── Payload de tarea: lo que cada agente entrega al orquestador ───────────────
/**
 * @typedef {Object} AgentPayload
 * @property {string} taskType        - Tipo de tarea (ver TASK_CONFIGS)
 * @property {string} systemPrompt    - Rol e instrucciones del agente
 * @property {string} userPrompt      - Prompt con datos concretos del cliente
 * @property {string} expectedFormat  - 'json' | 'text'
 * @property {Function} fallbackFn    - Función de fallback sin argumentos, retorna resultado válido
 * @property {Function} [parseResult] - Parser del string raw → objeto. Default: JSON.parse
 */

/**
 * Submits una tarea al orquestador.
 * @param {AgentPayload} payload
 * @returns {Promise<Object>} Resultado parseado o resultado de fallbackFn
 */
const submitTask = async (payload) => {
    const { taskType, systemPrompt, userPrompt, expectedFormat, fallbackFn, parseResult } = payload;

    const config = TASK_CONFIGS[taskType];
    if (!config) throw new Error(`[Orchestrator] Tipo de tarea desconocido: "${taskType}"`);

    const taskId = generateTaskId();
    const startedAt = Date.now();

    // Registrar tarea
    const record = {
        taskId,
        taskType,
        status: 'PENDING',
        startedAt,
        updatedAt: startedAt,
        result: null,
        error: null,
    };
    _taskRegistry.set(taskId, record);

    console.log(`[Orchestrator] ⏳ [${taskId}] ${config.label} → PENDING`);

    const transition = (status, data = {}) => {
        Object.assign(record, { status, updatedAt: Date.now(), ...data });
        console.log(`[Orchestrator] ${statusEmoji(status)} [${taskId}] ${config.label} → ${status}`);
    };

    try {
        transition('RUNNING');

        const rawContent = await enqueue({
            taskType,
            systemPrompt,
            userPrompt,
            expectedFormat,
            timeoutMs: config.timeoutMs,
        });

        // Parseo del resultado
        let parsed;
        if (parseResult) {
            parsed = parseResult(rawContent);
        } else if (expectedFormat === 'json') {
            parsed = extractAndParseJSON(rawContent, taskId);
        } else {
            parsed = rawContent;
        }

        transition('COMPLETED', { result: parsed });
        cleanupTask(taskId);
        return parsed;

    } catch (err) {
        const isTimeout = err.message?.includes('TIMEOUT') || err.message?.includes('Circuit OPEN');
        const finalStatus = isTimeout ? 'TIMEOUT' : 'FAILED';

        transition(finalStatus, { error: err.message });
        cleanupTask(taskId);

        console.warn(`[Orchestrator] 🔁 [${taskId}] Ejecutando fallback para ${config.label}`);

        if (typeof fallbackFn !== 'function') {
            throw new Error(`[Orchestrator] Sin fallback para ${taskType}: ${err.message}`);
        }

        const fallbackResult = fallbackFn();
        console.log(`[Orchestrator] 🟡 [${taskId}] Fallback aplicado correctamente`);
        return fallbackResult;
    }
};

// ── JSON extractor robusto ────────────────────────────────────────────────────
const extractAndParseJSON = (raw, taskId) => {
    // Intento 1: JSON puro
    try { return JSON.parse(raw); } catch (_) { }

    // Intento 2: extraer primer bloque {...}
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
        try { return JSON.parse(match[0]); } catch (_) { }
    }

    // Intento 3: limpiar bloques de markdown ```json ... ```
    const cleaned = raw.replace(/```json|```/g, '').trim();
    try { return JSON.parse(cleaned); } catch (_) { }

    throw new Error(`[Orchestrator] No se pudo extraer JSON válido de la respuesta (taskId: ${taskId})`);
};

// ── Helpers de presentación ───────────────────────────────────────────────────
const statusEmoji = (s) => ({
    PENDING: '⏳',
    RUNNING: '🔄',
    COMPLETED: '✅',
    FAILED: '❌',
    TIMEOUT: '⏱️',
}[s] || '•');

// ── Consultas de estado (para admin / health check) ───────────────────────────
const getTaskStatus = (taskId) => _taskRegistry.get(taskId) || null;

const getAllTasksSummary = () => {
    const tasks = [..._taskRegistry.values()];
    return {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'PENDING').length,
        running: tasks.filter(t => t.status === 'RUNNING').length,
        completed: tasks.filter(t => t.status === 'COMPLETED').length,
        failed: tasks.filter(t => t.status === 'FAILED').length,
        timeout: tasks.filter(t => t.status === 'TIMEOUT').length,
    };
};

module.exports = {
    submitTask,
    getTaskStatus,
    getAllTasksSummary,
    TASK_CONFIGS,
};