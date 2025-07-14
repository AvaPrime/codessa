import { EventEmitter } from 'events';
import {
  DelegationEngine,
  DelegationRequest,
  DelegationResponse,
  DelegationResult,
  DelegationAnalytics,
  Task,
  Agent,
  CapabilityMatch,
  DelegationConstraints,
  DelegationEvent,
  DelegationConfig
} from '../interfaces/delegationTypes';

export class CodessaDelegationEngine extends EventEmitter implements DelegationEngine {
  private activeDelegations: Map<string, DelegationResult>;
  private agentRegistry: Map<string, Agent>;
  private delegationHistory: DelegationResult[];
  private config: DelegationConfig;
  private eventCounter: number;

  constructor(config: DelegationConfig) {
    super();
    this.activeDelegations = new Map();
    this.agentRegistry = new Map();
    this.delegationHistory = [];
    this.config = config;
    this.eventCounter = 0;
  }

  async delegateTask(request: DelegationRequest): Promise<DelegationResponse> {
    const delegationId = `delegation_${Date.now()}_${this.eventCounter++}`;
    
    // Emit delegation requested event
    this.emitEvent('delegation_requested', delegationId, request.originAgent, request.task.id, {
      task: request.task,
      constraints: request.constraints
    });

    try {
      // Find optimal agent
      const optimalAgent = await this.findOptimalAgent(request.task, request.constraints);
      
      if (!optimalAgent) {
        const response: DelegationResponse = {
          id: delegationId,
          requestId: request.id,
          status: 'rejected',
          reason: 'No suitable agent found',
          timestamp: new Date()
        };
        
        this.emitEvent('delegation_rejected', delegationId, undefined, request.task.id, {
          reason: 'No suitable agent found'
        });
        
        return response;
      }

      // Check if agent is available
      if (optimalAgent.status === 'offline' || optimalAgent.status === 'busy') {
        return await this.handleUnavailableAgent(request, optimalAgent, delegationId);
      }

      // Create delegation result
      const delegationResult: DelegationResult = {
        id: delegationId,
        requestId: request.id,
        task: request.task,
        assignedAgent: optimalAgent.id,
        status: 'pending',
        timestamp: new Date()
      };

      this.activeDelegations.set(delegationId, delegationResult);

      // Update agent workload
      await this.updateAgentWorkload(optimalAgent.id, request.task.estimatedComplexity);

      const response: DelegationResponse = {
        id: delegationId,
        requestId: request.id,
        status: 'accepted',
        assignedAgent: optimalAgent.id,
        estimatedStartTime: new Date(),
        estimatedCompletionTime: new Date(Date.now() + request.task.estimatedDuration * 1000),
        timestamp: new Date()
      };

      this.emitEvent('delegation_accepted', delegationId, optimalAgent.id, request.task.id, {
        agent: optimalAgent,
        estimatedDuration: request.task.estimatedDuration
      });

      return response;

    } catch (error) {
      const response: DelegationResponse = {
        id: delegationId,
        requestId: request.id,
        status: 'rejected',
        reason: `Delegation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };

      this.emitEvent('delegation_failed', delegationId, undefined, request.task.id, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return response;
    }
  }

  async findOptimalAgent(task: Task, constraints?: DelegationConstraints): Promise<Agent | null> {
    const availableAgents = Array.from(this.agentRegistry.values())
      .filter(agent => this.isAgentEligible(agent, task, constraints));

    if (availableAgents.length === 0) {
      return null;
    }

    // Calculate capability matches
    const matches = await this.calculateCapabilityMatches(task, availableAgents);
    
    // Sort by overall score (descending)
    matches.sort((a, b) => b.overallScore - a.overallScore);

    const bestMatch = matches[0];
    return this.agentRegistry.get(bestMatch.agentId) || null;
  }

  async monitorDelegation(delegationId: string): Promise<DelegationResult> {
    const delegation = this.activeDelegations.get(delegationId);
    if (!delegation) {
      throw new Error(`Delegation ${delegationId} not found`);
    }
    return delegation;
  }

  async cancelDelegation(delegationId: string): Promise<boolean> {
    const delegation = this.activeDelegations.get(delegationId);
    if (!delegation) {
      return false;
    }

    delegation.status = 'cancelled';
    delegation.completionTime = new Date();
    
    // Update agent workload
    await this.updateAgentWorkload(delegation.assignedAgent, -delegation.task.estimatedComplexity);

    this.emitEvent('delegation_cancelled', delegationId, delegation.assignedAgent, delegation.task.id, {
      reason: 'Manually cancelled'
    });

    this.activeDelegations.delete(delegationId);
    this.delegationHistory.push(delegation);

    return true;
  }

  async getAgentWorkload(agentId: string): Promise<number> {
    const agent = this.agentRegistry.get(agentId);
    return agent ? agent.currentWorkload : 0;
  }

  async updateAgentCapabilities(agentId: string, capabilities: string[]): Promise<boolean> {
    const agent = this.agentRegistry.get(agentId);
    if (!agent) {
      return false;
    }

    agent.capabilities = capabilities;
    agent.lastActiveAt = new Date();
    
    // Recalculate specialization scores
    agent.specializationScore = this.calculateSpecializationScores(capabilities);
    
    return true;
  }

  async getDelegationHistory(agentId?: string): Promise<DelegationResult[]> {
    if (agentId) {
      return this.delegationHistory.filter(result => result.assignedAgent === agentId);
    }
    return [...this.delegationHistory];
  }

  async getDelegationAnalytics(): Promise<DelegationAnalytics> {
    const totalDelegations = this.delegationHistory.length;
    const successfulDelegations = this.delegationHistory.filter(d => d.status === 'completed').length;
    const failedDelegations = this.delegationHistory.filter(d => d.status === 'failed').length;

    const responseTimeSum = this.delegationHistory
      .filter(d => d.performanceMetrics)
      .reduce((sum, d) => sum + (d.performanceMetrics?.responseTime || 0), 0);

    const executionTimeSum = this.delegationHistory
      .filter(d => d.performanceMetrics)
      .reduce((sum, d) => sum + (d.performanceMetrics?.executionTime || 0), 0);

    const agentUtilization: Record<string, number> = {};
    const taskTypeDistribution: Record<string, number> = {};
    const failureReasons: Record<string, number> = {};

    this.delegationHistory.forEach(delegation => {
      // Agent utilization
      agentUtilization[delegation.assignedAgent] = (agentUtilization[delegation.assignedAgent] || 0) + 1;
      
      // Task type distribution
      taskTypeDistribution[delegation.task.type] = (taskTypeDistribution[delegation.task.type] || 0) + 1;
      
      // Failure reasons
      if (delegation.status === 'failed' && delegation.error) {
        failureReasons[delegation.error] = (failureReasons[delegation.error] || 0) + 1;
      }
    });

    // Calculate top performing agents
    const topPerformingAgents = Object.entries(agentUtilization)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([agentId]) => agentId);

    return {
      totalDelegations,
      successRate: totalDelegations > 0 ? successfulDelegations / totalDelegations : 0,
      averageResponseTime: responseTimeSum / Math.max(1, totalDelegations),
      averageExecutionTime: executionTimeSum / Math.max(1, totalDelegations),
      agentUtilization,
      taskTypeDistribution,
      failureReasons,
      topPerformingAgents,
      workloadBalance: this.calculateWorkloadBalance()
    };
  }

  // Helper methods

  private async handleUnavailableAgent(
    request: DelegationRequest, 
    agent: Agent, 
    delegationId: string
  ): Promise<DelegationResponse> {
    if (request.fallbackStrategy === 'retry') {
      // Defer the delegation
      return {
        id: delegationId,
        requestId: request.id,
        status: 'deferred',
        reason: `Agent ${agent.id} is currently ${agent.status}`,
        estimatedStartTime: new Date(Date.now() + 30000), // 30 seconds delay
        timestamp: new Date()
      };
    }

    return {
      id: delegationId,
      requestId: request.id,
      status: 'rejected',
      reason: `Agent ${agent.id} is currently ${agent.status}`,
      timestamp: new Date()
    };
  }

  private isAgentEligible(agent: Agent, task: Task, constraints?: DelegationConstraints): boolean {
    // Check basic availability
    if (agent.status === 'offline') {
      return false;
    }

    // Check capability requirements
    const hasRequiredCapabilities = task.requiredCapabilities.every(capability =>
      agent.capabilities.includes(capability)
    );

    if (!hasRequiredCapabilities) {
      return false;
    }

    // Check constraints
    if (constraints) {
      if (constraints.minTrustLevel && agent.trustLevel < constraints.minTrustLevel) {
        return false;
      }

      if (constraints.maxWorkload && agent.currentWorkload > constraints.maxWorkload) {
        return false;
      }

      if (constraints.requiredSuccessRate && agent.successRate < constraints.requiredSuccessRate) {
        return false;
      }

      if (constraints.requiredLocation && agent.location !== constraints.requiredLocation) {
        return false;
      }
    }

    return true;
  }

  private async calculateCapabilityMatches(task: Task, agents: Agent[]): Promise<CapabilityMatch[]> {
    const matches: CapabilityMatch[] = [];

    for (const agent of agents) {
      const match = await this.calculateSingleCapabilityMatch(task, agent);
      matches.push(match);
    }

    return matches;
  }

  private async calculateSingleCapabilityMatch(task: Task, agent: Agent): Promise<CapabilityMatch> {
    const capabilityScores: Record<string, number> = {};
    let totalCapabilityScore = 0;

    // Calculate capability match scores
    for (const capability of task.requiredCapabilities) {
      const score = agent.specializationScore[capability] || 0;
      capabilityScores[capability] = score;
      totalCapabilityScore += score;
    }

    const matchScore = totalCapabilityScore / task.requiredCapabilities.length;
    
    // Calculate workload factor (lower workload = higher score)
    const workloadFactor = Math.max(0, 1 - (agent.currentWorkload / agent.maxCapacity));
    
    // Trust factor
    const trustFactor = agent.trustLevel;
    
    // Location factor (placeholder - could be enhanced with actual distance calculation)
    const locationFactor = 1.0;

    // Overall score calculation
    const overallScore = (
      matchScore * 0.4 +
      workloadFactor * 0.3 +
      trustFactor * 0.2 +
      locationFactor * 0.1
    );

    const reasoning = [
      `Capability match: ${(matchScore * 100).toFixed(1)}%`,
      `Workload factor: ${(workloadFactor * 100).toFixed(1)}%`,
      `Trust level: ${(trustFactor * 100).toFixed(1)}%`,
      `Current workload: ${agent.currentWorkload}/${agent.maxCapacity}`
    ];

    return {
      agentId: agent.id,
      matchScore,
      capabilityScores,
      workloadFactor,
      trustFactor,
      locationFactor,
      overallScore,
      reasoning
    };
  }

  private calculateSpecializationScores(capabilities: string[]): Record<string, number> {
    const scores: Record<string, number> = {};
    
    // Simple scoring based on capability presence
    capabilities.forEach(capability => {
      scores[capability] = 0.8 + Math.random() * 0.2; // 0.8 to 1.0
    });

    return scores;
  }

  private async updateAgentWorkload(agentId: string, workloadChange: number): Promise<void> {
    const agent = this.agentRegistry.get(agentId);
    if (agent) {
      agent.currentWorkload = Math.max(0, agent.currentWorkload + workloadChange);
      agent.lastActiveAt = new Date();
    }
  }

  private calculateWorkloadBalance(): number {
    const agents = Array.from(this.agentRegistry.values());
    if (agents.length === 0) return 1.0;

    const workloadRatios = agents.map(agent => agent.currentWorkload / agent.maxCapacity);
    const avgWorkload = workloadRatios.reduce((sum, ratio) => sum + ratio, 0) / agents.length;
    
    // Calculate standard deviation
    const variance = workloadRatios.reduce((sum, ratio) => sum + Math.pow(ratio - avgWorkload, 2), 0) / agents.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Return balance score (lower deviation = better balance)
    return Math.max(0, 1 - standardDeviation);
  }

  private emitEvent(
    type: DelegationEvent['type'],
    delegationId: string,
    agentId: string | undefined,
    taskId: string,
    data: any
  ): void {
    const event: DelegationEvent = {
      id: `event_${Date.now()}_${this.eventCounter++}`,
      type,
      delegationId,
      agentId,
      taskId,
      data,
      timestamp: new Date()
    };

    this.emit(type, event);
  }

  // Agent management methods

  public registerAgent(agent: Agent): void {
    this.agentRegistry.set(agent.id, agent);
  }

  public unregisterAgent(agentId: string): boolean {
    return this.agentRegistry.delete(agentId);
  }

  public getAgent(agentId: string): Agent | undefined {
    return this.agentRegistry.get(agentId);
  }

  public getAllAgents(): Agent[] {
    return Array.from(this.agentRegistry.values());
  }

  public updateAgentStatus(agentId: string, status: Agent['status']): boolean {
    const agent = this.agentRegistry.get(agentId);
    if (agent) {
      agent.status = status;
      agent.lastActiveAt = new Date();
      return true;
    }
    return false;
  }
}
