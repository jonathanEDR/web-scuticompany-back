/**
 * AgentOrchestrator - Cerebro Central del Sistema de Agentes
 * Coordina y administra todos los agentes especializados
 */

import EventEmitter from 'events';
import logger from '../../utils/logger.js';

class AgentOrchestrator extends EventEmitter {
  constructor() {
    super();
    
    this.agents = new Map(); // Agentes registrados
    this.activeAgents = new Set(); // Agentes activos
    this.taskQueue = []; // Cola de tareas pendientes
    this.processingTasks = new Map(); // Tareas en proceso
    
    // Configuración
    this.config = {
      maxConcurrentTasks: 5,
      taskTimeout: 30000, // 30 segundos
      retryAttempts: 3,
      healthCheckInterval: 60000 // 1 minuto
    };
    
    // Métricas globales
    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      totalAgents: 0,
      activeAgents: 0,
      averageTaskTime: 0
    };
    
    logger.info('🧠 AgentOrchestrator initialized');
    this.startHealthChecking();
  }

  /**
   * Registrar un nuevo agente
   */
  async registerAgent(agent) {
    try {
      if (!agent || typeof agent.processTask !== 'function') {
        throw new Error('Invalid agent: must implement processTask method');
      }

      const agentId = agent.id || agent.name;
      
      // Verificar si ya existe
      if (this.agents.has(agentId)) {
        logger.warn(`⚠️  Agent ${agentId} already registered, updating...`);
      }

      // Registrar el agente
      this.agents.set(agentId, agent);
      this.metrics.totalAgents = this.agents.size;

      // Configurar listeners de eventos
      this.setupAgentListeners(agent);

      // Activar el agente automáticamente
      const activationResult = await agent.activate();
      
      if (activationResult.success) {
        this.activeAgents.add(agentId);
        this.metrics.activeAgents = this.activeAgents.size;
        
        logger.success(`✅ Agent ${agent.name} registered and activated`);
        this.emit('agent:registered', { agentId, agentName: agent.name });
        
        return { success: true, message: `Agent ${agent.name} registered successfully` };
      } else {
        logger.error(`❌ Failed to activate agent ${agent.name}`);
        return { success: false, error: `Failed to activate agent: ${activationResult.error}` };
      }

    } catch (error) {
      logger.error('❌ Error registering agent:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Configurar listeners de eventos para un agente
   */
  setupAgentListeners(agent) {
    const agentId = agent.id || agent.name;

    // Listener para cuando un agente completa una tarea
    agent.on('task:completed', (data) => {
      this.metrics.completedTasks++;
      this.processingTasks.delete(data.taskId);
      logger.info(`📋 Task completed by ${agent.name}: ${data.taskId}`);
      this.emit('task:completed', data);
    });

    // Listener para cuando un agente falla una tarea
    agent.on('task:failed', (data) => {
      this.metrics.failedTasks++;
      this.processingTasks.delete(data.taskId);
      logger.warn(`⚠️  Task failed by ${agent.name}: ${data.taskId}`);
      this.emit('task:failed', data);
    });

    // Listener para cuando un agente es activado
    agent.on('agent:activated', (data) => {
      this.activeAgents.add(agentId);
      this.metrics.activeAgents = this.activeAgents.size;
      logger.success(`🟢 Agent ${agent.name} activated`);
    });

    // Listener para cuando un agente es desactivado
    agent.on('agent:deactivated', (data) => {
      this.activeAgents.delete(agentId);
      this.metrics.activeAgents = this.activeAgents.size;
      logger.info(`🔴 Agent ${agent.name} deactivated`);
    });
  }

  /**
   * Procesar un comando de lenguaje natural
   */
  async processCommand(command, context = {}) {
    try {
      logger.info(`🎯 Processing command: "${command}"`);
      
      // Analizar el comando y determinar qué agente debe manejarlo
      const taskAssignment = await this.analyzeCommand(command, context);
      
      if (!taskAssignment) {
        return {
          success: false,
          error: 'No se pudo determinar qué agente debe manejar este comando'
        };
      }

      // Ejecutar la tarea
      return await this.executeTask(taskAssignment);

    } catch (error) {
      logger.error('❌ Error processing command:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analizar comando y asignar agente apropiado
   */
  async analyzeCommand(command, context) {
    const commandLower = command.toLowerCase();
    
    // Mapeo básico de comandos a agentes (después mejoraremos con IA)
    const commandMappings = [
      {
        keywords: ['blog', 'post', 'contenido', 'artículo', 'optimizar', 'seo', 'tags'],
        agentType: 'BlogAgent',
        priority: 1
      },
      {
        keywords: ['usuario', 'user', 'perfil', 'rol', 'moderación'],
        agentType: 'UserAgent',
        priority: 2
      },
      {
        keywords: ['cms', 'página', 'imagen', 'gestión', 'backup'],
        agentType: 'CMSAgent',
        priority: 3
      }
    ];

    // Encontrar el mapeo con mayor coincidencia
    let bestMatch = null;
    let maxMatches = 0;

    for (const mapping of commandMappings) {
      const matches = mapping.keywords.filter(keyword => 
        commandLower.includes(keyword)
      ).length;

      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = mapping;
      }
    }

    if (!bestMatch || maxMatches === 0) {
      // Si no hay coincidencias claras, usar el primer agente disponible
      const firstAgent = this.getFirstActiveAgent();
      if (!firstAgent) return null;

      bestMatch = {
        agentType: firstAgent.constructor.name,
        priority: 1
      };
    }

    // Buscar el agente apropiado
    const agent = this.findAgentByType(bestMatch.agentType);
    if (!agent) {
      logger.warn(`⚠️  No active agent found for type: ${bestMatch.agentType}`);
      return null;
    }

    return {
      agent,
      task: {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'natural_language_command',
        command: command,
        priority: bestMatch.priority,
        context: context,
        timestamp: new Date()
      }
    };
  }

  /**
   * Ejecutar una tarea asignada
   */
  async executeTask(taskAssignment) {
    const { agent, task } = taskAssignment;
    
    try {
      this.metrics.totalTasks++;
      this.processingTasks.set(task.id, {
        agentId: agent.id,
        startTime: Date.now(),
        task
      });

      logger.info(`🚀 Executing task ${task.id} with agent ${agent.name}`);

      // Ejecutar la tarea con timeout
      const result = await Promise.race([
        agent.processTask(task, task.context),
        this.createTimeoutPromise(task.id)
      ]);

      return result;

    } catch (error) {
      logger.error(`❌ Error executing task ${task.id}:`, error);
      this.metrics.failedTasks++;
      this.processingTasks.delete(task.id);
      
      return {
        success: false,
        error: error.message,
        taskId: task.id
      };
    }
  }

  /**
   * Crear promesa de timeout para tareas
   */
  createTimeoutPromise(taskId) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Task ${taskId} timed out after ${this.config.taskTimeout}ms`));
      }, this.config.taskTimeout);
    });
  }

  /**
   * Encontrar agente por tipo
   */
  findAgentByType(agentType) {
    for (const [agentId, agent] of this.agents) {
      if (agent.constructor.name === agentType && this.activeAgents.has(agentId)) {
        return agent;
      }
    }
    return null;
  }

  /**
   * Obtener primer agente activo
   */
  getFirstActiveAgent() {
    for (const [agentId, agent] of this.agents) {
      if (this.activeAgents.has(agentId)) {
        return agent;
      }
    }
    return null;
  }

  /**
   * Obtener un agente específico por nombre o ID
   */
  getAgent(agentNameOrId) {
    // Búsqueda exacta por ID
    if (this.agents.has(agentNameOrId)) {
      return this.agents.get(agentNameOrId);
    }
    
    // Búsqueda por nombre
    for (const [agentId, agent] of this.agents) {
      if (agent.name === agentNameOrId || agent.id === agentNameOrId) {
        return agent;
      }
    }
    
    return null;
  }

  /**
   * Obtener información de todos los agentes
   */
  getAgentsInfo() {
    const agentsInfo = [];
    
    for (const [agentId, agent] of this.agents) {
      agentsInfo.push({
        ...agent.getInfo(),
        isActive: this.activeAgents.has(agentId)
      });
    }
    
    return {
      agents: agentsInfo,
      metrics: this.metrics,
      queueSize: this.taskQueue.length,
      processingTasks: this.processingTasks.size
    };
  }

  /**
   * Health check periódico de todos los agentes
   */
  async startHealthChecking() {
    setInterval(async () => {
      for (const [agentId, agent] of this.agents) {
        try {
          const health = await agent.healthCheck();
          if (!health.healthy && this.activeAgents.has(agentId)) {
            logger.warn(`⚠️  Agent ${agent.name} is unhealthy, deactivating...`);
            this.activeAgents.delete(agentId);
            this.metrics.activeAgents = this.activeAgents.size;
          }
        } catch (error) {
          logger.error(`❌ Health check failed for agent ${agent.name}:`, error);
        }
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Desactivar el orquestador
   */
  async shutdown() {
    logger.info('🛑 Shutting down AgentOrchestrator...');
    
    // Desactivar todos los agentes
    for (const [agentId, agent] of this.agents) {
      try {
        await agent.deactivate();
      } catch (error) {
        logger.error(`Error deactivating agent ${agent.name}:`, error);
      }
    }
    
    this.agents.clear();
    this.activeAgents.clear();
    this.taskQueue.length = 0;
    this.processingTasks.clear();
    
    logger.info('✅ AgentOrchestrator shutdown complete');
  }
}

// Singleton instance
const orchestrator = new AgentOrchestrator();

export default orchestrator;
export { AgentOrchestrator };