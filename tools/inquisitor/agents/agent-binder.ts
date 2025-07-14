import { SemanticAnalysis } from '../core/semantic-analyzer';

interface AgentRecommendations {
  primary_agents: string[];
  secondary_agents: string[];
  suggested_guild: string;
  archetype_matches: string[];
  capability_mappings: Record<string, string[]>;
}

class AgentBinder {
  async analyzeAgentBindings(
    semanticAnalysis: SemanticAnalysis,
    capabilities: string[]
  ): Promise<AgentRecommendations> {
    
    const recommendations: AgentRecommendations = {
      primary_agents: [],
      secondary_agents: [],
      suggested_guild: 'Guild of Reason',
      archetype_matches: [],
      capability_mappings: {}
    };

    // Analyze patterns for agent suggestions
    this.analyzeArchitecturePatterns(semanticAnalysis.architecture_patterns, recommendations);
    this.analyzeDesignPatterns(semanticAnalysis.design_patterns, recommendations);
    this.analyzeCapabilities(capabilities, recommendations);

    return recommendations;
  }

  private analyzeArchitecturePatterns(patterns: string[], recommendations: AgentRecommendations): void {
    // Map architecture patterns to agent archetypes
    if (patterns.includes('MVC') || patterns.includes('Clean Architecture')) {
      recommendations.primary_agents.push('Weaver');
      recommendations.suggested_guild = 'Weavers of Code';
    }
    
    if (patterns.includes('Event-Driven') || patterns.includes('Observer')) {
      recommendations.primary_agents.push('Oracle');
      recommendations.archetype_matches.push('Oracle');
    }
  }

  private analyzeDesignPatterns(patterns: string[], recommendations: AgentRecommendations): void {
    // Map design patterns to specific agents
    if (patterns.includes('Singleton') || patterns.includes('Factory')) {
      recommendations.secondary_agents.push('Guardian');
    }
    
    if (patterns.includes('Command') || patterns.includes('Strategy')) {
      recommendations.primary_agents.push('Executor');
      recommendations.suggested_guild = 'Circle of Executors';
    }
  }

  private analyzeCapabilities(capabilities: string[], recommendations: AgentRecommendations): void {
    // Map capabilities to agent bindings
    capabilities.forEach(capability => {
      switch (capability) {
        case 'ai':
        case 'ml':
          recommendations.primary_agents.push('Oracle');
          recommendations.suggested_guild = 'Guild of Reason';
          break;
        case 'database':
        case 'memory':
          recommendations.primary_agents.push('Guardian');
          recommendations.suggested_guild = 'Order of Memory';
          break;
        case 'cli':
        case 'api':
          recommendations.primary_agents.push('Executor');
          recommendations.suggested_guild = 'Circle of Executors';
          break;
      }
    });

    // Remove duplicates
    recommendations.primary_agents = [...new Set(recommendations.primary_agents)];
    recommendations.secondary_agents = [...new Set(recommendations.secondary_agents)];
  }
}

export { AgentBinder, AgentRecommendations };
