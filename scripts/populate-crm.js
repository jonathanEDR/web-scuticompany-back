/**
 * 🧪 Script para poblar el CRM con datos de prueba
 * Ejecutar: node scripts/populate-crm.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lead from '../models/Lead.js';
import User from '../models/User.js';

// Cargar variables de entorno
dotenv.config();

// Función para conectar a la DB (copiada del config)
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';
    await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}\n`);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// Datos de prueba para leads
const sampleLeads = [
  {
    nombre: 'Carlos Mendoza',
    celular: '+51987654321',
    correo: 'carlos.mendoza@techcorp.com',
    empresa: 'TechCorp SAC',
    tipoServicio: 'web',
    descripcionProyecto: 'Necesitamos un sitio web corporativo moderno con sección de blog y portafolio de proyectos. Diseño responsive y optimizado para SEO.',
    presupuestoEstimado: 5000,
    fechaDeseada: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    prioridad: 'alta',
    origen: 'web',
    estado: 'nuevo',
    tags: ['corporativo', 'urgente', 'seo']
  },
  {
    nombre: 'María González',
    celular: '+51998765432',
    correo: 'maria.gonzalez@ecommerceperu.com',
    empresa: 'E-commerce Perú',
    tipoServicio: 'ecommerce',
    descripcionProyecto: 'Plataforma de e-commerce para venta de productos artesanales. Necesitamos integración con pasarelas de pago locales y sistema de inventario.',
    presupuestoEstimado: 8000,
    fechaDeseada: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 días
    prioridad: 'media',
    origen: 'referido',
    estado: 'contactado',
    tags: ['ecommerce', 'pagos', 'inventario']
  },
  {
    nombre: 'Roberto Silva',
    celular: '+51976543210',
    correo: 'roberto.silva@startuplab.pe',
    empresa: 'Startup Lab',
    tipoServicio: 'app',
    descripcionProyecto: 'Aplicación móvil para delivery de comida con sistema de tracking en tiempo real. iOS y Android nativos.',
    presupuestoEstimado: 15000,
    fechaDeseada: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días
    prioridad: 'urgente',
    origen: 'redes_sociales',
    estado: 'calificado',
    tags: ['mobile', 'delivery', 'tracking']
  },
  {
    nombre: 'Ana Torres',
    celular: '+51987123456',
    correo: 'ana.torres@consultingpro.com',
    empresa: 'Consulting Pro',
    tipoServicio: 'consultoria',
    descripcionProyecto: 'Consultoría para migración de sistemas legacy a arquitectura cloud. Incluye capacitación del equipo técnico.',
    presupuestoEstimado: 12000,
    fechaDeseada: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 días
    prioridad: 'media',
    origen: 'email',
    estado: 'propuesta',
    tags: ['cloud', 'consultoria', 'capacitacion']
  },
  {
    nombre: 'Luis Ramírez',
    celular: '+51965432109',
    correo: 'luis.ramirez@designstudio.pe',
    empresa: 'Design Studio',
    tipoServicio: 'diseño',
    descripcionProyecto: 'Rediseño completo de marca corporativa incluyendo logo, paleta de colores, tipografía y manual de identidad.',
    presupuestoEstimado: 3500,
    fechaDeseada: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 días
    prioridad: 'baja',
    origen: 'web',
    estado: 'negociacion',
    tags: ['branding', 'diseño', 'identidad']
  },
  {
    nombre: 'Patricia Vega',
    celular: '+51998123456',
    correo: 'patricia.vega@marketingdigital.com',
    empresa: 'Marketing Digital SAC',
    tipoServicio: 'marketing',
    descripcionProyecto: 'Campaña de marketing digital integral: SEO, SEM, redes sociales y email marketing. Duración 6 meses.',
    presupuestoEstimado: 6000,
    fechaDeseada: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 días
    prioridad: 'alta',
    origen: 'evento',
    estado: 'ganado',
    tags: ['marketing', 'seo', 'redes-sociales']
  },
  {
    nombre: 'Diego Morales',
    celular: '+51987654098',
    correo: 'diego.morales@sistemasrp.com',
    empresa: 'Sistemas RP',
    tipoServicio: 'sistemas',
    descripcionProyecto: 'Sistema de gestión empresarial (ERP) personalizado para gestión de inventarios, ventas y contabilidad.',
    presupuestoEstimado: 20000,
    fechaDeseada: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 días
    prioridad: 'media',
    origen: 'telefono',
    estado: 'perdido',
    tags: ['erp', 'gestion', 'inventario']
  },
  {
    nombre: 'Sandra Flores',
    celular: '+51976123098',
    correo: 'sandra.flores@innovatech.pe',
    empresa: 'Innova Tech',
    tipoServicio: 'web',
    descripcionProyecto: 'Landing page para campaña de lanzamiento de producto con formulario de registro y sistema de referidos.',
    presupuestoEstimado: 2500,
    fechaDeseada: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 días
    prioridad: 'urgente',
    origen: 'chat',
    estado: 'nuevo',
    tags: ['landing', 'producto', 'referidos']
  },
  {
    nombre: 'Fernando Castro',
    celular: '+51965098321',
    correo: 'fernando.castro@educacionplus.com',
    empresa: 'Educación Plus',
    tipoServicio: 'sistemas',
    descripcionProyecto: 'Plataforma educativa online con sistema de cursos, evaluaciones y certificados digitales. Incluye panel de administración.',
    presupuestoEstimado: 10000,
    fechaDeseada: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000), // 75 días
    prioridad: 'alta',
    origen: 'web',
    estado: 'contactado',
    tags: ['educacion', 'lms', 'certificados']
  },
  {
    nombre: 'Isabella Rojas',
    celular: '+51998765098',
    correo: 'isabella.rojas@beautyshop.pe',
    empresa: 'Beauty Shop',
    tipoServicio: 'ecommerce',
    descripcionProyecto: 'Tienda online de productos de belleza con catálogo virtual, carrito de compras y sistema de reservas para servicios.',
    presupuestoEstimado: 4500,
    fechaDeseada: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // 40 días
    prioridad: 'media',
    origen: 'redes_sociales',
    estado: 'pausado',
    tags: ['belleza', 'ecommerce', 'reservas']
  }
];

/**
 * Función principal para poblar datos
 */
