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

    await mongoose.connect(mongoURI, options);

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
