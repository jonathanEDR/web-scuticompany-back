import mongoose from 'mongoose';

/**
 * Conectar a la base de datos MongoDB
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';
    
    const options = {
      // useNewUrlParser: true, // Ya no es necesario en Mongoose 6+
      // useUnifiedTopology: true, // Ya no es necesario en Mongoose 6+
    };

    const conn = await mongoose.connect(mongoURI, options);

    console.log(`✅ MongoDB conectado exitosamente: ${conn.connection.host}`);
    console.log(`📊 Base de datos: ${conn.connection.name}`);
    
    // Eventos de conexión
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose conectado a MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de conexión a MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose desconectado de MongoDB');
    });

    // Manejar cierre gracioso
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔴 Conexión a MongoDB cerrada por terminación de la aplicación');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error al conectar con MongoDB:', error.message);
    console.error('💡 Asegúrate de que MongoDB esté corriendo en tu sistema');
    console.error('💡 Ejecuta: mongod o inicia MongoDB Compass');
    process.exit(1);
  }
};

export default connectDB;
