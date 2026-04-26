const cron = require('node-cron');
const Client = require('../models/Client');
const CheckIn = require('../models/CheckIn');
const { getClientState } = require('./clientStateService');

// Tarea diaria a las 08:00 AM
const initCronJobs = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Ejecutando revisión diaria de automatización y abandonos...');
    try {
      const activeClients = await Client.find({ activo: true });
      const now = new Date();

      for (const client of activeClients) {
         const state = await getClientState(client._id);
         if (!state) continue;
         
         const lastCheckInDate = state.current_state.last_checkin_date;
         if (lastCheckInDate) {
            const diffMs = now - lastCheckInDate;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays >= 7) {
               console.log(`[Alerta Cron] Cliente ${client.nombre} (${client.email}) lleva ${diffDays} días sin check-in (Pendiente)`);
               // Podríamos conectar a un mail service aquí o emitir evento Webhook.
            }
         }
      }
    } catch (err) {
      console.error('[Cron Error] Falla en la revisión de clientes:', err);
    }
  });
  console.log('✅ Cron Jobs Inicializados');
};

module.exports = { initCronJobs };
