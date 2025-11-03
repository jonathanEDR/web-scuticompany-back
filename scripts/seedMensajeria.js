import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lead from '../models/Lead.js';
import LeadMessage from '../models/LeadMessage.js';
import MessageTemplate from '../models/MessageTemplate.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Cargar variables de entorno
dotenv.config();

/**
 * 🌱 Script de Seeding para Sistema de Mensajería CRM
 * Crea datos de prueba para testing
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';

// Datos de usuarios de ejemplo (deberían existir en Clerk)
const USUARIOS_EJEMPLO = {
  admin: {
    id: 'user_admin_test',
    firstName: 'Admin',
    lastName: 'Principal',
    email: 'admin@scuti.com',
    role: 'ADMIN'
  },
  moderator: {
    id: 'user_moderator_test',
    firstName: 'Moderador',
    lastName: 'Ventas',
    email: 'moderator@scuti.com',
    role: 'MODERATOR'
  },
  cliente1: {
    id: 'user_client_test_1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@ejemplo.com',
    role: 'CLIENT'
  },
  cliente2: {
    id: 'user_client_test_2',
    firstName: 'María',
    lastName: 'González',
    email: 'maria.gonzalez@ejemplo.com',
    role: 'CLIENT'
  }
};

/**
 * Conectar a MongoDB
 */
const conectarDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.success('✅ Conectado a MongoDB');
  } catch (error) {
    logger.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

/**
 * Limpiar datos existentes (opcional)
 */
const limpiarDatos = async () => {
  try {
    logger.info('🗑️  Limpiando datos de prueba anteriores...');
    
    // Eliminar leads de prueba
    await Lead.deleteMany({
      $or: [
        { correo: /ejemplo\.com$/ },
        { nombre: /Test|Prueba/i }
      ]
    });
    
    // Eliminar mensajes de prueba
    await LeadMessage.deleteMany({
      $or: [
        { 'autor.email': /ejemplo\.com$/ },
        { contenido: /SEED_TEST/ }
      ]
    });
    
    logger.success('✅ Datos anteriores eliminados');
  } catch (error) {
    logger.error('❌ Error limpiando datos:', error);
  }
};

/**
 * Crear leads de ejemplo
 */
const crearLeads = async () => {
  try {
    logger.info('📝 Creando leads de ejemplo...');
    
    const leads = [
      {
        nombre: 'Juan Pérez',
        celular: '+52 555 123 4567',
        correo: 'juan.perez@ejemplo.com',
        empresa: 'TechStart México',
        tipoServicio: 'web',
        descripcionProyecto: 'Necesitamos desarrollar un sitio web corporativo con blog integrado',
        presupuestoEstimado: 50000,
        estado: 'contactado',
        prioridad: 'alta',
        origen: 'web',
        creadoPor: {
          userId: USUARIOS_EJEMPLO.admin.id,
          nombre: USUARIOS_EJEMPLO.admin.firstName,
          email: USUARIOS_EJEMPLO.admin.email
        },
        asignadoA: {
          userId: USUARIOS_EJEMPLO.moderator.id,
          nombre: `${USUARIOS_EJEMPLO.moderator.firstName} ${USUARIOS_EJEMPLO.moderator.lastName}`,
          email: USUARIOS_EJEMPLO.moderator.email
        },
        usuarioRegistrado: {
          userId: USUARIOS_EJEMPLO.cliente1.id,
          nombre: `${USUARIOS_EJEMPLO.cliente1.firstName} ${USUARIOS_EJEMPLO.cliente1.lastName}`,
          email: USUARIOS_EJEMPLO.cliente1.email,
          vinculadoEn: new Date(),
          vinculadoPor: {
            userId: USUARIOS_EJEMPLO.admin.id,
            nombre: USUARIOS_EJEMPLO.admin.firstName
          }
        },
        tags: ['web', 'corporativo', 'alta-prioridad']
      },
      {
        nombre: 'María González',
        celular: '+52 555 987 6543',
        correo: 'maria.gonzalez@ejemplo.com',
        empresa: 'Fashion Store Online',
        tipoServicio: 'ecommerce',
        descripcionProyecto: 'Plataforma de e-commerce para venta de ropa con integración de pagos',
        presupuestoEstimado: 120000,
        estado: 'propuesta',
        prioridad: 'urgente',
        origen: 'referido',
        creadoPor: {
          userId: USUARIOS_EJEMPLO.admin.id,
          nombre: USUARIOS_EJEMPLO.admin.firstName,
          email: USUARIOS_EJEMPLO.admin.email
        },
        asignadoA: {
          userId: USUARIOS_EJEMPLO.admin.id,
          nombre: `${USUARIOS_EJEMPLO.admin.firstName} ${USUARIOS_EJEMPLO.admin.lastName}`,
          email: USUARIOS_EJEMPLO.admin.email
        },
        usuarioRegistrado: {
          userId: USUARIOS_EJEMPLO.cliente2.id,
          nombre: `${USUARIOS_EJEMPLO.cliente2.firstName} ${USUARIOS_EJEMPLO.cliente2.lastName}`,
          email: USUARIOS_EJEMPLO.cliente2.email,
          vinculadoEn: new Date(),
          vinculadoPor: {
            userId: USUARIOS_EJEMPLO.admin.id,
            nombre: USUARIOS_EJEMPLO.admin.firstName
          }
        },
        tags: ['ecommerce', 'urgente', 'pagos']
      },
      {
        nombre: 'Carlos Ramírez',
        celular: '+52 555 456 7890',
        correo: 'carlos.ramirez@ejemplo.com',
        empresa: 'Consultoría Legal',
        tipoServicio: 'sistemas',
        descripcionProyecto: 'Sistema de gestión de casos legales y clientes',
        presupuestoEstimado: 80000,
        estado: 'nuevo',
        prioridad: 'media',
        origen: 'redes_sociales',
        creadoPor: {
          userId: USUARIOS_EJEMPLO.admin.id,
          nombre: USUARIOS_EJEMPLO.admin.firstName,
          email: USUARIOS_EJEMPLO.admin.email
        },
        asignadoA: {
          userId: USUARIOS_EJEMPLO.moderator.id,
          nombre: `${USUARIOS_EJEMPLO.moderator.firstName} ${USUARIOS_EJEMPLO.moderator.lastName}`,
          email: USUARIOS_EJEMPLO.moderator.email
        },
        tags: ['sistemas', 'legal', 'crm']
      }
    ];
    
    const leadsCreados = await Lead.insertMany(leads);
    logger.success(`✅ ${leadsCreados.length} leads creados`);
    
    return leadsCreados;
    
  } catch (error) {
    logger.error('❌ Error creando leads:', error);
    throw error;
  }
};

/**
 * Crear mensajes de ejemplo
 */
const crearMensajes = async (leads) => {
  try {
    logger.info('💬 Creando mensajes de ejemplo...');
    
    const mensajes = [];
    
    // Lead 1: Juan Pérez (Conversación activa)
    const lead1 = leads[0];
    
    // Mensaje interno 1
    mensajes.push({
      leadId: lead1._id,
      tipo: 'nota_interna',
      autor: {
        userId: USUARIOS_EJEMPLO.moderator.id,
        nombre: `${USUARIOS_EJEMPLO.moderator.firstName} ${USUARIOS_EJEMPLO.moderator.lastName}`,
        email: USUARIOS_EJEMPLO.moderator.email,
        rol: USUARIOS_EJEMPLO.moderator.role
      },
      contenido: 'SEED_TEST: Cliente muy interesado. Tuve una llamada inicial, quiere ver propuesta.',
      esPrivado: true,
      estado: 'enviado',
      prioridad: 'alta',
      etiquetas: ['seguimiento', 'llamada']
    });
    
    // Mensaje al cliente 1
    mensajes.push({
      leadId: lead1._id,
      tipo: 'mensaje_cliente',
      autor: {
        userId: USUARIOS_EJEMPLO.moderator.id,
        nombre: `${USUARIOS_EJEMPLO.moderator.firstName} ${USUARIOS_EJEMPLO.moderator.lastName}`,
        email: USUARIOS_EJEMPLO.moderator.email,
        rol: USUARIOS_EJEMPLO.moderator.role
      },
      destinatario: {
        userId: USUARIOS_EJEMPLO.cliente1.id,
        nombre: `${USUARIOS_EJEMPLO.cliente1.firstName} ${USUARIOS_EJEMPLO.cliente1.lastName}`,
        email: USUARIOS_EJEMPLO.cliente1.email,
        rol: 'CLIENT'
      },
      asunto: 'Seguimiento - Desarrollo Web Corporativo',
      contenido: 'SEED_TEST: Hola Juan, fue un placer hablar contigo. Te enviaré la propuesta mañana con los detalles que comentamos.',
      esPrivado: false,
      estado: 'leido',
      prioridad: 'normal',
      leido: true,
      fechaLectura: new Date(Date.now() - 2 * 60 * 60 * 1000) // Hace 2 horas
    });
    
    // Respuesta del cliente 1
    const mensaje1Id = new mongoose.Types.ObjectId();
    mensajes.push({
      _id: mensaje1Id,
      leadId: lead1._id,
      tipo: 'respuesta_cliente',
      autor: {
        userId: USUARIOS_EJEMPLO.cliente1.id,
        nombre: `${USUARIOS_EJEMPLO.cliente1.firstName} ${USUARIOS_EJEMPLO.cliente1.lastName}`,
        email: USUARIOS_EJEMPLO.cliente1.email,
        rol: 'CLIENT'
      },
      contenido: 'SEED_TEST: Perfecto, quedo atento a la propuesta. ¿Incluirá el diseño responsive?',
      esPrivado: false,
      estado: 'enviado',
      prioridad: 'normal',
      leido: false
    });
    
    // Lead 2: María González (Propuesta enviada)
    const lead2 = leads[1];
    
    mensajes.push({
      leadId: lead2._id,
      tipo: 'nota_interna',
      autor: {
        userId: USUARIOS_EJEMPLO.admin.id,
        nombre: `${USUARIOS_EJEMPLO.admin.firstName} ${USUARIOS_EJEMPLO.admin.lastName}`,
        email: USUARIOS_EJEMPLO.admin.email,
        rol: USUARIOS_EJEMPLO.admin.role
      },
      contenido: 'SEED_TEST: Propuesta enviada por correo. Presupuesto: $120,000. Plazo: 8 semanas.',
      esPrivado: true,
      estado: 'enviado',
      prioridad: 'urgente',
      etiquetas: ['propuesta', 'cotizacion']
    });
    
    mensajes.push({
      leadId: lead2._id,
      tipo: 'mensaje_cliente',
      autor: {
        userId: USUARIOS_EJEMPLO.admin.id,
        nombre: `${USUARIOS_EJEMPLO.admin.firstName} ${USUARIOS_EJEMPLO.admin.lastName}`,
        email: USUARIOS_EJEMPLO.admin.email,
        rol: USUARIOS_EJEMPLO.admin.role
      },
      destinatario: {
        userId: USUARIOS_EJEMPLO.cliente2.id,
        nombre: `${USUARIOS_EJEMPLO.cliente2.firstName} ${USUARIOS_EJEMPLO.cliente2.lastName}`,
        email: USUARIOS_EJEMPLO.cliente2.email,
        rol: 'CLIENT'
      },
      asunto: 'Propuesta E-commerce Fashion Store',
      contenido: 'SEED_TEST: Hola María, adjunto encontrarás la propuesta completa para tu tienda online. Incluye integración con Stripe y diseño personalizado.',
      esPrivado: false,
      estado: 'leido',
      prioridad: 'alta',
      leido: true,
      fechaLectura: new Date(Date.now() - 24 * 60 * 60 * 1000) // Hace 1 día
    });
    
    // Lead 3: Carlos (Sin mensajes al cliente, solo internos)
    const lead3 = leads[2];
    
    mensajes.push({
      leadId: lead3._id,
      tipo: 'nota_interna',
      autor: {
        userId: USUARIOS_EJEMPLO.moderator.id,
        nombre: `${USUARIOS_EJEMPLO.moderator.firstName} ${USUARIOS_EJEMPLO.moderator.lastName}`,
        email: USUARIOS_EJEMPLO.moderator.email,
        rol: USUARIOS_EJEMPLO.moderator.role
      },
      contenido: 'SEED_TEST: Lead nuevo, pendiente primer contacto. Revisar disponibilidad para llamada.',
      esPrivado: true,
      estado: 'enviado',
      prioridad: 'media',
      etiquetas: ['nuevo', 'pendiente-contacto']
    });
    
    const mensajesCreados = await LeadMessage.insertMany(mensajes);
    logger.success(`✅ ${mensajesCreados.length} mensajes creados`);
    
    // Actualizar actividades en los leads
    for (const lead of leads) {
      const leadDoc = await Lead.findById(lead._id);
      
      // Agregar algunas actividades de ejemplo
      await leadDoc.agregarActividad(
        'nota',
        'Lead creado desde el sitio web',
        USUARIOS_EJEMPLO.admin
      );
      
      if (lead.estado !== 'nuevo') {
        await leadDoc.agregarActividad(
          'llamada',
          'Llamada inicial realizada. Cliente muy interesado.',
          USUARIOS_EJEMPLO.moderator
        );
      }
    }
    
    logger.success('✅ Actividades agregadas a los leads');
    
  } catch (error) {
    logger.error('❌ Error creando mensajes:', error);
    throw error;
  }
};

/**
 * Verificar plantillas
 */
const verificarPlantillas = async () => {
  try {
    logger.info('📄 Verificando plantillas...');
    
    const totalPlantillas = await MessageTemplate.countDocuments();
    
    if (totalPlantillas === 0) {
      logger.info('📝 Creando plantillas por defecto...');
      await MessageTemplate.crearPlantillasDefault();
      logger.success('✅ Plantillas por defecto creadas');
    } else {
      logger.success(`✅ ${totalPlantillas} plantillas existentes`);
    }
    
  } catch (error) {
    logger.error('❌ Error verificando plantillas:', error);
  }
};

/**
 * Mostrar resumen
 */
const mostrarResumen = async () => {
  try {
    logger.info('\n📊 RESUMEN DE DATOS DE PRUEBA:');
    logger.info('═══════════════════════════════════════');
    
    const totalLeads = await Lead.countDocuments();
    const totalMensajes = await LeadMessage.countDocuments();
    const totalPlantillas = await MessageTemplate.countDocuments();
    const leadsConUsuario = await Lead.countDocuments({ 
      'usuarioRegistrado.userId': { $exists: true } 
    });
    
    console.log(`
📝 Leads creados: ${totalLeads}
   - Con usuario vinculado: ${leadsConUsuario}
   
💬 Mensajes creados: ${totalMensajes}
   - Notas internas: ${await LeadMessage.countDocuments({ tipo: 'nota_interna' })}
   - Mensajes a clientes: ${await LeadMessage.countDocuments({ tipo: 'mensaje_cliente' })}
   - Respuestas de clientes: ${await LeadMessage.countDocuments({ tipo: 'respuesta_cliente' })}
   
📄 Plantillas disponibles: ${totalPlantillas}
    `);
    
    logger.info('═══════════════════════════════════════');
    logger.info('\n🎯 DATOS DE ACCESO PARA TESTING:\n');
    
    console.log('USUARIOS:');
    Object.entries(USUARIOS_EJEMPLO).forEach(([key, user]) => {
      console.log(`  ${key}: ${user.email} (${user.role})`);
    });
    
    const leads = await Lead.find().limit(3).select('nombre correo estado');
    console.log('\nLEADS:');
    leads.forEach((lead, i) => {
      console.log(`  ${i + 1}. ${lead.nombre} - ${lead.correo} (${lead.estado})`);
    });
    
    logger.success('\n✅ Datos de prueba creados exitosamente');
    logger.info('🚀 Ya puedes empezar a probar los endpoints de mensajería\n');
    
  } catch (error) {
    logger.error('❌ Error mostrando resumen:', error);
  }
};

/**
 * Ejecutar seeding completo
 */
const ejecutarSeed = async () => {
  try {
    logger.startup('🌱 INICIANDO SEEDING DE MENSAJERÍA CRM');
    logger.info('═══════════════════════════════════════\n');
    
    await conectarDB();
    await limpiarDatos();
    await verificarPlantillas();
    const leads = await crearLeads();
    await crearMensajes(leads);
    await mostrarResumen();
    
    logger.success('🎉 Seeding completado exitosamente\n');
    
  } catch (error) {
    logger.error('❌ Error en el proceso de seeding:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('👋 Conexión a MongoDB cerrada');
    process.exit(0);
  }
};

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  ejecutarSeed();
}

export default ejecutarSeed;
