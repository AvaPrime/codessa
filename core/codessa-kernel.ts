import { EventEmitter } from 'events';
import { RegistryManager, Agent } from '../registry/registry-manager';
import { ModelRouter } from '../model_router/model-router';
import { MemoryManager } from '../memory/memory-manager';
import { GoalDecomposer } from '../planner/decomposer/goalDecomposer';
import { Scheduler } from '../planner/scheduler/taskQueue';
import { CognitionLoop } from '../planner/feedback/cognitionLoop';
import { ForesightKernelBridge } from '../foresight/foresightKernelBridge';
import { Goal, Task as PlannerTask, TaskPlan, PriorityLevel } from '../planner/models/taskTypes';

interface Task {
  id: string;
  type: string;
  content: string;
  agent?: string;
  metadata?: any;
}

interface Directive {
  id: string;
  name: string;
  tasks: Task[];
  status: 'pending' | 'running' | 'completed' | 'failed';
}

class CodesssaKernel extends EventEmitter {
  private registryManager: RegistryManager;
  private modelRouter: ModelRouter;
  private memoryManager: MemoryManager;
  private goalDecomposer: GoalDecomposer;
  private scheduler: Scheduler;
  private cognitionLoop: CognitionLoop;
  private isInitialized: boolean = false;
  private activeDirectives: Map<string, Directive> = new Map();
  private activePlans: Map<string, TaskPlan> = new Map();

  constructor() {
    super();
    this.registryManager = new RegistryManager();
    this.modelRouter = new ModelRouter();
    this.memoryManager = new MemoryManager();
    this.goalDecomposer = new GoalDecomposer();
    this.scheduler = new Scheduler();
    this.cognitionLoop = new CognitionLoop();
  }

