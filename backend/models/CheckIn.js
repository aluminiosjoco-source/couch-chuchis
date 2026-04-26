const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  client_id: { type: String, required: true },
  week: { type: Number, required: true },
  peso: { type: Number, required: true },
  adherencia: { type: Number, required: true, min: 0, max: 1 },
  fatiga: { type: Number, required: true, min: 1, max: 10 },
  sueno: { type: Number, required: true, min: 0, max: 24 },
  entrenamientos_realizados: { type: Number, required: true, default: 0 },
  notas: { type: String, default: '' },
  tipo: { type: String, enum: ['manual', 'obligatorio'], default: 'obligatorio' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('CheckIn', checkInSchema);
