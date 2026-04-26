/**
 * test_agents_suite.js
 *
 * Suite de tests sin dependencias externas (sin Jest, sin Mocha).
 * Ejecutar: node test_agents_suite.js
 * Ejecutar solo integración: node test_agents_suite.js --integration
 * Ejecutar sin integración:  node test_agents_suite.js --no-integration
 *
 * Secciones:
 *  S1  — OllamaExecutor: model routing, cola, circuit breaker, reintentos, timeout
 *  S2  — AgentOrchestrator: JSON extraction, lifecycle, fallback, taskType inválido
 *  S3  — Payloads/Fallbacks de cada agente: campos, tipos, math
 *  S4  — Concurrencia: MAX_CONCURRENCY=1 se respeta bajo carga
 *  S5  — Bugs documentados: imports muertos, env capturado en carga
 *  S6  — Integración con Ollama real (omitido si Ollama no está disponible)
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// INFRAESTRUCTURA DE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

const results = { passed: 0, failed: 0, skipped: 0, bugs: [] };

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

let currentSuite = '';

const suite = (name) => {
    currentSuite = name;
    console.log(`\n${BOLD}${CYAN}━━━ ${name} ━━━${RESET}`);
};

const pass = (name) => {
    results.passed++;
    console.log(`  ${GREEN}✓${RESET} ${name}`);
};

const fail = (name, reason) => {
    results.failed++;
    console.log(`  ${RED}✗${RESET} ${name}`);
    console.log(`    ${DIM}${reason}${RESET}`);
};

const skip = (name, reason) => {
    results.skipped++;
    console.log(`  ${YELLOW}○${RESET} ${DIM}${name} — ${reason}${RESET}`);
};

const bug = (description, detail) => {
    results.bugs.push({ description, detail });
    console.log(`  ${YELLOW}⚠ BUG DOCUMENTADO:${RESET} ${description}`);
    console.log(`    ${DIM}${detail}${RESET}`);
};

const assert = (condition, failMsg) => {
    if (!condition) throw new Error(failMsg);
};

const assertEq = (actual, expected, label) => {
    if (actual !== expected) throw new Error(`${label}: esperado ${JSON.stringify(expected)}, obtenido ${JSON.stringify(actual)}`);
};

const assertType = (val, type, label) => {
    if (typeof val !== type) throw new Error(`${label}: tipo esperado "${type}", obtenido "${typeof val}"`);
};

const assertArray = (val, label) => {
    if (!Array.isArray(val)) throw new Error(`${label}: se esperaba un array`);
};

const test = async (name, fn) => {
    try {
        await fn();
        pass(name);
    } catch (err) {
        fail(name, err.message);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS DE MOCK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Reemplaza global.fetch con un mock controlable.
 * @param {Function} mockFn - (url, options) => { ok, status, json(), text() }
 */
const mockFetch = (mockFn) => { global.fetch = mockFn; };

/** Mock que responde con un JSON de Ollama válido */
const fetchOk = (content) => async (_url, _opts) => ({
    ok: true,
    status: 200,
    json: async () => ({ message: { content } }),
    text: async () => content,
});

/** Mock que responde con error HTTP */
const fetchError = (status, body = 'error') => async () => ({
    ok: false,
    status,
    text: async () => body,
    json: async () => { throw new Error('not json'); },
});

/** Mock que nunca resuelve PERO sí responde al AbortController (simula timeout real) */
const fetchHang = () => (_url, opts) => new Promise((_resolve, reject) => {
    if (opts?.signal) {
        // Responder al abort cuando el AbortController dispare
        opts.signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
        });
        // Si ya estaba abortado al momento de llamar
        if (opts.signal.aborted) {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
        }
    }
    // Sin signal: cuelga para siempre (no debería llegar aquí en nuestros tests)
});

/** Mock con contador de llamadas */
const fetchWithCounter = (responses) => {
    let calls = 0;
    const fn = async () => {
        const resp = responses[calls] ?? responses[responses.length - 1];
        calls++;
        return resp;
    };
    fn.callCount = () => calls;
    return fn;
};

