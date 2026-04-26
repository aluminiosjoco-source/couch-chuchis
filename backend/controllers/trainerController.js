const User = require('../models/User');
const Client = require('../models/Client');
const bcrypt = require('bcryptjs');

/**
 * GET /api/trainers
 * Lista todos los entrenadores del gym del usuario autenticado.
 * gym_owner ve todos; super_admin puede filtrar por gym_id query.
 */
exports.getTrainers = async (req, res) => {
  try {
    const gym_id = req.user.rol === 'super_admin'
      ? (req.query.gym_id || req.user.gym_id)
      : req.user.gym_id;

    if (!gym_id) return res.status(400).json({ error: 'gym_id requerido' });

    const trainers = await User.find({ rol: 'trainer', gym_id }).select('-password_hash -reset_password_token');

    // Enriquecer con conteo de clientes asignados
    const enriched = await Promise.all(trainers.map(async (t) => {
      const clientCount = await Client.countDocuments({ trainer_id: t._id.toString(), activo: true });
      return { ...t.toJSON(), clientes_asignados: clientCount };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/trainers
 * Crear un entrenador nuevo dentro del gym (gym_owner only).
 */
exports.createTrainer = async (req, res) => {
  try {
    const { nombre, email, password, certificaciones = '', especialidades = [] } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }

    const existe = await User.findOne({ email });
    if (existe) return res.status(409).json({ error: 'El email ya está registrado' });

    const gym_id = req.user.gym_id;
    if (!gym_id) return res.status(400).json({ error: 'Tu cuenta no tiene un gym asignado' });

    const trainer = new User({
      nombre,
      email,
      password_hash: password, // pre-save hook hashea
      rol: 'trainer',
      gym_id,
    });

    // Guardar metadatos extra en campo libre (sin romper schema)
    trainer._certificaciones = certificaciones;
    trainer._especialidades = especialidades;

    await trainer.save();

    res.status(201).json({
      message: 'Entrenador creado exitosamente',
      trainer: trainer.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/trainers/:id
 * Detalle de un entrenador con sus clientes asignados.
 */
exports.getTrainer = async (req, res) => {
  try {
    const trainer = await User.findOne({ _id: req.params.id, rol: 'trainer' }).select('-password_hash -reset_password_token');
    if (!trainer) return res.status(404).json({ error: 'Entrenador no encontrado' });

    // Verificar pertenencia al mismo gym (salvo super_admin)
    if (req.user.rol !== 'super_admin' && trainer.gym_id !== req.user.gym_id) {
      return res.status(403).json({ error: 'Acceso denegado a este entrenador' });
    }

    const clientes = await Client.find({ trainer_id: trainer._id.toString() })
      .select('nombre email activo created_at');

    res.json({ trainer: trainer.toJSON(), clientes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/trainers/:id
 * Editar datos del entrenador.
 */
exports.updateTrainer = async (req, res) => {
  try {
    const { nombre, email, is_active } = req.body;

    const trainer = await User.findOne({ _id: req.params.id, rol: 'trainer' });
    if (!trainer) return res.status(404).json({ error: 'Entrenador no encontrado' });

    if (req.user.rol !== 'super_admin' && trainer.gym_id !== req.user.gym_id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    if (nombre) trainer.nombre = nombre;
    if (email && email !== trainer.email) {
      const dupe = await User.findOne({ email });
      if (dupe && dupe._id.toString() !== trainer._id.toString()) {
        return res.status(409).json({ error: 'El email ya está en uso' });
      }
      trainer.email = email;
    }
    if (typeof is_active === 'boolean') trainer.is_active = is_active;

    await trainer.save();

    res.json({ message: 'Entrenador actualizado', trainer: trainer.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/trainers/:id
 * Soft-delete: desactiva el entrenador. Sus clientes quedan con trainer_id intacto.
 * Si se pasa reassign_to en el body, reasigna los clientes al nuevo trainer.
 */
exports.deleteTrainer = async (req, res) => {
  try {
    const trainer = await User.findOne({ _id: req.params.id, rol: 'trainer' });
    if (!trainer) return res.status(404).json({ error: 'Entrenador no encontrado' });

    if (req.user.rol !== 'super_admin' && trainer.gym_id !== req.user.gym_id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { reassign_to } = req.body;

    if (reassign_to) {
      // Reasignar clientes al nuevo trainer
      const nuevoTrainer = await User.findOne({ _id: reassign_to, rol: 'trainer', gym_id: trainer.gym_id });
      if (!nuevoTrainer) return res.status(400).json({ error: 'Trainer de reasignación no válido' });

      await Client.updateMany(
        { trainer_id: trainer._id.toString() },
        { $set: { trainer_id: nuevoTrainer._id.toString() } }
      );
    }

    trainer.is_active = false;
    await trainer.save();

    const clientesAfectados = await Client.countDocuments({ trainer_id: trainer._id.toString() });

    res.json({
      message: 'Entrenador desactivado exitosamente',
      clientes_sin_trainer: reassign_to ? 0 : clientesAfectados,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
