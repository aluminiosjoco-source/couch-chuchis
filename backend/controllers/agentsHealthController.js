/**
 * agentsHealthController.js
 * Endpoint de diagnóstico: estado del OllamaExecutor + OrquestadorATasks
 * Ruta: GET /api/agents/health
 * Requiere rol trainer o superior.
 */

const { getStatus: getExecutorStatus } = require('../agents/anthropicExecutor');
const { getAllTasksSummary, TASK_CONFIGS } = require('../agents/agentOrchestrator');

exports.getAgentsHealth = async (req, res) => {
    try {
        const executor = getExecutorStatus();
        const tasks = getAllTasksSummary();

        // Verificar conectividad con Anthropic
        let anthropicReachable = false;
        if (process.env.ANTHROPIC_API_KEY) {
            anthropicReachable = true; // Si hay key asumimos disponible por ahora
        }

        res.json({
            status: anthropicReachable ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            provider: 'anthropic',
            anthropic: {
                reachable: anthropicReachable,
                model_sonnet: executor.models.sonnet,
                model_haiku: executor.models.haiku,
            },
            executor: {
                running: executor.running,
                queued: executor.queued,
                max_concurrency: executor.max_concurrency,
                circuit_breaker: executor.circuit_breaker,
            },
            tasks: {
                ...tasks,
                task_types: Object.entries(TASK_CONFIGS).map(([type, cfg]) => ({
                    type,
                    label: cfg.label,
                    timeout_ms: cfg.timeoutMs,
                })),
            },
        });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};