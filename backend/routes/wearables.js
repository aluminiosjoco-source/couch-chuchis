const express = require('express');
const router = express.Router();
const ClientState = require('../models/ClientState');

// Endpoint para simular webhook de Apple Health / Garmin
router.post('/wearables/sync', async (req, res) => {
  const { client_id, steps, sleep_score, active_calories } = req.body;
  
  try {
    let client = await ClientState.findOne({ client_id });
    
    if (client) {
      client.wearable_data = {
        last_synced: new Date(),
        avg_steps: steps,
        sleep_score: sleep_score,
        active_calories: active_calories
      };
      await client.save();
    }
    
    // Retornamos OK incluso si es MOCK/no lo encuentra en DB
    res.json({
      message: 'Wearable data synced successfully',
      data: { steps, sleep_score, active_calories }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
