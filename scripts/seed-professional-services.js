/**
 * Script para crear servicios profesionales de ejemplo
 * Ejecutar: node scripts/seed-professional-services.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const servicioSchema = new mongoose.Schema({}, { strict: false });
const Servicio = mongoose.model('Servicio', servicioSchema, 'servicios');
const Categoria = mongoose.model('Categoria', new mongoose.Schema({}, { strict: false }), 'categorias');

const serviciosProfesionales = [
  {
    titulo: 'Desarrollo Web Empresarial',
    slug: 'desarrollo-web-empresarial',
    descripcionCorta: 'Sitio web corporativo profesional con diseño responsivo y optimizado para SEO',
    precio: 2800,
    duracion: { valor: 4, unidad: 'semanas' },
    categoria: 'Desarrollo',
    destacado: true
  },
  {
    titulo: 'E-commerce Completo',
    slug: 'e-commerce-completo',
    descripcionCorta: 'Tienda online con carrito de compras, pasarela de pagos y panel administrativo',
    precio: 4500,
    duracion: { valor: 6, unidad: 'semanas' },
    categoria: 'Desarrollo',
    destacado: true
  },
  {
    titulo: 'Sistema CRM Personalizado',
    slug: 'sistema-crm-personalizado',
    descripcionCorta: 'Gestión completa de clientes, ventas y seguimiento de leads',
    precio: 5200,
    duracion: { valor: 8, unidad: 'semanas' },
    categoria: 'Desarrollo',
    destacado: true
  },
  {
    titulo: 'Aplicación Móvil iOS/Android',
    slug: 'aplicacion-movil-ios-android',
    descripcionCorta: 'App nativa o híbrida para ambas plataformas con diseño moderno',
    precio: 6800,
    duracion: { valor: 10, unidad: 'semanas' },
    categoria: 'Desarrollo',
    destacado: false
  },
  {
    titulo: 'Consultoría SEO Avanzada',
    slug: 'consultoria-seo-avanzada',
    descripcionCorta: 'Optimización completa de tu sitio para posicionar en Google',
    precio: 1500,
    duracion: { valor: 1, unidad: 'meses' },
    categoria: 'Consultoría',
    destacado: false
  },
  {
    titulo: 'Mantenimiento Web Mensual',
    slug: 'mantenimiento-web-mensual',
    descripcionCorta: 'Actualizaciones, backups y soporte técnico para tu sitio web',
    precio: 350,
    duracion: { valor: 1, unidad: 'meses' },
    categoria: 'Mantenimiento',
    destacado: false
  },
  {
    titulo: 'Marketing Digital 360°',
    slug: 'marketing-digital-360',
    descripcionCorta: 'Estrategia completa de redes sociales, email marketing y publicidad',
    precio: 2200,
    duracion: { valor: 1, unidad: 'meses' },
    categoria: 'Marketing',
    destacado: false
  },
  {
    titulo: 'Diseño de Identidad Corporativa',
    slug: 'diseno-identidad-corporativa',
    descripcionCorta: 'Logo, manual de marca y papelería profesional para tu empresa',
    precio: 1800,
    duracion: { valor: 3, unidad: 'semanas' },
    categoria: 'Diseño',
    destacado: false
  }
];

async function seedServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti');
    console.log('✅ Conectado a MongoDB\n');

    // Obtener categorías
    const categorias = await Categoria.find().lean();
    const categoriasMap = Object.fromEntries(categorias.map(c => [c.nombre, c._id]));

    console.log('📋 Categorías disponibles:', Object.keys(categoriasMap));
    console.log('');

    // Eliminar servicios de prueba
    console.log('🗑️  Eliminando servicios de prueba...');
    const serviciosPrueba = ['cvx', 'dsf', 'trs', 'trd', 'tes', 'test'];
    for (const keyword of serviciosPrueba) {
      const deleted = await Servicio.deleteMany({ 
        titulo: { $regex: keyword, $options: 'i' }
      });
      if (deleted.deletedCount > 0) {
        console.log(`   ✓ Eliminados ${deleted.deletedCount} servicios con "${keyword}"`);
      }
    }
    console.log('');

    // Crear servicios profesionales
    console.log('🚀 Creando servicios profesionales...\n');

    for (const servicio of serviciosProfesionales) {
      const categoriaId = categoriasMap[servicio.categoria];
      if (!categoriaId) {
        console.log(`⚠️  Categoría "${servicio.categoria}" no encontrada, saltando ${servicio.titulo}`);
        continue;
      }

      // Verificar si ya existe
      const existe = await Servicio.findOne({ slug: servicio.slug });
      if (existe) {
        console.log(`⏭️  "${servicio.titulo}" ya existe`);
        continue;
      }

      const nuevoServicio = await Servicio.create({
        ...servicio,
        categoria: categoriaId,
        estado: 'activo',
        visibleEnWeb: true,
        descripcion: servicio.descripcionCorta,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`✅ Creado: ${nuevoServicio.titulo} - S/ ${nuevoServicio.precio}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ Servicios profesionales creados exitosamente');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Listar servicios finales
    const serviciosFinales = await Servicio.find({ estado: 'activo' }).lean();
    console.log(`📊 Total servicios activos: ${serviciosFinales.length}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  }
}

seedServices();
