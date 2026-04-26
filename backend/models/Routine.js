const mongoose = require('mongoose');

const debateMsgSchema = new mongoose.Schema({
  autor: { type: String, enum: ['coach', 'agente'], required: true },
  mensaje: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const routineSchema = new mongoose.Schema({
  // Quién/qué generó la rutina
  tipo: {
    type: String,
    enum: ['ia_pura', 'cliente_nuevo', 'sin_cliente', 'propuesta_coach'],
    required: true,
  },
  estado: {
    type: String,
    enum: ['propuesta', 'en_debate', 'aprobada', 'activa', 'reemplazada', 'archivada'],
    default: 'propuesta',
  },

  // Contexto
  trainer_id: { type: String, required: true },
  client_id: { type: String, default: null }, // null = sin_cliente
  tenant_id: { type: String },
  version: { type: Number, default: 1 },

  // Perfil usado para generar (snapshot en el momento de creación)
  perfil_snapshot: {
    objetivo: String,
    experiencia: String,
    edad: Number,
    peso: Number,
    porcentaje_grasa: Number,
    dias_disponibles: Number,
    equipamiento: String,
    limitaciones: [String],
    fatiga_percibida: Number,
    adherencia: Number,
    max_estimates: Object,
  },

  // Plan generado (JSON del workoutAgent)
  plan: { type: Object, default: null },

  // Plan nutricional (JSON del nutritionAgent, opcional)
  nutrition_plan: { type: Object, default: null },

  // Chat de debate coach-agente
  debate_log: { type: [debateMsgSchema], default: [] },

  // Nota del entrenador al aprobar
  notas_aprobacion: { type: String, default: '' },

  // Semana en la que fue activada
  semana_activacion: { type: Number, default: null },

}, { timestamps: true });

module.exports = mongoose.model('Routine', routineSchema);
