const mongoose = require('mongoose');

const nutritionPlanSchema = new mongoose.Schema({
  client_id: { type: String, required: true },
  calorias: { type: Number, required: true },
  proteina: { type: Number, required: true },
  grasas: { type: Number, required: true },
  carbs: { type: Number, required: true },
  version: { type: Number, default: 1 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('NutritionPlan', nutritionPlanSchema);
