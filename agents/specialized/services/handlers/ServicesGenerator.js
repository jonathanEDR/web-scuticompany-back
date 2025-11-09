/**
 * ServicesGenerator - Generador de servicios y paquetes con IA
 * 
 * Responsabilidades:
 * - CREAR servicios nuevos con IA (escribir en BD)
 * - CREAR paquetes inteligentes (escribir en BD)
 * - Generar descripciones atractivas
 * - Generar contenido de marketing
 * - Generar variaciones de servicios
 * - Validar antes de crear
 */

import mongoose from 'mongoose';
import openaiService from '../../../services/OpenAIService.js';
import Servicio from '../../../../models/Servicio.js';
import PaqueteServicio from '../../../../models/PaqueteServicio.js';
import Categoria from '../../../../models/Categoria.js';
import logger from '../../../../utils/logger.js';

class ServicesGenerator {
  constructor(config = {}) {
    this.config = {
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 2000,
      validateBeforeCreate: config.validateBeforeCreate !== false,
      autoOptimizeSEO: config.autoOptimizeSEO !== false,
      ...config
    };

    this.metrics = {
      totalGenerations: 0,
      servicesCreated: 0,
      packagesCreated: 0,
      errors: 0,
      averageTime: 0
    };

    logger.info('✅ ServicesGenerator initialized');
  }

