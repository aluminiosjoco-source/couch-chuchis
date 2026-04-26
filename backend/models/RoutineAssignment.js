const mongoose = require('mongoose');

const routineAssignmentSchema = new mongoose.Schema({
  client_id: { type: String, required: true },
  routine_id: { type: String, required: true },
  week_assigned: { type: Number, required: true },
  activa: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('RoutineAssignment', routineAssignmentSchema);
