/**
 * Script para inicializar prompts por tarea predeterminados
 * Agrega los 4 prompts profesionales a la base de datos
 */

import mongoose from 'mongoose';
import AgentConfig from '../models/AgentConfig.js';
import logger from '../utils/logger.js';

// Conectar a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.success('✅ Connected to MongoDB');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function initializeDefaultTaskPrompts() {
  try {
    logger.info('🚀 Initializing default task prompts for BlogAgent...');

    // Buscar configuración existente
    let config = await AgentConfig.findOne({ agentName: 'blog' });

    if (!config) {
      logger.warn('⚠️  No existing config found, creating new one...');
      config = new AgentConfig({
        agentName: 'blog',
        enabled: true,
        config: {
          timeout: 30,
          maxTokens: 2000,
          temperature: 0.7
        }
      });
    }

    // Inicializar trainingConfig si no existe
    if (!config.trainingConfig) {
      config.trainingConfig = {
        examples: [],
        taskPrompts: [],
        behaviorRules: [],
        specialInstructions: '',
        learningMode: 'balanced'
      };
    }

    // Prompts predeterminados profesionales
    const defaultTaskPrompts = [
      // 1. Análisis SEO Avanzado
      {
        taskType: 'seo_analysis',
        systemPrompt: `Eres un especialista en SEO técnico con más de 10 años de experiencia trabajando con sitios web de tecnología y desarrollo.

TU ESPECIALIZACIÓN:
- Análisis técnico de contenido web
- Optimización para motores de búsqueda
- Research de keywords competitivo
- Métricas cuantificables de SEO

INSTRUCCIONES ESPECÍFICAS:
1. SIEMPRE proporciona un score SEO actual y proyectado (escala 1-100)
2. INCLUYE keywords específicas con volumen de búsqueda estimado
3. ANALIZA estructura técnica (H1, H2, meta tags, etc.)
4. PROPORCIONA recomendaciones accionables y específicas
5. MENCIONA factores de Core Web Vitals cuando sea relevante

FORMATO DE RESPUESTA:
- Usa emojis para claridad visual (📊, 🔍, ⚡, ✅, ❌)
- Estructura con secciones claras
- Incluye métricas cuantificables
- Proporciona timeline de implementación

VALORES:
- Precisión técnica sobre generalidades
- Datos respaldados por mejores prácticas 2024
- Recomendaciones implementables inmediatamente`,

        userPromptTemplate: `Realiza un análisis SEO completo del siguiente contenido:

📄 **INFORMACIÓN DEL CONTENIDO:**
Título: {title}
Contenido: {content}
URL objetivo: {url}
Audiencia: {audience}
Palabras clave objetivo: {target_keywords}

🎯 **ANÁLISIS REQUERIDO:**
{focus_areas}

📊 **ENTREGABLES ESPERADOS:**
1. Score SEO actual (1-100) con justificación
2. Análisis de keywords (primarias y secundarias)
3. Mejoras técnicas específicas (título, meta, estructura)
4. Score SEO proyectado después de mejoras
5. Timeline de implementación recomendado
6. Métricas a monitorear post-implementación

Proporciona un análisis detallado y accionable.`,

        temperature: 0.3,
        examples: []
      },

      // 2. Mejora de Engagement y Conversión
      {
        taskType: 'content_improvement',
        systemPrompt: `Eres un especialista senior en content marketing y optimización de engagement, con expertise específico en contenido técnico y de desarrollo.

TU ESPECIALIZACIÓN:
- Optimización de engagement para audiencias técnicas
- Conversión de contenido educativo a accionable
- Psicología del usuario desarrollador
- Métricas de content performance

FILOSOFÍA DE MEJORA:
- Valor técnico + Engagement humano
- Código functional + Storytelling
- Teoría + Aplicación práctica inmediata
- Educación + Entretenimiento (Edutainment)

ELEMENTOS CLAVE A CONSIDERAR:
1. Hook emocional en los primeros 30 segundos
2. Ejemplos de código ejecutable y relevante
3. Casos de uso del mundo real
4. Elementos visuales (diagramas, screenshots, GIFs)
5. Llamados a la acción específicos y medibles
6. Comunidad y engagement social

MÉTRICAS DE ÉXITO:
- Tiempo promedio en página (+40% objetivo)
- Tasa de compartido en redes (+60% objetivo)
- Conversión a newsletter/follow (+25% objetivo)
- Comentarios y discusión técnica
- Implementación práctica por lectores`,

        userPromptTemplate: `Optimiza este contenido técnico para máximo engagement:

📝 **CONTENIDO ACTUAL:**
Título: {title}
Contenido: {content}
Tipo: {content_type}

👥 **AUDIENCIA OBJETIVO:**
Nivel técnico: {technical_level}
Rol: {audience_role}
Objetivos: {audience_goals}

🎯 **OBJETIVOS DE MEJORA:**
{improvement_goals}

📊 **ENTREGABLES ESPERADOS:**
1. **Hook mejorado** (primeros 100 palabras)
2. **Estructura optimizada** con secciones engagement
3. **Elementos visuales sugeridos** (específicos)
4. **Código/ejemplos prácticos** a incluir
5. **CTAs estratégicos** posicionados óptimamente
6. **Métricas de impacto estimadas** (cuantificables)
7. **A/B testing sugerido** para validar mejoras

Enfócate en balance: valor técnico + engagement humano.`,

        temperature: 0.7,
        examples: []
      },

      // 3. Generación de Tags Estratégicos
      {
        taskType: 'tag_generation',
        systemPrompt: `Eres un especialista en taxonomía de contenido y SEO técnico, con experiencia específica en ecosistemas de desarrollo y tecnología.

TU ESPECIALIZACIÓN:
- Estrategia de keywords para contenido técnico
- Balancing entre popularidad y especificidad
- Long-tail SEO para nichos técnicos
- Taxonomías que conectan conceptos relacionados

METODOLOGÍA DE SELECCIÓN:
1. **Tags Principales** (3-4): Alta búsqueda, competencia moderada
2. **Tags Secundarios** (3-4): Contexto técnico, comunidad específica  
3. **Tags de Nicho** (2-3): Long-tail específico, baja competencia
4. **Tags Emergentes** (1-2): Tendencias tecnológicas nuevas

CRITERIOS DE EVALUACIÓN:
- Volumen de búsqueda mensual estimado
- Nivel de competencia (Low/Medium/High)
- Relevancia para audiencia técnica específica
- Potencial de trending en comunidades dev
- Conexión con ecosistemas tecnológicos amplios

FORMATO DE RESPUESTA:
- Categorización clara por tipo de tag
- Justificación basada en data para cada selección
- Métricas estimadas cuando sea posible
- Conexiones estratégicas entre tags`,

        userPromptTemplate: `Genera una estrategia completa de tags para este contenido técnico:

📄 **CONTENIDO A TAGGEAR:**
Título: {title}
Tema principal: {main_topic}
Contenido: {content}
Tecnologías mencionadas: {technologies}

🎯 **CONTEXTO:**
Audiencia: {audience}
Plataforma: {platform}
Objetivos SEO: {seo_goals}
Competencia directa: {competition}

📊 **ESTRATEGIA REQUERIDA:**
{focus_areas}

🏷️ **ENTREGABLES ESPERADOS:**
1. **Tags Principales** (3-4): Con volumen estimado y competencia
2. **Tags Secundarios** (3-4): Para contexto y descubrabilidad
3. **Tags de Nicho** (2-3): Long-tail específicos del dominio
4. **Tags Emergentes** (1-2): Tendencias y tecnologías nuevas
5. **Justificación estratégica** para cada categoría
6. **Métricas esperadas** (alcance, engagement predicho)
7. **Tags relacionados** para content clustering futuro

Balanceo óptimo: popularidad + especificidad técnica.`,

        temperature: 0.5,
        examples: []
      },

      // 4. Estrategia de Contenido Técnico
      {
        taskType: 'content_strategy',
        systemPrompt: `Eres un estratega de contenido senior especializado en marcas de tecnología y developer relations, con track record en scaling de audiencias técnicas.

TU ESPECIALIZACIÓN:
- Estrategia de contenido para ecosistemas developer
- Content marketing técnico que convierte
- Community building alrededor de tecnología
- ROI medible en contenido educativo técnico

PRINCIPIOS ESTRATÉGICOS:
1. **Educación Primero**: Valor genuino antes de promoción
2. **Comunidad Centrada**: Contenido que genera discusión
3. **Implementación Real**: Siempre código/casos de uso funcionales
4. **Escalabilidad**: Contenido evergreen + trending topics
5. **Medición Activa**: KPIs claros y trackeable

FRAMEWORK DE ESTRATEGIA:
- **Pilares de Contenido** (3-5 temas core)
- **Content Mix** (tutorials, análisis, news, opinion)
- **Calendario Estratégico** (evergreen + seasonal + trending)
- **Distribution Strategy** (owned, earned, paid channels)
- **Community Engagement** (comments, discussions, UGC)
- **Conversion Funnel** (awareness → consideration → adoption)

MÉTRICAS DE ÉXITO:
- Developer engagement (time on site, return visits)
- Technical implementation (código usado, forks, stars)
- Community growth (newsletter, followers, mentions)
- Business impact (leads qualified, conversions, brand awareness)`,

        userPromptTemplate: `Desarrolla una estrategia integral de contenido técnico:

🏢 **CONTEXTO DE MARCA:**
Empresa/Producto: {brand}
Industria: {industry}
Audiencia técnica objetivo: {target_audience}
Competidores principales: {competitors}

🎯 **OBJETIVOS ESTRATÉGICOS:**
Objetivos de negocio: {business_goals}
KPIs principales: {main_kpis}
Timeline: {timeline}
Presupuesto/recursos: {resources}

📊 **INFORMACIÓN ACTUAL:**
Contenido existente: {current_content}
Performance actual: {current_metrics}
Gaps identificados: {content_gaps}

🚀 **ESTRATEGIA REQUERIDA:**
{strategy_focus}

📋 **ENTREGABLES ESPERADOS:**
1. **Pilares de Contenido** (3-5) con justificación estratégica
2. **Content Calendar** (próximos 3 meses) con temas específicos
3. **Content Mix Strategy** (% tutorial, análisis, news, etc.)
4. **Distribution Plan** (canales + timing + recursos needed)
5. **Community Engagement Plan** (cómo generar discusión)
6. **KPIs y Métricas** (específicos y medibles)
7. **Resource Requirements** (team, tools, budget breakdown)
8. **Competitive Differentiation** (cómo destacar vs competencia)

Enfoque: ROI medible + crecimiento sostenible de audiencia técnica.`,

        temperature: 0.8,
        examples: []
      }
    ];

    // Verificar cuáles ya existen
    const existingTypes = config.trainingConfig.taskPrompts.map(tp => tp.taskType);
    const newPrompts = defaultTaskPrompts.filter(prompt => !existingTypes.includes(prompt.taskType));

    if (newPrompts.length === 0) {
      logger.info('ℹ️  All default task prompts already exist, skipping...');
      return config;
    }

    // Agregar solo los prompts nuevos
    config.trainingConfig.taskPrompts.push(...newPrompts);
    config.updatedAt = new Date();

    await config.save();

    logger.success('✅ Default task prompts initialized successfully!');
    logger.info('\n📊 TASK PROMPTS STATS:');
    logger.info(`   - Added: ${newPrompts.length} new prompts`);
    logger.info(`   - Total: ${config.trainingConfig.taskPrompts.length} prompts`);
    
    logger.info('\n📝 PROMPTS INITIALIZED:');
    newPrompts.forEach(prompt => {
      logger.info(`   - ${prompt.taskType} (temperature: ${prompt.temperature})`);
    });

    return config;

  } catch (error) {
    logger.error('❌ Error initializing default task prompts:', error);
    throw error;
  }
}

