const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const checkInController = require('../controllers/checkInController');
const { authenticate, isGymOwner, isTrainer } = require('../middleware/authMiddleware');

// Listar clientes del trainer/gym autenticado
router.get('/', authenticate, isTrainer, clientController.getClients);

// Crear nuevo cliente + perfil fitness
router.post('/', authenticate, isTrainer, clientController.createClient);

// Detalle completo de un cliente (datos + estado motor + perfil fitness)
router.get('/:id', authenticate, isTrainer, clientController.getClientProfile);

// Editar datos básicos del cliente
router.put('/:id', authenticate, isTrainer, clientController.updateClient);

// Desactivar cliente (soft-delete) — solo gym_owner
router.delete('/:id', authenticate, isGymOwner, clientController.deleteClient);

// Editar perfil fitness del cliente
router.put('/:id/profile', authenticate, isTrainer, clientController.updateClientProfile);

// Reasignar cliente a otro trainer — solo gym_owner
router.put('/:id/assign', authenticate, isGymOwner, clientController.assignClient);

// Check-ins
router.post('/:id/checkin', authenticate, checkInController.createCheckIn);
router.get('/:id/checkins', authenticate, checkInController.getCheckIns);

// Rutinas del cliente
router.get('/:id/routines', authenticate, isTrainer, clientController.getClientRoutines);

module.exports = router;