  async initialize(): Promise<void> {
    try {
      console.log('🌟 Initializing Codessa Kernel...');
      
      // Initialize core components
      await this.registryManager.loadRegistry();
      await this.modelRouter.initialize();
      await this.memoryManager.initialize();
      
      // Initialize task planner components
      console.log('🧠 Initializing Autonomous Task Planner...');
      await this.goalDecomposer.initialize();
      await this.scheduler.initialize();
      await this.cognitionLoop.initialize();
      
      // Wire up task planner event handlers
      this.setupTaskPlannerEvents();
      
      // Start the scheduler loop
      this.scheduler.start();
      
      this.isInitialized = true;
      this.emit('system.ready');
      
      console.log('✅ Codessa Kernel initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Codessa Kernel:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Codessa Kernel...');
    
    this.emit('system.shutdown');
    
    // Clean shutdown of components
    await this.modelRouter.shutdown();
    await this.memoryManager.shutdown();
    
    this.isInitialized = false;
    console.log('🔴 Codessa Kernel shutdown complete');
  }

  // Agent Management
  async listAgents(): Promise<Agent[]> {
    this.ensureInitialized();
    return await this.registryManager.listAgents();
  }

  async getAgent(name: string): Promise<Agent | null> {
    this.ensureInitialized();
    return await this.registryManager.getAgent(name);
  }

  async registerAgent(agent: Agent): Promise<void> {
    this.ensureInitialized();
    await this.registryManager.registerAgent(agent);
    this.emit('agent.registered', agent);
  }

  async agentStatus(name: string): Promise<any> {
    this.ensureInitialized();
    const agent = await this.getAgent(name);
    
    if (!agent) {
      throw new Error(`Agent ${name} not found`);
    }

    return {
      name: agent.name,
      archetype: agent.archetype,
      guild: agent.guild,
      status: 'active', // TODO: Implement actual status tracking
      capabilities: agent.capabilities,
      model_preference: agent.model_preference
    };
  }

  // Directive Execution
  async runDirective(directiveName: string, params?: any): Promise<any> {
    this.ensureInitialized();
    
    const directive: Directive = {
      id: `directive-${Date.now()}`,
      name: directiveName,
      tasks: [], // TODO: Load from directive definition
      status: 'pending'
    };

    this.activeDirectives.set(directive.id, directive);
    this.emit('directive.started', directive);

    try {
      directive.status = 'running';
      
      // Execute directive tasks
      const results = await this.executeDirectiveTasks(directive);
      
      directive.status = 'completed';
      this.emit('directive.completed', directive);
      
      return results;
    } catch (error) {
      directive.status = 'failed';
      this.emit('directive.failed', directive, error);
      throw error;
    } finally {
      this.activeDirectives.delete(directive.id);
    }
  }

  private async executeDirectiveTasks(directive: Directive): Promise<any[]> {
    const results: any[] = [];

    for (const task of directive.tasks) {
      try {
        const result = await this.executeTask(task);
        results.push({ taskId: task.id, result });
      } catch (error) {
        console.error(`Task ${task.id} failed:`, error);
        throw error;
      }
    }

    return results;
  }

  private async executeTask(task: Task): Promise<any> {
    // Determine which agent should handle this task
    const agent = task.agent ? 
      await this.getAgent(task.agent) : 
      await this.selectAgentForTask(task);

    if (!agent) {
      throw new Error(`No suitable agent found for task ${task.id}`);
    }

    // Route the task to the appropriate model
    const model = await this.modelRouter.routeTask(task, agent);
    
    // Execute the task through the selected model
    const result = await model.execute(task.content, task.metadata);
    
    // Store result in memory if needed
    if (task.metadata?.storeInMemory) {
      await this.memoryManager.store({
        id: `task-result-${task.id}-${Date.now()}`,
        type: 'task_result',
        content: result,
        agent: agent.name,
        task_id: task.id,
        timestamp: new Date().toISOString()
      });
    }

    return result;
  }

  private async selectAgentForTask(task: Task): Promise<Agent | null> {
    const agents = await this.listAgents();
    
    // Simple selection based on capabilities
    // TODO: Implement more sophisticated agent selection
    return agents.find(agent => 
      agent.capabilities.some(cap => 
        task.type.includes(cap) || cap.includes(task.type)
      )
    ) || agents[0]; // Fallback to first agent
  }

  // Memory Operations
  async queryMemory(query: string): Promise<any[]> {
    this.ensureInitialized();
    
    const results = await this.memoryManager.search(query);
    this.emit('memory.queried', query, results);
    
    return results;
  }

  async storeMemory(data: any): Promise<void> {
    this.ensureInitialized();
    
    await this.memoryManager.store(data);
    this.emit('memory.stored', data);
  }

  // Guild Operations
  async listGuilds(): Promise<any[]> {
    this.ensureInitialized();
    return await this.registryManager.listGuilds();
  }

  async getAgentsByGuild(guildName: string): Promise<Agent[]> {
    this.ensureInitialized();
    return await this.registryManager.getAgentsByGuild(guildName);
  }

  // Model Management
  async setAgentModelPreference(agentName: string, modelName: string): Promise<void> {
    this.ensureInitialized();
    
    await this.registryManager.setModelPreference(agentName, modelName);
    this.emit('agent.modelPreferenceChanged', { agent: agentName, model: modelName });
  }

  async getAvailableModels(): Promise<string[]> {
    this.ensureInitialized();
    return this.modelRouter.getAvailableModels();
  }

  // Task Planner Integration
  async createGoal(description: string, priority: PriorityLevel = PriorityLevel.MEDIUM): Promise<Goal> {
    this.ensureInitialized();
    
    const goal: Goal = {
      id: `goal-${Date.now()}`,
      title: `Goal ${Date.now()}`,
      description,
      priority,
      createdAt: new Date(),
      createdBy: 'system',
      domain: 'general',
      successCriteria: ['Task completion'],
      constraints: [],
      metadata: {},
      status: 'active'
    };
    
    const plan = await this.goalDecomposer.decomposeGoal(goal);
    this.activePlans.set(plan.id, plan);
    
    // Queue tasks in scheduler - plan.tasks contains task IDs, not Task objects
    // This is a mock implementation - in reality we'd need to create/retrieve actual Task objects
    console.log(`Plan ${plan.id} created with ${plan.tasks.length} task(s)`);
    // TODO: Implement actual task queueing from task IDs
    
    this.emit('goal.created', goal);
    this.emit('plan.created', plan);
    
    return goal;
  }
  
  async getActivePlans(): Promise<TaskPlan[]> {
    this.ensureInitialized();
    return Array.from(this.activePlans.values());
  }
  
  async getPlan(planId: string): Promise<TaskPlan | null> {
    this.ensureInitialized();
    return this.activePlans.get(planId) || null;
  }
  
  async cancelPlan(planId: string): Promise<void> {
    this.ensureInitialized();
    const plan = this.activePlans.get(planId);
    if (plan) {
      plan.status = 'cancelled';
      // Cancel associated tasks in scheduler - plan.tasks contains task IDs
      for (const taskId of plan.tasks) {
        await this.scheduler.cancelTask(taskId);
      }
      this.activePlans.delete(planId);
      this.emit('plan.cancelled', plan);
    }
  }
  
  private setupTaskPlannerEvents(): void {
    // TODO: Implement task event handlers once Task interface is unified
    // Temporarily disabled to resolve interface mismatch
    console.log('⚠️ Task planner events setup deferred - interface unification needed');
    
    // Listen for cognition loop insights
    this.cognitionLoop.on('insight.generated', (insight: any) => {
      this.emit('cognitive.insight', insight);
    });
  }
  
  // System Information
  getSystemStatus(): any {
    return {
      initialized: this.isInitialized,
      activeDirectives: this.activeDirectives.size,
      activePlans: this.activePlans.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Codessa Kernel is not initialized. Call initialize() first.');
    }
  }

  // Event handling for graceful shutdown
  setupGracefulShutdown(): void {
    process.on('SIGINT', async () => {
      console.log('\n🔄 Received SIGINT, shutting down gracefully...');
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🔄 Received SIGTERM, shutting down gracefully...');
      await this.shutdown();
      process.exit(0);
    });
  }
}

export { CodesssaKernel, Task, Directive };
