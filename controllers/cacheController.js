/**
 * 🎛️ Controlador de Gestión de Cache para Servicios
 * 
 * Permite a los administradores controlar el sistema de cache:
 * - Activar/desactivar cache global
 * - Configurar cache por tipo de ruta
 * - Invalidar cache manualmente
 * - Ver estadísticas de uso del cache
 * 
 * @author Web Scuti
 * @version 1.0.0
 */

import CacheConfig from '../models/CacheConfig.js';
import { invalidateConfigCache } from '../middleware/serviciosCache.js';

/**
 * @desc    Obtener configuración actual del cache
 * @route   GET /api/servicios/cache/config
 * @access  Private - Admin only
 */
export const getCacheConfig = async (req, res) => {
  try {
    const config = await CacheConfig.getCurrentConfig();
    
    res.status(200).json({
      success: true,
      message: 'Configuración de cache obtenida exitosamente',
      data: {
        enabled: config.enabled,
        temporaryDisabled: config.temporaryDisabled,
        reactivateAt: config.reactivateAt,
        configurations: config.configurations,
        autoInvalidation: config.autoInvalidation,
        statistics: config.statistics,
        hitRate: config.hitRate,
        lastModified: config.lastModified,
        modifiedBy: config.modifiedBy
      }
    });
  } catch (error) {
    console.error('Error obteniendo configuración de cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración de cache',
      error: error.message
    });
  }
};

/**
 * @desc    Activar/desactivar cache global
 * @route   POST /api/servicios/cache/toggle
 * @access  Private - Admin only
 */
export const toggleCache = async (req, res) => {
  try {
    const { enabled } = req.body;
    const userId = req.user?.id || req.auth?.userId || 'admin';
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'El parámetro "enabled" debe ser un boolean'
      });
    }
    
    const config = await CacheConfig.getCurrentConfig();
    await config.toggleCache(enabled, userId);
    
    // Invalidar cache en memoria para que se recargue la configuración
    invalidateConfigCache();
    
    res.status(200).json({
      success: true,
      message: `Cache ${enabled ? 'activado' : 'desactivado'} exitosamente`,
      data: {
        enabled: config.enabled,
        modifiedBy: userId,
        modifiedAt: config.lastModified
      }
    });
    
    console.log(`🔄 Cache ${enabled ? 'activado' : 'desactivado'} por usuario: ${userId}`);
  } catch (error) {
    console.error('Error activando/desactivando cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del cache',
      error: error.message
    });
  }
};

/**
 * @desc    Configurar cache para un tipo específico
 * @route   PUT /api/servicios/cache/configure/:type
 * @access  Private - Admin only
 */
export const configureCacheType = async (req, res) => {
  try {
    const { type } = req.params;
    const { enabled, maxAge, staleWhileRevalidate, public: isPublic } = req.body;
    const userId = req.user?.id || req.auth?.userId || 'admin';
    
    // Validar tipo de cache
    const validTypes = [
      'service-list',
      'service-detail', 
      'featured-services',
      'service-categories',
      'service-packages',
      'service-stats'
    ];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de cache no válido',
        validTypes
      });
    }
    
    // Validar parámetros
    const updateConfig = {};
    if (typeof enabled === 'boolean') updateConfig.enabled = enabled;
    if (typeof maxAge === 'number' && maxAge >= 0) updateConfig.maxAge = maxAge;
    if (typeof staleWhileRevalidate === 'number' && staleWhileRevalidate >= 0) {
      updateConfig.staleWhileRevalidate = staleWhileRevalidate;
    }
    if (typeof isPublic === 'boolean') updateConfig.public = isPublic;
    
    if (Object.keys(updateConfig).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron parámetros válidos para actualizar'
      });
    }
    
    const config = await CacheConfig.getCurrentConfig();
    await config.updateTypeConfig(type, updateConfig, userId);
    
    // Invalidar cache en memoria
    invalidateConfigCache();
    
    res.status(200).json({
      success: true,
      message: `Configuración de cache para '${type}' actualizada exitosamente`,
      data: {
        type,
        configuration: config.configurations[type],
        modifiedBy: userId,
        modifiedAt: config.lastModified
      }
    });
    
    console.log(`⚙️ Configuración de cache '${type}' actualizada por usuario: ${userId}`);
  } catch (error) {
    console.error('Error configurando cache por tipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al configurar cache',
      error: error.message
    });
  }
};

