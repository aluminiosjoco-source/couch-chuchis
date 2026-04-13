# Arquitectura SaaS "Coach-as-a-Service" (B2B2C)

## Documento Técnico de Diseño - Versión 1.0

**Fecha de Diseño:** 2026-04-03  
**Clasificación:** Propuesta Técnica para Equipo de Desarrollo  
**Enfoque:** Arquitectura Lógica, Flujo de Datos y Reglas Operativas

---

## Resumen Ejecutivo

Este documento define la arquitectura técnica para un SaaS B2B2C de coaching fitness donde el sistema actúa como un **entrenador autónomo** con memoria persistente. La diferenciación central es un Motor de Decisiones que mantiene estado continuo del usuario, adaptando entrenamiento, nutrición y suplementación basándose en datos reales de check-in semanal.

**Supuestos de Diseño:**
- Base de datos documental (MongoDB) para almacenamiento de estados
- API RESTful + Webhooks para integración con wearables
- Frontend SPA (React/Next.js) con dashboards dinámicos
- Sistema de notificaciones push + TELEGRAM BOT
- Cultura objetivo inicial: México/LatAm con extensibilidad a otras regiones

---

## 1. Arquitectura Multi-Tenant y Roles

### 1.1 Modelo de Datos Relacional (Simplificado)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN (Plataforma)                  │
│  - Gestiona gyms registrados                                   │
│  - Configura planes y precios base                            │
│  - Acceso a analytics globales                                │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌─────────────────┴─────────────────┐
              ▼                                   ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│   GYM (Tenant)       │           │ ENTRENADOR INDEPENDIENTE│
│   (Multi-Tenant)    │           │ (Sin Gym)              │
│                     │           │                       │
│ - Nombre Gym       │           │ - Nombre Completo      │
│ - Plan activo      │           │ - Certificaciones     │
│ - Usuarios límite │           │ - Especialidades      │
│ - Configuración   │           │ - Clientes propios   │
└─────────────────────────┘           └─────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ENTRENADORES ASOCIADOS                        │
│  - Pertenecen a un Gym o sono independientes                    │
│  - Tienen clientes asignados                                  │
│  - Reciben alertas de estancamiento/abandono                  │
│  - Pueden personalizar dentro de rangos del sistema             │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────���──────────────────────────────┐
│                    CLIENTES (Usuarios Finales)                   │
│  - Pertenecen a un Gym o contratan independiente                  │
│  - Check-in semanal obligatorio                                 │
│  - Acceso a app móvil/web                                       │
│  - Reciben plan adaptado automáticamente                          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Matriz de Permisos

| Recurso | Super Admin | Gym | Entrenador | Cliente |
|--------|------------|-----|-----------|---------|
| `platform.config` | CRUD | READ | - | - |
| `gym.config` | CRUD | CRUD | READ | - |
| `trainer.profile` | CRUD | CRUD | CRU | READ |
| `client.data` | CRUD | CRUD | CRU (asignados) | RU (propio) |
| `client.plan` | READ | READ | CRUD | READ |
| `client.history` | READ | READ | READ | CRU (propio) |
| `billing.subscription` | CRUD | CRUD | READ | CRU (propio) |
| `analytics.global` | CRUD | READ | - | - |
| `analytics.gym` | CRUD | CRUD | READ | - |
| `analytics.client` | READ | READ | READ (asignados) | READ (propio) |

### 1.3 Modelo de Negocio y Monetización

#### Planes de Suscripción

| Nivel | Funcionalidad | Precio Mensual (MXN) | Ideal Para |
|-------|---------------|---------------------|------------|
| **Básico** | 1 Entrenador, hasta 20 clientes, dashboard básico, generación auto de planes | $1,499 | Entrenadores independientes iniciando |
| **Profesional** | Hasta 5 entradores, hasta 100 clientes, analytics avanzados, APIs de wearables, e-commerce básico | $3,499 | Gimnasios pequeños |
| **Enterprise** | Multi-sucursal, clientes ilimitados, white-label, webhooks, integración POS, soporte prioritario | $7,999 | Cadenas de gyms |

#### monetize E-Commerce (Comisión sobre Productos)

