import { EventEmitter } from 'events';

export interface ModelConfig {
  name: string;
  type: string;
  endpoint?: string;
  apiKey?: string;
  capabilities: string[];
  maxTokens?: number;
  temperature?: number;
}

export interface ModelInstance {
  name: string;
  config: ModelConfig;
  execute(prompt: string, metadata?: any): Promise<any>;
}

export interface Task {
  id: string;
  type: string;
  content: string;
  agent?: string;
  metadata?: any;
}

export interface Agent {
  name: string;
  archetype: string;
  guild: string;
  capabilities: string[];
  model_preference?: string;
}

export class ModelRouter extends EventEmitter {
  private models: Map<string, ModelInstance> = new Map();
  private initialized: boolean = false;
  private defaultModel: string = 'gemini-pro';

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    console.log('🎯 Initializing Model Router...');
    
    // Initialize default models
    await this.initializeDefaultModels();
    
    this.initialized = true;
    console.log('✅ Model Router initialized');
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Model Router...');
    this.initialized = false;
    this.models.clear();
    console.log('✅ Model Router shutdown complete');
  }

  private async initializeDefaultModels(): Promise<void> {
    // Add default Gemini model
    const geminiModel: ModelInstance = {
      name: 'gemini-pro',
      config: {
        name: 'gemini-pro',
        type: 'language-model',
        capabilities: ['text-generation', 'analysis', 'reasoning'],
        maxTokens: 8192,
        temperature: 0.7
      },
      execute: async (prompt: string, metadata?: any) => {
        // Mock implementation - in real system would call actual API
        return {
          content: `Mock response for: ${prompt.substring(0, 50)}...`,
          model: 'gemini-pro',
          timestamp: new Date().toISOString(),
          metadata
        };
      }
    };

    this.models.set('gemini-pro', geminiModel);

    // Add GPT-4 model
    const gptModel: ModelInstance = {
      name: 'gpt-4',
      config: {
        name: 'gpt-4',
        type: 'language-model',
        capabilities: ['text-generation', 'analysis', 'reasoning', 'code-generation'],
        maxTokens: 8192,
        temperature: 0.7
      },
      execute: async (prompt: string, metadata?: any) => {
        // Mock implementation
        return {
          content: `Mock GPT-4 response for: ${prompt.substring(0, 50)}...`,
          model: 'gpt-4',
          timestamp: new Date().toISOString(),
          metadata
        };
      }
    };

    this.models.set('gpt-4', gptModel);
  }

  async routeTask(task: Task, agent: Agent): Promise<ModelInstance> {
    if (!this.initialized) {
      throw new Error('Model Router not initialized');
    }

    // Determine the best model for this task/agent combination
    const modelName = this.selectBestModel(task, agent);
    const model = this.models.get(modelName);

    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }

    this.emit('task.routed', { task, agent, model: modelName });
    return model;
  }

  private selectBestModel(task: Task, agent: Agent): string {
    // Use agent's model preference if available
    if (agent.model_preference && this.models.has(agent.model_preference)) {
      return agent.model_preference;
    }

    // Select based on task type and capabilities
    for (const [modelName, model] of this.models) {
      if (model.config.capabilities.some(cap => 
        task.type.includes(cap) || cap.includes(task.type)
      )) {
        return modelName;
      }
    }

    // Fallback to default model
    return this.defaultModel;
  }

  async addModel(modelConfig: ModelConfig): Promise<void> {
    if (!this.initialized) {
      throw new Error('Model Router not initialized');
    }

    const model: ModelInstance = {
      name: modelConfig.name,
      config: modelConfig,
      execute: async (prompt: string, metadata?: any) => {
        // Generic execution logic - would be customized per model type
        return {
          content: `Response from ${modelConfig.name}: ${prompt.substring(0, 50)}...`,
          model: modelConfig.name,
          timestamp: new Date().toISOString(),
          metadata
        };
      }
    };

    this.models.set(modelConfig.name, model);
    this.emit('model.added', modelConfig);
  }

  async removeModel(modelName: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Model Router not initialized');
    }

    const removed = this.models.delete(modelName);
    if (removed) {
      this.emit('model.removed', modelName);
    }
    return removed;
  }

  getAvailableModels(): string[] {
    return Array.from(this.models.keys());
  }

  getModel(modelName: string): ModelInstance | null {
    return this.models.get(modelName) || null;
  }

  getModelConfigs(): ModelConfig[] {
    return Array.from(this.models.values()).map(model => model.config);
  }

  setDefaultModel(modelName: string): void {
    if (!this.models.has(modelName)) {
      throw new Error(`Model ${modelName} not found`);
    }
    this.defaultModel = modelName;
    this.emit('default.model.changed', modelName);
  }
}
