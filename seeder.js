import dotenv from 'dotenv';
import connectDB from './config/database.js';
import Servicio from './models/Servicio.js';

dotenv.config();

// Datos de ejemplo para servicios
const serviciosData = [
  {
    titulo: 'Desarrollo Web Profesional',
    descripcion: 'Creación de sitios web modernos, responsivos y optimizados para SEO. Utilizamos las últimas tecnologías como React, Node.js y MongoDB.',
    icono: '💻',
    precio: 1500,
    categoria: 'desarrollo',
    destacado: true,
    caracteristicas: [
      'Diseño responsive',
      'Optimización SEO',
      'Panel de administración',
      'Alta velocidad de carga',
      'Seguridad SSL'
    ],
    metaTitle: 'Desarrollo Web Profesional | Web Scuti',
    metaDescription: 'Desarrollo de sitios web profesionales con React y Node.js. Optimizados para SEO y con diseño moderno.'
  },
  {
    titulo: 'Diseño UI/UX',
    descripcion: 'Diseño de interfaces de usuario atractivas y experiencias de usuario intuitivas. Wireframes, prototipos y diseño final.',
    icono: '🎨',
    precio: 800,
    categoria: 'diseño',
    destacado: true,
    caracteristicas: [
      'Investigación de usuarios',
      'Wireframes y prototipos',
      'Diseño visual',
      'Testing de usabilidad',
      'Design system'
    ],
    metaTitle: 'Diseño UI/UX Profesional | Web Scuti',
    metaDescription: 'Servicios de diseño UI/UX para crear experiencias digitales excepcionales y atractivas.'
  },
  {
    titulo: 'Marketing Digital',
    descripcion: 'Estrategias de marketing digital para aumentar tu presencia online. SEO, SEM, redes sociales y content marketing.',
    icono: '📊',
    precio: 1200,
    categoria: 'marketing',
    destacado: true,
    caracteristicas: [
      'Estrategia SEO',
      'Google Ads',
      'Redes sociales',
      'Email marketing',
      'Analytics y reportes'
    ],
    metaTitle: 'Marketing Digital | Web Scuti',
    metaDescription: 'Impulsa tu negocio con nuestras estrategias de marketing digital y SEO profesional.'
  },
  {
    titulo: 'E-commerce',
    descripcion: 'Tiendas online completas con carrito de compras, pasarelas de pago y gestión de inventario.',
    icono: '🛒',
    precio: 2500,
    categoria: 'desarrollo',
    destacado: false,
    caracteristicas: [
      'Carrito de compras',
      'Pasarelas de pago',
      'Gestión de inventario',
      'Dashboard administrativo',
      'Notificaciones automáticas'
    ],
    metaTitle: 'Desarrollo de E-commerce | Web Scuti',
    metaDescription: 'Crea tu tienda online profesional con todas las funcionalidades necesarias para vender.'
  },
  {
    titulo: 'Aplicaciones Móviles',
    descripcion: 'Desarrollo de aplicaciones móviles nativas e híbridas para iOS y Android con React Native.',
    icono: '📱',
    precio: 3000,
    categoria: 'desarrollo',
    destacado: false,
    caracteristicas: [
      'iOS y Android',
      'React Native',
      'Push notifications',
      'Integración con APIs',
      'Publicación en stores'
    ],
    metaTitle: 'Desarrollo de Apps Móviles | Web Scuti',
    metaDescription: 'Apps móviles profesionales para iOS y Android con React Native.'
  },
  {
    titulo: 'Consultoría Tecnológica',
    descripcion: 'Asesoramiento técnico para proyectos digitales. Análisis, arquitectura y mejores prácticas.',
    icono: '💡',
    precio: 500,
    categoria: 'consultoría',
    destacado: false,
    caracteristicas: [
      'Análisis de requerimientos',
      'Arquitectura de software',
      'Selección de tecnologías',
      'Code review',
      'Mejores prácticas'
    ],
    metaTitle: 'Consultoría Tecnológica | Web Scuti',
    metaDescription: 'Asesoramiento técnico profesional para tu proyecto digital.'
  }
];

// Función para importar datos
const importData = async () => {
  try {
    await connectDB();

    // Limpiar colección existente
    await Servicio.deleteMany();
    console.log('🗑️  Datos anteriores eliminados');

    // Insertar nuevos datos
    const servicios = await Servicio.insertMany(serviciosData);
    console.log(`✅ ${servicios.length} servicios importados exitosamente`);
    
    console.log('\n📋 Servicios creados:');
    servicios.forEach(servicio => {
      console.log(`   - ${servicio.titulo} (${servicio.categoria})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al importar datos:', error);
    process.exit(1);
  }
};

// Función para eliminar datos
const deleteData = async () => {
  try {
    await connectDB();
    await Servicio.deleteMany();
    console.log('🗑️  Todos los datos eliminados');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al eliminar datos:', error);
    process.exit(1);
  }
};

// Ejecutar según el argumento de línea de comandos
if (process.argv[2] === '-d') {
  deleteData();
} else {
  importData();
}
