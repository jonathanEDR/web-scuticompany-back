import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Servicio from '../models/Servicio.js';
import PaqueteServicio from '../models/PaqueteServicio.js';
import logger from '../utils/logger.js';

dotenv.config();

// Plantillas de servicios predefinidas
const plantillasServicios = [
  {
    // DESARROLLO WEB
    servicio: {
      titulo: 'Desarrollo Web Profesional',
      descripcion: 'Creación de sitios web modernos y responsive con las últimas tecnologías. Diseño personalizado, optimización SEO y experiencia de usuario excepcional.',
      descripcionCorta: 'Sitios web modernos y responsive con diseño personalizado.',
      icono: '🌐',
      iconoType: 'emoji',
      colorIcono: '#4F46E5',
      colorFondo: '#EEF2FF',
      categoria: 'desarrollo',
      tipoPrecio: 'paquetes',
      precioMin: 1200,
      precioMax: 5000,
      moneda: 'USD',
      duracion: { valor: 4, unidad: 'semanas' },
      estado: 'activo',
      destacado: true,
      visibleEnWeb: true,
      caracteristicas: [
        'Diseño responsive y mobile-first',
        'Optimización SEO on-page',
        'Integración con CMS',
        'Formularios de contacto',
        'Google Analytics',
        'Certificado SSL incluido'
      ],
      tecnologias: ['React', 'Next.js', 'TailwindCSS', 'Node.js'],
      etiquetas: ['web', 'frontend', 'responsive', 'react', 'nextjs'],
      departamento: 'desarrollo',
      metaTitle: 'Desarrollo Web Profesional | Web Scuti',
      metaDescription: 'Creamos sitios web modernos y optimizados con las últimas tecnologías. Diseño responsive y SEO incluido.',
      esPlantilla: false,
      orden: 1
    },
    paquetes: [
      {
        nombre: 'Básico',
        descripcion: 'Ideal para pequeños negocios y páginas de presentación',
        precio: 1200,
        caracteristicas: [
          { texto: 'Hasta 5 páginas', incluido: true },
          { texto: 'Diseño básico personalizado', incluido: true },
          { texto: '1 revisión incluida', incluido: true },
          { texto: 'Formulario de contacto', incluido: true },
          { texto: 'Responsive design', incluido: true },
          { texto: 'Blog integrado', incluido: false },
          { texto: 'E-commerce', incluido: false },
          { texto: 'Soporte prioritario', incluido: false }
        ],
        orden: 1,
        disponible: true
      },
      {
        nombre: 'Profesional',
        descripcion: 'Para negocios en crecimiento que necesitan más funcionalidad',
        precio: 2500,
        precioOriginal: 3000,
        caracteristicas: [
          { texto: 'Hasta 10 páginas', incluido: true },
          { texto: 'Diseño custom avanzado', incluido: true },
          { texto: '3 revisiones incluidas', incluido: true },
          { texto: 'Blog integrado', incluido: true },
          { texto: 'SEO avanzado', incluido: true },
          { texto: 'Newsletter', incluido: true },
          { texto: 'Panel de administración', incluido: true },
          { texto: 'E-commerce básico', incluido: false }
        ],
        orden: 2,
        destacado: true,
        etiqueta: 'Más Popular',
        colorEtiqueta: '#10B981',
        disponible: true
      },
      {
        nombre: 'Enterprise',
        descripcion: 'Solución completa para empresas y e-commerce',
        precio: 5000,
        caracteristicas: [
          { texto: 'Páginas ilimitadas', incluido: true },
          { texto: 'Diseño premium personalizado', incluido: true },
          { texto: 'Revisiones ilimitadas', incluido: true },
          { texto: 'E-commerce completo', incluido: true },
          { texto: 'Múltiples idiomas', incluido: true },
          { texto: 'Integraciones API', incluido: true },
          { texto: 'Dashboard analytics', incluido: true },
          { texto: '6 meses soporte prioritario', incluido: true }
        ],
        orden: 3,
        disponible: true
      }
    ]
  },
  {
    // APPS MÓVILES
    servicio: {
      titulo: 'Apps Móviles',
      descripcion: 'Desarrollo de aplicaciones móviles nativas e híbridas para iOS y Android. Experiencia de usuario optimizada y rendimiento superior.',
      descripcionCorta: 'Apps móviles nativas e híbridas para iOS y Android.',
      icono: '📱',
      iconoType: 'emoji',
      colorIcono: '#8B5CF6',
      colorFondo: '#F5F3FF',
      categoria: 'desarrollo',
      tipoPrecio: 'paquetes',
      precioMin: 3000,
      precioMax: 15000,
      moneda: 'USD',
      duracion: { valor: 10, unidad: 'semanas' },
      estado: 'activo',
      destacado: true,
      visibleEnWeb: true,
      caracteristicas: [
        'Diseño nativo iOS y Android',
        'Backend y API incluidos',
        'Push notifications',
        'Integración con servicios cloud',
        'Testing y QA completo',
        'Publicación en stores'
      ],
      tecnologias: ['React Native', 'Flutter', 'Node.js', 'Firebase'],
      etiquetas: ['mobile', 'app', 'ios', 'android', 'react-native'],
      departamento: 'desarrollo',
      metaTitle: 'Desarrollo de Apps Móviles | Web Scuti',
      metaDescription: 'Desarrollamos aplicaciones móviles nativas e híbridas para iOS y Android con la mejor experiencia de usuario.',
      orden: 2
    },
    paquetes: [
      {
        nombre: 'Híbrida',
        descripcion: 'App híbrida para iOS y Android con código compartido',
        precio: 3000,
        caracteristicas: [
          { texto: 'Una plataforma (iOS o Android)', incluido: true },
          { texto: 'Hasta 10 pantallas', incluido: true },
          { texto: 'Backend básico incluido', incluido: true },
          { texto: 'Autenticación de usuarios', incluido: true },
          { texto: 'Push notifications', incluido: false },
          { texto: 'Publicación en stores', incluido: true }
        ],
        orden: 1,
        disponible: true
      },
      {
        nombre: 'Nativa',
        descripcion: 'App nativa con mejor rendimiento y experiencia',
        precio: 7000,
        caracteristicas: [
          { texto: 'iOS y Android', incluido: true },
          { texto: 'Hasta 20 pantallas', incluido: true },
          { texto: 'Backend completo', incluido: true },
          { texto: 'Push notifications', incluido: true },
          { texto: 'Integración con APIs', incluido: true },
          { texto: 'Analytics incluido', incluido: true },
          { texto: 'Soporte 3 meses', incluido: true }
        ],
        orden: 2,
        destacado: true,
        etiqueta: 'Recomendado',
        disponible: true
      },
      {
        nombre: 'Premium',
        descripcion: 'Solución completa con todas las funcionalidades',
        precio: 15000,
        caracteristicas: [
          { texto: 'iOS, Android y Web', incluido: true },
          { texto: 'Pantallas ilimitadas', incluido: true },
          { texto: 'Backend escalable', incluido: true },
          { texto: 'Integraciones avanzadas', incluido: true },
          { texto: 'Dashboard de administración', incluido: true },
          { texto: 'Testing automatizado', incluido: true },
          { texto: '6 meses soporte', incluido: true }
        ],
        orden: 3,
        disponible: true
      }
    ]
  },
  {
    // SEO & MARKETING
    servicio: {
      titulo: 'SEO & Marketing Digital',
      descripcion: 'Optimización para motores de búsqueda y estrategias de marketing digital. Aumenta tu visibilidad online y genera más leads.',
      descripcionCorta: 'SEO y marketing digital para aumentar tu visibilidad online.',
      icono: '🔍',
      iconoType: 'emoji',
      colorIcono: '#059669',
      colorFondo: '#D1FAE5',
      categoria: 'marketing',
      tipoPrecio: 'suscripcion',
      precioMin: 800,
      precioMax: 3000,
      moneda: 'USD',
      duracion: { valor: 1, unidad: 'meses' },
      estado: 'desarrollo',
      destacado: false,
      visibleEnWeb: true,
      caracteristicas: [
        'Auditoría SEO completa',
        'Optimización on-page',
        'Link building',
        'Content marketing',
        'Reportes mensuales',
        'Gestión de redes sociales'
      ],
      tecnologias: ['Google Analytics', 'SEMrush', 'Ahrefs', 'Google Ads'],
      etiquetas: ['seo', 'marketing', 'digital', 'analytics', 'ads'],
      departamento: 'marketing',
      metaTitle: 'SEO y Marketing Digital | Web Scuti',
      metaDescription: 'Servicios de SEO y marketing digital para aumentar tu visibilidad y generar más ventas online.',
      requiereContacto: false,
      orden: 3
    },
    paquetes: [
      {
        nombre: 'Básico',
        descripcion: 'Para empezar con SEO y marketing digital',
        precio: 800,
        tipoFacturacion: 'mensual',
        caracteristicas: [
          { texto: 'Auditoría SEO inicial', incluido: true },
          { texto: 'Optimización básica', incluido: true },
          { texto: '5 keywords objetivo', incluido: true },
          { texto: 'Reporte mensual', incluido: true },
          { texto: 'Link building', incluido: false },
          { texto: 'Gestión redes sociales', incluido: false }
        ],
        orden: 1,
        disponible: true
      },
      {
        nombre: 'Profesional',
        descripcion: 'Marketing completo con resultados garantizados',
        precio: 1500,
        tipoFacturacion: 'mensual',
        caracteristicas: [
          { texto: 'Todo del plan Básico', incluido: true },
          { texto: '15 keywords objetivo', incluido: true },
          { texto: 'Link building activo', incluido: true },
          { texto: 'Content marketing (4 posts/mes)', incluido: true },
          { texto: 'Gestión básica redes sociales', incluido: true },
          { texto: 'Reportes semanales', incluido: true }
        ],
        orden: 2,
        destacado: true,
        etiqueta: 'Mejor Valor',
        disponible: true
      },
      {
        nombre: 'Enterprise',
        descripcion: 'Marketing integral para empresas grandes',
        precio: 3000,
        tipoFacturacion: 'mensual',
        caracteristicas: [
          { texto: 'Keywords ilimitadas', incluido: true },
          { texto: 'Estrategia completa de marketing', incluido: true },
          { texto: 'Gestión completa redes sociales', incluido: true },
          { texto: 'Google Ads management', incluido: true },
          { texto: 'Email marketing', incluido: true },
          { texto: 'Consultor dedicado', incluido: true }
        ],
        orden: 3,
        disponible: true
      }
    ]
  },
  {
    // CONSULTORÍA
    servicio: {
      titulo: 'Consultoría Tecnológica',
      descripcion: 'Asesoría experta en tecnología, arquitectura de software y transformación digital. Ayudamos a tu empresa a tomar las mejores decisiones tecnológicas.',
      descripcionCorta: 'Asesoría experta en tecnología y transformación digital.',
      icono: '💼',
      iconoType: 'emoji',
      colorIcono: '#DC2626',
      colorFondo: '#FEE2E2',
      categoria: 'consultoría',
      tipoPrecio: 'personalizado',
      precio: 150,
      moneda: 'USD',
      duracion: { valor: 1, unidad: 'horas' },
      estado: 'activo',
      destacado: false,
      visibleEnWeb: true,
      requiereContacto: true,
      caracteristicas: [
        'Auditoría tecnológica',
        'Arquitectura de software',
        'Selección de tecnologías',
        'Roadmap tecnológico',
        'Optimización de procesos',
        'Capacitación de equipos'
      ],
      tecnologias: ['Cloud', 'DevOps', 'Arquitectura', 'Microservicios'],
      etiquetas: ['consultoria', 'tecnologia', 'arquitectura', 'estrategia'],
      departamento: 'ventas',
      metaTitle: 'Consultoría Tecnológica | Web Scuti',
      metaDescription: 'Asesoría experta en tecnología y transformación digital para empresas.',
      orden: 4
    },
    paquetes: [
      {
        nombre: 'Por Hora',
        descripcion: 'Consultoría flexible por horas',
        precio: 150,
        caracteristicas: [
          { texto: 'Sesión de 1 hora', incluido: true },
          { texto: 'Video llamada o presencial', incluido: true },
          { texto: 'Documento de recomendaciones', incluido: true },
          { texto: 'Seguimiento por email', incluido: false }
        ],
        orden: 1,
        disponible: true
      },
      {
        nombre: 'Paquete 10 Horas',
        descripcion: 'Ahorra 20% comprando paquete de horas',
        precio: 1200,
        precioOriginal: 1500,
        caracteristicas: [
          { texto: '10 horas de consultoría', incluido: true },
          { texto: 'Válido por 3 meses', incluido: true },
          { texto: 'Documentación detallada', incluido: true },
          { texto: 'Seguimiento continuo', incluido: true },
          { texto: 'Soporte por email', incluido: true }
        ],
        orden: 2,
        destacado: true,
        etiqueta: 'Ahorra 20%',
        disponible: true
      }
    ]
  },
  {
    // MANTENIMIENTO
    servicio: {
      titulo: 'Mantenimiento y Soporte',
      descripcion: 'Servicio de mantenimiento continuo para tu sitio web o aplicación. Actualizaciones, seguridad, backups y soporte técnico.',
      descripcionCorta: 'Mantenimiento continuo, actualizaciones y soporte técnico.',
      icono: '🔧',
      iconoType: 'emoji',
      colorIcono: '#F59E0B',
      colorFondo: '#FEF3C7',
      categoria: 'mantenimiento',
      tipoPrecio: 'suscripcion',
      precioMin: 200,
      precioMax: 1000,
      moneda: 'USD',
      duracion: { valor: 1, unidad: 'meses' },
      estado: 'activo',
      destacado: false,
      visibleEnWeb: true,
      caracteristicas: [
        'Actualizaciones de seguridad',
        'Backups automáticos diarios',
        'Monitoreo 24/7',
        'Corrección de bugs',
        'Optimización de rendimiento',
        'Soporte técnico prioritario'
      ],
      etiquetas: ['mantenimiento', 'soporte', 'hosting', 'seguridad'],
      departamento: 'soporte',
      metaTitle: 'Mantenimiento Web | Web Scuti',
      metaDescription: 'Servicio de mantenimiento continuo para tu sitio web con actualizaciones y soporte 24/7.',
      orden: 5
    },
    paquetes: [
      {
        nombre: 'Básico',
        descripcion: 'Mantenimiento esencial para sitios pequeños',
        precio: 200,
        tipoFacturacion: 'mensual',
        caracteristicas: [
          { texto: 'Backup semanal', incluido: true },
          { texto: 'Actualizaciones de seguridad', incluido: true },
          { texto: 'Monitoreo uptime', incluido: true },
          { texto: '2 horas soporte/mes', incluido: true },
          { texto: 'Soporte prioritario', incluido: false },
          { texto: 'Optimización mensual', incluido: false }
        ],
        orden: 1,
        disponible: true
      },
      {
        nombre: 'Profesional',
        descripcion: 'Mantenimiento completo con soporte prioritario',
        precio: 500,
        tipoFacturacion: 'mensual',
        caracteristicas: [
          { texto: 'Backup diario', incluido: true },
          { texto: 'Monitoreo 24/7', incluido: true },
          { texto: 'Actualizaciones proactivas', incluido: true },
          { texto: '10 horas soporte/mes', incluido: true },
          { texto: 'Optimización mensual', incluido: true },
          { texto: 'Reporte mensual', incluido: true },
          { texto: 'Soporte prioritario', incluido: true }
        ],
        orden: 2,
        destacado: true,
        etiqueta: 'Recomendado',
        disponible: true
      },
      {
        nombre: 'Enterprise',
        descripcion: 'Soporte dedicado para sitios críticos',
        precio: 1000,
        tipoFacturacion: 'mensual',
        caracteristicas: [
          { texto: 'Todo del plan Profesional', incluido: true },
          { texto: '30 horas soporte/mes', incluido: true },
          { texto: 'Ingeniero dedicado', incluido: true },
          { texto: 'SLA 99.9% uptime', incluido: true },
          { texto: 'Optimización semanal', incluido: true },
          { texto: 'Soporte 24/7', incluido: true }
        ],
        orden: 3,
        disponible: true
      }
    ]
  }
];

