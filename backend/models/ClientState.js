const mongoose = require('mongoose');

const clientStateSchema = new mongoose.Schema({
  client_id: { type: String, required: true },
  tenant_id: { type: String, required: true },
  profile_info: {
    name: String,
    email: String,
    objetivo: { type: String, default: 'hipertrofia' }, // fuerza | hipertrofia | perdida_grasa | recomposicion | rendimiento
    experiencia: { type: String, default: 'principiante' }, // nula | baja | media | avanzada | atleta
    edad: { type: Number, default: 25 },
    altura_cm: { type: Number, default: 170 },
    porcentaje_grasa: { type: Number, default: 20 },
    dias_disponibles: { type: Number, default: 4 },
    equipamiento: { type: String, default: 'gimnasio' }, // gimnasio | casa_minimal | bandas_elasticas | sin_equipo
    limitaciones: { type: [String], default: [] }, // lesiones o restricciones físicas
    region_cultural: { type: String, default: 'mexico' },
    restricciones_alimentarias: { type: [String], default: [] }, // lactosa, gluten, etc.
    alimentos_preferidos: { type: [String], default: [] },
  },
  current_state: {
    week: { type: Number, default: 1 },
    start_date: { type: Date, default: Date.now },
    peso: { type: Number, default: 80.0 },
    peso_change: { type: Number, default: 0 },
    tdee_calculated: { type: Number, default: 2400 },
    tdee_adjusted: { type: Number, default: 2400 },
    adherencia: { type: Number, default: 1.0 },
    fatiga_percibida: { type: Number, default: 5 },
    dolor_muscular: { type: Number, default: 3 },
    horas_sueno: { type: Number, default: 7 },
    check_in_completed: Date,
    flags: [String]
  },
  historical_weeks: Array,
  exercise_history: Object,
  nutrition_state: Object,
  engagement: Object,
  // Integración Hipotética con Wearable
  wearable_data: {
    last_synced: Date,
    avg_steps: { type: Number, default: 8000 },
    sleep_score: { type: Number, default: 85 },
    active_calories: { type: Number, default: 450 }
  }
}, { timestamps: true });

module.exports = mongoose.model('ClientState', clientStateSchema);
