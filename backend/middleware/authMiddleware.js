const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret';
const JWT_EXPIRES_IN = '7d';

/**
 * Genera un JWT firmado con el payload del usuario.
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Middleware: Valida JWT. Adjunta user al req si es válido.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

/**
 * Middleware: Verifica que el usuario tenga uno de los roles requeridos.
 * @param {...string} roles - Roles permitidos (ej. 'super_admin', 'gym_owner', 'trainer', 'client')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  if (!roles.includes(req.user.rol)) {
    return res.status(403).json({ error: `Acceso denegado. Rol requerido: ${roles.join(' o ')}` });
  }
  next();
};

/**
 * Middleware: Verifica que el usuario pertenece al gym_id del parámetro de ruta.
 * Los super_admin pueden acceder a cualquier gym.
 */
const authorizeGymAccess = (req, res, next) => {
  const { gymId } = req.params;
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  if (req.user.rol === 'super_admin') return next(); // Super admin accede a todo
  if (req.user.gym_id !== gymId) {
    return res.status(403).json({ error: 'No tienes acceso a este gimnasio' });
  }
  next();
};

// Exportar helpers nombrados para conveniencia
const isSuperAdmin = authorize('super_admin');
const isGymOwner = authorize('super_admin', 'gym_owner');
const isTrainer = authorize('super_admin', 'gym_owner', 'trainer');
const isClient = authorize('super_admin', 'gym_owner', 'trainer', 'client');

module.exports = {
  generateToken,
  authenticate,
  authorize,
  authorizeGymAccess,
  isSuperAdmin,
  isGymOwner,
  isTrainer,
  isClient,
};
