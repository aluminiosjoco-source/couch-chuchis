const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainerController');
const { authenticate, isGymOwner, isTrainer } = require('../middleware/authMiddleware');

// Listar entrenadores del gym (gym_owner ve todos, trainer se puede ver a sí mismo)
router.get('/', authenticate, isGymOwner, trainerController.getTrainers);

// Crear nuevo entrenador (solo gym_owner)
router.post('/', authenticate, isGymOwner, trainerController.createTrainer);

// Detalle de un entrenador con sus clientes
router.get('/:id', authenticate, isTrainer, trainerController.getTrainer);

// Editar datos de un entrenador
router.put('/:id', authenticate, isGymOwner, trainerController.updateTrainer);

// Desactivar entrenador (soft-delete) con opción de reasignar clientes
router.delete('/:id', authenticate, isGymOwner, trainerController.deleteTrainer);

module.exports = router;
