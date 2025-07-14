import { SemanticAnalysis } from '../core/semantic-analyzer';
import { AgentRecommendations } from '../agents/agent-binder';

interface IntegrationBlueprint {
  extraction_strategy: string;
  module_boundaries: string[];
  refactoring_tasks: string[];
  integration_points: string[];
  testing_requirements: string[];
}

class ModuleExtractor {
  async generateBlueprint(
    projectPath: string,
    semanticAnalysis: SemanticAnalysis,
    agentRecommendations: AgentRecommendations
  ): Promise<IntegrationBlueprint> {
    
    const blueprint: IntegrationBlueprint = {
      extraction_strategy: this.determineExtractionStrategy(semanticAnalysis),
      module_boundaries: this.identifyModuleBoundaries(semanticAnalysis),
      refactoring_tasks: this.planRefactoringTasks(semanticAnalysis),
      integration_points: this.identifyIntegrationPoints(semanticAnalysis),
      testing_requirements: this.defineTestingRequirements(semanticAnalysis)
    };

    return blueprint;
  }

  private determineExtractionStrategy(analysis: SemanticAnalysis): string {
    // Determine if we should extract as:
    // - Single module
    // - Multiple modules
    // - Plugin
    // - Core integration
    
    if (analysis.architecture_patterns.includes('Plugin')) {
      return 'plugin_extraction';
    }
    
    if (analysis.code_quality_metrics.maintainability_index > 80) {
      return 'direct_integration';
    }
    
    return 'modular_extraction';
  }

  private identifyModuleBoundaries(analysis: SemanticAnalysis): string[] {
    // Identify natural module boundaries based on:
    // - Class hierarchies
    // - Function groupings
    // - Import/export patterns
    
    return analysis.api_surface.exported_classes;
  }

  private planRefactoringTasks(analysis: SemanticAnalysis): string[] {
    const tasks: string[] = [];
    
    if (analysis.code_quality_metrics.technical_debt_ratio > 0.3) {
      tasks.push('technical_debt_reduction');
    }
    
    if (analysis.code_quality_metrics.cognitive_complexity > 15) {
      tasks.push('complexity_reduction');
    }
    
    tasks.push('codessa_api_integration');
    tasks.push('agent_binding_implementation');
    
    return tasks;
  }

  private identifyIntegrationPoints(analysis: SemanticAnalysis): string[] {
    // Identify how this module will integrate with Codessa:
    // - Agent interfaces
    // - Plugin hooks
    // - Event system
    // - Memory bindings
    
    return [
      'agent_interface',
      'plugin_registry',
      'event_system',
      'memory_binding'
    ];
  }

  private defineTestingRequirements(analysis: SemanticAnalysis): string[] {
    return [
      'unit_tests',
      'integration_tests',
      'agent_binding_tests',
      'performance_tests'
    ];
  }
}

export { ModuleExtractor, IntegrationBlueprint };
