const express = require('express');
const router = express.Router();
const agentsController = require('../controllers/agentsController');
const { authenticate, isTrainer } = require('../middleware/authMiddleware');
const routineController = require('../controllers/routineController');

// Todos los endpoints de agentes requieren autenticación como mínimo Trainer
router.post('/workout', authenticate, isTrainer, agentsController.generateWorkout);
router.post('/nutrition', authenticate, isTrainer, agentsController.generateNutrition);
router.post('/engagement', authenticate, isTrainer, agentsController.generateEngagement);
router.post('/social', authenticate, isTrainer, agentsController.generateSocial);

// Rutinas especializadas
router.post('/routine/new-client', authenticate, isTrainer, routineController.createRoutineNewClient);
router.post('/routine/existing/:id', authenticate, isTrainer, routineController.createRoutineExisting);
router.post('/routine/anonymous', authenticate, isTrainer, routineController.createRoutineAnonymous);
router.post('/routine/coach-draft', authenticate, isTrainer, routineController.createRoutineCoachDraft);
router.post('/routine/:id/debate', authenticate, isTrainer, routineController.debateRoutine);
router.post('/routine/:id/approve', authenticate, isTrainer, routineController.approveRoutine);

module.exports = router;