/**
 * @desc    Invalidar cache manualmente
 * @route   POST /api/servicios/cache/invalidate
 * @access  Private - Admin only
 */
export const invalidateCache = async (req, res) => {
  try {
    const { duration = 30 } = req.body;
    const userId = req.user?.id || req.auth?.userId || 'admin';
    
    // Validar duración
    if (typeof duration !== 'number' || duration < 0) {
      return res.status(400).json({
        success: false,
        message: 'La duración debe ser un número positivo (segundos)'
      });
    }
    
    const config = await CacheConfig.getCurrentConfig();
    await config.disableTemporarily(duration);
    
    // Invalidar cache en memoria
    invalidateConfigCache();
    
    res.status(200).json({
      success: true,
      message: `Cache invalidado exitosamente por ${duration} segundos`,
      data: {
        temporaryDisabled: true,
        reactivateAt: config.reactivateAt,
        invalidatedBy: userId,
        duration
      }
    });
    
    console.log(`🗑️ Cache invalidado manualmente por ${duration}s por usuario: ${userId}`);
  } catch (error) {
    console.error('Error invalidando cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error al invalidar cache',
      error: error.message
    });
  }
};

/**
 * @desc    Reactivar cache inmediatamente
 * @route   POST /api/servicios/cache/reactivate
 * @access  Private - Admin only
 */
