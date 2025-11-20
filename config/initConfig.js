/**
 * 🔧 CONFIGURACIÓN GLOBAL DE INICIALIZACIONES
 * 
 * Controla todas las inicializaciones automáticas del sistema.
 * Cambiar a `true` solo cuando necesites forzar la inicialización.
 * 
 * PRODUCCIÓN: Todos en `false` excepto ENSURE_SUPER_ADMIN
 * DESARROLLO: Personalizar según necesidad
 */

export const INIT_CONFIG = {
  // ========================================
  // 📄 PÁGINAS CMS
  // ========================================
  CREATE_HOME_PAGE: false,        // Crear página Home si no existe
  CREATE_SERVICES_PAGE: false,    // Crear página Services si no existe
  CREATE_ABOUT_PAGE: false,       // Crear página About si no existe
  AUTO_UPDATE_CHATBOT: false,     // Actualizar configuración del chatbot
  
  // ========================================
  // 🏷️  CATEGORÍAS Y DATOS BASE
  // ========================================
  INIT_CATEGORIES: false,         // Inicializar categorías del sistema
  INIT_MESSAGE_TEMPLATES: false,  // Inicializar plantillas de mensajes
  INIT_CACHE_CONFIG: false,       // Inicializar configuración de cache
  
  // ========================================
  // 🤖 AGENTES IA
  // ========================================
  INIT_AGENT_CONFIGS: false,      // Inicializar configuraciones de agentes
  INIT_AGENT_PROFILES: false,     // Inicializar perfiles de agentes
  INIT_PROMPT_TEMPLATES: false,   // Inicializar plantillas de prompts
  
  // ========================================
  // 👤 USUARIOS Y SEGURIDAD
  // ========================================
  ENSURE_SUPER_ADMIN: true,       // ⚠️ RECOMENDADO: Siempre verificar super admin
  
  // ========================================
  // 📊 LOGS Y DIAGNÓSTICO
  // ========================================
  SHOW_HEALTH_CHECK: false,       // Mostrar información detallada de health check
  SHOW_INIT_LOGS: true,           // Mostrar logs de inicialización (resumen)
  SHOW_DETAILED_LOGS: false,      // Mostrar logs detallados de cada componente
};

/**
 * Devuelve true si el sistema está en modo "primera vez" (desarrollo inicial)
 */
export const isFirstTimeSetup = () => {
  return Object.values(INIT_CONFIG).filter(v => v === true).length > 2;
};

/**
 * Devuelve true si el sistema está en modo producción (sin inicializaciones)
 */
export const isProductionMode = () => {
  const enabledInits = Object.entries(INIT_CONFIG)
    .filter(([key, value]) => key !== 'ENSURE_SUPER_ADMIN' && key.startsWith('INIT_') || key.startsWith('CREATE_'))
    .filter(([, value]) => value === true);
  
  return enabledInits.length === 0;
};

export default INIT_CONFIG;
