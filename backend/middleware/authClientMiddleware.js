const jwt = require('jsonwebtoken');

exports.generateClientToken = (client) => {
  return jwt.sign(
    {
      id: client._id,
      email: client.email,
      rol: 'client_end_user',
      trainer_id: client.trainer_id,
      tenant_id: client.tenant_id
    },
    process.env.JWT_SECRET || 'secret_de_desarrollo',
    { expiresIn: '30d' }
  );
};

exports.authenticateClient = (req, res, next) => {
  const originHeader = req.headers.authorization;
  if (!originHeader || !originHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
  }

  const token = originHeader.split(' ')[1];
  try {
    const decodificado = jwt.verify(token, process.env.JWT_SECRET || 'secret_de_desarrollo');
    if (decodificado.rol !== 'client_end_user') {
      return res.status(403).json({ error: 'Token inválido para esta aplicación' });
    }
    req.client = decodificado;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
