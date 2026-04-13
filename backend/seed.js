require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Gym = require('./models/Gym');

const DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/couch_chuchis_global';

mongoose.connect(DB_URI)
  .then(async () => {
    console.log('🔗 Conectado a MongoDB Global para Seeding');
    
    const email = 'demo@example.com';
    const ownerEmail = 'admin@example.com';

    // Limpiar usuarios de prueba
    await User.deleteMany({ email: { $in: [email, ownerEmail] } });
    await Gym.deleteMany({ gym_id: 'demo-gym' });

    // Crear Gym de prueba
    const demoGym = new Gym({
      gym_id: 'demo-gym',
      nombre: 'Gym Demo Coach',
      owner_user_id: null // Se actualiza despues
    });
    // await demoGym.save();

    // Crear Dueño de Gym
    const ownerUser = new User({
        nombre: 'Admin Demo',
        email: ownerEmail,
        password_hash: '123456',
        rol: 'gym_owner',
        gym_id: 'demo-gym',
        is_active: true
    });
    // await ownerUser.save();
    
    demoGym.owner_user_id = ownerUser._id;
    await demoGym.save();
    await ownerUser.save();

    // Crear cliente demo
    const demoUser = new User({
        nombre: 'Client Demo',
        email: email,
        password_hash: '123456',
        rol: 'client',
        gym_id: 'demo-gym',
        is_active: true
    });
    await demoUser.save();

    console.log('✅ Cuentas creadas correctamente:');
    console.log(` Gym Owner: ${ownerEmail} / 123456`);
    console.log(` Client: ${email} / 123456`);

    process.exit(0);
  })
  .catch(err => {
    console.error('Error connecting to BD:', err.message);
    if(err.errors) console.error(JSON.stringify(err.errors, null, 2));
    process.exit(1);
  });
