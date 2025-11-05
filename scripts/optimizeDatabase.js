/**
 * 📊 Database Optimization Script
 * Crea índices optimizados para mejorar el rendimiento en producción
 */

import mongoose from 'mongoose';
import BlogComment from '../models/BlogComment.js';
import BlogPost from '../models/BlogPost.js';
import User from '../models/User.js';

// Conectar a MongoDB
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';
  
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

/**
 * Crea índices optimizados para comentarios del blog
 */
const optimizeBlogCommentsIndexes = async () => {
  console.log('🔧 Optimizando índices para BlogComment...');
  
  try {
    // Índice compuesto para obtener comentarios de un post por estado y fecha
    await BlogComment.collection.createIndex(
      { 
        post: 1, 
        status: 1, 
        createdAt: -1 
      },
      { 
        name: 'post_status_created',
        background: true
      }
    );

    // Índice para comentarios padre (comentarios de primer nivel)
    await BlogComment.collection.createIndex(
      { 
        post: 1, 
        parentComment: 1, 
        status: 1 
      },
      { 
        name: 'post_parent_status',
        background: true
      }
    );

    // Índice para moderación - comentarios pendientes
    await BlogComment.collection.createIndex(
      { 
        status: 1, 
        createdAt: 1 
      },
      { 
        name: 'status_created_moderation',
        background: true
      }
    );

    // Índice para comentarios por autor
    await BlogComment.collection.createIndex(
      { 
        'author.email': 1, 
        status: 1 
      },
      { 
        name: 'author_email_status',
        background: true
      }
    );

    console.log('✅ Índices de BlogComment optimizados');
    
  } catch (error) {
    console.error('❌ Error optimizando índices de BlogComment:', error);
  }
};

/**
 * Crea índices optimizados para posts del blog
 */
const optimizeBlogPostsIndexes = async () => {
  console.log('🔧 Optimizando índices para BlogPost...');
  
  try {
    // Índice compuesto para posts públicos por fecha
    await BlogPost.collection.createIndex(
      { 
        isPublished: 1, 
        publishedAt: -1 
      },
      { 
        name: 'published_date',
        background: true
      }
    );

    // Índice para búsqueda de texto
    await BlogPost.collection.createIndex(
      { 
        title: 'text', 
        excerpt: 'text', 
        content: 'text' 
      },
      { 
        name: 'text_search',
        background: true,
        weights: {
          title: 10,
          excerpt: 5,
          content: 1
        }
      }
    );

    console.log('✅ Índices de BlogPost optimizados');
    
  } catch (error) {
    console.error('❌ Error optimizando índices de BlogPost:', error);
  }
};

/**
 * Crea índices optimizados para usuarios
 */
const optimizeUsersIndexes = async () => {
  console.log('🔧 Optimizando índices para User...');
  
  try {
    // Índice para perfiles públicos
    await User.collection.createIndex(
      { 
        'blogProfile.isPublicProfile': 1, 
        username: 1 
      },
      { 
        name: 'public_profile_username',
        background: true,
        sparse: true
      }
    );

    console.log('✅ Índices de User optimizados');
    
  } catch (error) {
    console.error('❌ Error optimizando índices de User:', error);
  }
};

/**
 * Ejecuta todas las optimizaciones
 */
const optimizeDatabase = async () => {
  console.log('🚀 Iniciando optimización de base de datos...');
  
  try {
    // Conectar a la base de datos primero
    await connectDB();
    
    await optimizeBlogCommentsIndexes();
    await optimizeBlogPostsIndexes();
    await optimizeUsersIndexes();
    
    console.log('✅ Optimización de base de datos completada');
    
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    
  } catch (error) {
    console.error('❌ Error en optimización:', error);
    process.exit(1);
  }
};

export { optimizeDatabase };

// Si se ejecuta directamente
if (process.argv[1].endsWith('optimizeDatabase.js')) {
  optimizeDatabase().then(() => {
    console.log('🎉 Optimización completada');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}