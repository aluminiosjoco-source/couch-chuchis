const ClientState = require('../models/ClientState');

// Regla 4.1 y 4.2 del motor de decisiones
exports.processCheckIn = async (req, res) => {
  const { id } = req.params;
  const { peso, adherencia, fatiga_percibida, horas_sueno, dolor_muscular } = req.body;

  try {
    let client = await ClientState.findOne({ client_id: id });
    let isMock = false;

    // Si no hay DB, usamos mock en memoria
    if (!client) {
      isMock = true;
      client = {
        client_id: id,
        tenant_id: 'gym-1',
        current_state: {
          week: 4, peso: 80, adherencia: 1, fatiga_percibida: 5, tdee_calculated: 2400, tdee_adjusted: 2400, flags: []
        },
        save: async () => {} 
      };
    }

    const { current_state } = client;
    const oldPeso = current_state.peso || 80;
    
    // Archivar semana anterior
    if(client.historical_weeks) {
       client.historical_weeks.push({...current_state});
    } else {
       client.historical_weeks = [{...current_state}];
    }

    // Calcular estancamiento
    const weightDiff = Math.abs(oldPeso - peso);
    const estancado = weightDiff < 0.5;

    let newFlags = [];
    let newTDEE = current_state.tdee_adjusted || 2400;

    // Regla 1: Estancamiento
    if (estancado && adherencia > 0.85) {
      newTDEE -= 200;
      newFlags.push('estancamiento_peso');
    }

    // Regla 2: Fatiga alta
    if (fatiga_percibida >= 7) {
      newFlags.push('alta_fatiga');
    }

    // Actualizar Estado
    current_state.peso = parseFloat(peso) || current_state.peso;
    current_state.peso_change = current_state.peso - oldPeso;
    current_state.adherencia = parseFloat(adherencia) || current_state.adherencia;
    current_state.fatiga_percibida = parseInt(fatiga_percibida) || current_state.fatiga_percibida;
    current_state.horas_sueno = parseFloat(horas_sueno) || current_state.horas_sueno;
    current_state.dolor_muscular = parseInt(dolor_muscular) || current_state.dolor_muscular;
    current_state.tdee_adjusted = newTDEE;
    current_state.flags = newFlags;
    current_state.week += 1;
    current_state.check_in_completed = new Date();

    if (!isMock) { await client.save(); }

    res.json({
      message: 'Check-in procesado correctamente por el Motor de Decisiones',
      action_taken: newFlags.length > 0 ? 'Ajustes realizados (Ver Flags)' : 'Sin cambios necesarios',
      new_state: current_state,
      isMock
    });

  } catch (error) {
    res.status(500).json({ error: 'Error del Motor: ' + error.message });
  }
};

exports.getDashboardData = async (req, res) => {
  // Simulamos datos del dashboard para entrenadores
  res.json({
    active_clients: 12,
    avg_adherence: 84,
    alerts: [
      { client: 'Juan Pérez', issue: 'Fatiga alta 2 sem', type: 'critical' },
      { client: 'María García', issue: 'Check-in pendiente 48h', type: 'warning' },
      { client: 'Roberto Lee', issue: 'Estancamiento 4 sem', type: 'warning' }
    ],
    progression_avg: '+5kg fuerza',
    collective_progress: [-0.5, -0.6, 0, -1, -0.5, -0.3]
  });
};

exports.getClientPlan = async (req, res) => {
  const { id } = req.params;
  res.json({
    client_id: id,
    week_on_block: 4,
    block_type: 'Upper/Lower',
    nutrition: {
      kcal_target: 2200,
      macros: { p: 140, c: 220, f: 55 },
      cultural_adaptation: "Tortilla, Frijoles. Sin Lactosa."
    },
    flags_actives: ['alta_fatiga'],
    wearable_status: 'Sincronizado'
  });
};