| Canal | Comisión | Flujo |
|-------|----------|-------|
| Suplementos (integración major brand) | 8-12% | El cliente compra → el gym/entrenador recibe comisión |
| Merchandising gym | 0% (usa plataforma del gym) | N/A |
| Planes extra (nutrición personalizada) | 15% | El trainer ofrece servicio adicional |

**Fallback:** Si el pago falla (stripe decline), el sistema mantiene el plan actual por 3 días, marca al cliente como "en riesgo" y alerta al trainer. No se corta el servicio inmediatamente para permitir resolución.

---

## 2. Motor de Memoria Persistente (Estado del Cliente)

### 2.1 Esquema JSON (Documentos NoSQL)

El cliente es un documento vivo que evoluciona cada semana. Se actualiza mediante el flujo de check-in.

```json
{
  "_id": "ObjectId",
  "client_id": "uuid-v4",
  "tenant_id": "gym-uuid o trainer-uuid",
  "current_state": {
    "week": 4,
    "start_date": "2026-03-09",
    "peso": 78.5,
    "peso_change": -0.5,
    "tdee_calculated": 2450,
    "tdee_adjusted": 2200,
    " Adherencia": 0.90,
    "fatiga_percibida": 7,
    "dolor_muscular": 3,
    "horas_sueño": 6.5,
    "check_in_completed": "2026-04-02",
    "flags": ["estancamiento_peso", "alta_fatiga"]
  },
  "historical_weeks": [
    {
      "week": 1,
      "peso": 80.0,
      " Adherencia": 0.95,
      "fatiga_percibida": 4,
      "tdee_adjusted": 2400,
      "difficulty_rating": 6,
      "notes": "Inicio fuerte, sin complicaciones"
    },
    {
      "week": 2,
      "peso": 79.5,
      " Adherencia": 0.88,
      "fatiga_percibida": 5,
      "tdee_adjusted": 2350,
      "difficulty_rating": 7,
      "notes": "Ligera fatiga en tren inferior"
    },
    {
      "week": 3,
      "peso": 79.0,
      " Adherencia": 0.85,
      "fatiga_percibida": 6,
      "tdee_adjusted": 2300,
      "difficulty_rating": 7,
      "notes": "Introdujo cardio HIIT dos veces"
    }
  ],
  "exercise_history": {
    "current_block": {
      "type": "Upper/Lower",
      "week_on_block": 4,
      "total_weeks": 8,
      "split": ["Upper A", "Lower A", "Upper B", "Lower B", "Rest"],
      "progression": "linear_hypertrophy"
    },
    "past_blocks": [
      {
        "type": "PPL",
        "weeks": [1, 2, 3],
        "avg Adherencia": 0.91,
        "failed_patterns": ["pull_day", "legs_day"]
      }
    ],
    "max_estimates": {
      "squat": 95,
      "bench": 75,
      "deadlift": 110,
      "ohp": 45
    }
  },
  "nutrition_state": {
    "method": "mifflin_stJeor",
    "calories": 2200,
    "protein_g_kg": 1.8,
    "protein_total": 140,
    "fat_percentage": 0.25,
    "carbs_remaining": 220,
    "cultural_adaptation": {
      "region": "mexico",
      "foods_included": ["tortilla", "frijoles", "pollo", "arroz blanco"],
      "foods_avoided": ["lactosa"],
      "restriction_notes": "Intolerancia a lactosa"
    },
    "meal_structure": {
      "breakfast": "600kcal",
      "lunch": "700kcal",
      "snack_1": "200kcal",
      "dinner": "600kcal",
      "post_workout": "200kcal"
    }
  },
  "supplementation": {
    "active": [
      {
        "name": "creatine_monohydrate",
        "dose": "5g",
        "timing": "post_workout",
        "start_week": 1,
        "evidence_level": "high",
        "notes": "Considerar para fuerza y recuperación"
      },
      {
        "name": "caffeine",
        "dose": "100mg",
        "timing": "pre_workout",
        "start_week": 2,
        "evidence_level": "moderate",
        "notes": "Solo días de entrenamiento"
      }
    ],
    "recommended_but_deferred": [
      {
        "name": "whey_protein",
        "reason": "protein_intake_below_target",
        "dose": "25g",
        "start_when": " Adherencia > 0.80"
      }
    ]
  },
  "engagement": {
    "streak_current": 3,
    "streak_longest": 12,
    "check_in_missed_count": 0,
    "last_alert_sent": "2026-03-30",
    "abandono_probability": 0.05,
    "nps_score": null
  },
  "metadata": {
    "created_at": "2026-02-24",
    "updated_at": "2026-04-02",
    "trainer_id": "trainer-uuid",
    "source": "app_mobile",
    "version": "4"
  }
}
```

