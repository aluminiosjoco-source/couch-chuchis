exports.validateClientOnboarding = (req, res, next) => {
  const { peso, altura_cm } = req.body;
  if (peso !== undefined && (peso < 30 || peso > 300)) {
    console.error(`[ValidationError] Peso inválido: ${peso}`);
    return res.status(400).json({ error: 'El peso debe estar entre 30kg y 300kg' });
  }
  if (altura_cm !== undefined && (altura_cm < 120 || altura_cm > 230)) {
    console.error(`[ValidationError] Altura inválida: ${altura_cm}`);
    return res.status(400).json({ error: 'La altura debe estar entre 120cm y 230cm' });
  }
  next();
};

exports.validateCheckIn = (req, res, next) => {
  const { peso, adherencia, fatiga } = req.body;
  
  if (peso !== undefined && (peso < 30 || peso > 300)) {
    console.error(`[ValidationError] Peso de checkin inválido: ${peso}`);
    return res.status(400).json({ error: 'El peso debe estar entre 30kg y 300kg' });
  }

  if (adherencia !== undefined && (adherencia < 0 || adherencia > 1)) {
    console.error(`[ValidationError] Adherencia inválida: ${adherencia}`);
    return res.status(400).json({ error: 'La adherencia debe ser un valor entre 0 y 1' });
  }

  if (fatiga !== undefined && (fatiga < 1 || fatiga > 10)) {
    console.error(`[ValidationError] Fatiga inválida: ${fatiga}`);
    return res.status(400).json({ error: 'La fatiga debe estar entre 1 y 10' });
  }

  next();
};
