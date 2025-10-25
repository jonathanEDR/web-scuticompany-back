import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Contact from '../models/Contact.js';

// Cargar variables de entorno
dotenv.config();

/**
 * 🧪 Script para poblar datos de prueba de Contactos
 * Genera contactos con diferentes estados para testing
 */

const contactosPrueba = [
  {
    nombre: 'Carlos Mendoza',
    celular: '+51 987 654 321',
    correo: 'carlos.mendoza@gmail.com',
    mensaje: 'Estoy interesado en desarrollar una aplicación móvil para mi negocio de delivery. ¿Podrían ayudarme con esto?',
    estado: 'nuevo',
    prioridad: 'alta',
    origen: 'web',
    metadata: {
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      referrer: 'https://www.google.com',
      idioma: 'es'
    }
  },
  {
    nombre: 'María González',
    celular: '+51 999 888 777',
    correo: 'maria.gonzalez@outlook.com',
    mensaje: 'Necesito una página web corporativa moderna para mi empresa de consultoría. Me gustaría agendar una reunión.',
    estado: 'leido',
    prioridad: 'media',
    origen: 'web',
    fechaLectura: new Date(Date.now() - 2 * 60 * 60 * 1000), // Hace 2 horas
    metadata: {
      ip: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      referrer: 'https://www.facebook.com',
      idioma: 'es'
    }
  },
  {
    nombre: 'Jorge Ramírez',
    celular: '+51 955 444 333',
    correo: 'jorge.ramirez@hotmail.com',
    mensaje: '¿Ofrecen servicios de desarrollo de IA? Tengo un proyecto de chatbot que me gustaría discutir.',
    estado: 'en_proceso',
    prioridad: 'alta',
    origen: 'web',
    fechaLectura: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Hace 1 día
    notas: [
      {
        tipo: 'nota',
        contenido: 'Cliente muy interesado en IA. Programar llamada para mañana.',
        autor: {
          userId: 'admin-001',
          userName: 'Admin',
          userEmail: 'admin@scuti.com'
        },
        fecha: new Date(Date.now() - 3 * 60 * 60 * 1000)
      }
    ],
    metadata: {
      ip: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
      referrer: 'https://www.instagram.com',
      idioma: 'es'
    }
  },
  {
    nombre: 'Ana Torres',
    celular: '+51 922 111 000',
    correo: 'ana.torres@empresa.com',
    mensaje: 'Representante de una empresa minera. Necesitamos un sistema de gestión de inventarios. Presupuesto disponible.',
    estado: 'respondido',
    prioridad: 'urgente',
    origen: 'web',
    fechaLectura: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Hace 3 días
    fechaRespuesta: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Hace 2 días
    notas: [
      {
        tipo: 'email',
        contenido: 'Propuesta enviada por correo con cotización detallada.',
        autor: {
          userId: 'admin-001',
          userName: 'Admin',
          userEmail: 'admin@scuti.com'
        },
        fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ],
    etiquetas: ['empresa', 'sistema', 'presupuesto-alto'],
    metadata: {
      ip: '192.168.1.103',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      referrer: 'https://www.linkedin.com',
      idioma: 'es'
    }
  },
  {
    nombre: 'Pedro Silva',
    celular: '+51 988 777 666',
    correo: 'pedro.silva@startup.pe',
    mensaje: 'Startup tecnológica buscando desarrollar MVP para app de finanzas. ¿Tienen experiencia en fintech?',
    estado: 'nuevo',
    prioridad: 'media',
    origen: 'web',
    metadata: {
      ip: '192.168.1.104',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      referrer: 'direct',
      idioma: 'es'
    }
  },
  {
    nombre: 'Lucía Vargas',
    celular: '+51 944 333 222',
    correo: 'lucia.vargas@yahoo.com',
    mensaje: 'Necesito rediseñar mi tienda online de ropa. La actual está muy lenta y anticuada.',
    estado: 'leido',
    prioridad: 'baja',
    origen: 'web',
    fechaLectura: new Date(Date.now() - 5 * 60 * 60 * 1000), // Hace 5 horas
    metadata: {
      ip: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X)',
      referrer: 'https://www.google.com',
      idioma: 'es'
    }
  },
  {
    nombre: 'Roberto Chang',
    celular: '+51 977 666 555',
    correo: 'roberto.chang@comercio.com',
    mensaje: '¿Cuánto cuesta desarrollar una app tipo Uber pero para servicios de limpieza? Necesito cotización urgente.',
    estado: 'en_proceso',
    prioridad: 'alta',
    origen: 'web',
    fechaLectura: new Date(Date.now() - 6 * 60 * 60 * 1000), // Hace 6 horas
    asignadoA: {
      userId: 'admin-001',
      userName: 'Admin',
      userEmail: 'admin@scuti.com',
      fechaAsignacion: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    notas: [
      {
        tipo: 'llamada',
        contenido: 'Llamada inicial realizada. Cliente necesita demo y cotización.',
        autor: {
          userId: 'admin-001',
          userName: 'Admin',
          userEmail: 'admin@scuti.com'
        },
        fecha: new Date(Date.now() - 3 * 60 * 60 * 1000)
      }
    ],
    etiquetas: ['app-movil', 'urgente'],
    metadata: {
      ip: '192.168.1.106',
      userAgent: 'Mozilla/5.0 (Android 11; Mobile)',
      referrer: 'https://www.google.com',
      idioma: 'es'
    }
  },
  {
    nombre: 'Isabel Flores',
    celular: '+51 933 222 111',
    correo: 'isabel.flores@edu.pe',
    mensaje: 'Soy directora de colegio. Necesitamos un sistema de gestión académica. ¿Tienen soluciones para educación?',
    estado: 'archivado',
    prioridad: 'baja',
    origen: 'web',
    fechaLectura: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Hace 10 días
    fechaArchivado: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Hace 7 días
    notas: [
      {
        tipo: 'nota',
        contenido: 'Cliente no respondió a seguimiento. Archivar por ahora.',
        autor: {
          userId: 'admin-001',
          userName: 'Admin',
          userEmail: 'admin@scuti.com'
        },
        fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    ],
    metadata: {
      ip: '192.168.1.107',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      referrer: 'https://www.bing.com',
      idioma: 'es'
    }
  },
  {
    nombre: 'Miguel Herrera',
    celular: '+51 966 555 444',
    correo: 'miguel.herrera@restaurante.com',
    mensaje: 'Tengo una cadena de restaurantes. Necesito un sistema de pedidos online con delivery integrado.',
    estado: 'respondido',
    prioridad: 'media',
    origen: 'web',
    fechaLectura: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // Hace 4 días
    fechaRespuesta: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Hace 3 días
    notas: [
      {
        tipo: 'reunion',
        contenido: 'Reunión presencial agendada para la próxima semana.',
        autor: {
          userId: 'admin-001',
          userName: 'Admin',
          userEmail: 'admin@scuti.com'
        },
        fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ],
    etiquetas: ['restaurante', 'delivery', 'reunion-agendada'],
    calificacion: 5,
    metadata: {
      ip: '192.168.1.108',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      referrer: 'https://www.google.com',
      idioma: 'es'
    }
  },
  {
    nombre: 'Carmen Ruiz',
    celular: '+51 911 000 999',
    correo: 'carmen.ruiz@gmail.com',
    mensaje: 'Estoy iniciando un emprendimiento de venta de productos naturales. ¿Pueden ayudarme con una tienda online básica?',
    estado: 'nuevo',
    prioridad: 'baja',
    origen: 'web',
    metadata: {
      ip: '192.168.1.109',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      referrer: 'https://www.facebook.com',
      idioma: 'es'
    }
  },
  {
    nombre: 'Daniel Soto',
    celular: '+51 900 888 777',
    correo: 'daniel.soto@logistica.com',
    mensaje: 'Empresa de logística requiere sistema de tracking de envíos en tiempo real con geolocalización.',
    estado: 'en_proceso',
    prioridad: 'urgente',
    origen: 'web',
    fechaLectura: new Date(Date.now() - 12 * 60 * 60 * 1000), // Hace 12 horas
    asignadoA: {
      userId: 'admin-001',
      userName: 'Admin',
      userEmail: 'admin@scuti.com',
      fechaAsignacion: new Date(Date.now() - 10 * 60 * 60 * 1000)
    },
    notas: [
      {
        tipo: 'seguimiento',
        contenido: 'Análisis técnico en progreso. Pendiente cotización.',
        autor: {
          userId: 'admin-001',
          userName: 'Admin',
          userEmail: 'admin@scuti.com'
        },
        fecha: new Date(Date.now() - 8 * 60 * 60 * 1000)
      }
    ],
    etiquetas: ['logistica', 'geolocalización', 'urgente'],
    calificacion: 4,
    metadata: {
      ip: '192.168.1.110',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      referrer: 'https://www.linkedin.com',
      idioma: 'es'
    }
  },
  {
    nombre: 'Gabriela Paz',
    celular: '+51 955 333 111',
    correo: 'gabriela.paz@salud.com',
    mensaje: 'Clínica médica necesita sistema de citas online y gestión de historias clínicas. ¿Tienen experiencia en salud?',
    estado: 'leido',
    prioridad: 'alta',
    origen: 'web',
    fechaLectura: new Date(Date.now() - 1 * 60 * 60 * 1000), // Hace 1 hora
    etiquetas: ['salud', 'sistema-medico'],
    metadata: {
      ip: '192.168.1.111',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      referrer: 'https://www.google.com',
      idioma: 'es'
    }
  }
];

/**
 * Función principal para poblar contactos
 */
async function poblarContactos() {
  try {
    console.log('📧 Iniciando script de población de contactos...\n');

    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Limpiar colección de contactos existente
    const count = await Contact.countDocuments();
    if (count > 0) {
      console.log(`⚠️  Se encontraron ${count} contactos existentes`);
      console.log('🗑️  Eliminando contactos anteriores...');
      await Contact.deleteMany({});
      console.log('✅ Contactos anteriores eliminados\n');
    }

    // Insertar contactos de prueba
    console.log('📝 Insertando contactos de prueba...\n');
    const contactosCreados = await Contact.insertMany(contactosPrueba);
    
    console.log('✅ Contactos creados exitosamente!\n');
    console.log('📊 RESUMEN DE CONTACTOS CREADOS:\n');
    
    // Estadísticas por estado
    const estadoStats = contactosCreados.reduce((acc, contact) => {
      acc[contact.estado] = (acc[contact.estado] || 0) + 1;
      return acc;
    }, {});

    console.log('Por Estado:');
    Object.entries(estadoStats).forEach(([estado, cantidad]) => {
      const emoji = {
        'nuevo': '🆕',
        'leido': '👁️',
        'en_proceso': '⏳',
        'respondido': '✅',
        'archivado': '📦'
      }[estado] || '📄';
      console.log(`  ${emoji} ${estado}: ${cantidad}`);
    });

    // Estadísticas por prioridad
    const prioridadStats = contactosCreados.reduce((acc, contact) => {
      acc[contact.prioridad] = (acc[contact.prioridad] || 0) + 1;
      return acc;
    }, {});

    console.log('\nPor Prioridad:');
    Object.entries(prioridadStats).forEach(([prioridad, cantidad]) => {
      const emoji = {
        'urgente': '🔴',
        'alta': '🟠',
        'media': '🟡',
        'baja': '🟢'
      }[prioridad] || '⚪';
      console.log(`  ${emoji} ${prioridad}: ${cantidad}`);
    });

    console.log('\n📋 LISTA DE CONTACTOS:');
    contactosCreados.forEach((contacto, index) => {
      const estadoEmoji = {
        'nuevo': '🆕',
        'leido': '👁️',
        'en_proceso': '⏳',
        'respondido': '✅',
        'archivado': '📦'
      }[contacto.estado] || '📄';
      
      const prioridadEmoji = {
        'urgente': '🔴',
        'alta': '🟠',
        'media': '🟡',
        'baja': '🟢'
      }[contacto.prioridad] || '⚪';

      console.log(`\n${index + 1}. ${contacto.nombre}`);
      console.log(`   Estado: ${estadoEmoji} ${contacto.estado} | Prioridad: ${prioridadEmoji} ${contacto.prioridad}`);
      console.log(`   Correo: ${contacto.correo} | Celular: ${contacto.celular}`);
      console.log(`   Mensaje: ${contacto.mensaje.substring(0, 60)}...`);
      if (contacto.notas.length > 0) {
        console.log(`   📝 Notas: ${contacto.notas.length}`);
      }
      if (contacto.etiquetas.length > 0) {
        console.log(`   🏷️  Tags: ${contacto.etiquetas.join(', ')}`);
      }
    });

    console.log('\n\n🎉 ¡Script completado exitosamente!');
    console.log(`\n✅ Total de contactos creados: ${contactosCreados.length}`);
    
    console.log('\n📍 Próximos pasos:');
    console.log('   1. Verificar en MongoDB que los contactos se crearon');
    console.log('   2. Probar endpoints en Postman o con scripts');
    console.log('   3. Verificar permisos con diferentes roles');
    console.log('   4. Continuar con Fase 2: Frontend Público\n');

  } catch (error) {
    console.error('\n❌ Error al poblar contactos:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Ejecutar el script
poblarContactos();