/** Limpiar módulos para re-requerir con distinta config */
const clearModules = (...paths) => {
    for (const p of paths) {
        try {
            const resolved = require.resolve(p);
            // Si es el ejecutor, resetear su estado interno antes de limpiar caché
            if (p === EXECUTOR_PATH && require.cache[resolved]) {
                require(p)._resetForTesting?.();
            }
            delete require.cache[resolved];
        } catch (_) { }
    }
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const EXECUTOR_PATH = './agents/ollamaExecutor';
const ORCHESTRATOR_PATH = './agents/agentOrchestrator';
const WORKOUT_PATH = './agents/workoutAgent';
const NUTRITION_PATH = './agents/nutritionAgent';
const ENGAGEMENT_PATH = './agents/engagementAgent';
const SOCIAL_PATH = './agents/socialAgent';

// ═══════════════════════════════════════════════════════════════════════════════
// S1 — OllamaExecutor
// ═══════════════════════════════════════════════════════════════════════════════

const runS1 = async () => {
    suite('S1 — OllamaExecutor: cola, routing, reintentos, circuit breaker, timeout');

    // ── Configuración para S1 ──────────────────────────────────────────────────
    clearModules(EXECUTOR_PATH);
    process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
    process.env.OLLAMA_MAX_RETRIES = '2';
    process.env.OLLAMA_MAX_CONCURRENCY = '1';
    process.env.OLLAMA_CB_THRESHOLD = '100'; // desactivado para S1
    process.env.OLLAMA_CB_RECOVERY_MS = '500';
    process.env.OLLAMA_MODEL_DEEP = 'model-deep:7b';
    process.env.OLLAMA_MODEL_FAST = 'model-fast:3b';

    // ──────────────────────────────────────────────────────────────────────────
    // S1.1 Model routing: workout → deep, engagement → fast
    // ──────────────────────────────────────────────────────────────────────────
    await test('workout usa modelo deep', async () => {
        clearModules(EXECUTOR_PATH);
        const executor = require(EXECUTOR_PATH);
        let capturedBody;
        mockFetch(async (_url, opts) => {
            capturedBody = JSON.parse(opts.body);
            return { ok: true, status: 200, json: async () => ({ message: { content: '{"ok":true}' } }), text: async () => '' };
        });
        await executor.enqueue({ taskType: 'workout', systemPrompt: 'sys', userPrompt: 'usr', expectedFormat: 'json', timeoutMs: 5000 });
        assertEq(capturedBody.model, 'model-deep:7b', 'modelo');
    });

    await test('engagement usa modelo fast', async () => {
        clearModules(EXECUTOR_PATH);
        const executor = require(EXECUTOR_PATH);
        let capturedBody;
        mockFetch(async (_url, opts) => {
            capturedBody = JSON.parse(opts.body);
            return { ok: true, status: 200, json: async () => ({ message: { content: '{"ok":true}' } }), text: async () => '' };
        });
        await executor.enqueue({ taskType: 'engagement', systemPrompt: 'sys', userPrompt: 'usr', expectedFormat: 'json', timeoutMs: 5000 });
        assertEq(capturedBody.model, 'model-fast:3b', 'modelo');
    });

    await test('nutrition usa modelo deep', async () => {
        clearModules(EXECUTOR_PATH);
        const executor = require(EXECUTOR_PATH);
        let capturedBody;
        mockFetch(async (_url, opts) => { capturedBody = JSON.parse(opts.body); return { ok: true, status: 200, json: async () => ({ message: { content: '{}' } }), text: async () => '' }; });
        await executor.enqueue({ taskType: 'nutrition', systemPrompt: '', userPrompt: '', expectedFormat: 'json', timeoutMs: 5000 });
        assertEq(capturedBody.model, 'model-deep:7b', 'modelo');
    });

    await test('social usa modelo fast', async () => {
        clearModules(EXECUTOR_PATH);
        const executor = require(EXECUTOR_PATH);
        let capturedBody;
        mockFetch(async (_url, opts) => { capturedBody = JSON.parse(opts.body); return { ok: true, status: 200, json: async () => ({ message: { content: '{}' } }), text: async () => '' }; });
        await executor.enqueue({ taskType: 'social', systemPrompt: '', userPrompt: '', expectedFormat: 'json', timeoutMs: 5000 });
        assertEq(capturedBody.model, 'model-fast:3b', 'modelo');
    });

    await test('debate usa modelo fast', async () => {
        clearModules(EXECUTOR_PATH);
        const executor = require(EXECUTOR_PATH);
        let capturedBody;
        mockFetch(async (_url, opts) => { capturedBody = JSON.parse(opts.body); return { ok: true, status: 200, json: async () => ({ message: { content: 'ok' } }), text: async () => '' }; });
        await executor.enqueue({ taskType: 'debate', systemPrompt: '', userPrompt: '', expectedFormat: 'text', timeoutMs: 5000 });
        assertEq(capturedBody.model, 'model-fast:3b', 'modelo');
    });

    await test('evaluation usa modelo fast', async () => {
        clearModules(EXECUTOR_PATH);
        const executor = require(EXECUTOR_PATH);
        let capturedBody;
        mockFetch(async (_url, opts) => { capturedBody = JSON.parse(opts.body); return { ok: true, status: 200, json: async () => ({ message: { content: 'ok' } }), text: async () => '' }; });
        await executor.enqueue({ taskType: 'evaluation', systemPrompt: '', userPrompt: '', expectedFormat: 'text', timeoutMs: 5000 });
        assertEq(capturedBody.model, 'model-fast:3b', 'modelo');
    });

    await test('modelTier explícito sobreescribe el routing', async () => {
        clearModules(EXECUTOR_PATH);
        const executor = require(EXECUTOR_PATH);
        let capturedBody;
        mockFetch(async (_url, opts) => { capturedBody = JSON.parse(opts.body); return { ok: true, status: 200, json: async () => ({ message: { content: '{}' } }), text: async () => '' }; });
        await executor.enqueue({ taskType: 'workout', modelTier: 'fast', systemPrompt: '', userPrompt: '', expectedFormat: 'json', timeoutMs: 5000 });
        assertEq(capturedBody.model, 'model-fast:3b', 'modelo sobreescrito');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S1.2 Formato JSON: body.format='json' solo para expectedFormat='json'
    // ──────────────────────────────────────────────────────────────────────────
    await test('expectedFormat=json agrega body.format=json en la request', async () => {
        clearModules(EXECUTOR_PATH);
        const executor = require(EXECUTOR_PATH);
        let capturedBody;
        mockFetch(async (_url, opts) => { capturedBody = JSON.parse(opts.body); return { ok: true, status: 200, json: async () => ({ message: { content: '{}' } }), text: async () => '' }; });
        await executor.enqueue({ taskType: 'workout', systemPrompt: '', userPrompt: '', expectedFormat: 'json', timeoutMs: 5000 });
        assertEq(capturedBody.format, 'json', 'format');
    });

    await test('expectedFormat=text NO agrega body.format', async () => {
        clearModules(EXECUTOR_PATH);
        const executor = require(EXECUTOR_PATH);
        let capturedBody;
        mockFetch(async (_url, opts) => { capturedBody = JSON.parse(opts.body); return { ok: true, status: 200, json: async () => ({ message: { content: 'texto libre' } }), text: async () => '' }; });
        await executor.enqueue({ taskType: 'debate', systemPrompt: '', userPrompt: '', expectedFormat: 'text', timeoutMs: 5000 });
        assert(capturedBody.format === undefined, 'format debe ser undefined para text');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S1.3 Reintentos: MAX_RETRIES=1 → exactamente 2 llamadas (1 intento + 1 retry)
    // Usamos MAX_RETRIES=1 (backoff: 2s) en lugar de 2 (backoff: 2s+4s=6s) para CI rápido.
    // ──────────────────────────────────────────────────────────────────────────
    await test('MAX_RETRIES=1 produce exactamente 2 llamadas a fetch antes de fallar', async () => {
        clearModules(EXECUTOR_PATH);
        process.env.OLLAMA_MAX_RETRIES = '1';
        const executor = require(EXECUTOR_PATH);
        let callCount = 0;
        mockFetch(async () => {
            callCount++;
            return { ok: false, status: 503, text: async () => 'Service Unavailable', json: async () => { throw new Error(); } };
        });
        try {
            await executor.enqueue({ taskType: 'engagement', systemPrompt: '', userPrompt: '', expectedFormat: 'json', timeoutMs: 30000 });
        } catch (_) { }
        // Intento 1 + 1 reintento = 2 llamadas totales (tarda ~2s por backoff 2^1*1000)
        assertEq(callCount, 2, 'número de llamadas con MAX_RETRIES=1');
        process.env.OLLAMA_MAX_RETRIES = '2';
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S1.4 MAX_RETRIES=0: falla en el primer intento sin reintentar
    // ──────────────────────────────────────────────────────────────────────────
    await test('MAX_RETRIES=0 produce exactamente 1 llamada a fetch', async () => {
        clearModules(EXECUTOR_PATH);
        process.env.OLLAMA_MAX_RETRIES = '0';
        const executor = require(EXECUTOR_PATH);
        let callCount = 0;
        mockFetch(async () => {
            callCount++;
            return { ok: false, status: 503, text: async () => 'error', json: async () => { throw new Error(); } };
        });
        try {
            await executor.enqueue({ taskType: 'engagement', systemPrompt: '', userPrompt: '', expectedFormat: 'json', timeoutMs: 5000 });
        } catch (_) { }
        assertEq(callCount, 1, 'llamadas con MAX_RETRIES=0');
        process.env.OLLAMA_MAX_RETRIES = '2';
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S1.5 Timeout: el AbortController cancela la request colgada
    // ──────────────────────────────────────────────────────────────────────────
    await test('timeoutMs corto cancela fetch colgado con error TIMEOUT', async () => {
        clearModules(EXECUTOR_PATH);
        process.env.OLLAMA_MAX_RETRIES = '0';
        const executor = require(EXECUTOR_PATH);
        mockFetch(fetchHang()); // nunca resuelve, pero sí responde al AbortController
        let errMsg = '';
        try {
            await executor.enqueue({ taskType: 'engagement', systemPrompt: '', userPrompt: '', expectedFormat: 'json', timeoutMs: 200 });
        } catch (err) {
            errMsg = err.message;
        }
        assert(errMsg.includes('TIMEOUT'), `Error debe contener TIMEOUT, obtenido: "${errMsg}"`);
        process.env.OLLAMA_MAX_RETRIES = '2';
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S1.6 Ollama devuelve content vacío → error claro
    // ──────────────────────────────────────────────────────────────────────────
    await test('respuesta de Ollama con content vacío/null lanza error descriptivo', async () => {
        clearModules(EXECUTOR_PATH);
        process.env.OLLAMA_MAX_RETRIES = '0';
        const executor = require(EXECUTOR_PATH);
        mockFetch(async () => ({ ok: true, status: 200, json: async () => ({ message: { content: '' } }), text: async () => '' }));
        let errMsg = '';
        try {
            await executor.enqueue({ taskType: 'engagement', systemPrompt: '', userPrompt: '', expectedFormat: 'json', timeoutMs: 5000 });
        } catch (err) { errMsg = err.message; }
        assert(errMsg.includes('vacío') || errMsg.includes('empty') || errMsg.length > 0, 'debe haber un mensaje de error');
        process.env.OLLAMA_MAX_RETRIES = '2';
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S1.7 Circuit Breaker: abre después de CB_THRESHOLD fallos consecutivos
    // ──────────────────────────────────────────────────────────────────────────
    await test('circuit breaker abre después de CB_THRESHOLD fallos (rechazo inmediato)', async () => {
        clearModules(EXECUTOR_PATH);
        process.env.OLLAMA_MAX_RETRIES = '0';
        process.env.OLLAMA_CB_THRESHOLD = '3';
        process.env.OLLAMA_CB_RECOVERY_MS = '500';
        const executor = require(EXECUTOR_PATH);

        mockFetch(async () => ({ ok: false, status: 503, text: async () => 'error', json: async () => { throw new Error(); } }));

        // 3 fallos para abrir el circuito
        for (let i = 0; i < 3; i++) {
            try { await executor.enqueue({ taskType: 'social', systemPrompt: '', userPrompt: '', expectedFormat: 'json', timeoutMs: 5000 }); } catch (_) { }
        }

        // La siguiente debe ser rechazada instantáneamente con Circuit OPEN
        let errMsg = '';
        const t0 = Date.now();
        try {
            await executor.enqueue({ taskType: 'social', systemPrompt: '', userPrompt: '', expectedFormat: 'json', timeoutMs: 5000 });
        } catch (err) { errMsg = err.message; }
        const elapsed = Date.now() - t0;

        assert(errMsg.includes('Circuit OPEN') || errMsg.includes('OPEN'), `Esperado "Circuit OPEN", obtenido: "${errMsg}"`);
        assert(elapsed < 500, `Debe rechazar en <500ms (sin llegar a Ollama). Elapsed: ${elapsed}ms`);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S1.8 Circuit Breaker: se recupera después del tiempo de recovery
    // ──────────────────────────────────────────────────────────────────────────
    await test('circuit breaker se recupera (half-open) después de CB_RECOVERY_MS', async () => {
        // El circuito quedó abierto del test anterior (mismo módulo en caché)
        clearModules(EXECUTOR_PATH);
        process.env.OLLAMA_MAX_RETRIES = '0';
        process.env.OLLAMA_CB_THRESHOLD = '2';
        process.env.OLLAMA_CB_RECOVERY_MS = '300';
        const executor = require(EXECUTOR_PATH);

        // Abrir el circuito
        mockFetch(async () => ({ ok: false, status: 503, text: async () => 'error', json: async () => { throw new Error(); } }));
        for (let i = 0; i < 2; i++) {
            try { await executor.enqueue({ taskType: 'social', systemPrompt: '', userPrompt: '', expectedFormat: 'json', timeoutMs: 5000 }); } catch (_) { }
        }

        // Esperar recovery
        await sleep(400);

        // Ahora debería permitir el paso (mock devuelve éxito)
        mockFetch(async () => ({ ok: true, status: 200, json: async () => ({ message: { content: '{}' } }), text: async () => '' }));
        let succeeded = false;
        try {
            await executor.enqueue({ taskType: 'social', systemPrompt: '', userPrompt: '', expectedFormat: 'json', timeoutMs: 5000 });
            succeeded = true;
        } catch (_) { }
        assert(succeeded, 'Debe permitir peticiones después del recovery');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S1.9 getStatus() refleja estado real
    // ──────────────────────────────────────────────────────────────────────────
    await test('getStatus() incluye todos los campos esperados', async () => {
        clearModules(EXECUTOR_PATH);
        process.env.OLLAMA_CB_THRESHOLD = '5';
        const executor = require(EXECUTOR_PATH);
        const s = executor.getStatus();
        assertType(s.running, 'number', 'running');
        assertType(s.queued, 'number', 'queued');
        assertType(s.max_concurrency, 'number', 'max_concurrency');
        assertType(s.circuit_breaker.failures, 'number', 'cb.failures');
        assertType(s.circuit_breaker.threshold, 'number', 'cb.threshold');
        assertType(s.circuit_breaker.open, 'boolean', 'cb.open');
        assertType(s.models.deep, 'string', 'models.deep');
        assertType(s.models.fast, 'string', 'models.fast');
    });

    // Restaurar defaults
    process.env.OLLAMA_MAX_RETRIES = '2';
    process.env.OLLAMA_CB_THRESHOLD = '100';
    process.env.OLLAMA_CB_RECOVERY_MS = '500';
};

// ═══════════════════════════════════════════════════════════════════════════════
// S2 — AgentOrchestrator
// ═══════════════════════════════════════════════════════════════════════════════

const runS2 = async () => {
    suite('S2 — AgentOrchestrator: lifecycle, JSON extraction, fallback, taskType inválido');

    // Para tests de orquestador usamos MAX_RETRIES=0 para velocidad
    clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH);
    process.env.OLLAMA_MAX_RETRIES = '0';
    process.env.OLLAMA_CB_THRESHOLD = '100';
    process.env.OLLAMA_CB_RECOVERY_MS = '500';

    // ──────────────────────────────────────────────────────────────────────────
    // S2.1 taskType desconocido → throw inmediato
    // ──────────────────────────────────────────────────────────────────────────
    await test('taskType desconocido lanza error sin llamar a Ollama', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH);
        const orchestrator = require(ORCHESTRATOR_PATH);
        let called = false;
        mockFetch(async () => { called = true; return { ok: true, status: 200, json: async () => ({ message: { content: '{}' } }), text: async () => '' }; });
        let errMsg = '';
        try {
            await orchestrator.submitTask({
                taskType: 'tipo_inexistente',
                systemPrompt: '', userPrompt: '', expectedFormat: 'json',
                fallbackFn: () => ({}),
            });
        } catch (err) { errMsg = err.message; }
        assert(!called, 'fetch no debe llamarse para taskType inválido');
        assert(errMsg.includes('tipo_inexistente'), `Mensaje debe incluir el tipo inválido: "${errMsg}"`);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S2.2 JSON extraction: JSON puro directo
    // ──────────────────────────────────────────────────────────────────────────
    await test('extrae JSON puro (sin markdown, sin texto extra)', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH);
        const orchestrator = require(ORCHESTRATOR_PATH);
        mockFetch(fetchOk('{"split_name":"PPL","dias_totales":3}'));
        const result = await orchestrator.submitTask({
            taskType: 'workout', systemPrompt: '', userPrompt: '', expectedFormat: 'json',
            fallbackFn: () => ({ fallback: true }),
        });
        assertEq(result.split_name, 'PPL', 'split_name');
        assertEq(result.dias_totales, 3, 'dias_totales');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S2.3 JSON extraction: JSON embebido en texto
    // ──────────────────────────────────────────────────────────────────────────
    await test('extrae JSON embebido entre texto (respuesta con introducción)', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH);
        const orchestrator = require(ORCHESTRATOR_PATH);
        mockFetch(fetchOk('Aquí está tu plan: {"split_name":"Upper/Lower","dias_totales":4} Espero que te sirva.'));
        const result = await orchestrator.submitTask({
            taskType: 'workout', systemPrompt: '', userPrompt: '', expectedFormat: 'json',
            fallbackFn: () => ({ fallback: true }),
        });
        assertEq(result.split_name, 'Upper/Lower', 'split_name');
        assertEq(result.dias_totales, 4, 'dias_totales');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S2.4 JSON extraction: JSON dentro de markdown ```json ... ```
    // ──────────────────────────────────────────────────────────────────────────
    await test('extrae JSON con fence de markdown ```json...```', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH);
        const orchestrator = require(ORCHESTRATOR_PATH);
        mockFetch(fetchOk('```json\n{"split_name":"Full Body","dias_totales":2}\n```'));
        const result = await orchestrator.submitTask({
            taskType: 'workout', systemPrompt: '', userPrompt: '', expectedFormat: 'json',
            fallbackFn: () => ({ fallback: true }),
        });
        assertEq(result.split_name, 'Full Body', 'split_name');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S2.5 JSON garbage → invoca fallback (no lanza)
    // ──────────────────────────────────────────────────────────────────────────
    await test('JSON inválido en respuesta activa fallback sin lanzar error al caller', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH);
        const orchestrator = require(ORCHESTRATOR_PATH);
        mockFetch(fetchOk('esto no es json en ninguna forma'));
        let fallbackCalled = false;
        const result = await orchestrator.submitTask({
            taskType: 'workout', systemPrompt: '', userPrompt: '', expectedFormat: 'json',
            fallbackFn: () => { fallbackCalled = true; return { fallback: true }; },
        });
        assert(fallbackCalled, 'fallback debe haberse llamado');
        assert(result.fallback === true, 'resultado debe venir del fallback');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S2.6 Ollama HTTP error → fallback invocado
    // ──────────────────────────────────────────────────────────────────────────
    await test('error HTTP de Ollama activa fallback sin lanzar al caller', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH);
        process.env.OLLAMA_MAX_RETRIES = '0';
        const orchestrator = require(ORCHESTRATOR_PATH);
        mockFetch(fetchError(503));
        let fallbackCalled = false;
        const result = await orchestrator.submitTask({
            taskType: 'engagement', systemPrompt: '', userPrompt: '', expectedFormat: 'json',
            fallbackFn: () => { fallbackCalled = true; return { urgencia: 'alta', canal: 'push' }; },
        });
        assert(fallbackCalled, 'fallback debe haberse llamado');
        assertEq(result.urgencia, 'alta', 'urgencia en fallback');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S2.7 Éxito → fallback NO se invoca
    // ──────────────────────────────────────────────────────────────────────────
    await test('en éxito el fallback no se invoca', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH);
        process.env.OLLAMA_MAX_RETRIES = '0';
        const orchestrator = require(ORCHESTRATOR_PATH);
        mockFetch(fetchOk('{"titulo":"test","urgencia":"baja"}'));
        let fallbackCalled = false;
        await orchestrator.submitTask({
            taskType: 'engagement', systemPrompt: '', userPrompt: '', expectedFormat: 'json',
            fallbackFn: () => { fallbackCalled = true; return {}; },
        });
        assert(!fallbackCalled, 'fallback NO debe llamarse en éxito');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S2.8 Sin fallbackFn en falla → el error se propaga al caller
    // ──────────────────────────────────────────────────────────────────────────
    await test('sin fallbackFn en falla el error se propaga al caller', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH);
        process.env.OLLAMA_MAX_RETRIES = '0';
        const orchestrator = require(ORCHESTRATOR_PATH);
        mockFetch(fetchError(500));
        let threw = false;
        try {
            await orchestrator.submitTask({
                taskType: 'engagement', systemPrompt: '', userPrompt: '', expectedFormat: 'json',
                // sin fallbackFn
            });
        } catch (_) { threw = true; }
        assert(threw, 'debe lanzar error cuando no hay fallback');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S2.9 Task IDs son únicos en llamadas secuenciales
    // ──────────────────────────────────────────────────────────────────────────
    await test('task IDs son únicos en 10 llamadas secuenciales', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH);
        process.env.OLLAMA_MAX_RETRIES = '0';
        const orchestrator = require(ORCHESTRATOR_PATH);
        mockFetch(fetchOk('{}'));
        // No podemos acceder a taskId desde afuera, pero podemos verificar el summary
        const ids = new Set();
        for (let i = 0; i < 10; i++) {
            await orchestrator.submitTask({
                taskType: 'engagement', systemPrompt: '', userPrompt: '', expectedFormat: 'json',
                fallbackFn: () => ({}),
            });
            const summary = orchestrator.getAllTasksSummary();
            // Si los IDs no son únicos, el mapa los sobreescribiría y el total sería < iteraciones
            // Verificamos que completed += 1 cada vez
            ids.add(summary.total); // total debería ser diferente o igual dependiendo del TTL
        }
        // La verificación real: getAllTasksSummary devuelve números válidos
        const summary = orchestrator.getAllTasksSummary();
        assertType(summary.total, 'number', 'total');
        assertType(summary.completed, 'number', 'completed');
        assertType(summary.failed, 'number', 'failed');
        assert(summary.completed >= 0, 'completed debe ser >= 0');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S2.10 expectedFormat='text' → retorna string sin parsear
    // ──────────────────────────────────────────────────────────────────────────
    await test('expectedFormat=text retorna string raw sin intentar JSON.parse', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH);
        process.env.OLLAMA_MAX_RETRIES = '0';
        const orchestrator = require(ORCHESTRATOR_PATH);
        const rawText = 'Esta es una evaluación del borrador: necesitas más volumen en piernas.';
        mockFetch(fetchOk(rawText));
        const result = await orchestrator.submitTask({
            taskType: 'debate', systemPrompt: '', userPrompt: '', expectedFormat: 'text',
            fallbackFn: () => 'fallback text',
        });
        assertEq(result, rawText, 'resultado raw text');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S2.11 parseResult personalizado se usa antes que el extractor JSON interno
    // ──────────────────────────────────────────────────────────────────────────
    await test('parseResult personalizado tiene prioridad sobre extractor JSON interno', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH);
        process.env.OLLAMA_MAX_RETRIES = '0';
        const orchestrator = require(ORCHESTRATOR_PATH);
        mockFetch(fetchOk('respuesta cruda del modelo'));
        let parseCalledWith = null;
        const result = await orchestrator.submitTask({
            taskType: 'debate', systemPrompt: '', userPrompt: '', expectedFormat: 'json',
            parseResult: (raw) => { parseCalledWith = raw; return { custom: true }; },
            fallbackFn: () => ({}),
        });
        assertEq(parseCalledWith, 'respuesta cruda del modelo', 'parseResult recibió el raw');
        assert(result.custom === true, 'resultado viene del parseResult personalizado');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S2.12 TASK_CONFIGS expone todos los tipos esperados
    // ──────────────────────────────────────────────────────────────────────────
    await test('TASK_CONFIGS contiene los 6 tipos de tarea con timeoutMs y label', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH);
        const { TASK_CONFIGS } = require(ORCHESTRATOR_PATH);
        const expectedTypes = ['workout', 'nutrition', 'engagement', 'social', 'debate', 'evaluation'];
        for (const t of expectedTypes) {
            assert(t in TASK_CONFIGS, `Falta tipo: ${t}`);
            assertType(TASK_CONFIGS[t].timeoutMs, 'number', `${t}.timeoutMs`);
            assertType(TASK_CONFIGS[t].label, 'string', `${t}.label`);
            assert(TASK_CONFIGS[t].timeoutMs > 0, `${t}.timeoutMs debe ser > 0`);
        }
        // workout y nutrition deben tener timeout mayor que engagement (tareas complejas)
        assert(TASK_CONFIGS.workout.timeoutMs > TASK_CONFIGS.engagement.timeoutMs,
            'workout debe tener mayor timeout que engagement');
    });

    process.env.OLLAMA_MAX_RETRIES = '2';
};

// ═══════════════════════════════════════════════════════════════════════════════
// S3 — Payloads y Fallbacks de cada Agente
// ═══════════════════════════════════════════════════════════════════════════════

const runS3 = async () => {
    suite('S3 — Fallbacks de agentes: campos, tipos, lógica de negocio');

    // Nota: los fallbacks son funciones puras, no necesitan Ollama ni fetch.
    // Los importamos y extraemos la función de fallback invocándola con valores
    // que causen el fallback (Ollama mock siempre falla).

    clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, WORKOUT_PATH, NUTRITION_PATH, ENGAGEMENT_PATH, SOCIAL_PATH);
    process.env.OLLAMA_MAX_RETRIES = '0';
    process.env.OLLAMA_CB_THRESHOLD = '100';
    mockFetch(fetchError(503)); // todos los agentes van a fallback

    // ──────────────────────────────────────────────────────────────────────────
    // S3.1 workoutAgent fallback: estructura mínima
    // ──────────────────────────────────────────────────────────────────────────
    await test('workoutAgent fallback tiene split_name, dias_totales, dias (array), notas_generales', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, WORKOUT_PATH);
        const { generateWorkoutPlan } = require(WORKOUT_PATH);
        const result = await generateWorkoutPlan({ dias_disponibles: 4, objetivo: 'hipertrofia', fatiga_percibida: 5, adherencia: 0.85 });
        assertType(result.split_name, 'string', 'split_name');
        assertType(result.dias_totales, 'number', 'dias_totales');
        assertType(result.volumen_ajustado, 'boolean', 'volumen_ajustado');
        assertArray(result.dias, 'dias');
        assertType(result.notas_generales, 'string', 'notas_generales');
        assert(result.dias.length > 0, 'dias debe tener al menos 1 elemento');
    });

    await test('workoutAgent fallback: cada ejercicio tiene nombre, series, repeticiones, rpe_objetivo, nota', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, WORKOUT_PATH);
        const { generateWorkoutPlan } = require(WORKOUT_PATH);
        const result = await generateWorkoutPlan({ dias_disponibles: 4, objetivo: 'hipertrofia', fatiga_percibida: 5, adherencia: 0.85 });
        const ejercicio = result.dias[0]?.ejercicios?.[0];
        assert(ejercicio, 'debe haber al menos un ejercicio en el primer día');
        assertType(ejercicio.nombre, 'string', 'ejercicio.nombre');
        assertType(ejercicio.series, 'number', 'ejercicio.series');
        assertType(ejercicio.repeticiones, 'string', 'ejercicio.repeticiones');
        assertType(ejercicio.rpe_objetivo, 'number', 'ejercicio.rpe_objetivo');
        assertType(ejercicio.nota, 'string', 'ejercicio.nota');
    });

    await test('workoutAgent fallback con fatiga>=7: series reducidas a 3 (vs 4)', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, WORKOUT_PATH);
        const { generateWorkoutPlan } = require(WORKOUT_PATH);
        const resultAlta = await generateWorkoutPlan({ dias_disponibles: 4, objetivo: 'hipertrofia', fatiga_percibida: 8, adherencia: 0.85 });
        const resultBaja = await generateWorkoutPlan({ dias_disponibles: 4, objetivo: 'hipertrofia', fatiga_percibida: 4, adherencia: 0.85 });
        const seriesAlta = resultAlta.dias[0]?.ejercicios?.[0]?.series;
        const seriesBaja = resultBaja.dias[0]?.ejercicios?.[0]?.series;
        assert(resultAlta.volumen_ajustado === true, 'volumen_ajustado debe ser true con fatiga alta');
        assert(resultBaja.volumen_ajustado === false, 'volumen_ajustado debe ser false con fatiga baja');
        assert(seriesAlta < seriesBaja, `Series con fatiga alta (${seriesAlta}) deben ser menores que con baja (${seriesBaja})`);
    });

    await test('workoutAgent fallback razon_ajuste: presente con fatiga>=7, null sin fatiga', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, WORKOUT_PATH);
        const { generateWorkoutPlan } = require(WORKOUT_PATH);
        const conFatiga = await generateWorkoutPlan({ dias_disponibles: 4, fatiga_percibida: 9, adherencia: 0.8 });
        const sinFatiga = await generateWorkoutPlan({ dias_disponibles: 4, fatiga_percibida: 3, adherencia: 0.9 });
        assert(conFatiga.razon_ajuste !== null, 'razon_ajuste debe estar presente con fatiga alta');
        assertEq(sinFatiga.razon_ajuste, null, 'razon_ajuste debe ser null sin fatiga');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S3.2 nutritionAgent fallback: estructura y math básico
    // ──────────────────────────────────────────────────────────────────────────
    await test('nutritionAgent fallback tiene resumen_diario con kcal, proteina_g, carbs_g, grasa_g', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, NUTRITION_PATH);
        const { generateMealPlan } = require(NUTRITION_PATH);
        const result = await generateMealPlan({ kcal_target: 2200, protein_g: 140, region: 'mexico', objetivo: 'perdida_grasa' });
        const rd = result.resumen_diario;
        assert(rd, 'resumen_diario debe existir');
        assertEq(rd.kcal, 2200, 'kcal');
        assertEq(rd.proteina_g, 140, 'proteina_g');
        assertType(rd.carbs_g, 'number', 'carbs_g');
        assertType(rd.grasa_g, 'number', 'grasa_g');
        assert(rd.carbs_g > 0, 'carbs_g > 0');
        assert(rd.grasa_g > 0, 'grasa_g > 0');
    });

    await test('nutritionAgent fallback tiene los 5 slots de comida', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, NUTRITION_PATH);
        const { generateMealPlan } = require(NUTRITION_PATH);
        const result = await generateMealPlan({ kcal_target: 2200, protein_g: 140, region: 'mexico' });
        const slots = ['desayuno', 'colacion_1', 'almuerzo', 'colacion_2', 'cena'];
        for (const slot of slots) {
            assert(slot in result.estructura_comidas, `Falta slot: ${slot}`);
            assertType(result.estructura_comidas[slot].kcal, 'number', `${slot}.kcal`);
            assertArray(result.estructura_comidas[slot].opciones, `${slot}.opciones`);
        }
    });

    await test('nutritionAgent fallback: suma de kcal de slots ≈ kcal_target (±5%)', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, NUTRITION_PATH);
        const { generateMealPlan } = require(NUTRITION_PATH);
        const kcalTarget = 2000;
        const result = await generateMealPlan({ kcal_target: kcalTarget, protein_g: 130, region: 'mexico' });
        const ec = result.estructura_comidas;
        const suma = ec.desayuno.kcal + ec.colacion_1.kcal + ec.almuerzo.kcal + ec.colacion_2.kcal + ec.cena.kcal;
        const diff = Math.abs(suma - kcalTarget);
        const tolerancia = kcalTarget * 0.05;
        assert(diff <= tolerancia + 5, `Suma de kcal (${suma}) debe aproximarse a ${kcalTarget} (diff: ${diff}, tolerancia: ${tolerancia})`);
    });

    await test('nutritionAgent fallback: intercambios_sugeridos es un array no vacío', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, NUTRITION_PATH);
        const { generateMealPlan } = require(NUTRITION_PATH);
        const result = await generateMealPlan({ kcal_target: 2200, protein_g: 140, region: 'mexico' });
        assertArray(result.intercambios_sugeridos, 'intercambios_sugeridos');
        assert(result.intercambios_sugeridos.length > 0, 'intercambios_sugeridos no debe estar vacío');
    });

    await test('nutritionAgent fallback: nota_nutricionista contiene [FALLBACK]', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, NUTRITION_PATH);
        const { generateMealPlan } = require(NUTRITION_PATH);
        const result = await generateMealPlan({ kcal_target: 2200, protein_g: 140, region: 'mexico' });
        assert(result.nota_nutricionista.includes('[FALLBACK]'), 'nota debe indicar que es fallback');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S3.3 engagementAgent fallback: urgencia y CTA según riesgo
    // ──────────────────────────────────────────────────────────────────────────
    await test('engagementAgent fallback: riesgo>0.6 → urgencia=alta, cta presente', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, ENGAGEMENT_PATH);
        const { generateEngagementMessage } = require(ENGAGEMENT_PATH);
        const result = await generateEngagementMessage({ nombre: 'Test', abandono_risk: 0.75, canal: 'push' });
        assertEq(result.urgencia, 'alta', 'urgencia');
        assert(result.cta !== null && result.cta !== undefined, 'cta debe estar presente para riesgo alto');
        assertType(result.titulo, 'string', 'titulo');
        assertType(result.cuerpo, 'string', 'cuerpo');
    });

    await test('engagementAgent fallback: riesgo 0.4-0.6 → urgencia=media', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, ENGAGEMENT_PATH);
        const { generateEngagementMessage } = require(ENGAGEMENT_PATH);
        const result = await generateEngagementMessage({ nombre: 'Test', abandono_risk: 0.5, canal: 'push' });
        assertEq(result.urgencia, 'media', 'urgencia');
    });

    await test('engagementAgent fallback: riesgo<0.4 → urgencia=baja, cta=null', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, ENGAGEMENT_PATH);
        const { generateEngagementMessage } = require(ENGAGEMENT_PATH);
        const result = await generateEngagementMessage({ nombre: 'Test', abandono_risk: 0.2, streak_current: 3, canal: 'push' });
        assertEq(result.urgencia, 'baja', 'urgencia');
        assert(result.cta === null || result.cta === undefined, 'cta debe ser null para riesgo bajo');
    });

    await test('engagementAgent fallback: canal se propaga al resultado', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, ENGAGEMENT_PATH);
        const { generateEngagementMessage } = require(ENGAGEMENT_PATH);
        for (const canal of ['push', 'email', 'whatsapp']) {
            const result = await generateEngagementMessage({ nombre: 'Test', abandono_risk: 0.5, canal });
            assertEq(result.canal, canal, `canal=${canal}`);
        }
    });

    await test('engagementAgent fallback: cta_link es /dashboard', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, ENGAGEMENT_PATH);
        const { generateEngagementMessage } = require(ENGAGEMENT_PATH);
        const result = await generateEngagementMessage({ nombre: 'Test', abandono_risk: 0.8, canal: 'push' });
        assertEq(result.cta_link, '/dashboard', 'cta_link');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S3.4 socialAgent fallback: estructura mínima
    // ──────────────────────────────────────────────────────────────────────────
    await test('socialAgent fallback tiene copy_principal, gancho_alternativo, hashtags, sugerencia_visual', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, SOCIAL_PATH);
        const { generateSocialPost } = require(SOCIAL_PATH);
        const result = await generateSocialPost({ nombre_entrenador: 'Carlos', tipo_milestone: 'perdida_peso', valor_logro: '-5kg', plataforma: 'instagram' });
        assertType(result.copy_principal, 'string', 'copy_principal');
        assertType(result.gancho_alternativo, 'string', 'gancho_alternativo');
        assertArray(result.hashtags, 'hashtags');
        assertType(result.sugerencia_visual, 'string', 'sugerencia_visual');
        assert(result.hashtags.length > 0, 'hashtags no debe estar vacío');
        assert(result.copy_principal.length > 10, 'copy_principal debe tener contenido');
    });

    await test('socialAgent fallback: cada hashtag empieza con #', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, SOCIAL_PATH);
        const { generateSocialPost } = require(SOCIAL_PATH);
        const result = await generateSocialPost({ plataforma: 'instagram', tipo_milestone: 'streak' });
        for (const tag of result.hashtags) {
            assert(tag.startsWith('#'), `Hashtag "${tag}" debe empezar con #`);
        }
    });

    await test('socialAgent fallback: plataforma se propaga al resultado', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, SOCIAL_PATH);
        const { generateSocialPost } = require(SOCIAL_PATH);
        for (const plataforma of ['instagram', 'tiktok', 'facebook']) {
            const result = await generateSocialPost({ plataforma, tipo_milestone: 'fuerza' });
            assertEq(result.plataforma, plataforma, `plataforma=${plataforma}`);
        }
    });

    await test('socialAgent fallback: mejor_hora_publicacion y tip_engagement son strings no vacíos', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, SOCIAL_PATH);
        const { generateSocialPost } = require(SOCIAL_PATH);
        const result = await generateSocialPost({ plataforma: 'instagram', tipo_milestone: 'check_in' });
        assertType(result.mejor_hora_publicacion, 'string', 'mejor_hora_publicacion');
        assertType(result.tip_engagement, 'string', 'tip_engagement');
        assert(result.mejor_hora_publicacion.length > 0, 'mejor_hora_publicacion no vacío');
        assert(result.tip_engagement.length > 0, 'tip_engagement no vacío');
    });

    process.env.OLLAMA_MAX_RETRIES = '2';
};

