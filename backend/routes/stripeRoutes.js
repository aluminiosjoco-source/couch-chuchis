const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');
const { authenticate, isGymOwner } = require('../middleware/authMiddleware');

// Público - ver planes disponibles
router.get('/planes', stripeController.getPlanes);

// Protegido - crear checkout
router.post('/checkout', authenticate, stripeController.createCheckout);

// Estado de suscripción actual
router.get('/subscription', authenticate, stripeController.getSubscription);

// Webhook de Stripe: requiere body raw (configurado en server.js)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeController.handleWebhook);

module.exports = router;