### 2.2 Plantilla Markdown (Registro del Entrenador)

Esta es la plantilla legible que el trainer revisa cada semana:

```markdown
### Semana 4 - Juan Pérez | Peso: 78.5kg (-0.5) | Adherencia: 90%

** estado Actual**
- Peso: 78.5 kg (cambio: -0.5 kg)
- TDEE: 2,200 kcal (ajustado por inactividad)
- Fatiga percibida: 7/10 (Alta)
- Sueño: 6.5 hrs (subóptimo)

** Métricas de Fuerza Estimadas**
- Squat: 95 kg | Bench: 75 kg | Deadlift: 110 kg | Press: 45 kg

** Bloque Actual: Upper/Lower (Semana 4/8)**

**Historial Semanal**

| Semana | Peso | Adherencia | Fatiga | Ajuste Realizado |
|--------|------|------------|-------|-----------------|
| 1 | 80.0 | 95% | 4 | Ninguno (línea base) |
| 2 | 79.5 | 88% | 5 | Redujo volumen -10% |
| 3 | 79.0 | 85% | 6 | Agregó cardio HIIT |
| 4 | 78.5 | 90% | 7 | **Reducción tren inferior** |
| 5 | - | - | - | Programado: Deload |

** Flags Activos**
⚠️ Estancamiento de peso (2 sem)
⚠️ Fatiga acumulada alta

** Recomendación Nutricional**
- Calorías: 2,200 kcal (mantener)
- Proteína: 140g (1.8g/kg)
- Adaptación cultural: Incluir tortilla + frijoles (maíz)
- Evitar: Lactosa

** Suplementación Activa**
- Creatina: 5g post-workout ✅
- Cafeína: 100mg pre-workout ✅

** Notas del Sistema**
> La fatiga acumulada sugiere estancamiento. Reducir volumen en tren inferior 
> y programar deload en semana 5. Entrenador debe revisar si el cliente 
> esta alimentando más de lo reportado.

**Acciones Recomendadas**
1. [ ] Confirmar deload semana 5
2. [ ] Revisar horas de sueño (objetivo: 7-8 hrs)
3. [ ] Considérar reducción de estrés laboral si aplica
```

### 2.3 Fallbacks (Manejo de Ambigüedad)

| Escenario | Fallback |
|-----------|----------|
| Cliente no reporta peso | Mantener plan actual, marcar `peso: null`, flag `data_incomplete`, alertar al trainer |
| Cliente no responde check-in | Enviar recordatorio 24h, si no hay respuesta > marcar `abandono_risk += 0.2`, notificar trainer |
| Datos de entrenamiento corruptos | Usar último snapshot válido, recomputar con línea base, loggear incidente |
|Primera vez sin historial | Usar valores por defecto: Adherencia=0.75, Fatiga=5, TDEE=mifflin con sedentary multiplier |
| Scraper wearables falla | Ignorar datos del wearable, usar check-in manual únicamente, no bloquear flujo |
| Trainer inactivo > 7 días | Escalar a admin del gym, reasignar clientes temporalmente si es necesario |

---

## 3. Motor Autónomo de Entrenamiento y Nutrición

### 3.1 Algoritmo de Generación de Entrenamiento

#### Fase 1: Clasificación Inicial

```
Entradas:
- objetivo: [fuerza | hipertrofia | rendimiento | perdida_grasa | recomposition]
- experiencia: [principiante | intermedio | avanzado]
- dias_disponibles: [2-7]
- equipamiento: [gimnasio | casa_minimal | bandas_elasticas]
- limitaciones: [lista de lesiones]

Lógica:
1. Si principiante → programa full-body, 3 días/semana, linear progression
2. Si intermedio → Upper/Lower o PPL, 4-5 días, periodización ondulante
3. Si avanzado → depending de objetivo, periodización bloque, 4-6 días
```

#### Fase 2: Periodización y Progresión

