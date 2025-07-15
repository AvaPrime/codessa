// Basic DirectiveRegistry implementation for agent system

export interface DirectiveDefinition {
  id: string;
  name: string;
  description: string;
  tasks: string[];
  status: 'active' | 'inactive' | 'deprecated';
  createdAt: string;
  metadata?: Record<string, any>;
}

export class DirectiveRegistry {
  private directives: Map<string, DirectiveDefinition> = new Map();

  constructor() {
    // Initialize with basic directives
    this.initializeBasicDirectives();
  }

  private initializeBasicDirectives(): void {
    const basicDirective: DirectiveDefinition = {
      id: 'basic-analysis',
      name: 'Basic Analysis',
      description: 'Perform basic analysis tasks',
      tasks: ['analyze', 'summarize', 'report'],
      status: 'active',
      createdAt: new Date().toISOString(),
      metadata: { category: 'analysis' }
    };

    this.directives.set(basicDirective.id, basicDirective);
  }

  registerDirective(directive: DirectiveDefinition): void {
    this.directives.set(directive.id, directive);
    console.log(`Directive registered: ${directive.name}`);
  }

  getDirective(id: string): DirectiveDefinition | undefined {
    return this.directives.get(id);
  }

  getDirectiveByName(name: string): DirectiveDefinition | undefined {
    for (const directive of this.directives.values()) {
      if (directive.name === name) {
        return directive;
      }
    }
    return undefined;
  }

  getAllDirectives(): DirectiveDefinition[] {
    return Array.from(this.directives.values());
  }

  getActiveDirectives(): DirectiveDefinition[] {
    return Array.from(this.directives.values()).filter(d => d.status === 'active');
  }

  removeDirective(id: string): boolean {
    return this.directives.delete(id);
  }
}

// Export singleton instance
export const directiveRegistry = new DirectiveRegistry();