export const reactivateCache = async (req, res) => {
  try {
    const userId = req.user?.id || req.auth?.userId || 'admin';
    
    const config = await CacheConfig.getCurrentConfig();
    config.temporaryDisabled = false;
    config.reactivateAt = null;
    config.modifiedBy = userId;
    config.lastModified = new Date();
    
    await config.save();
    
    // Invalidar cache en memoria para que se recargue
    invalidateConfigCache();
    
    res.status(200).json({
      success: true,
      message: 'Cache reactivado exitosamente',
      data: {
        enabled: config.enabled,
        temporaryDisabled: config.temporaryDisabled,
        reactivatedBy: userId
      }
    });
    
    console.log(`🔄 Cache reactivado manualmente por usuario: ${userId}`);
  } catch (error) {
    console.error('Error reactivando cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reactivar cache',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener estadísticas de uso del cache
 * @route   GET /api/servicios/cache/stats
 * @access  Private - Admin only
 */
export const getCacheStats = async (req, res) => {
  try {
    const config = await CacheConfig.getCurrentConfig();
    
    const stats = {
      ...config.statistics,
      hitRate: config.hitRate,
      efficiency: {
        level: parseFloat(config.hitRate) >= 70 ? 'high' : 
               parseFloat(config.hitRate) >= 50 ? 'medium' : 'low',
        recommendation: parseFloat(config.hitRate) < 50 ? 
          'Considera ajustar los tiempos de cache para mejorar la eficiencia' :
          'Rendimiento del cache es óptimo'
      },
      status: {
        globalEnabled: config.enabled,
        temporaryDisabled: config.temporaryDisabled,
        reactivateAt: config.reactivateAt,
        activeTypes: Object.keys(config.configurations).filter(
          type => config.configurations[type].enabled
        ).length
      }
    };
    
    res.status(200).json({
      success: true,
      message: 'Estadísticas de cache obtenidas exitosamente',
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de cache',
      error: error.message
    });
  }
};

/**
 * @desc    Resetear estadísticas de cache
 * @route   POST /api/servicios/cache/reset-stats
 * @access  Private - Admin only
 */
export const resetCacheStats = async (req, res) => {
  try {
    const userId = req.user?.id || req.auth?.userId || 'admin';
    
    const config = await CacheConfig.getCurrentConfig();
    config.statistics = {
      totalHits: 0,
      totalMisses: 0,
      totalInvalidations: 0,
      lastReset: new Date()
    };
    config.modifiedBy = userId;
    config.lastModified = new Date();
    
    await config.save();
    
    res.status(200).json({
      success: true,
      message: 'Estadísticas de cache reseteadas exitosamente',
      data: {
        statistics: config.statistics,
        resetBy: userId
      }
    });
    
    console.log(`📊 Estadísticas de cache reseteadas por usuario: ${userId}`);
  } catch (error) {
    console.error('Error reseteando estadísticas de cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resetear estadísticas de cache',
      error: error.message
    });
  }
};

/**
 * @desc    Configurar auto-invalidación
 * @route   PUT /api/servicios/cache/auto-invalidation
 * @access  Private - Admin only
 */
export const configureAutoInvalidation = async (req, res) => {
  try {
    const { disableDuringMutations, reactivationDelay } = req.body;
    const userId = req.user?.id || req.auth?.userId || 'admin';
    
    const config = await CacheConfig.getCurrentConfig();
    
    if (typeof disableDuringMutations === 'boolean') {
      config.autoInvalidation.disableDuringMutations = disableDuringMutations;
    }
    
    if (typeof reactivationDelay === 'number' && reactivationDelay >= 0) {
      config.autoInvalidation.reactivationDelay = reactivationDelay;
    }
    
    config.modifiedBy = userId;
    config.lastModified = new Date();
    config.markModified('autoInvalidation');
    
    await config.save();
    
    // Invalidar cache en memoria
    invalidateConfigCache();
    
    res.status(200).json({
      success: true,
      message: 'Configuración de auto-invalidación actualizada exitosamente',
      data: {
        autoInvalidation: config.autoInvalidation,
        modifiedBy: userId,
        modifiedAt: config.lastModified
      }
    });
    
    console.log(`🤖 Auto-invalidación configurada por usuario: ${userId}`);
  } catch (error) {
    console.error('Error configurando auto-invalidación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al configurar auto-invalidación',
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar TTL (Time To Live) de cache para tipos específicos
 * @route   PUT /api/servicios/cache/ttl
 * @access  Private - Admin only
 */
export const updateCacheTTL = async (req, res) => {
  try {
    const { ttlConfig } = req.body;
    const userId = req.user?.id || req.auth?.userId || 'admin';
    
    if (!ttlConfig || typeof ttlConfig !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un objeto "ttlConfig" con las configuraciones de TTL'
      });
    }
    
    const config = await CacheConfig.getCurrentConfig();
    const updatedConfigs = {};
    
    // Actualizar cada tipo de cache con los nuevos TTL
    for (const [type, ttlValue] of Object.entries(ttlConfig)) {
      // Validar que el tipo existe en la configuración
      if (!config.configurations[type]) {
        return res.status(400).json({
          success: false,
          message: `Tipo de cache no válido: ${type}`,
          validTypes: Object.keys(config.configurations)
        });
      }
      
      // Validar que ttlValue es un número positivo
      if (typeof ttlValue !== 'number' || ttlValue < 0) {
        return res.status(400).json({
          success: false,
          message: `TTL inválido para ${type}. Debe ser un número positivo (segundos)`
        });
      }
      
      // Actualizar el maxAge (que es el TTL principal)
      config.configurations[type].maxAge = ttlValue;
      updatedConfigs[type] = {
        maxAge: ttlValue,
        staleWhileRevalidate: config.configurations[type].staleWhileRevalidate
      };
    }
    
    config.modifiedBy = userId;
    config.lastModified = new Date();
    config.markModified('configurations');
    
    await config.save();
    
    // Invalidar cache en memoria
    invalidateConfigCache();
    
    res.status(200).json({
      success: true,
      message: 'Configuraciones de TTL actualizadas exitosamente',
      data: {
        updatedConfigs,
        modifiedBy: userId,
        modifiedAt: config.lastModified
      }
    });
    
    console.log(`⏱️ TTL de cache actualizado por usuario: ${userId}`, updatedConfigs);
  } catch (error) {
    console.error('Error actualizando TTL del cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar TTL del cache',
      error: error.message
    });
  }
};

export default {
  getCacheConfig,
  toggleCache,
  configureCacheType,
  invalidateCache,
  reactivateCache,
  getCacheStats,
  resetCacheStats,
  configureAutoInvalidation,
  updateCacheTTL
};