| Objetivo | Periodización | Progresión Semanal | Duración Bloque |
|----------|----------------|--------------------|-----------------|
| Fuerza | Linear | +2.5-5kg | 4-6 sem |
| Hipertrofia | Undulating | +1-2kg o +1 rep | 4-8 sem |
| Rendimiento | Concurrent | Variada | 4-8 sem |
| Pérdida grasa | RPE-based | Mantener carga, ↓ volumen | 6-12 sem |

```python
# Pseudocódigo: Generación de split semanal
def generate_split(dias_disponibles, objetivo):
    split_map = {
        2: ["Full Body A", "Full Body B"],
        3: ["Full Body", "Push", "Pull"],
        4: ["Upper", "Lower", "Upper", "Lower"],
        5: ["Push", "Pull", "Legs", "Upper", "Lower"],
        6: ["Push", "Pull", "Legs", "Push", "Pull", "Legs"],
        7: ["Push", "Pull", "Legs", "Upper", "Lower", "Cardio", "Rest"]
    }
    return split_map.get(dias_disponibles, ["Upper", "Lower"])
```

#### Fase 3: Adaptación Dinámica (Post-Check-In)

```python
def adaptar_semana(nuevo_check_in, semana_actual):
    if semana_actual.fatiga > 7 and semana_actual.adherencia > 0.85:
        # Reducir volumen 15-20%
        semana_actual.volume_multiplier = 0.80
        return "Reducción de volumen aplicada"
    
    elif semana_actual.adherencia < 0.60:
        # Reducir dificultad 20%
        semana_actual.difficulty_multiplier = 0.80
        return "Dificultad reducida, foco en adherencia"
    
    elif semana_actual.estancamiento_flag and semana_actual.adherencia > 0.80:
        # Cambiar split o método
        return cambio_split()
    
    elif nuevo_check_in.fatiga > 8:
        return deload_triggered()
    
    return "Sin cambios necesarios"
```

### 3.2 Algoritmo de Nutrición con Adaptación Cultural 80/20

#### Regla 80/20 Explicada

> **80% Estructura Científica Base:** Calculada mediante fórmulas validadas
> **20% Adaptación Cultural:** Ajustes por gastronomía local, disponibilidad y preferencias

**Fórmulas Bases:**

```
TDEE = BMR × Factor_Actividad

# Mifflin-St Jeor (más precisa para población general)
BMR_hombre = 10 × peso_kg + 6.25 × altura_cm - 5 × edad + 5
BMR_mujer = 10 × peso_kg + 6.25 × altura_cm - 5 × edad - 161

# Katch-McArdle (si se conoce porcentaje de grasa)
BMR = 370 + (21.6 × Lean_Body_Mass_kg)

Factor_Actividad:
- Sedentario: 1.2
- Ligero (1-3 días): 1.375
- Moderado (3-5 días): 1.55
- Activo (6-7 días): 1.725
- Atleta: 1.9

# Ajuste por objetivo
- Mantenimiento: + 0 kcal
- Pérdida grasa: -300 a -500 kcal
- Hipertrofia: +200 a +300 kcal
- Recomposición: -100 a +100 kcal (user-dependent)
```

**Estructura de Macros (Recomendada):**

| Objetivo | Proteína | Grasa | Carbohidratos |
|----------|----------|-------|----------------|
| Pérdida grasa | 1.8-2.2 g/kg | 25-30% | Resto |
| Mantenimiento | 1.6-1.8 g/kg | 25-30% | Resto |
| Hipertrofia | 1.6-1.8 g/kg | 20-25% | Resto |

#### Adaptación Cultural - Ejemplo México