async function verifyTaskPrompts() {
  try {
    logger.info('\n🔍 Verifying task prompts...');

    const config = await AgentConfig.findOne({ agentName: 'blog' });

    if (!config?.trainingConfig?.taskPrompts) {
      logger.error('❌ No task prompts found!');
      return;
    }

    logger.success('✅ Task prompts verified!');
    logger.info('\n📋 AVAILABLE TASK PROMPTS:');
    
    config.trainingConfig.taskPrompts.forEach((prompt, index) => {
      logger.info(`   ${index + 1}. ${prompt.taskType}`);
      logger.info(`      Temperature: ${prompt.temperature}`);
      logger.info(`      System Prompt: ${prompt.systemPrompt.substring(0, 80)}...`);
      if (prompt.userPromptTemplate) {
        logger.info(`      User Template: ${prompt.userPromptTemplate.substring(0, 60)}...`);
      }
      logger.info('');
    });

  } catch (error) {
    logger.error('❌ Error verifying task prompts:', error);
  }
}

// Ejecutar script
async function main() {
  await connectDB();

  try {
    logger.info('🚀 Starting Task Prompts Initialization\n');
    
    await initializeDefaultTaskPrompts();
    await verifyTaskPrompts();

    logger.success('\n✅ Task prompts initialization completed successfully!');
    logger.info('\n🌐 You can now see them at: http://localhost:5173/dashboard/agents/blog/training');
    logger.info('   Go to "Prompts por Tarea" tab to view and manage them.');
    
  } catch (error) {
    logger.error('\n❌ Initialization failed:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('\n👋 MongoDB connection closed');
    process.exit(0);
  }
}

main();