  /**
   * CREAR servicio completo con IA (escribe en BD)
   */
  async createServiceWithAI(serviceData, context = {}) {
    const startTime = Date.now();
    this.metrics.totalGenerations++;

    try {
      logger.info('🆕 Creating service with AI assistance...');

      // 0. Si tiene requirements pero no titulo, generar base desde el prompt
      let data = { ...serviceData };
      if (data.requirements && !data.titulo) {
        logger.info('🎯 Generating service structure from requirements...');
        const baseData = await this.generateServiceFromRequirements(data.requirements, context);
        // Merge pero preservar valores existentes (especialmente categoria)
        data = { ...baseData, ...data };
      }

      // 1. Verificar que la categoría existe PRIMERO
      const categoria = await this.verifyCategory(data.categoria);
      if (!categoria) {
        throw new Error(`Categoría no encontrada: ${data.categoria}`);
      }

      // 2. Generar contenido con IA si es necesario (ANTES de validar)
      const enrichedData = await this.enrichServiceData(data, categoria, context);

      // 3. AHORA validar datos completos (después del enriquecimiento)
      this.validateServiceInput(enrichedData);

      // 4. Preparar datos para BD
      const serviceForDB = this.prepareServiceForDB(enrichedData, categoria);

      // 5. Validar datos completos antes de crear
      if (this.config.validateBeforeCreate) {
        this.validateCompleteService(serviceForDB);
      }

      // 6. CREAR EN BASE DE DATOS
      const newService = new Servicio(serviceForDB);
      await newService.save();

      this.metrics.servicesCreated++;
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime);

      logger.success(`✅ Service created successfully: ${newService._id} in ${processingTime}ms`);

      return {
        success: true,
        data: {
          service: newService,
          id: newService._id,
          serviceId: newService._id,
          titulo: newService.titulo,
          categoria: newService.categoria
        },
        metadata: {
          processingTime,
          aiGenerated: enrichedData.aiGenerated || [],
          validationsPassed: true
        }
      };

    } catch (error) {
      this.metrics.errors++;
      logger.error('❌ Error creating service with AI:', error);

      return {
        success: false,
        error: error.message,
        details: error.stack
      };
    }
  }

  /**
   * CREAR paquete con IA (escribe en BD)
   */
  async createPackageWithAI(packageData, context = {}) {
    const startTime = Date.now();
    this.metrics.totalGenerations++;

    try {
      logger.info('📦 Creating package with AI assistance...');

      // 1. Validar entrada
      if (!packageData.servicioId) {
        throw new Error('servicioId is required');
      }

      // 2. Verificar que el servicio existe
      const servicio = await Servicio.findById(packageData.servicioId);
      if (!servicio) {
        throw new Error(`Servicio no encontrado: ${packageData.servicioId}`);
      }

      // 3. Generar contenido del paquete con IA
      const enrichedPackage = await this.enrichPackageData(packageData, servicio, context);

      // 4. Preparar para BD
      const packageForDB = this.preparePackageForDB(enrichedPackage, servicio);

      // 5. CREAR EN BASE DE DATOS
      const newPackage = new PaqueteServicio(packageForDB);
      await newPackage.save();

      this.metrics.packagesCreated++;
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime);

      logger.success(`✅ Package created successfully: ${newPackage._id} in ${processingTime}ms`);

      return {
        success: true,
        data: {
          package: newPackage,
          id: newPackage._id,
          nombre: newPackage.nombre,
          precio: newPackage.precio
        },
        metadata: {
          processingTime,
          aiGenerated: enrichedPackage.aiGenerated || []
        }
      };

    } catch (error) {
      this.metrics.errors++;
      logger.error('❌ Error creating package with AI:', error);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generar solo contenido (sin crear en BD)
   */
  async generateService(requirements) {
    try {
      logger.info('🎨 Generating service content...');

      // Construir prompt
      const prompt = this.buildServiceGenerationPrompt(requirements);

      // Generar con IA
      const aiResponse = await this.callAI(prompt, 'service_generation');

      // Parsear respuesta
      const generatedService = this.parseAIServiceResponse(aiResponse);

      return {
        success: true,
        data: generatedService,
        note: 'Service generated but not saved to database. Use createServiceWithAI to save.'
      };

    } catch (error) {
      logger.error('Error generating service:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generar múltiples paquetes para un servicio
   */
  async generatePackages(serviceId, strategy = 'balanced') {
    try {
      logger.info(`📦 Generating packages for service ${serviceId}...`);

      // Obtener servicio
      const servicio = await Servicio.findById(serviceId);
      if (!servicio) {
        throw new Error('Servicio no encontrado');
      }

      // Construir prompt para paquetes
      const prompt = this.buildPackageGenerationPrompt(servicio, strategy);

      // Generar con IA
      const aiResponse = await this.callAI(prompt, 'package_generation');

      // Parsear paquetes sugeridos
      const packages = this.parseAIPackageResponse(aiResponse, servicio);

      return {
        success: true,
        data: {
          packages,
          service: { id: servicio._id, titulo: servicio.titulo }
        },
        note: 'Packages generated but not saved. Use createPackageWithAI to save each.'
      };

    } catch (error) {
      logger.error('Error generating packages:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ============================================

  /**
   * Validar datos de entrada del servicio
   */
  validateServiceInput(data) {
    if (!data.titulo || data.titulo.trim().length < 5) {
      throw new Error('Título requerido (mínimo 5 caracteres)');
    }

    if (!data.categoria) {
      throw new Error('Categoría requerida');
    }

    if (data.titulo.length > 100) {
      throw new Error('Título muy largo (máximo 100 caracteres)');
    }
  }

  /**
   * Verificar que la categoría existe
   */
  async verifyCategory(categoriaInput) {
    if (!categoriaInput) {
      logger.warn('⚠️ [VERIFY_CATEGORY] No category input provided');
      return null;
    }

    let categoria;
    
    logger.info(`🔍 [VERIFY_CATEGORY] Looking for: "${categoriaInput}"`);
    
    // 1. Buscar por ObjectId
    if (mongoose.Types.ObjectId.isValid(categoriaInput)) {
      categoria = await Categoria.findById(categoriaInput);
      if (categoria) {
        logger.success(`✅ [VERIFY_CATEGORY] Found by ID: ${categoria.nombre}`);
        return categoria;
      }
    }
    
    // 2. Buscar por slug (case-insensitive)
    categoria = await Categoria.findOne({ 
      slug: categoriaInput.toLowerCase(),
      activo: true 
    });
    if (categoria) {
      logger.success(`✅ [VERIFY_CATEGORY] Found by slug: ${categoria.nombre}`);
      return categoria;
    }
    
    // 3. Buscar por nombre (case-insensitive, fuzzy)
    const nombreLower = categoriaInput.toLowerCase().trim();
    const categorias = await Categoria.find({ activo: true });
    
    for (const cat of categorias) {
      const catNombreLower = cat.nombre.toLowerCase();
      
      // Coincidencia exacta
      if (catNombreLower === nombreLower) {
        logger.success(`✅ [VERIFY_CATEGORY] Found by exact name: ${cat.nombre}`);
        return cat;
      }
      
      // Coincidencia parcial (fuzzy)
      if (catNombreLower.includes(nombreLower) || nombreLower.includes(catNombreLower)) {
        logger.success(`✅ [VERIFY_CATEGORY] Found by fuzzy name match: ${cat.nombre}`);
        return cat;
      }
    }
    
    logger.warn(`⚠️ [VERIFY_CATEGORY] No match found for: "${categoriaInput}"`);
    return null;
  }

  /**
   * Enriquecer datos del servicio con IA
   */
  async enrichServiceData(serviceData, categoria, context) {
    const enriched = { ...serviceData };
    const aiGenerated = [];

    logger.info('🔍 [ENRICH] Starting service enrichment...');

    // Generar título si no existe o es muy corto
    if (!enriched.titulo || enriched.titulo.length < 5) {
      logger.info('🏷️ Generating title with AI...');
      const titlePrompt = this.buildTitlePrompt(enriched, categoria);
      enriched.titulo = await this.callAI(titlePrompt, 'title');
      
      if (!enriched.titulo || enriched.titulo.length < 5) {
        enriched.titulo = `${categoria.nombre} - ${new Date().getTime()}`;
        logger.warn('⚠️ Using fallback title:', enriched.titulo);
      }
      
      aiGenerated.push('titulo');
    }

    // Generar descripción si no existe o es muy corta
    if (!enriched.descripcion || enriched.descripcion.length < 50) {
      logger.info('📝 Generating description with AI...');
      const descPrompt = this.buildDescriptionPrompt(enriched, categoria);
      enriched.descripcion = await this.callAI(descPrompt, 'description');
      
      if (enriched.descripcion.length > 900) {
        enriched.descripcion = enriched.descripcion.substring(0, 897) + '...';
      }
      
      aiGenerated.push('descripcion');
    }

    // Generar descripción corta si no existe
    if (!enriched.descripcionCorta && enriched.descripcion) {
      enriched.descripcionCorta = enriched.descripcion.substring(0, 147) + '...';
      aiGenerated.push('descripcionCorta');
    }

    // Si tenemos descripcionCorta pero NO descripcion, expandir la corta
    if (enriched.descripcionCorta && (!enriched.descripcion || enriched.descripcion.length < 100)) {
      logger.info('📝 Expanding short description with AI...');
      const expandPrompt = `Expande esta descripción corta en una descripción completa y profesional:

"${enriched.descripcionCorta}"

Servicio: ${enriched.titulo}
Categoría: ${categoria.nombre}

La descripción expandida debe:
- Elaborar los puntos mencionados en la descripción corta
- Agregar detalles técnicos y beneficios específicos
- Ser profesional y atractiva
- Tener MÁXIMO 600 caracteres
- Mantener el mismo tono y mensaje

Genera solo la descripción expandida, sin títulos.`;
      
      enriched.descripcion = await this.callAI(expandPrompt, 'description_expansion');
      
      if (enriched.descripcion.length > 900) {
        enriched.descripcion = enriched.descripcion.substring(0, 897) + '...';
      }
      
      aiGenerated.push('descripcion');
    }

    // Generar características si no existen
    if (!enriched.caracteristicas || enriched.caracteristicas.length === 0) {
      logger.info('⭐ Generating features with AI...');
      const featuresPrompt = this.buildFeaturesPrompt(enriched, categoria);
      const features = await this.callAI(featuresPrompt, 'features');
      const cleanedFeatures = this.cleanAIResponse(features);
      enriched.caracteristicas = this.parseArrayResponse(cleanedFeatures);
      aiGenerated.push('caracteristicas');
    }

    // Generar beneficios si no existen
    if (!enriched.beneficios || enriched.beneficios.length === 0) {
      logger.info('💡 Generating benefits with AI...');
      const benefitsPrompt = this.buildBenefitsPrompt(enriched, categoria);
      const benefits = await this.callAI(benefitsPrompt, 'benefits');
      const cleanedBenefits = this.cleanAIResponse(benefits);
      enriched.beneficios = this.parseArrayResponse(cleanedBenefits);
      aiGenerated.push('beneficios');
    }

    enriched.aiGenerated = aiGenerated;
    
    logger.success('✅ [ENRICH] Service enrichment completed');
    
    return enriched;
  }

  /**
   * Generar estructura básica de servicio desde requisitos en texto
   */
  async generateServiceFromRequirements(requirements, context = {}) {
    logger.info('🎯 Generating service structure from text requirements...');
    
    try {
      const prompt = `Basándote en la siguiente descripción de servicio, extrae y genera:

DESCRIPCIÓN: ${requirements}

Por favor, genera un JSON con SOLO los siguientes campos (sin markdown, sin explicaciones):
{
  "titulo": "Título profesional del servicio (30-60 caracteres, SEO-friendly)",
  "descripcion": "Descripción completa (100-300 caracteres)",
  "beneficios": ["beneficio 1", "beneficio 2", "beneficio 3"],
  "caracteristicas": ["característica 1", "característica 2", "característica 3"]
}

IMPORTANTE: Responde SOLO con el JSON válido, sin comentarios ni explicaciones adicionales.`;

      const response = await this.callAI(prompt, 'service_structure');
      
      // Parsear la respuesta JSON
      let parsed = {};
      try {
        // Limpiar posibles markdown markers
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (parseError) {
        logger.warn('⚠️ Could not parse AI response as JSON, using partial data');
        // Intentar extraer al menos un título
        if (requirements.length > 0) {
          parsed.titulo = requirements.substring(0, Math.min(60, requirements.length));
        }
      }
      
      return {
        titulo: parsed.titulo || `Servicio - ${Date.now()}`,
        descripcion: parsed.descripcion,
        caracteristicas: parsed.caracteristicas || [],
        beneficios: parsed.beneficios || []
      };
    } catch (error) {
      logger.error('❌ Error generating service from requirements:', error);
      // Retornar un título fallback basado en los requisitos
      return {
        titulo: requirements.substring(0, Math.min(60, requirements.length)) || 'Nuevo Servicio',
        descripcion: `Servicio profesional: ${requirements}. Brindamos soluciones de calidad con atención personalizada y garantía de satisfacción al cliente.`
      };
    }
  }

  /**
   * Preparar servicio para BD
   */
  prepareServiceForDB(data, categoria) {
    // Validar y convertir responsable si es ObjectId válido
    let responsable = undefined;
    if (data.responsable) {
      try {
        if (mongoose.Types.ObjectId.isValid(data.responsable)) {
          responsable = data.responsable;
        }
      } catch (e) {
        // No es un ObjectId válido, omitir
      }
    }
    
    // Validar y convertir userId si es ObjectId válido
    let userId = undefined;
    if (data.userId) {
      try {
        if (mongoose.Types.ObjectId.isValid(data.userId)) {
          userId = data.userId;
        }
      } catch (e) {
        // No es un ObjectId válido, omitir
      }
    }
    
    return {
      titulo: data.titulo.trim(),
      descripcion: data.descripcion?.trim(),
      descripcionCorta: data.descripcionCorta?.trim(),
      categoria: categoria._id,
      
      // Pricing
      precio: data.precio || null,
      precioMin: data.precioMin || null,
      precioMax: data.precioMax || null,
      tipoPrecio: data.tipoPrecio || 'fijo',
      moneda: data.moneda || 'PEN',
      
      // Visualización
      icono: data.icono || '🚀',
      iconoType: data.iconoType || 'emoji',
      colorIcono: data.colorIcono || '#4F46E5',
      colorFondo: data.colorFondo || '#EEF2FF',
      
      // Estado
      estado: data.estado || 'activo',
      destacado: data.destacado || false,
      visibleEnWeb: data.visibleEnWeb !== false,
      
      // Contenido
      caracteristicas: data.caracteristicas || [],
      beneficios: data.beneficios || [],
      incluye: data.incluye || [],
      noIncluye: data.noIncluye || [],
      tecnologias: data.tecnologias || [],
      etiquetas: data.etiquetas || [],
      
      // Información adicional
      tiempoEntrega: data.tiempoEntrega,
      garantia: data.garantia,
      soporte: data.soporte || 'basico',
      
      // Metadata (solo si son ObjectIds válidos)
      ...(responsable && { responsable }),
      creadoPor: data.creadoPor || 'ServicesAgent'
    };
  }

  /**
   * Enriquecer datos del paquete con IA
   */
  async enrichPackageData(packageData, servicio, context) {
    const enriched = { ...packageData };
    const aiGenerated = [];

    // Si no hay nombre, generar uno
    if (!enriched.nombre) {
      const tier = enriched.tier || 'Estándar';
      enriched.nombre = `${servicio.titulo} - ${tier}`;
      aiGenerated.push('nombre');
    }

    // Si no hay descripción, generar una
    if (!enriched.descripcion) {
      const prompt = `Genera una descripción atractiva de 1-2 líneas para un paquete "${enriched.nombre}" del servicio "${servicio.titulo}". La descripción debe destacar el valor y beneficios.`;
      enriched.descripcion = await this.callAI(prompt, 'package_description');
      aiGenerated.push('descripcion');
    }

    // Si no hay características, generar basadas en el servicio
    if (!enriched.caracteristicas || enriched.caracteristicas.length === 0) {
      const prompt = `Lista 5-7 características específicas que incluiría un paquete "${enriched.nombre}" para el servicio "${servicio.titulo}". Formato: lista de objetos JSON con {texto, incluido, descripcion}`;
      const features = await this.callAI(prompt, 'package_features');
      enriched.caracteristicas = this.parsePackageFeaturesResponse(features);
      aiGenerated.push('caracteristicas');
    }

    enriched.aiGenerated = aiGenerated;
    return enriched;
  }

  /**
   * Preparar paquete para BD
   */
  preparePackageForDB(data, servicio) {
    return {
      servicioId: servicio._id,
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim(),
      
      // Pricing
      precio: data.precio,
      precioOriginal: data.precioOriginal,
      moneda: data.moneda || servicio.moneda || 'PEN',
      tipoFacturacion: data.tipoFacturacion || 'unico',
      
      // Contenido
      caracteristicas: data.caracteristicas || [],
      limitaciones: data.limitaciones || [],
      addons: data.addons || [],
      
      // Visualización
      destacado: data.destacado || false,
      orden: data.orden || 0,
      badge: data.badge,
      
      // Estado
      activo: data.activo !== false,
      disponible: data.disponible !== false
    };
  }

  /**
   * Validar servicio completo
   */
  validateCompleteService(service) {
    const errors = [];

    if (!service.titulo || service.titulo.length < 5) {
      errors.push('Título muy corto');
    }

    if (!service.descripcion || service.descripcion.length < 100) {
      errors.push('Descripción muy corta (mínimo 100 caracteres)');
    }

    if (!service.categoria) {
      errors.push('Categoría requerida');
    }

    if (errors.length > 0) {
      throw new Error(`Validación fallida: ${errors.join(', ')}`);
    }
  }

  /**
   * Construir prompts para IA
   */
  buildTitlePrompt(serviceData, categoria) {
    return `Genera un título profesional y atractivo para un servicio de tecnología.

Categoría: ${categoria.nombre}
${serviceData.descripcion ? `Descripción: ${serviceData.descripcion.substring(0, 200)}` : ''}
${serviceData.descripcionCorta ? `Resumen: ${serviceData.descripcionCorta}` : ''}

El título debe:
- Ser descriptivo y SEO-friendly
- Tener entre 30-60 caracteres
- Incluir palabra clave principal
- Ser atractivo para clientes
- No incluir caracteres especiales

Genera SOLO el título, sin explicaciones.`;
  }

  buildDescriptionPrompt(serviceData, categoria) {
    return `Genera una descripción profesional y atractiva para un servicio de tecnología.

Servicio: ${serviceData.titulo}
Categoría: ${categoria.nombre}
${serviceData.descripcionCorta ? `Resumen: ${serviceData.descripcionCorta}` : ''}
${serviceData.targetAudience ? `Audiencia: ${serviceData.targetAudience}` : ''}
${serviceData.requirements ? `Requisitos: ${serviceData.requirements}` : ''}

REQUISITOS ESTRICTOS:
- Descripción en UN SOLO PÁRRAFO continuo (sin saltos de línea)
- Tener MÁXIMO 600 caracteres (aproximadamente 100-120 palabras)
- Ser clara, profesional y atractiva
- Destacar el valor y beneficios principales
- Usar tono profesional pero cercano
- Incluir palabras clave relevantes para SEO

PROHIBIDO:
❌ NO dividas en múltiples párrafos
❌ NO agregues "RECOMENDACIÓN:" ni sugerencias
❌ NO agregues análisis del servicio
❌ NO agregues títulos o subtítulos
❌ NO excedas 600 caracteres

FORMATO REQUERIDO:
La descripción debe ser un texto continuo sin saltos de línea, similar a:
"En [nombre servicio], ofrecemos [propuesta de valor]. Nos especializamos en [qué hacemos] para [beneficio principal]. [Características clave]. [Resultado esperado]."

Genera SOLO la descripción en un párrafo continuo, sin formato adicional.`;
  }

  buildFeaturesPrompt(serviceData, categoria) {
    return `GENERA EXACTAMENTE UNA LISTA con viñetas para ${serviceData.titulo}.

Servicio: ${serviceData.titulo}
Descripción: ${serviceData.descripcionCorta || 'No proporcionada'}
Categoría: ${categoria.nombre}

RESPONDE SOLO CON ESTA ESTRUCTURA:
- Característica específica del servicio
- Otra característica específica del servicio  
- Tercera característica específica del servicio
- Cuarta característica específica del servicio
- Quinta característica específica del servicio

OBLIGATORIO:
✅ CADA línea debe comenzar con guión (-)
✅ Máximo 80 caracteres por línea
✅ 5-7 características
✅ Descripción DIRECTA (sin "Primera", "Segunda", etc.)
✅ SIN párrafos largos
✅ SIN doble salto de línea
✅ SIN texto extra

RESPONDE SOLO con la lista de viñetas, nada más. NO agregues explicaciones.`;
  }

  buildBenefitsPrompt(serviceData, categoria) {
    return `GENERA EXACTAMENTE UNA LISTA con viñetas para ${serviceData.titulo}.

Servicio: ${serviceData.titulo}
Descripción: ${serviceData.descripcionCorta || 'No proporcionada'}
Categoría: ${categoria.nombre}

RESPONDE SOLO CON ESTA ESTRUCTURA:
- Beneficio específico del servicio
- Otro beneficio específico del servicio
- Tercer beneficio específico del servicio
- Cuarto beneficio específico del servicio

OBLIGATORIO:
✅ CADA línea debe comenzar con guión (-)
✅ Máximo 80 caracteres por línea
✅ 4-6 beneficios
✅ Descripción DIRECTA (sin "Primer", "Segundo", etc.)
✅ SIN párrafos largos
✅ SIN doble salto de línea
✅ SIN texto extra

RESPONDE SOLO con la lista de viñetas, nada más. NO agregues explicaciones.`;
  }

  buildServiceGenerationPrompt(requirements) {
    return `Genera un servicio de tecnología completo basado en estos requisitos:

${JSON.stringify(requirements, null, 2)}

Genera un objeto JSON con esta estructura:
{
  "titulo": "Título del servicio",
  "descripcion": "Descripción completa",
  "caracteristicas": ["característica 1", "característica 2"],
  "beneficios": ["beneficio 1", "beneficio 2"],
  "precio": número o null,
  "tiempoEntrega": "X días/semanas"
}`;
  }

  buildPackageGenerationPrompt(servicio, strategy) {
    const strategies = {
      basic: 'básico para clientes que buscan lo esencial',
      balanced: 'equilibrado con buen valor-precio',
      premium: 'premium con todas las funcionalidades'
    };

    return `Genera 3 paquetes (Básico, Estándar, Premium) para este servicio:

Servicio: ${servicio.titulo}
Estrategia: ${strategies[strategy] || strategies.balanced}
Precio base: ${servicio.precio || 'No definido'}

Genera un array JSON con 3 paquetes siguiendo esta estructura:
[
  {
    "nombre": "Paquete X",
    "descripcion": "breve descripción",
    "precio": número,
    "caracteristicas": [{"texto": "feature", "incluido": true}]
  }
]`;
  }

  /**
   * Llamar a IA
   */
  async callAI(prompt, type = 'general') {
    if (!openaiService.isAvailable()) {
      logger.warn(`⚠️ OpenAI not available for ${type}, using fallback`);
      return this.getFallbackResponse(type);
    }

    try {
      const response = await openaiService.generateIntelligentResponse(
        `generator_${Date.now()}`,
        'ServicesAgent',
        prompt,
        {
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
          contextData: { type }
        }
      );

      return response.content || response.message || response;

    } catch (error) {
      logger.error(`Error calling AI for ${type}:`, error);
      // Return fallback instead of throwing
      return this.getFallbackResponse(type);
    }
  }

  /**
   * Obtener respuesta fallback cuando OpenAI no está disponible
   */
  getFallbackResponse(type) {
    const fallbacks = {
      title: 'Servicio Profesional de Calidad',
      description: 'Servicio profesional de alta calidad diseñado para proporcionar soluciones efectivas y confiables. Contamos con expertos dedicados a garantizar la satisfacción del cliente y entregar resultados excepcionales en cada proyecto.',
      features: '["Servicio profesional de calidad", "Atención personalizada dedicada", "Garantía de calidad premium", "Soporte continuo"]',
      benefits: '["Mejora del rendimiento operacional", "Mayor productividad empresarial", "Soluciones confiables y verificadas"]',
      service_structure: '{"titulo": "Servicio Profesional de Calidad", "descripcion": "Servicio profesional de alta calidad diseñado para proporcionar soluciones efectivas y confiables. Contamos con expertos dedicados a garantizar la satisfacción del cliente."}',
      package_description: 'Paquete profesional completo con servicios incluidos y soporte dedicado'
    };
    
    return fallbacks[type] || fallbacks.description;
  }

  /**
   * 🆕 Limpiar respuesta del agente de IA
   * Remueve recomendaciones, análisis y otros contenidos no deseados
   */
  cleanAIResponse(text) {
    if (!text) return '';
    
    // Si el texto es JSON válido, devolverlo sin modificar
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        JSON.parse(trimmed);
        return text;
      } catch (e) {
        // No es JSON válido, continuar con la limpieza normal
      }
    }
    
    let cleaned = text;
    
    // Remover secciones de recomendación
    const recommendationPatterns = [
      /💡\s*RECOMENDACIÓN:?.*/gi,
      /RECOMENDACIÓN:?.*/gi,
      /💡\s*Sugerencia:?.*/gi,
      /Sugerencia:?.*/gi,
      /💡\s*Consejo:?.*/gi,
      /Consejo:?.*/gi,
      /\n\nRecomendaciones?:.*/gis,
      /\n\nNota:.*/gis,
      /\n\nSugerencias?:.*/gis,
    ];
    
    for (const pattern of recommendationPatterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    
    // Remover párrafos que empiezan con emoji de recomendación
    cleaned = cleaned.split('\n\n')
      .filter(paragraph => {
        const trimmed = paragraph.trim();
        if (/^[💡📝✨🎯⚠️]/.test(trimmed)) {
          return false;
        }
        if (/^(Recomendación|Sugerencia|Consejo|Nota|Tip|Importante):/i.test(trimmed)) {
          return false;
        }
        return true;
      })
      .join('\n\n');
    
    // Limpiar espacios múltiples
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
    
    return cleaned;
  }

  /**
   * 🆕 Parsear respuesta de array con soporte para párrafos y listas
   * 
   * Estrategia SIMPLIFICADA:
   * 1. Intenta parsear como JSON (estructura {"caracteristicas": [...]} o {"beneficios": [...]})
   * 2. Si tiene viñetas/numeración → parsear como lista (cada item = 1 bloque)
   * 3. Si tiene párrafos (doble \n\n) → cada párrafo = 1 bloque
   * 4. Si tiene saltos simples → unir todo en 1 bloque
   */
  parseArrayResponse(text) {
    if (!text) return [];
    
    // 1️⃣ Intentar parsear como JSON primero
    try {
      const parsed = JSON.parse(text);
      // Si es objeto con "caracteristicas" o "beneficios" o "features" o "benefits"
      if (parsed.caracteristicas && Array.isArray(parsed.caracteristicas)) {
        logger.info('✅ [PARSER] JSON detected: caracteristicas');
        return parsed.caracteristicas;
      }
      if (parsed.beneficios && Array.isArray(parsed.beneficios)) {
        logger.info('✅ [PARSER] JSON detected: beneficios');
        return parsed.beneficios;
      }
      if (parsed.features && Array.isArray(parsed.features)) {
        return parsed.features;
      }
      if (parsed.benefits && Array.isArray(parsed.benefits)) {
        return parsed.benefits;
      }
      // Si es un array directo
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // No es JSON válido, continuar con parsing de texto
    }

    // Limpiar el texto
    const cleaned = text.trim();

    // Detectar si es una lista con viñetas/números
    const lines = cleaned.split('\n');
    const linesWithMarkers = lines.filter(line => 
      /^[-•*]\s+/.test(line.trim()) || /^\d+[\.)]\s+/.test(line.trim())
    ).length;
    
    // Si más del 40% de las líneas tienen marcadores, es una lista
    const hasMultipleListItems = linesWithMarkers >= 2 && linesWithMarkers / lines.length > 0.4;
    
    if (hasMultipleListItems) {
      return this.parseListFormat(cleaned);
    }

    // Si tiene doble salto de línea → separar por párrafos
    if (cleaned.includes('\n\n')) {
      return this.parseParagraphFormat(cleaned, '\n\n');
    }

    // Si solo tiene saltos simples → unir todo en un bloque
    const singleBlock = cleaned.replace(/\n+/g, ' ').trim();
    return singleBlock ? [singleBlock] : [];
  }

  /**
   * 🆕 Parsear formato de lista con viñetas o números
   * Ejemplos:
   * - Item 1
   * - Item 2
   * 1. Item A
   * 2. Item B
   */
  parseListFormat(text) {
    const items = [];
    const lines = text.split('\n');
    let currentItem = '';

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detectar inicio de nuevo item (viñetas o números)
      const isNewItem = /^[-•*]\s+/.test(trimmed) || /^\d+[\.)]\s+/.test(trimmed);
      
      if (isNewItem) {
        // Guardar item anterior si existe
        if (currentItem) {
          items.push(currentItem.trim());
        }
        // Iniciar nuevo item (removiendo el marcador)
        currentItem = trimmed.replace(/^[-•*]\s+/, '').replace(/^\d+[\.)]\s+/, '');
      } else if (trimmed) {
        // Continuar item actual (línea de continuación)
        currentItem += ' ' + trimmed;
      }
    }

    // Agregar último item
    if (currentItem) {
      items.push(currentItem.trim());
    }

    return items.slice(0, 10); // Máximo 10 items
  }

  /**
   * 🆕 Parsear formato de párrafos separados por salto múltiple
   * Cada bloque separado por separator se considera un item independiente
   */
  parseParagraphFormat(text, separator = '\n\n') {
    return text
      .split(separator)  // Dividir por párrafos
      .map(paragraph => {
        // Unir líneas dentro del párrafo con un espacio
        return paragraph
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join(' ')
          .trim();
      })
      .filter(block => block.length > 0)
      .map(block => {
        // Limpiar marcadores si los hay al inicio
        return block.replace(/^[-•*]\s*/, '').trim();
      })
      .slice(0, 10); // Máximo 10 bloques
  }

  parseAIServiceResponse(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      logger.warn('Could not parse AI service response as JSON');
      return { generated: text };
    }
  }

  parseAIPackageResponse(text, servicio) {
    try {
      return JSON.parse(text);
    } catch (e) {
      logger.warn('Could not parse AI package response as JSON');
      return [];
    }
  }

  parsePackageFeaturesResponse(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      // Fallback: crear features simples
      const lines = this.parseArrayResponse(text);
      return lines.map(line => ({
        texto: line,
        incluido: true
      }));
    }
  }

  /**
   * 🆕 GENERAR CONTENIDO ESPECÍFICO para un servicio existente
   * Tipos: full_description, short_description, features, benefits, faq
   * Estilos: formal, casual, technical
   */
  async generateSpecificContent(serviceId, contentType, style = 'formal') {
    try {
      logger.info(`📝 Generating ${contentType}...`);

      // Obtener el servicio
      const servicio = await Servicio.findById(serviceId).populate('categoria');
      if (!servicio) {
        throw new Error('Servicio no encontrado');
      }

      // Construir prompt según el tipo de contenido y estilo
      const prompt = this.buildContentPrompt(servicio, contentType, style);
      
      // Llamar a la IA
      const content = await this.callAI(prompt, contentType);

      logger.success(`✅ Content generated successfully`);

      return {
        success: true,
        data: {
          type: contentType,
          style: style,
          content: content,
          service: {
            id: servicio._id,
            titulo: servicio.titulo,
            categoria: servicio.categoria?.nombre
          }
        },
        metadata: {
          contentLength: content.length,
          generatedAt: new Date()
        }
      };

    } catch (error) {
      logger.error('❌ Error generating content:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 🆕 Construir prompt según tipo de contenido y estilo
   */
  buildContentPrompt(servicio, contentType, style) {
    const categoria = servicio.categoria?.nombre || 'Servicio';
    const tituloServicio = servicio.titulo;
    const descripcionActual = servicio.descripcion || servicio.descripcionCorta || '';

    // Mapeo de estilos
    const styleDescriptions = {
      formal: 'profesional, corporativo y estructurado',
      casual: 'amigable, cercano y conversacional',
      technical: 'técnico, detallado y específico con terminología especializada'
    };

    const styleDesc = styleDescriptions[style] || styleDescriptions.formal;

    // Plantillas por tipo de contenido
    const templates = {
      full_description: `Genera una descripción completa y detallada para el siguiente servicio.

**Servicio:** ${tituloServicio}
**Categoría:** ${categoria}
**Contexto actual:** ${descripcionActual}

**Estilo requerido:** ${styleDesc}

**Requisitos:**
- Extensión: 300-500 palabras
- Estructura clara con introducción, desarrollo y conclusión
- Incluir propuesta de valor
- Destacar diferenciadores
- Llamado a la acción al final
- Estilo: ${styleDesc}

Genera SOLO el texto de la descripción, sin títulos ni formato adicional.`,

      short_description: `Genera una descripción corta y atractiva para el siguiente servicio.

**Servicio:** ${tituloServicio}
**Categoría:** ${categoria}
**Descripción actual:** ${descripcionActual}

**Estilo requerido:** ${styleDesc}

**Requisitos:**
- Extensión: 80-120 palabras
- Impacto inmediato
- Destacar el beneficio principal
- Lenguaje claro y persuasivo
- Estilo: ${styleDesc}

Genera SOLO el texto de la descripción corta, sin títulos.`,

      features: `Genera una lista de características principales para el siguiente servicio.

**Servicio:** ${tituloServicio}
**Categoría:** ${categoria}
**Descripción:** ${descripcionActual}

**Estilo requerido:** ${styleDesc}

**Requisitos:**
- 6-8 características concretas
- Cada una debe ser específica y relevante
- Formato: lista con viñetas
- Enfoque en capacidades y funcionalidades
- Estilo: ${styleDesc}

Genera SOLO la lista de características en formato de viñetas (- Característica).`,

      benefits: `Genera una lista de beneficios clave para el siguiente servicio.

**Servicio:** ${tituloServicio}
**Categoría:** ${categoria}
**Descripción:** ${descripcionActual}

**Estilo requerido:** ${styleDesc}

**Requisitos:**
- 5-7 beneficios principales
- Enfoque en resultados y valor para el cliente
- Cada beneficio debe responder "¿Qué gano con esto?"
- Formato: lista con viñetas
- Estilo: ${styleDesc}

Genera SOLO la lista de beneficios en formato de viñetas (- Beneficio).`,

      faq: `Genera una lista de preguntas frecuentes (FAQ) para el siguiente servicio.

**Servicio:** ${tituloServicio}
**Categoría:** ${categoria}
**Descripción:** ${descripcionActual}

**Estilo requerido:** ${styleDesc}

**Requisitos:**
- 5-8 preguntas frecuentes relevantes
- Cada pregunta con su respuesta clara y concisa
- Cubrir: qué incluye, cómo funciona, tiempo de entrega, precios, soporte
- Formato: Pregunta: seguida de respuesta
- Estilo: ${styleDesc}

Genera SOLO las preguntas con sus respuestas en el formato especificado.`
    };

    return templates[contentType] || templates.full_description;
  }

  /**
   * Actualizar métricas
   */
  updateMetrics(processingTime) {
    const total = this.metrics.servicesCreated + this.metrics.packagesCreated;
    this.metrics.averageTime = 
      (this.metrics.averageTime * (total - 1) + processingTime) / total;
  }

  /**
   * Obtener métricas
   */
  getMetrics() {
    return { ...this.metrics };
  }
}

export default ServicesGenerator;