```python
cultural_food_mapping = {
    "mexico": {
        "base_protein_sources": ["pollo", "res", "pescado", "huevo", "frijoles"],
        "carb_sources": ["tortilla", "arroz", "frijoles", "papa", "pan"],
        "fat_sources": ["aguacate", "aceite_oliva", "mantequilla", "nuez"],
        "meal_templates": {
            "desayuno": {
                "option_a": "Huevos + tortilla + frijoles + aguacate",
                "option_b": "Oatmeal + fruta + nueces",
                "option_c": "Yogur + granola + miel"
            },
            "almuerzo": {
                "option_a": "Pollo/Res + arroz + frijoles + ensalada",
                "option_b": "Sopa de tortilla + pozole bajo grasa",
                "option_c": "Ensalada proteica + pan integral"
            },
            "cena": {
                "option_a": "Pescado + verduras + tortilla",
                "option_b": "Huevo + frijoles + ensalada",
                "option_c": "Pollo + arroz + aguacate"
            }
        },
        "avoid": ["lactosa" if user.intolerant],  # Conditional
        "notes": "Tortilla de maíz > tortilla de harina. Frijoles negros=mejor perfil proteico."
    }
}

# Generación de plan semanal
def generate_meal_plan(kcal_target, protein_target, region):
    # 80% de macros = estructura científica
    # 20% = ajustar por fuentes culturales disponibles
    meals = []
    for day in range(7):
        meal = select_cultural_meal_template(region, kcal_per_meal)
        meals.append(adjust_macros(meal, kcal_target, protein_target))
    return meals
```

**Extensibilidad:** Agregar más regiones es simple:

```python
# Agregar nueva región:
cultural_food_mapping["argentina"] = {
    "base_protein_sources": ["carne", "pollo", "huevo", "pescado"],
    "carb_sources": ["pan", "arroz", "pasta", "pure"],
    "meal_templates": {...}
}
```

### 3.3 Suplementación Basada en Evidencia

**Matriz de Suplementos:**

| Suplemento | Evidencia | Dosis | Timing | Condición |
|-----------|-----------|-------|--------|------------|
| Creatina monohidratada | ⭐⭐⭐ Alta | 5g | Post-workout o con comida | Siempre recomendado si no hay contraindicación |
| Cafeína | ⭐⭐⭐ Alta | 3-6 mg/kg | 30-60 min pre-workout | Energía baja |
| Proteína whey | ⭐⭐ Media | 20-40g | Post-workout o entre comidas | Proteína diet < 1.6g/kg |
| Vit D | ⭐⭐ Media | 1000-4000 IU | Con grasa | Si niveles bajos (análisis de sangre) |
| Omega-3 | ⭐⭐ Media | 1-3g EPA+DHA | Con comida | Si pescado < 2x/semana |
| Magnesio | ⭐⭐ Media | 200-400mg | Antes de dormir | Calambres, sueño pobre |
| Beta-alanina | ⭐ Media | 3-5g | Repartido | Entrenamiento de alta rep |
| multivitamínico | ⭐ Baja | 1 tab | Desayuno | Solo si deficiencia verificada |

**Lógica de Recomendación:**

```python
def recommend_supplements(user_profile):
    recommendations = []
    
    # Siempre: Creatina (alta evidencia, bajo costo)
    if not user_profile.health_contraindications:
        recommendations.append("creatine_monohydrate:5g")
    
    # Evaluación por condición
    if user_profile.protein_intake_g_kg < 1.6:
        recommendations.append("whey_protein:25-40g")
    
    if user_profile.caffeine_sensitivity == False and user_profile.energy_level < 5:
        recommendations.append(f"caffeine:{user_profile.weight_kg * 3}mg")
    
    # Solo si hay análisis de sangre:
    if user_profile.blood_test.vitamin_d < 30:
        recommendations.append("vitamin_d:2000IU")
    
    return recommendations
```

**Fallback Suplementación:** Si el trainer no aprueba suplementos, el sistema no los muestra en el plan del cliente. El flag `supplements_approved_by_trainer` debe ser `true`.

---

## 4. Reglas de Decisión Automática (If-Then-Else)

El Motor de Decisiones evalúa cada check-in semanal y ejecuta acciones basadas en reglas predefinidas.

### 4.1 Regla 1: Estancamiento de Peso

```yaml
SI:
  - peso_actual == peso_2_semanas_atras (diferencia < 0.5kg)
  - adherencia > 0.85
ENTONCES:
  - recalcular_tdee(-200 kcal)
  - actualizar_json("tdee_adjusted": nuevo_valor)
  - marcar_flag("estancamiento_peso")
  - notificar_trainer("Considerar cambio de programa o revisar metabolismo")
  - si stagnation > 4 sem: sugerir cambio de bloque periodización
```

### 4.2 Regla 2: Fatiga Acumulada Alta

