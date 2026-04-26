const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Modelo de Usuario Global (colección maestra de autenticación - NO es tenant).
 * Almacenado en la DB global: couch_chuchis_global
 * Los roles determinan el acceso a los datos de los tenants.
 */
const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  rol: {
    type: String,
    enum: ['super_admin', 'gym_owner', 'trainer', 'client'],
    required: true,
    default: 'client',
  },
  // Para trainers y clients: referencia al gym al que pertenecen
  gym_id: { type: String, default: null }, // null = super_admin sin tenant
  // Para clients: referencia al trainer asignado (dentro del tenant)
  trainer_id: { type: String, default: null },
  // Control de suscripción
  subscription: {
    plan: { type: String, enum: ['basico', 'profesional', 'enterprise', null], default: null },
    status: { type: String, enum: ['active', 'inactive', 'trial', 'past_due'], default: 'trial' },
    stripe_customer_id: { type: String, default: null },
    stripe_subscription_id: { type: String, default: null },
    trial_ends_at: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }, // 14 días trial
    current_period_end: { type: Date, default: null },
  },
  // Estado de cuenta
  is_active: { type: Boolean, default: true },
  email_verified: { type: Boolean, default: false },
  last_login: { type: Date, default: null },
  reset_password_token: { type: String, default: null },
  reset_password_expires: { type: Date, default: null },
}, { timestamps: true });

// Hash de contraseña antes de guardar
userSchema.pre('save', async function () {
  if (!this.isModified('password_hash')) return;
  this.password_hash = await bcrypt.hash(this.password_hash, 12);
});

// Método para verificar contraseña
userSchema.methods.verifyPassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password_hash);
};

// No exponer el hash en respuestas JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password_hash;
  delete obj.reset_password_token;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
