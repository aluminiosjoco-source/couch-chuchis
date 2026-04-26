const Client = require('../models/Client');
const ClientProfile = require('../models/ClientProfile');
const Routine = require('../models/Routine');
const { getClientState } = require('../services/clientStateService');

// ─────────────────────────────────────────────
// GET /api/clients
// ─────────────────────────────────────────────
exports.getClients = async (req, res) => {
  try {
    const query = { tenant_id: req.user.gym_id };
    if (req.user.rol === 'trainer') {
      query.trainer_id = req.user.id;
    }

    // Filtro opcional por estado activo
    if (req.query.activo !== undefined) {
      query.activo = req.query.activo === 'true';
    }

    const clients = await Client.find(query).select('nombre email activo created_at trainer_id');

    const enriched = await Promise.all(clients.map(async (client) => {
      const cState = await getClientState(client._id.toString());
      return {
        id: client._id,
        nombre: client.nombre,
        email: client.email,
        is_active: client.activo,
        trainer_id: client.trainer_id,
        joined_at: client.created_at,
        estado: cState ? cState.current_state : null,
      };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────
exports.createClient = async (req, res) => {
  try {
    const {
      nombre, email, password, edad, altura_cm,
      // Perfil fitness extendido
      objetivo = 'hipertrofia',
      experiencia = 'principiante',
      dias_disponibles = 4,
      equipamiento = 'gym',
      limitaciones = [],
      restricciones_alimentarias = [],
      // Nuevos campos
      peso_inicial, telefono, ocupacion, meta_especifica, tiempo_objetivo,
      tiempo_sesion, horario_preferido, lesiones_pasadas, dolor_frecuente,
      condicion_medica, estilo_vida, horas_sueno, nivel_estres, comidas_dia,
      alcohol, tipo_entrenamiento_preferido, ejercicios_disgusto,
      motivacion_principal, nivel_compromiso, porcentaje_grasa_inicial,
      medida_cintura, medida_cadera, observaciones_posturales, notas_entrenador
    } = req.body;

    if (!nombre || !email || !password || !edad || !altura_cm) {
      return res.status(400).json({ error: 'Nombre, email, contraseña, edad y altura son requeridos' });
    }

    // Verificar email único en la colección Client
    const existe = await Client.findOne({ email });
    if (existe) return res.status(409).json({ error: 'El email ya está registrado como cliente' });

    const gym_id = req.user.gym_id;
    if (!gym_id) return res.status(400).json({ error: 'Tu cuenta no tiene un gym asignado' });

    const trainer_id = req.user.rol === 'trainer'
      ? req.user.id
      : (req.body.trainer_id || req.user.id); // gym_owner puede asignar a cualquier trainer

    const client = new Client({
      trainer_id,
      tenant_id: gym_id,
      nombre,
      email,
      password_hash: password, // pre-save hook hashea
      edad,
      altura_cm,
    });

    await client.save();

    // Crear perfil fitness inmediatamente
    const profile = new ClientProfile({
      client_id: client._id.toString(),
      objetivo, experiencia, dias_disponibles, equipamiento, limitaciones, restricciones_alimentarias,
      peso_inicial, telefono, ocupacion, meta_especifica, tiempo_objetivo,
      tiempo_sesion, horario_preferido, lesiones_pasadas, dolor_frecuente,
      condicion_medica, estilo_vida, horas_sueno, nivel_estres, comidas_dia,
      alcohol, tipo_entrenamiento_preferido, ejercicios_disgusto,
      motivacion_principal, nivel_compromiso, porcentaje_grasa_inicial,
      medida_cintura, medida_cadera, observaciones_posturales, notas_entrenador
    });

    await profile.save();

    res.status(201).json({
      message: 'Cliente creado exitosamente',
      client: client.toJSON(),
      profile,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/clients/:id
// Perfil completo: datos + estado del motor
// ─────────────────────────────────────────────
exports.getClientProfile = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).select('-password_hash');
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

    if (req.user.rol !== 'super_admin' && client.tenant_id !== req.user.gym_id) {
      return res.status(403).json({ error: 'Acceso denegado a este cliente' });
    }

    const state = await getClientState(client._id.toString());
    const fitnessProfile = await ClientProfile.findOne({ client_id: client._id.toString() });

    res.json({
      user: client,
      state: state || null,
      profile: fitnessProfile || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/clients/:id
// Editar datos básicos del cliente
// ─────────────────────────────────────────────
exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

    if (req.user.rol !== 'super_admin' && client.tenant_id !== req.user.gym_id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { nombre, email, edad, altura_cm, activo } = req.body;

    if (nombre) client.nombre = nombre;
    if (email && email !== client.email) {
      const dupe = await Client.findOne({ email });
      if (dupe && dupe._id.toString() !== client._id.toString()) {
        return res.status(409).json({ error: 'El email ya está en uso' });
      }
      client.email = email;
    }
    if (edad) client.edad = edad;
    if (altura_cm) client.altura_cm = altura_cm;
    if (typeof activo === 'boolean') client.activo = activo;

    await client.save();

    res.json({ message: 'Cliente actualizado', client: client.toJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/clients/:id  (soft-delete, gym_owner only)
// ─────────────────────────────────────────────
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

    if (req.user.rol !== 'super_admin' && client.tenant_id !== req.user.gym_id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    client.activo = false;
    await client.save();

    res.json({ message: 'Cliente desactivado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────
exports.updateClientProfile = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

    if (req.user.rol !== 'super_admin' && client.tenant_id !== req.user.gym_id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const profileFields = [
      'objetivo', 'experiencia', 'dias_disponibles', 'equipamiento', 'limitaciones', 'restricciones_alimentarias',
      'peso_inicial', 'telefono', 'ocupacion', 'meta_especifica', 'tiempo_objetivo',
      'tiempo_sesion', 'horario_preferido', 'lesiones_pasadas', 'dolor_frecuente',
      'condicion_medica', 'estilo_vida', 'horas_sueno', 'nivel_estres', 'comidas_dia',
      'alcohol', 'tipo_entrenamiento_preferido', 'ejercicios_disgusto',
      'motivacion_principal', 'nivel_compromiso', 'porcentaje_grasa_inicial',
      'medida_cintura', 'medida_cadera', 'observaciones_posturales', 'notas_entrenador'
    ];

    let profile = await ClientProfile.findOne({ client_id: req.params.id });
    if (!profile) {
      profile = new ClientProfile({ client_id: req.params.id });
    }

    profileFields.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    await profile.save();

    res.json({ message: 'Perfil fitness actualizado', profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/clients/:id/assign
// Reasignar cliente a otro trainer (gym_owner only)
// ─────────────────────────────────────────────
exports.assignClient = async (req, res) => {
  try {
    const { trainer_id } = req.body;
    if (!trainer_id) return res.status(400).json({ error: 'trainer_id requerido' });

    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

    if (req.user.rol !== 'super_admin' && client.tenant_id !== req.user.gym_id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    client.trainer_id = trainer_id;
    await client.save();

    res.json({ message: 'Cliente reasignado exitosamente', client: client.toJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/clients/:id/routines
// ─────────────────────────────────────────────
exports.getClientRoutines = async (req, res) => {
  try {
    const routines = await Routine.find({ client_id: req.params.id }).sort({ createdAt: -1 });
    res.json(routines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