```yaml
SI:
  - fatiga_percibida >= 7 por 2+ semanas
  - adherencia > 0.70
ENTONCES:
  - reducir_volumen(15-20%)
  - activar_delayed_week(en_semana_actual + 1)
  - actualizar_json("current_block.deload_scheduled": true)
  - notificar_trainer("Alta fatiga: Deload programado para semana próxima")
  - si fatiga > 8: forzar deload inmediato
```

### 4.3 Regla 3: Adherencia Baja (Riesgo de Abandono)

```yaml
SI:
  - adherencia < 0.60 en semana_actual
  - check_in_completed == true
ENTONCES:
  - reducir_dificultad_programa(20%)
  - simplificar_split(a menos días o más simple)
  - actualizar_json("program_difficulty": "reduced")
  - notificar_trainer("Adherencia baja: Programa simplificado ¿Contactar cliente?")
  - marcar alerta_en_app("Foco en construir hábito, no en intensidad")
```

### 4.4 Regla 4: Sobreentrenamiento Detectado

```yaml
SI:
  - fatiga >= 8
  - rendimiento_ejercicio_drop > 15% (comparado con 3 sem atrás)
  - horas_sueño < 6
ENTONCES:
  - trigger_delayed_inmediato()
  - forzar_descanso(2-3 días)
  - notificar_trainer("Posible sobreentrenamiento: Revisar carga de estrés")
  - marcar_flag("overreaching")
  - si recover > 3 sem: escalas a "abandono_risk += 0.3"
```

### 4.5 Regla 5: Progresión Exitosa - Escalar Carga

```yaml
SI:
  - adherencia > 0.90
  - fatiga < 5
  - weight_estable_o_aumentando (si hipertrofia)
  - semana en bloque >= 4
ENTONCES:
  - aumentar_carga(5-10%)
  - mantener_misma_periodización
  - actualizar_json("max_estimates" incremented)
  - congratulate_client("¡Progresando! Has completado X semanas")
  - siblock_complete: предложить next_block_optimizado
```

### 4.6 Regla 6: Datos Incompletos (Fallback Automático)

```yaml
SI:
  - check_in_fields_missing > 2
  - peso == null
  O:
  - check_in_not_completed en 48h
ENTONCES:
  - mantener_plan_anterior(sin cambios)
  - marcar_flag("data_incomplete")
  - enviar_reminder_push_notification
  - si no responde en 72h: notificar_trainer("Cliente no completó check-in")
  - si no responde en > 1 sem: abandon_risk += 0.2
```

### 4.7 Regla 7: Revisión Nutricional Automática

```yaml
SI:
  - peso_estancado >= 3 semanas
  - adherencia_nutricional < 0.70 (reportado por cliente)
ENTONCES:
  - verificar_tdee_actual vs required
  - si difference > 300: ajustar_calorías(-200 o +200)
  - recalcular_macros
  - notificar_trainer("Evaluar adherencia nutricional: ¿Comunicar con cliente?")
  - si culture_issues: ofrecer alternative_meal_templates
```

---

## 5. Interfaz, Métricas y Adherencia

### 5.1 Dashboard del Entrenador (Vista Principal)

