# Plan de Implementación: Sistema de Rutinas + Dashboard Enriquecido

## Descripción

Agregar al **TrainerDashboard** un vínculo "➕ Rutina" por cada cliente que abre un flujo de 4 tipos de rutina, respaldado por el equipo de agentes IA (usando DeepSeek en lugar de Ollama). Además, añadir una página dedicada `/trainer/clients/:id` con historial completo, gráficas y seguimiento de rutinas, tomando como base la plantilla 2.2 del documento.

---

## Decisiones de Diseño a Confirmar

> [!IMPORTANT]
> **DeepSeek como LLM principal:** Reemplazaremos `ollamaClient.js` por `deepseekClient.js`. Necesito que adds la API key de DeepSeek en el `.env` como `DEEPSEEK_API_KEY`. Puedes conseguirla en https://platform.deepseek.com

> [!WARNING]
> **JWT requerido:** El flujo de rutinas usa rutas protegidas (`authenticate, isTrainer`). El frontend debe enviar el JWT en el header `Authorization: Bearer <token>` para que funcionen las llamadas a los agentes.

---

## Propuesta de Cambios

### Bloque 1 — LLM Client (Backend)

#### [MODIFY] [ollamaClient.js](file:///c:/SERVER/couch-chuchis/backend/agents/ollamaClient.js)
- Reemplazar URL de Ollama por API de DeepSeek (`api.deepseek.com/v1/chat/completions`)
- Mantener misma firma `generateCompletion(prompt, systemPrompt, model)` para no romper agentes existentes
- Fallback gracioso si la API falla → lanza error que los agentes atrapan con su fallback determinístico

#### [NEW] `.env` — agregar variable
```
DEEPSEEK_API_KEY=sk-xxxxx
```

---

### Bloque 2 — Modelo de Datos (Backend)

#### [MODIFY] [ClientState.js](file:///c:/SERVER/couch-chuchis/backend/models/ClientState.js)
Agregar campos faltantes al `profile_info`:
```
edad, altura_cm, porcentaje_grasa, dias_disponibles, equipamiento,
limitaciones[], region_cultural, restricciones_alimentarias[]
```

#### [NEW] `backend/models/Routine.js`
Modelo de documento de rutina asignada a un cliente:
```json
{
  "client_id": "uuid",
  "trainer_id": "uuid",
  "tipo": "ia_pura | cliente_nuevo | sin_cliente | propuesta_coach",
  "estado": "propuesta | debatida | aprobada | activa | archivada",
  "plan": { ... },           // JSON generado por workoutAgent
  "debate_log": [           // historial del chat coach-agente
    { "autor": "coach|agente", "mensaje": "...", "timestamp": "..." }
  ],
  "nutrition_plan": { ... }, // opcional, del nutritionAgent
  "created_at", "updated_at"
}
```

---

### Bloque 3 — Rutas y Controladores (Backend)

#### [MODIFY] [agentsRoutes.js](file:///c:/SERVER/couch-chuchis/backend/routes/agentsRoutes.js)
Rutas nuevas:
```
POST /api/agents/routine/new-client     → rutina cliente nuevo (recibe perfil completo)
POST /api/agents/routine/existing/:id   → rutina IA pura (usa ClientState de BD)
POST /api/agents/routine/anonymous      → rutina sin cliente
POST /api/agents/routine/coach-draft    → valida/debate rutina del coach
POST /api/agents/routine/:id/debate     → envía mensaje al debate coach-agente
POST /api/agents/routine/:id/approve    → aprueba y activa la rutina
POST /api/agents/nutrition/:id          → propone plan nutricional (similar)
GET  /api/clients                       → lista clientes del trainer autenticado
GET  /api/clients/:id                   → perfil + estado completo de un cliente
GET  /api/clients/:id/routines          → historial de rutinas del cliente
```

#### [NEW] `backend/controllers/routineController.js`
Lógica para los 4 flujos de rutina + debate coach-agente.