const populateCRM = async () => {
  try {
    console.log('🚀 Iniciando población del CRM...\n');

    // Conectar a la base de datos
    await connectDB();

    // Obtener el primer Super Admin para asignar algunos leads
    const superAdmin = await User.findOne({ role: 'super_admin' });
    
    if (!superAdmin) {
      console.log('⚠️ No se encontró un Super Admin. Los leads no serán asignados.');
    }

    // Limpiar leads existentes (opcional - comentar si no quieres borrar)
    const deleteCount = await Lead.countDocuments();
    if (deleteCount > 0) {
      console.log(`🗑️ Eliminando ${deleteCount} leads existentes...`);
      await Lead.deleteMany({});
    }

    // Crear los leads
    console.log('📝 Creando leads de prueba...\n');
    
    const createdLeads = [];
    for (const leadData of sampleLeads) {
      // Agregar información del creador
      const leadWithCreator = {
        ...leadData,
        creadoPor: {
          userId: superAdmin?.clerkId || 'system_seed',
          nombre: superAdmin ? `${superAdmin.firstName} ${superAdmin.lastName}` : 'Sistema',
          email: superAdmin?.email || 'sistema@webscuti.com'
        }
      };
      
      const lead = new Lead(leadWithCreator);
      
      // Asignar algunos leads al Super Admin (los que están en estados avanzados)
      if (superAdmin && ['propuesta', 'negociacion', 'ganado'].includes(lead.estado)) {
        await lead.asignarA({
          id: superAdmin.clerkId,
          firstName: superAdmin.firstName,
          lastName: superAdmin.lastName,
          email: superAdmin.email,
          fullName: `${superAdmin.firstName} ${superAdmin.lastName}`
        });
      }

      // Agregar algunas actividades de ejemplo
      if (lead.estado !== 'nuevo') {
        lead.actividades.push({
          tipo: 'nota',
          descripcion: 'Primer contacto establecido. Cliente interesado en conocer propuesta.',
          usuarioId: superAdmin?.clerkId || 'system_seed',
          usuarioNombre: superAdmin ? `${superAdmin.firstName} ${superAdmin.lastName}` : 'Sistema'
        });
      }

      if (['propuesta', 'negociacion', 'ganado'].includes(lead.estado)) {
        lead.actividades.push({
          tipo: 'email',
          descripcion: 'Propuesta comercial enviada con detalles técnicos y económicos.',
          usuarioId: superAdmin?.clerkId || 'system_seed',
          usuarioNombre: superAdmin ? `${superAdmin.firstName} ${superAdmin.lastName}` : 'Sistema'
        });
      }

      await lead.save();
      createdLeads.push(lead);
      
      console.log(`✅ Lead creado: ${lead.nombre} (${lead.empresa}) - Estado: ${lead.estado}`);
    }

    console.log(`\n✅ ${createdLeads.length} leads creados exitosamente!`);
    
    // Mostrar resumen por estado
    console.log('\n📊 Resumen por estado:');
    const stats = await Lead.aggregate([
      { $group: { _id: '$estado', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    stats.forEach(stat => {
      console.log(`   - ${stat._id}: ${stat.count} leads`);
    });

    console.log('\n🎉 ¡Población del CRM completada con éxito!');
    console.log('👉 Accede a http://localhost:5173/dashboard/crm para verlos\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error poblando el CRM:', error);
    process.exit(1);
  }
};

// Ejecutar el script
populateCRM();