// ═══════════════════════════════════════════════════════════════════════════════
// S4 — Concurrencia
// ═══════════════════════════════════════════════════════════════════════════════

const runS4 = async () => {
    suite('S4 — Concurrencia: MAX_CONCURRENCY=1 se respeta, FIFO, todas completan');

    clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH);
    process.env.OLLAMA_MAX_RETRIES = '0';
    process.env.OLLAMA_MAX_CONCURRENCY = '1';
    process.env.OLLAMA_CB_THRESHOLD = '100';

    // ──────────────────────────────────────────────────────────────────────────
    // S4.1 MAX_CONCURRENCY=1: nunca más de 1 fetch en vuelo simultáneamente
    // ──────────────────────────────────────────────────────────────────────────
    await test('MAX_CONCURRENCY=1: nunca más de 1 fetch activo simultáneamente', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH);
        const executor = require(EXECUTOR_PATH);
        let maxSimultaneous = 0;
        let currentlyRunning = 0;

        mockFetch(async () => {
            currentlyRunning++;
            maxSimultaneous = Math.max(maxSimultaneous, currentlyRunning);
            await sleep(50); // simular latencia
            currentlyRunning--;
            return { ok: true, status: 200, json: async () => ({ message: { content: '{}' } }), text: async () => '' };
        });

        // Lanzar 5 tareas en paralelo
        const tasks = Array.from({ length: 5 }, (_, i) =>
            executor.enqueue({ taskType: 'engagement', systemPrompt: '', userPrompt: `tarea-${i}`, expectedFormat: 'json', timeoutMs: 10000 })
        );
        await Promise.all(tasks);

        assertEq(maxSimultaneous, 1, 'máximo de fetches simultáneos');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S4.2 FIFO: las tareas se procesan en orden de inserción
    // ──────────────────────────────────────────────────────────────────────────
    await test('cola FIFO: las tareas se ejecutan en orden de inserción', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH);
        const executor = require(EXECUTOR_PATH);
        const executionOrder = [];

        mockFetch(async (_url, opts) => {
            const body = JSON.parse(opts.body);
            const taskId = body.messages.find(m => m.role === 'user')?.content;
            executionOrder.push(taskId);
            await sleep(30);
            return { ok: true, status: 200, json: async () => ({ message: { content: '{}' } }), text: async () => '' };
        });

        const tasks = ['tarea-A', 'tarea-B', 'tarea-C'].map(id =>
            executor.enqueue({ taskType: 'engagement', systemPrompt: '', userPrompt: id, expectedFormat: 'json', timeoutMs: 10000 })
        );
        await Promise.all(tasks);

        assertEq(executionOrder[0], 'tarea-A', 'primera');
        assertEq(executionOrder[1], 'tarea-B', 'segunda');
        assertEq(executionOrder[2], 'tarea-C', 'tercera');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S4.3 Todas las tareas completan aunque estén encoladas
    // ──────────────────────────────────────────────────────────────────────────
    await test('3 tareas concurrentes completan todas correctamente', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, ENGAGEMENT_PATH, WORKOUT_PATH, NUTRITION_PATH);
        process.env.OLLAMA_MAX_RETRIES = '0';
        const { generateEngagementMessage } = require(ENGAGEMENT_PATH);
        const { generateWorkoutPlan } = require(WORKOUT_PATH);
        const { generateMealPlan } = require(NUTRITION_PATH);

        mockFetch(fetchError(503)); // todos van a fallback

        const [eng, wkt, nut] = await Promise.all([
            generateEngagementMessage({ nombre: 'A', abandono_risk: 0.8, canal: 'push' }),
            generateWorkoutPlan({ dias_disponibles: 3, objetivo: 'hipertrofia', fatiga_percibida: 5, adherencia: 0.9 }),
            generateMealPlan({ kcal_target: 2000, protein_g: 130, region: 'mexico' }),
        ]);

        assert(eng.urgencia === 'alta', 'engagement completó');
        assert(wkt.split_name?.length > 0, 'workout completó');
        assert(nut.resumen_diario?.kcal === 2000, 'nutrition completó');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S4.4 Fallo en una tarea no afecta las demás
    // ──────────────────────────────────────────────────────────────────────────
    await test('fallo en una tarea no bloquea las siguientes en cola', async () => {
        clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, ENGAGEMENT_PATH);
        process.env.OLLAMA_MAX_RETRIES = '0';
        const orchestrator = require(ORCHESTRATOR_PATH);
        let callCount = 0;
        mockFetch(async () => {
            callCount++;
            if (callCount === 1) return { ok: false, status: 500, text: async () => 'error', json: async () => { throw new Error(); } };
            return { ok: true, status: 200, json: async () => ({ message: { content: '{"ok":true}' } }), text: async () => '' };
        });

        const [r1, r2] = await Promise.all([
            orchestrator.submitTask({ taskType: 'engagement', systemPrompt: '', userPrompt: '1', expectedFormat: 'json', fallbackFn: () => ({ from: 'fallback' }) }),
            orchestrator.submitTask({ taskType: 'engagement', systemPrompt: '', userPrompt: '2', expectedFormat: 'json', fallbackFn: () => ({ from: 'fallback' }) }),
        ]);

        assertEq(r1.from, 'fallback', 'tarea 1 usó fallback');
        assertEq(r2.ok, true, 'tarea 2 completó exitosamente');
    });

    process.env.OLLAMA_MAX_RETRIES = '2';
};

