import mongoose from 'mongoose';

/**
 * Conectar a la base de datos MongoDB
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';

    // Verificar que existe URI de MongoDB en producción
    if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI must be defined in production');
    }

    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout después de 5s si no puede conectar
      socketTimeoutMS: 45000, // Cerrar sockets después de 45s de inactividad
    };

    await mongoose.connect(mongoURI, options);

    console.log(`MongoDB Connected: ${mongoose.connection.host}`);

    // Eventos de conexión - solo errores críticos
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    // Manejar cierre gracioso
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