// Función para conectar a la base de datos
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.success('✅ Conectado a MongoDB');
  } catch (error) {
    logger.error('❌ Error al conectar a MongoDB:', error);
    process.exit(1);
  }
};

// Función principal para ejecutar el seed
const seedServicios = async () => {
  try {
    await connectDB();

    logger.info('🌱 Iniciando seed de servicios...');

    // Opcional: Limpiar colecciones existentes (comentar si no quieres borrar)
    // await Servicio.deleteMany({});
    // await PaqueteServicio.deleteMany({});
    // logger.info('🗑️  Colecciones limpiadas');

    let serviciosCreados = 0;
    let paquetesCreados = 0;

    for (const plantilla of plantillasServicios) {
      // Crear el servicio
      const servicio = await Servicio.create(plantilla.servicio);
      serviciosCreados++;
      logger.success(`✅ Servicio creado: ${servicio.titulo}`);

      // Crear los paquetes asociados
      if (plantilla.paquetes && plantilla.paquetes.length > 0) {
        for (const paqueteData of plantilla.paquetes) {
          const paquete = await PaqueteServicio.create({
            ...paqueteData,
            servicioId: servicio._id
          });
          paquetesCreados++;
          logger.info(`   📦 Paquete creado: ${paquete.nombre} - $${paquete.precio}`);
        }
      }
    }

    logger.success(`\n🎉 Seed completado exitosamente!`);
    logger.info(`   ✅ ${serviciosCreados} servicios creados`);
    logger.info(`   ✅ ${paquetesCreados} paquetes creados`);

  } catch (error) {
    logger.error('❌ Error durante el seed:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('👋 Conexión a MongoDB cerrada');
    process.exit(0);
  }
};

// Ejecutar el seed
seedServicios();
