// src/orchestration/agentRegistry.ts

import { Logger } from '../utils/logger';

const logger = new Logger('AgentRegistry');

export interface AgentCapability {
  name: string;
  description: string;
  inputTypes: string[];
  outputTypes: string[];
  streaming?: boolean;
  contextAware?: boolean;
}

export interface AgentMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: AgentCapability[];
  status: 'active' | 'inactive' | 'error' | 'initializing';
  lastHealthCheck: Date;
  performance: {
    averageResponseTime: number;
    successRate: number;
    totalRequests: number;
  };
}

export interface RegisteredAgent {
  id: string;
  instance: any;
  metadata: AgentMetadata;
  healthCheck: () => Promise<boolean>;
}

export class AgentRegistry {
  private agents: Map<string, RegisteredAgent> = new Map();
  private capabilityIndex: Map<string, string[]> = new Map();

  constructor() {
    logger.info('AgentRegistry initialized');
  }

  /**
   * Register an agent with the registry
   */
  async registerAgent(
    id: string,
    instance: any,
    metadata: AgentMetadata,
    healthCheck: () => Promise<boolean>
  ): Promise<boolean> {
    try {
      // Validate agent instance has required methods
      if (!this.validateAgentInterface(instance)) {
        logger.error(`Agent ${id} does not implement required interface`);
        return false;
      }

      const registeredAgent: RegisteredAgent = {
        id,
        instance,
        metadata: {
          ...metadata,
          status: 'initializing',
          lastHealthCheck: new Date()
        },
        healthCheck
      };

      // Perform initial health check
      const isHealthy = await healthCheck();
      registeredAgent.metadata.status = isHealthy ? 'active' : 'error';

      // Register agent
      this.agents.set(id, registeredAgent);

      // Update capability index
      this.updateCapabilityIndex(id, metadata.capabilities);

      logger.info(`Agent registered: ${id} (${metadata.name}) - Status: ${registeredAgent.metadata.status}`);
      return true;

    } catch (error) {
      logger.error(`Failed to register agent ${id}:`, error);
      return false;
    }
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): RegisteredAgent | undefined {
    return this.agents.get(id);
  }

  /**
   * Get agent instance by ID
   */
  getAgentInstance(id: string): any {
    const agent = this.agents.get(id);
    return agent?.instance;
  }

  /**
   * Find agents by capability
   */
  findAgentsByCapability(capabilityName: string): RegisteredAgent[] {
    const agentIds = this.capabilityIndex.get(capabilityName) || [];
    return agentIds
      .map(id => this.agents.get(id))
      .filter(agent => agent && agent.metadata.status === 'active') as RegisteredAgent[];
  }

  /**
   * List all registered agents
   */
  listAgents(): RegisteredAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * List active agents
   */
  listActiveAgents(): RegisteredAgent[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.metadata.status === 'active');
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(id: string): boolean {
    const agent = this.agents.get(id);
    if (!agent) {
      logger.warn(`Agent ${id} not found for unregistration`);
      return false;
    }

    // Remove from capability index
    for (const capability of agent.metadata.capabilities) {
      const agentIds = this.capabilityIndex.get(capability.name) || [];
      const updatedIds = agentIds.filter(agentId => agentId !== id);
      if (updatedIds.length > 0) {
        this.capabilityIndex.set(capability.name, updatedIds);
      } else {
        this.capabilityIndex.delete(capability.name);
      }
    }

    // Remove agent
    this.agents.delete(id);
    logger.info(`Agent unregistered: ${id}`);
    return true;
  }

  /**
   * Perform health checks on all agents
   */
  async performHealthChecks(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    for (const [id, agent] of this.agents) {
      try {
        const isHealthy = await agent.healthCheck();
        agent.metadata.status = isHealthy ? 'active' : 'error';
        agent.metadata.lastHealthCheck = new Date();
        results.set(id, isHealthy);
        
        logger.debug(`Health check for ${id}: ${isHealthy ? 'healthy' : 'unhealthy'}`);
      } catch (error) {
        agent.metadata.status = 'error';
        agent.metadata.lastHealthCheck = new Date();
        results.set(id, false);
        logger.error(`Health check failed for ${id}:`, error);
      }
    }

    return results;
  }

  /**
   * Update agent performance metrics
   */
  updateAgentPerformance(id: string, responseTime: number, success: boolean): void {
    const agent = this.agents.get(id);
    if (!agent) return;

    const perf = agent.metadata.performance;
    perf.totalRequests++;
    
    // Update average response time (exponential moving average)
    const alpha = 0.1;
    perf.averageResponseTime = perf.averageResponseTime * (1 - alpha) + responseTime * alpha;
    
    // Update success rate
    const successCount = Math.floor(perf.successRate * (perf.totalRequests - 1));
    perf.successRate = success 
      ? (successCount + 1) / perf.totalRequests 
      : successCount / perf.totalRequests;

    logger.debug(`Performance updated for ${id}: ${responseTime}ms, success=${success}`);
  }

  /**
   * Get registry statistics
   */
  getRegistryStats(): any {
    const agents = Array.from(this.agents.values());
    const statusCounts = agents.reduce((acc, agent) => {
      acc[agent.metadata.status] = (acc[agent.metadata.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAgents: agents.length,
      statusDistribution: statusCounts,
      totalCapabilities: this.capabilityIndex.size,
      averageResponseTime: agents.reduce((sum, agent) => 
        sum + agent.metadata.performance.averageResponseTime, 0) / agents.length,
      overallSuccessRate: agents.reduce((sum, agent) => 
        sum + agent.metadata.performance.successRate, 0) / agents.length
    };
  }

  /**
   * Validate agent implements required interface
   */
  private validateAgentInterface(instance: any): boolean {
    // Check for required methods - can be extended based on your agent interface
    const requiredMethods = ['testConnection'];
    
    for (const method of requiredMethods) {
      if (typeof instance[method] !== 'function') {
        logger.error(`Agent missing required method: ${method}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Update capability index
   */
  private updateCapabilityIndex(agentId: string, capabilities: AgentCapability[]): void {
    for (const capability of capabilities) {
      const agentIds = this.capabilityIndex.get(capability.name) || [];
      if (!agentIds.includes(agentId)) {
        agentIds.push(agentId);
        this.capabilityIndex.set(capability.name, agentIds);
      }
    }
  }
}
