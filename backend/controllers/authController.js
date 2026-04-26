const User = require('../models/User');
const Gym = require('../models/Gym');
const { generateToken } = require('../middleware/authMiddleware');
const crypto = require('crypto');

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { nombre, email, password, rol = 'client', gym_id = null, nombre_gym = null } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }

    const existe = await User.findOne({ email });
    if (existe) return res.status(409).json({ error: 'El email ya está registrado' });

    // Si está creando un gym, validar y crear el registro del gym también
    let gymRegistrado = null;
    if (rol === 'gym_owner' && nombre_gym) {
      const gymSlug = nombre_gym.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      gymRegistrado = new Gym({
        gym_id: gymSlug,
        nombre: nombre_gym,
        owner_user_id: null, // Se actualiza tras crear el user
      });
    }

    const nuevoUser = new User({
      nombre,
      email,
      password_hash: password, // El pre-save hook lo hashea
      rol,
      gym_id: gymRegistrado ? gymRegistrado.gym_id : gym_id,
    });

    await nuevoUser.save();

    if (gymRegistrado) {
      gymRegistrado.owner_user_id = nuevoUser._id;
      await gymRegistrado.save();
    }

    const token = generateToken({
      id: nuevoUser._id,
      email: nuevoUser.email,
      rol: nuevoUser.rol,
      gym_id: nuevoUser.gym_id,
    });

    res.status(201).json({
      message: 'Cuenta creada exitosamente',
      token,
      user: nuevoUser.toJSON(),
      gym: gymRegistrado,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar: ' + error.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const user = await User.findOne({ email });
    if (!user || !user.is_active) return res.status(401).json({ error: 'Credenciales inválidas' });

    const passwordValido = await user.verifyPassword(password);
    if (!passwordValido) return res.status(401).json({ error: 'Credenciales/ Contrasena inválidas' });

    user.last_login = new Date();
    await user.save();

    const token = generateToken({
      id: user._id,
      email: user.email,
      rol: user.rol,
      gym_id: user.gym_id,
    });

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión: ' + error.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Retornamos 200 siempre para no revelar si el email existe
    if (!user) return res.json({ message: 'Si el correo existe, recibirás instrucciones' });

    const token = crypto.randomBytes(32).toString('hex');
    user.reset_password_token = crypto.createHash('sha256').update(token).digest('hex');
    user.reset_password_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await user.save();

    // TODO: Enviar correo con el token via notificationService
    console.log(`[ForgotPassword] Token para ${email}: ${token}`);

    res.json({ message: 'Si el correo existe, recibirás instrucciones' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, nueva_password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      reset_password_token: hashedToken,
      reset_password_expires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ error: 'Token inválido o expirado' });

    user.password_hash = nueva_password; // Pre-save hook re-hashea
    user.reset_password_token = null;
    user.reset_password_expires = null;
    await user.save();

    const newToken = generateToken({ id: user._id, email: user.email, rol: user.rol, gym_id: user.gym_id });
    res.json({ message: 'Contraseña actualizada correctamente', token: newToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
