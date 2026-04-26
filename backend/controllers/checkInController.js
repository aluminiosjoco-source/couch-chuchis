const Client = require('../models/Client');
const CheckIn = require('../models/CheckIn');
const { getClientState } = require('../services/clientStateService');
const { validateCheckIn } = require('../utils/validators');

exports.createCheckIn = [
  validateCheckIn,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const checkin = new CheckIn({
        client_id: id,
        week: req.body.week,
        peso: req.body.peso,
        adherencia: req.body.adherencia,
        fatiga: req.body.fatiga,
        sueno: req.body.sueno,
        entrenamientos_realizados: req.body.entrenamientos_realizados,
        notas: req.body.notas || '',
        tipo: 'obligatorio',
      });
      
      await checkin.save();
      
      const newState = await getClientState(id);

      res.status(201).json({
        message: 'CheckIn registrado correctamente',
        checkin: checkin,
        newState
      });
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  }
];

exports.getCheckIns = async (req, res) => {
  try {
    const checkins = await CheckIn.find({ client_id: req.params.id }).sort({ week: -1 });
    res.json(checkins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
