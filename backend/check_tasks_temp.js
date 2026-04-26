const mongoose = require('mongoose');
require('dotenv').config();

const Routine = require('./models/Routine');

async function checkLatestRoutines() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const routines = await Routine.find().sort({ createdAt: -1 }).limit(3);

    if (routines.length === 0) {
      console.log('No routines found in the database.');
    } else {
      console.log(`Found ${routines.length} recent routines:`);
      routines.forEach((r, i) => {
        console.log(`\n--- Routine ${i + 1} ---`);
        console.log(`ID: ${r._id}`);
        console.log(`Tipo: ${r.tipo}`);
        console.log(`Estado: ${r.estado}`);
        console.log(`Fecha: ${r.createdAt}`);
        console.log(`Plan Plan Name: ${r.plan?.split_name || 'N/A'}`);
        console.log(`Plan Notas Generales: ${r.plan?.notas_generales || 'N/A'}`);
        if (r.plan?.dias) {
          console.log(`Días: ${r.plan.dias.length}`);
          r.plan.dias.forEach(d => {
            console.log(`  - Día ${d.dia}: ${d.nombre} (${d.ejercicios?.length || 0} ejercicios)`);
          });
        }
      });
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

checkLatestRoutines();