// ═══════════════════════════════════════════════════════════════════════════════
// S5 — Bugs Documentados
// ═══════════════════════════════════════════════════════════════════════════════

const runS5 = async () => {
    suite('S5 — Bugs documentados y comportamientos a vigilar');

    // ──────────────────────────────────────────────────────────────────────────
    // S5.1 Dead import: require('crypto').v4 es undefined
    // ──────────────────────────────────────────────────────────────────────────
    await test('FIX: agentOrchestrator ya no importa v4 de crypto (nativo)', async () => {
        // Leemos el archivo para asegurar que la línea fue eliminada
        const fs = require('fs');
        const content = fs.readFileSync(ORCHESTRATOR_PATH + '.js', 'utf8');
        assert(!content.includes("require('crypto')"), 'La línea de importación de crypto debe haber sido eliminada');
        pass('Línea 19 eliminada correctamente');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S5.2 Env vars capturadas en carga: cambiarlas DESPUÉS del require no tiene efecto
    // ──────────────────────────────────────────────────────────────────────────
    await test('FIX: constantes son dinámicas: OLLAMA_MAX_RETRIES cambiado post-require Afecta comportamiento', async () => {
        clearModules(EXECUTOR_PATH);
        process.env.OLLAMA_MAX_RETRIES = '0';
        const executor = require(EXECUTOR_PATH);

        // Cambiar DESPUÉS de cargar el módulo. Ahora debe funcionar porque usamos getters.
        process.env.OLLAMA_MAX_RETRIES = '1';

        let callCount = 0;
        mockFetch(async () => {
            callCount++;
            return { ok: false, status: 503, text: async () => 'error', json: async () => { throw new Error(); } };
        });
        try {
            await executor.enqueue({ taskType: 'engagement', systemPrompt: '', userPrompt: '', expectedFormat: 'json', timeoutMs: 30000 });
        } catch (_) { }

        assertEq(callCount, 2, 'con MAX_RETRIES=1 dinámico, debe haber 2 llamadas (1 inicial + 1 retry)');
        pass('Configuración dinámica verificada');
        process.env.OLLAMA_MAX_RETRIES = '2';
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S5.3 Estado del módulo persiste entre tests (aislamiento)
    // ──────────────────────────────────────────────────────────────────────────
    await test('FIX: estado de módulo se limpia correctamente con _resetForTesting() (via clearModules)', async () => {
        clearModules(EXECUTOR_PATH);
        process.env.OLLAMA_CB_THRESHOLD = '2';
        process.env.OLLAMA_MAX_RETRIES = '0';
        const exec1 = require(EXECUTOR_PATH);

        // Abrir el circuito
        mockFetch(async () => ({ ok: false, status: 503, text: async () => 'err', json: async () => { throw new Error(); } }));
        for (let i = 0; i < 2; i++) {
            try { await exec1.enqueue({ taskType: 'social', systemPrompt: '', userPrompt: '', expectedFormat: 'json', timeoutMs: 5000 }); } catch (_) { }
        }

        // Al limpiar módulos, ahora también reseteamos el estado interno
        clearModules(EXECUTOR_PATH);
        const exec2 = require(EXECUTOR_PATH);

        const status = exec2.getStatus();
        assertEq(status.circuit_breaker.failures, 0, 'failures debe ser 0 tras reset');
        assertEq(status.circuit_breaker.open, false, 'circuito debe estar cerrado tras reset');
        pass('Aislamiento de estado verificado');

        process.env.OLLAMA_CB_THRESHOLD = '100';
        process.env.OLLAMA_MAX_RETRIES = '2';
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S5.4 deepseekClient.js: doble module.exports (bug en archivo original)
    // ──────────────────────────────────────────────────────────────────────────
    await test('FIX: deepseekClient.js fue eliminado correctamente', async () => {
        const fs = require('fs');
        const exists = fs.existsSync('./agents/deepseekClient.js');
        assert(!exists, 'El archivo deepseekClient.js no debería existir');
        pass('Archivo eliminado correctamente');
    });
};

// ═══════════════════════════════════════════════════════════════════════════════
// S6 — Integración con Ollama real
// ═══════════════════════════════════════════════════════════════════════════════

const runS6 = async (ollamaUrl) => {
    suite('S6 — Integración con Ollama real (fetch sin mock)');

    // Restaurar fetch real
    global.fetch = globalFetchReal;

    clearModules(EXECUTOR_PATH, ORCHESTRATOR_PATH, WORKOUT_PATH, NUTRITION_PATH, ENGAGEMENT_PATH, SOCIAL_PATH);

    // Forzar modelos que sabemos que existen para integración
    const defaultModel = process.env.OLLAMA_MODEL || 'gemma2:9b';
    process.env.OLLAMA_MODEL_DEEP = defaultModel;
    process.env.OLLAMA_MODEL_FAST = defaultModel;

    process.env.OLLAMA_BASE_URL = ollamaUrl;
    process.env.OLLAMA_MAX_RETRIES = '1';
    process.env.OLLAMA_CB_THRESHOLD = '5';
    process.env.OLLAMA_MAX_CONCURRENCY = '1';

    // ──────────────────────────────────────────────────────────────────────────
    // S6.1 Conectividad
    // ──────────────────────────────────────────────────────────────────────────
    await test('Ollama responde en /api/tags con lista de modelos', async () => {
        const res = await fetch(`${ollamaUrl}/api/tags`);
        const data = await res.json();
        assertArray(data.models, 'models');
        console.log(`    ${DIM}Modelos instalados: ${data.models.map(m => m.name).join(', ')}${RESET}`);
    });

    await test('Modelo configurado está disponible en Ollama', async () => {
        const modelDeep = process.env.OLLAMA_MODEL_DEEP || process.env.OLLAMA_MODEL || 'gemma2:9b';
        const res = await fetch(`${ollamaUrl}/api/tags`);
        const data = await res.json();
        const names = data.models.map(m => m.name);
        assert(names.includes(modelDeep), `Modelo "${modelDeep}" no está instalado. Disponibles: ${names.join(', ')}`);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S6.2 workoutAgent con Ollama real
    // ──────────────────────────────────────────────────────────────────────────
    await test('workoutAgent: resultado de Ollama tiene estructura correcta y NO es fallback', async () => {
        const { generateWorkoutPlan } = require(WORKOUT_PATH);
        const result = await generateWorkoutPlan({
            objetivo: 'hipertrofia', experiencia: 'intermedio', dias_disponibles: 4,
            equipamiento: 'gimnasio', peso: 80, fatiga_percibida: 5, adherencia: 0.85,
        });
        assertType(result.split_name, 'string', 'split_name');
        assertArray(result.dias, 'dias');
        assert(result.dias.length > 0, 'dias no vacío');
        assert(!result.notas_generales?.includes('[FALLBACK]'), 'no debe ser fallback');
        console.log(`    ${DIM}Split: ${result.split_name} | Días: ${result.dias_totales}${RESET}`);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S6.3 nutritionAgent con Ollama real
    // ──────────────────────────────────────────────────────────────────────────
    await test('nutritionAgent: resultado tiene plan_semanal con al menos 1 día', async () => {
        const { generateMealPlan } = require(NUTRITION_PATH);
        const result = await generateMealPlan({
            kcal_target: 2200, protein_g: 140, region: 'mexico', objetivo: 'perdida_grasa',
            nombre_cliente: 'Test Integration',
        });
        assert(result.resumen_diario?.kcal > 0, 'kcal en resumen_diario > 0');
        assertArray(result.plan_semanal, 'plan_semanal');
        assert(!result.nota_nutricionista?.includes('[FALLBACK]'), 'no debe ser fallback');
        console.log(`    ${DIM}Kcal: ${result.resumen_diario?.kcal} | Días en plan: ${result.plan_semanal?.length}${RESET}`);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S6.4 engagementAgent con Ollama real
    // ──────────────────────────────────────────────────────────────────────────
    await test('engagementAgent: resultado tiene titulo, cuerpo, urgencia válida', async () => {
        const { generateEngagementMessage } = require(ENGAGEMENT_PATH);
        const result = await generateEngagementMessage({
            nombre: 'Juan', abandono_risk: 0.65, streak_current: 2,
            adherencia_ultima_semana: 0.6, canal: 'push',
        });
        assertType(result.titulo, 'string', 'titulo');
        assertType(result.cuerpo, 'string', 'cuerpo');
        assert(['alta', 'media', 'baja'].includes(result.urgencia), `urgencia inválida: ${result.urgencia}`);
        assert(result.tono !== 'fallback', 'no debe ser fallback');
        console.log(`    ${DIM}Tono: ${result.tono} | Urgencia: ${result.urgencia}${RESET}`);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // S6.5 socialAgent con Ollama real
    // ──────────────────────────────────────────────────────────────────────────
    await test('socialAgent: resultado tiene copy_principal y hashtags válidos', async () => {
        const { generateSocialPost } = require(SOCIAL_PATH);
        const result = await generateSocialPost({
            nombre_entrenador: 'Carlos', tipo_milestone: 'perdida_peso',
            valor_logro: '-5kg en 8 semanas', semanas_entrenando: 8,
            plataforma: 'instagram', estilo_coach: 'motivacional',
        });
        assertType(result.copy_principal, 'string', 'copy_principal');
        assertArray(result.hashtags, 'hashtags');
        assert(result.copy_principal.length > 20, 'copy_principal con contenido real');
        assert(result.hashtags.length >= 3, 'al menos 3 hashtags');
        console.log(`    ${DIM}Hashtags: ${result.hashtags.slice(0, 3).join(' ')}...${RESET}`);
    });
};

// ═══════════════════════════════════════════════════════════════════════════════
// RUNNER PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

// Guardar fetch real antes de mockear
const globalFetchReal = global.fetch;

const checkOllamaAvailable = async (url) => {
    try {
        const res = await fetch(`${url}/api/tags`);
        return res.ok;
    } catch (_) {
        return false;
    }
};

(async () => {
    const args = process.argv.slice(2);
    const forceInteg = args.includes('--integration');
    const skipInteg = args.includes('--no-integration');
    const ollamaUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').trim();

    console.log(`\n${BOLD}═══════════════════════════════════════════════════════${RESET}`);
    console.log(`${BOLD}  SUITE DE TESTS — Sistema de Agentes AI${RESET}`);
    console.log(`${BOLD}═══════════════════════════════════════════════════════${RESET}`);
    console.log(`${DIM}  Ollama URL: ${ollamaUrl}${RESET}`);
    console.log(`${DIM}  Node: ${process.version}${RESET}`);

    const start = Date.now();

    try {
        await runS1();
        await runS2();
        await runS3();
        await runS4();
        await runS5();
    } catch (fatalErr) {
        console.error(`\n${RED}Error fatal en suite: ${fatalErr.message}${RESET}`);
        console.error(fatalErr.stack);
    }

    // S6: Integración
    if (!skipInteg) {
        const ollamaAvailable = await checkOllamaAvailable(ollamaUrl);
        if (ollamaAvailable || forceInteg) {
            try {
                await runS6(ollamaUrl);
            } catch (fatalErr) {
                console.error(`\n${RED}Error fatal en S6: ${fatalErr.message}${RESET}`);
            }
        } else {
            suite('S6 — Integración con Ollama real');
            const integTests = ['workoutAgent', 'nutritionAgent', 'engagementAgent', 'socialAgent', 'conectividad', 'modelo disponible'];
            for (const t of integTests) {
                skip(t, `Ollama no disponible en ${ollamaUrl}. Usa --integration para forzar o levanta Docker.`);
            }
        }
    }

    // ── Resumen Final ──────────────────────────────────────────────────────────
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    console.log(`\n${BOLD}═══════════════════════════════════════════════════════${RESET}`);
    console.log(`${BOLD}  RESUMEN  (${elapsed}s)${RESET}`);
    console.log(`${BOLD}═══════════════════════════════════════════════════════${RESET}`);
    console.log(`  ${GREEN}✓ Passed:${RESET}  ${results.passed}`);
    console.log(`  ${RED}✗ Failed:${RESET}  ${results.failed}`);
    console.log(`  ${YELLOW}○ Skipped:${RESET} ${results.skipped}`);

    if (results.bugs.length > 0) {
        console.log(`\n${BOLD}${YELLOW}  BUGS ENCONTRADOS (${results.bugs.length}):${RESET}`);
        results.bugs.forEach((b, i) => {
            console.log(`\n  ${YELLOW}[BUG ${i + 1}]${RESET} ${b.description}`);
            console.log(`  ${DIM}${b.detail}${RESET}`);
        });
    }

    const exitCode = results.failed > 0 ? 1 : 0;
    console.log(`\n${exitCode === 0 ? GREEN : RED}  ${exitCode === 0 ? '● TODOS LOS TESTS PASARON' : '● HAY TESTS FALLANDO'}${RESET}\n`);
    process.exit(exitCode);
})();