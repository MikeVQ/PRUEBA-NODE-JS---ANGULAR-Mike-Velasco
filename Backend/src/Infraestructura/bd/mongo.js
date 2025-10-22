const mongoose = require('mongoose');

let conectado = false;

async function conectarMongo(uri) {
  if (!uri) {
    console.error(' MONGO_URI no está definida en las variables de entorno');
    process.exit(1);
  }

  if (conectado) return mongoose.connection;

  try {
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      
      autoIndex: true,
      maxPoolSize: 10,
    });

    conectado = true;

    mongoose.connection.on('connected', () => {
      console.log(' MongoDB conectado');
    });

    mongoose.connection.on('error', (err) => {
      console.error(' Error de conexión MongoDB:', err?.message || err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(' MongoDB desconectado');
      conectado = false;
    });

    // Cierre ordenado
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log(' Conexión MongoDB cerrada por SIGINT');
      process.exit(0);
    });

    return mongoose.connection;
  } catch (err) {
    console.error(' No se pudo conectar a MongoDB:', err?.message || err);
    process.exit(1);
  }
}

module.exports = { conectarMongo };
