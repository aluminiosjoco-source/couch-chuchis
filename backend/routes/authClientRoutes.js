const express = require('express');
const router = express.Router();
const authClientController = require('../controllers/authClientController');
const { authenticateClient } = require('../middleware/authClientMiddleware');

router.post('/register', authClientController.register);
router.post('/login', authClientController.login);
router.get('/me', authenticateClient, authClientController.getMe);

module.exports = router;
