const Client = require('../models/Client');
const { generateClientToken } = require('../middleware/authClientMiddleware');

exports.register = async (req, res) => {
  try {
    const { nombre, email, password, edad, altura_cm, trainer_id, tenant_id } = req.body;

    const existe = await Client.findOne({ email });
    if (existe) return res.status(409).json({ error: 'El email ya está registrado como cliente' });

    const newClient = new Client({
      nombre,
      email,
      password_hash: password, // Pre-save lo hashea
      edad,
      altura_cm,
      trainer_id,
      tenant_id
    });

    await newClient.save();

    const token = generateClientToken(newClient);
    res.status(201).json({
      message: 'Cliente registrado',
      token,
      client: newClient.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const client = await Client.findOne({ email });
    if (!client || !client.activo) return res.status(401).json({ error: 'Credenciales inválidas o cuenta desactivada' });

    const validPassword = await client.verifyPassword(password);
    if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = generateClientToken(client);
    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      client: client.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const client = await Client.findById(req.client.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ client: client.toJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
