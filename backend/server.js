require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ── Rutas V1 (legacy)
const engineRoutes   = require('./routes/engine');
const wearableRoutes = require('./routes/wearables');

// ── Rutas V2
const authRoutes       = require('./routes/authRoutes');
const stripeRoutes     = require('./routes/stripeRoutes');
const agentsRoutes     = require('./routes/agentsRoutes');
const clientRoutes     = require('./routes/clientRoutes');
const trainerRoutes    = require('./routes/trainerRoutes');
const authClientRoutes = require('./routes/authClientRoutes');
const { initCronJobs } = require('./services/cronService');

const app = express();

app.use(cors());

// CRÍTICO: El webhook de Stripe necesita el body RAW (sin parsear).
// Por eso su ruta se define ANTES de express.json().
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Para todas las demás rutas: parseo normal de JSON
app.use(express.json());

// ── Montar rutas
app.use('/api', engineRoutes);
app.use('/api/webhooks', wearableRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/client-auth', authClientRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '2.0.0', timestamp: new Date() }));

// Configuración y conexión
const PORT   = process.env.PORT   || 5000;
const DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/couch_chuchis_global';

mongoose.connect(DB_URI)
  .then(() => {
    console.log('🔗 Conectado a MongoDB Global');
    initCronJobs();
    app.listen(PORT, () => console.log(`🚀 API Coach-as-a-Service v2.0 en puerto ${PORT}`));
  })
  .catch(err => {
    console.warn('⚠️ No se detectó MongoDB. Corriendo en modo MOCK/Fallback...');
    app.listen(PORT, () => console.log(`🚀 API v2.0 (Fallback) en puerto ${PORT}`));
  });
