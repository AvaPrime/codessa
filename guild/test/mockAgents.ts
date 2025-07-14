export interface MockAgent {
  id: string;
  name: string;
  capabilities: string[];
  successRate: number;
  computeAvailable: number;
  memoryAvailable: number;
  specializations: string[];
  trustLevel: number;
  responseTime: number;
  isActive: boolean;
}

export class MockAgentFactory {
  static createAgent(
    id: string,
    name: string,
    capabilities: string[],
    successRate: number = 0.8,
    computeAvailable: number = 50,
    memoryAvailable: number = 1000,
    specializations: string[] = [],
    trustLevel: number = 0.8,
    responseTime: number = 100
  ): MockAgent {
    return {
      id,
      name,
      capabilities,
      successRate,
      computeAvailable,
      memoryAvailable,
      specializations,
      trustLevel,
      responseTime,
      isActive: true
    };
  }

  static createGuildAlpha(): MockAgent[] {
    return [
      MockAgentFactory.createAgent(
        'agent_alpha_001',
        'AgentAlpha',
        ['compute', 'gpu', 'inference'],
        0.92,
        80,
        2000,
        ['machine_learning', 'neural_networks'],
        0.95,
        50
      ),
      MockAgentFactory.createAgent(
        'agent_beta_002',
        'AgentBeta',
        ['network', 'bandwidth', 'communication'],
        0.85,
        60,
        1500,
        ['networking', 'distributed_systems'],
        0.88,
        75
      ),
      MockAgentFactory.createAgent(
        'agent_gamma_003',
        'AgentGamma',
        ['storage', 'ssd', 'database'],
        0.89,
        70,
        3000,
        ['data_management', 'persistence'],
        0.91,
        60
      ),
      MockAgentFactory.createAgent(
        'agent_delta_004',
        'AgentDelta',
        ['analysis', 'reasoning', 'planning'],
        0.94,
        90,
        2500,
        ['strategic_planning', 'decision_making'],
        0.93,
        40
      )
    ];
  }

  static createGuildBeta(): MockAgent[] {
    return [
      MockAgentFactory.createAgent(
        'agent_epsilon_005',
        'AgentEpsilon',
        ['security', 'encryption', 'validation'],
        0.96,
        85,
        1800,
        ['cryptography', 'security_protocols'],
        0.97,
        35
      ),
      MockAgentFactory.createAgent(
        'agent_zeta_006',
        'AgentZeta',
        ['monitoring', 'metrics', 'logging'],
        0.87,
        65,
        1200,
        ['observability', 'system_monitoring'],
        0.89,
        80
      ),
      MockAgentFactory.createAgent(
        'agent_eta_007',
        'AgentEta',
        ['optimization', 'performance', 'efficiency'],
        0.91,
        75,
        2200,
        ['performance_tuning', 'resource_optimization'],
        0.92,
        55
      )
    ];
  }

  static simulateResourceNeed(agent: MockAgent, resourceType: string, amount: number): any {
    return {
      agentId: agent.id,
      resourceType,
      amount,
      priority: agent.trustLevel > 0.9 ? 'high' : 'medium',
      justification: `${agent.name} requires ${amount} units of ${resourceType} for specialized task`,
      maxBid: Math.round(agent.trustLevel * 100 + Math.random() * 50),
      timestamp: new Date()
    };
  }

  static simulateVotingBehavior(agent: MockAgent, proposal: any): string {
    // Simulate voting behavior based on agent characteristics
    const randomFactor = Math.random();
    const trustFactor = agent.trustLevel;
    const successFactor = agent.successRate;
    
    const acceptanceProbability = (trustFactor + successFactor) / 2;
    
    if (randomFactor < acceptanceProbability) {
      return 'Accept';
    } else if (randomFactor < acceptanceProbability + 0.2) {
      return 'Counter';
    } else {
      return 'Reject';
    }
  }
}

export class GuildSimulator {
  private agents: MockAgent[];
  private guildId: string;

  constructor(guildId: string, agents: MockAgent[]) {
    this.guildId = guildId;
    this.agents = agents;
  }

  getActiveAgents(): MockAgent[] {
    return this.agents.filter(agent => agent.isActive);
  }

  getTotalMembers(): number {
    return this.agents.length;
  }

  getAgentById(id: string): MockAgent | undefined {
    return this.agents.find(agent => agent.id === id);
  }

  simulateResourceContention(resourceType: string, totalAvailable: number): any[] {
    const requests = this.agents.map(agent => 
      MockAgentFactory.simulateResourceNeed(
        agent, 
        resourceType, 
        Math.round(Math.random() * totalAvailable * 0.8)
      )
    );

    return requests;
  }

  simulateConsensusVoting(proposalId: string, proposal: any): any[] {
    const votes = this.agents.map(agent => ({
      proposalId,
      voterId: agent.id,
      choice: MockAgentFactory.simulateVotingBehavior(agent, proposal),
      timestamp: new Date(),
      agentTrustLevel: agent.trustLevel,
      agentSuccessRate: agent.successRate
    }));

    return votes;
  }

  getGuildMetrics(): any {
    const totalCompute = this.agents.reduce((sum, agent) => sum + agent.computeAvailable, 0);
    const totalMemory = this.agents.reduce((sum, agent) => sum + agent.memoryAvailable, 0);
    const averageTrust = this.agents.reduce((sum, agent) => sum + agent.trustLevel, 0) / this.agents.length;
    const averageSuccess = this.agents.reduce((sum, agent) => sum + agent.successRate, 0) / this.agents.length;

    return {
      guildId: this.guildId,
      totalAgents: this.agents.length,
      activeAgents: this.getActiveAgents().length,
      totalComputeCapacity: totalCompute,
      totalMemoryCapacity: totalMemory,
      averageTrustLevel: averageTrust,
      averageSuccessRate: averageSuccess,
      capabilityDistribution: this.getCapabilityDistribution()
    };
  }

  private getCapabilityDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    this.agents.forEach(agent => {
      agent.capabilities.forEach(capability => {
        distribution[capability] = (distribution[capability] || 0) + 1;
      });
    });

    return distribution;
  }
}