#### [NEW] `backend/routes/clientRoutes.js`
Rutas para traer lista de clientes y perfil individual del trainer.

---

### Bloque 4 — Frontend

#### [MODIFY] [TrainerDashboard.jsx](file:///c:/SERVER/couch-chuchis/frontend/src/pages/TrainerDashboard.jsx)
Cambios:
- Agregar **lista de clientes** con tarjeta por cada uno
- Cada tarjeta tiene: nombre, semana, adherencia, flags activos
- **Vínculo "➕ Rutina"** antes del nombre → abre modal de selección de tipo
- **Enlace al perfil** → navega a `/trainer/clients/:id`

#### [NEW] `frontend/src/pages/Trainer/ClientProfile.jsx`
Página dedicada `/trainer/clients/:id` con:
- Header: datos del cliente (semana, peso, adherencia)
- Plantilla 2.2 renderizada (estado actual, flags, recomendaciones)
- **4 gráficas** (Recharts):
  - Línea: Progresión de peso semana a semana
  - Barras: Adherencia por semana
  - Radar/Barras horizontales: Métricas de fuerza (squat/bench/deadlift/OHP)
  - Timeline: Historial de rutinas asignadas
- Sección de rutinas activas + botón para crear nueva

#### [NEW] `frontend/src/pages/Trainer/RoutineWizard.jsx`
Modal/Wizard de creación de rutina con 4 pasos según tipo:

| Tipo | Paso 1 | Paso 2 | Paso 3 |
|------|--------|--------|--------|
| **Cliente nuevo** | Form: edad, peso, grasa, objetivo, experiencia, equipo | IA genera propuesta | Coach revisa / aprueba / modifica |
| **IA pura** | Confirmar contexto del cliente (prellenado desde BD) | IA genera propuesta | Aprobación directa |
| **Sin cliente** | Form: objetivo + expertise + equipo (sin datos personales) | IA genera | Guardar o descartar |
| **Propuesta coach** | Editor de texto para que el coach escriba la rutina | Agente analiza y valida con fundamentos | Chat de debate + aprobación |

#### [NEW] `frontend/src/components/DebateChat.jsx`
Componente de chat interno entre Coach y Agente para el debate de rutinas.

#### [MODIFY] [App.jsx](file:///c:/SERVER/couch-chuchis/frontend/src/App.jsx)
Agregar rutas:
```
/trainer/clients/:id    → ClientProfile
```

---

## Orden de Implementación

```
1. Backend: deepseekClient.js (reemplaza ollamaClient)
2. Backend: ClientState.js (campos de perfil extendidos)
3. Backend: Routine.js (modelo nuevo)
4. Backend: clientRoutes.js + controller (GET clientes + perfil)
5. Backend: routineController.js (4 flujos)
6. Backend: agentsRoutes.js (rutas nuevas)
7. Backend: server.js (montar nuevas rutas)
8. Frontend: TrainerDashboard (lista de clientes + vínculo rutina)
9. Frontend: App.jsx (nueva ruta /trainer/clients/:id)
10. Frontend: ClientProfile.jsx (página completa con gráficas)
11. Frontend: RoutineWizard.jsx (wizard de 4 tipos)
12. Frontend: DebateChat.jsx (componente de debate)
```

---

## Plan de Verificación

### Automatizado
- Backend: `curl POST /api/agents/routine/anonymous` con payload de prueba → debe retornar JSON de rutina (DeepSeek o fallback)
- Backend: `GET /api/clients` con JWT válido → lista de clientes del trainer

### Manual (Browser)
- Navegar al TrainerDashboard → ver lista de clientes con vínculo "➕ Rutina"
- Hacer clic en "➕ Rutina" → se abre el wizard con los 4 tipos
- Completar flujo "Cliente nuevo" → ver propuesta de IA
- Hacer clic en nombre del cliente → navegar a `/trainer/clients/:id`
- Verificar que las 4 gráficas renderizan con datos reales o mock