```
┌─────────────────────────────────────────────────────────────────┐
│  ENTRENADOR: Carlos Mendoza                      Gym: FitZone  │
│  Dashboard: Hoy (2026-04-03)                    Clientes: 12  │
├─────────────────────────────────────────────────────────────────┤
│                                                              │
│  ALERTAS URGENTES (3)                                          │
│  ⚠️ Juan Pérez - Alta fatiga 2 sem (Llamar)                    │
│  ⚠️ María García - Check-in pendiente 48h                    │
│  ⚠️ Roberto Lee - Estancamiento 4 sem                        │
│                                                              │
├──────────────────────┬──────────────────────┬─────────────────┤
│ CLIENTES ACTIVOS: 12 │ PROMEDIO ADHERENCIA │ PROGRESIÓN     │
│ [████████████░░░░]   │        84%         │ +2.1kg media  │
│  10 de 12 responden  │  ▲3% vs mes ant    │ fuerza: +5kg  │
├──────────────────────┴──────────────────────┴─────────────────┤
│                                                              │
│  PROGRESO COLECTIVO                                           │
│  ▼ Pesos por cliente (media semanal)                        │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │
│  │▓▓│ │▓▓│ │▓░│ │▓▓│ │▓░│ │▓▓│ │▓▓│ │▓░│ │▓▓│ │▓░│  │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘  │
│  Sem1   Sem2   Sem3   Sem4   Sem5   Sem6   Sem7   Sem8   Sem9   │
│  Meta: -0.5kg/sem                                             │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  PRÓXIMOS CHECK-IN                                            │
│  [Ver lista completa →]                                      │
│  • Ana López - Hoy                                            │
│  • Luis M. - Mañana                                         │
│  • Carla R. - Viernes                                        │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Dashboard del Cliente (App Móvil/Web)

```
┌─────────────────────────────────────────────────────────────────┐
│                   ¡Buenos días, Juan!                           │
│              Semana 4/8 - Upper/Lower                        │
├─────────────────────────────────────────────────────────────────┤
│  PROGRESO                                      ESTADO ACTUAL  │
│  ████████████░░░░░░░░░░░░░ 60%                ░░░░░░░░░░░░░  │
│  Meta: -8kg                    Peso: 78.5kg (-0.5 esta sem) │
├─────────────────────────────────────────────────────────────────┤
│                                                              │
│  HOY: Entrenamiento - Tren Superior                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  [A] Press Banca          4×10    65kg → 70kg ✓        │ │
│  │  [B] Remo con barra       4×10    55kg → 60kg ✓        │ │
│  │  [C] Dominadas           4xAMRAP → +2 rep             │ │
│  │  [D] Press militar       3×12    35kg → 40kg          │ │
│  │  [E] Curl bíceps         3×15    15kg                 │ │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  [Iniciar Entrenamiento]                                    │
│                                                              │
├─────────────────────────────────────────────────────────────────┤
│  NUTRICIÓN                                    [Editar →]    │
│  2,200 kcal | 140g proteína | 25% grasa                      │
│  ☑ Desayuno (600)  ☑ Almuerzo (700)  ☐ Cena (600)           │
├─────────────────────────────────────────────────────────────────┤
│  ESTREAK: 3 semanas                      🔥 Racha actual   │
│  Mejor racha: 12 semanas                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Métricas de Fuerza (Progresión)

```
┌─────────────────────────────────────────────────────────────────┐
│                   PROGRESIÓN DE FUERZA                           │
│  Estimados RM (1 Rep Max)                                        │
├─────────────���─���─────────────────────────────────────────────────┤
│  Sentadilla         ██████████████████████        95kg (+15kg)    │
│  Press Banca       ██████████████████             75kg (+10kg)    │
│  Peso Muerto       █████████████████████████    110kg (+20kg)   │
│  Press Militar    ████████████                     45kg (+5kg)  │
├─────────────────────────────────────────────────────────────────┤
│  Evolución Semanal                                              │
│  Semana 1: 80/65/90/40                                          │
│  Semana 2: 85/70/100/40 (+5/+5/+10/+0)                          │
│  Semana 3: 90/70/105/45 (+5/+0/+5/+5)                           │
│  Semana 4: 95/75/110/45 (+5/+5/+5/+0)                           │
│  Meta próxima: 100/80/120/50                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Sistema de Retención y Gamificación

#### Tipos de Alertas

| Tipo | Trigger | Canal | Mensaje | Acción |
|------|---------|-------|---------|--------|
| **Info** | Check-in completado | Push | "¡Buen trabajo esta semana!" | Ninguna |
| **Warning** | Adherencia < 70% | Push + Email | "Tu adherencia está bajando. ¿Todo bien?" | Botón "Necesito ayuda" |
| **Critical** | Abandono risk > 0.6 | Push + Email + SMS | "Teextrañamos. Tu plan está listo cuando regreses." | Call-to-action "Regresar" |
| **Celebration** | Racha +4 sem | Push | "¡4 semanas! Estáscrack." | Compartir en redes (opcional) |
| **Milestone** | Meta alcanzada | Push + Email | "¡Felicidades! Has perdido 5kg." | Badge解锁ado |

#### Lógica de Gamificación

```python
# Sistema de badges y rewards
badges = {
    "first_week": {"condition": "semana_1_completada", "name": "Iniciando el viaje"},
    "streak_4": {"condition": "semanas_consecutivas >= 4", "name": "Consistente"},
    "streak_12": {"condition": "semanas_consecutivas >= 12", "name": "Dedición de hierro"},
    "meta_peso_5": {"condition": "peso_perdido >= 5", "name": "Transformación: 5kg"},
    "meta_peso_10": {"condition": "peso_perdido >= 10", "name": "Transformación: 10kg"},
    "fuerza_primer_1rm": {"condition": "primera_rm_alcanzada", "name": "Primero de muchos"},
    "adherencia_100": {"condition": "semana_100_adherencia", "name": "Perfecto"}
}

