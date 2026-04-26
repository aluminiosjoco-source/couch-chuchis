const mongoose = require('mongoose');

const clientProfileSchema = new mongoose.Schema({
  client_id: { type: String, required: true, unique: true }, // Referencia a Client
  
  // ── 1. DATOS GENERALES (Extendidos) ─────────────────────────────────────────
  objetivo: { 
    type: String, 
    enum: ['perdida_grasa', 'hipertrofia', 'recomposicion', 'rendimiento', 'fuerza', 'rehabilitacion', 'otro'],
    default: 'hipertrofia' 
  },
  peso_inicial: { type: Number },
  telefono: { type: String },
  ocupacion: { type: String },
  meta_especifica: { type: String },
  tiempo_objetivo: { type: String }, // ej: "3 meses"

  // ── 2. EXPERIENCIA Y DISPONIBILIDAD ────────────────────────────────────────
  experiencia: { 
    type: String, 
    enum: ['principiante', 'intermedio', 'avanzado'],
    default: 'principiante'
  },
  dias_disponibles: { type: Number, default: 4, min: 1, max: 7 },
  tiempo_sesion: { type: String }, // ej: "60 min"
  horario_preferido: { type: String }, // Mañana, Tarde, Noche

  // ── 3. SALUD Y LIMITACIONES ────────────────────────────────────────────────
  limitaciones: { type: [String], default: [] }, // Tags rápidos
  lesiones_pasadas: { type: String },
  dolor_frecuente: { type: String },
  condicion_medica: { type: String },

  // ── 4. ESTILO DE VIDA ──────────────────────────────────────────────────────
  estilo_vida: { 
    type: String, 
    enum: ['sedentario', 'activo', 'muy_activo'],
    default: 'sedentario'
  },
  horas_sueno: { type: String },
  nivel_estres: { 
    type: String, 
    enum: ['bajo', 'medio', 'alto'],
    default: 'medio'
  },

  // ── 5. ALIMENTACIÓN ────────────────────────────────────────────────────────
  comidas_dia: { type: Number, default: 3 },
  restricciones_alimentarias: { type: [String], default: [] },
  alcohol: { 
    type: String, 
    enum: ['no', 'ocasional', 'frecuente'],
    default: 'no'
  },

  // ── 6. EQUIPAMIENTO Y PREFERENCIAS ─────────────────────────────────────────
  equipamiento: { 
    type: String, 
    enum: ['gym', 'casa_minimal', 'bandas', 'sin_equipo'], 
    default: 'gym' 
  },
  tipo_entrenamiento_preferido: {
    type: String,
    enum: ['pesas', 'cardio', 'mixto', 'funcional'],
    default: 'pesas'
  },
  ejercicios_disgusto: { type: String },
  motivacion_principal: { type: String },
  nivel_compromiso: { 
    type: String, 
    enum: ['bajo', 'medio', 'alto'],
    default: 'medio'
  },

  // ── 7. MEDICIONES INICIALES ────────────────────────────────────────────────
  porcentaje_grasa_inicial: { type: Number },
  medida_cintura: { type: Number },
  medida_cadera: { type: Number },
  observaciones_posturales: { type: String },
  notas_entrenador: { type: String },

  region_cultural: { type: String, default: 'mexico' },

}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('ClientProfile', clientProfileSchema);
