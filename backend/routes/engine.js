const express = require('express');
const router = express.Router();
const engineController = require('../controllers/decisionEngine');

router.post('/v1/clients/:id/check-in', engineController.processCheckIn);
router.get('/v1/trainers/dashboard', engineController.getDashboardData);
router.get('/v1/clients/:id/plan', engineController.getClientPlan);

module.exports = router;