# Sistema de niveles
def calculate_level(semanas, adherencia_promedio):
    base = semanas * adherencia_promedio
    if base < 10: return "Principiante"
    elif base < 30: return "Intermedio"
    elif base < 60: return "Avanzado"
    elif base < 100: return "Elite"
    else: return "Atleta"
```

#### Predicción de Abandono (Modelo Simplificado)

```python
# Scoring de abandono (0 = no va a abandonar, 1 = va a abandonar)
# Variables que увеличивают riesgo:
# - check_in_missed: +0.2 por miss
# - adherencia_baja: -0.1 por cada 10% bajo 0.8
# - fatiga_alta: +0.1 si > 7
# - dias_sin_entrenar: +0.15 por cada día > 3
# - streak_roto: +0.3 si рата previous streak > 4

def abandono_probability(client):
    riesgo = 0.0
    riesgo += client.missed_check_ins * 0.2
    riesgo += max(0, 0.8 - client.adherencia) * 0.1
    riesgo += max(0, client.fatiga - 7) * 0.1
    if client.days_since_workout > 3:
        riesgo += (client.days_since_workout - 3) * 0.15
    if client.streak_broken and client.previous_streak > 4:
        riesgo += 0.3
    return min(1.0, max(0.0, riesgo))
```

### 5.5 Alertas al Entrenador (Resumen Diario)

```markdown
### Resumen Diario: Gimnasio FitZone - 3 de Abril

**Clientes con Acciones Requeridas:**

| Cliente | Sem | Estado | Acción Requerida |
|---------|-----|--------|------------------|
| Juan Pérez | 4 | ⚠️ Fatiga alta | Llamar para evaluar |
| María García | 4 | ⏳ Check-in pendiente | Enviar recordatorio |
| Roberto Lee | 4 | ⚠️ Estancado 4 sem | Revisar programa |
| Ana López | 1 | ✅ Check-in completado | Ninguna |
| Luis M. | 2 | ✅ En vía | Ninguna |

**Métricas del Día:**
- Check-in completados: 8/12 (67%)
- Clientes en riesgo: 2 (16%)
- Promedio adherencia grupo: 84%
- Meta peso grupo: -4kg semana

**Acciones Rápidas:**
- [ ] Enviar recordatorio masivo
- [ ] Programar llamadas de seguimiento
- [ ] Exportar reporte semanal
- [ ] Agregar nuevo cliente
```

---

## Apéndice: Consideraciones de Infraestructura

### Base de Datos

- **MongoDB** o **Amazon DocumentDB** para documentos de cliente (estado vivo)
- **Redis** para caché de sesiones y coordenadas de scoring
- **PostgreSQL** para datos transaccionales (facturación, usuarios, auth)

### API y Webhooks

```
Endpoints principales:
- POST /api/v1/clients/{id}/check-in
- GET /api/v1/clients/{id}/plan
- POST /api/v1/clients/{id}/workout/complete
- GET /api/v1/trainers/dashboard
- POST /api/v1/webhooks/wearables (Fitbit, Garmin, Apple Health)

Webhooks disponibles:
- client.check_in.completed
- client.plan.adapted
- client.abandono_risk.increased
- client.milestone.reached
```

### Integraciones Futuras

- Wearables: Fitbit, Garmin, Apple Watch, Whoop
- Calendario: Google Calendar, Outlook
- WhatsApp: Business API para notificaciones
- Stripe: Suscripciones y pagos

---

## Historial de Versiones

| Versión | Fecha |Cambios |
|--------|-------|---------|
| 1.0 | 2026-04-03 | Primera versión arsitekturcomplete |

** fin del documento**