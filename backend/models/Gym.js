const mongoose = require('mongoose');

/**
 * Modelo de Gym (Tenant).
 * Actúa como directorio global de gimnasios registrados en la plataforma.
 * Los datos operativos del gym (clientes, rutinas, etc.) viven en su propia DB tenant.
 */
const gymSchema = new mongoose.Schema({
  gym_id: { type: String, required: true, unique: true }, // ID slug: 'fitzone-monterrey'
  nombre: { type: String, required: true, trim: true },
  owner_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Información del negocio
  info: {
    direccion: { type: String, default: '' },
    ciudad: { type: String, default: '' },
    pais: { type: String, default: 'Mexico' },
    telefono: { type: String, default: '' },
    logo_url: { type: String, default: null },
    website: { type: String, default: null },
  },
  // Suscripción y límites del plan
  plan: {
    tipo: { type: String, enum: ['basico', 'profesional', 'enterprise'], default: 'basico' },
    max_entrenadores: { type: Number, default: 1 },
    max_clientes: { type: Number, default: 20 },
    white_label: { type: Boolean, default: false },
    stripe_subscription_id: { type: String, default: null },
    status: { type: String, enum: ['active', 'inactive', 'trial', 'past_due'], default: 'trial' },
    trial_ends_at: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  },
  // Configuración del motor de decisiones
  config: {
    check_in_dia: { type: String, enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'], default: 'lunes' },
    region_cultural: { type: String, default: 'mexico' },
    notificaciones_activas: { type: Boolean, default: true },
    suplementos_requieren_aprobacion: { type: Boolean, default: true },
    ollama_model: { type: String, default: 'llama3' }, // Modelo de IA a usar para este tenant
  },
  // Métricas agregadas (actualizadas periódicamente)
  metricas: {
    total_entrenadores: { type: Number, default: 0 },
    total_clientes: { type: Number, default: 0 },
    adherencia_promedio: { type: Number, default: 0 },
    check_ins_este_mes: { type: Number, default: 0 },
  },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Gym', gymSchema);
