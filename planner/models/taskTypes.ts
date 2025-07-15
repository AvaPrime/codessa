/**
 * Core Data Structures for Codessa Autonomous Task Planner
 * 
 * These foundational types define the contracts for autonomous task planning,
 * goal decomposition, and cognitive task management within Codessa OS.
 */

export enum PriorityLevel {
  CRITICAL = 5,    // System-critical tasks (security, stability)
  HIGH = 4,        // Important goals with time constraints
  MEDIUM = 3,      // Standard operational tasks
  LOW = 2,         // Background optimization tasks
  DEFERRED = 1     // Future considerations
}

export enum TaskStatus {
  PENDING = 'pending',           // Task created, awaiting execution
  QUEUED = 'queued',            // Task in execution queue
  RUNNING = 'running',          // Currently being executed
  BLOCKED = 'blocked',          // Waiting for dependencies
  COMPLETED = 'completed',      // Successfully finished
  FAILED = 'failed',            // Execution failed
  CANCELLED = 'cancelled',      // Manually cancelled
  DEFERRED = 'deferred'         // Postponed to future
}

export enum TaskType {
  DIRECTIVE = 'directive',           // Execute a Codessa directive
  ANALYSIS = 'analysis',             // Analyze data or system state
  PLANNING = 'planning',             // Strategic planning task
  MEMORY_OPERATION = 'memory_op',    // Memory storage/retrieval
  AGENT_COORDINATION = 'agent_coord', // Multi-agent coordination
  SYSTEM_MAINTENANCE = 'sys_maint',  // System health and maintenance
  LEARNING = 'learning',             // Knowledge acquisition
  REFLECTION = 'reflection',         // Self-analysis and improvement
  COMMUNICATION = 'communication',   // External communication
  CREATIVE = 'creative'              // Creative/generative tasks
}

export enum RecurrenceType {
  NONE = 'none',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  createdAt: Date;
  deadline?: Date;
  createdBy: string;           // Agent or user who created the goal
  domain: string;              // Domain of the goal (e.g., 'system', 'development', 'analysis')
  successCriteria: string[];   // Measurable success conditions
  constraints: GoalConstraint[];
  metadata: Record<string, any>;
  status: 'active' | 'completed' | 'cancelled' | 'on_hold';
}

export interface GoalConstraint {
  type: 'resource' | 'time' | 'dependency' | 'agent' | 'custom';
  description: string;
  value: any;
  required: boolean;
}

export interface Task {
  id: string;
  goalId: string;              // Parent goal this task serves
  title: string;
  description: string;
  type: TaskType;
  priority: PriorityLevel;
  status: TaskStatus;
  
  // Execution context
  assignedAgent?: string;      // Which agent should execute this task
  modelPreference?: string;    // Preferred LLM model for this task
  estimatedDuration: number;   // Estimated duration in minutes
  actualDuration?: number;     // Actual duration after completion
  
  // Dependencies and scheduling
  dependencies: string[];      // Task IDs this task depends on
  dependents: string[];        // Task IDs that depend on this task
  blockedBy: string[];         // Currently blocked by these task IDs
  
  // Timing
  createdAt: Date;
  scheduledFor?: Date;         // When task should be executed
  startedAt?: Date;
  completedAt?: Date;
  deadline?: Date;
  
  // Recurrence
  recurrence: RecurrenceSchedule;
  
  // Execution parameters
  parameters: TaskParameters;
  context: TaskContext;
  
  // Results and feedback
  result?: TaskResult;
  feedback?: TaskFeedback[];
  
  // Metadata
  tags: string[];
  metadata: Record<string, any>;
}

export interface RecurrenceSchedule {
  type: RecurrenceType;
  interval?: number;           // For custom recurrence
  endDate?: Date;
  maxOccurrences?: number;
  cronExpression?: string;     // For complex custom schedules
}

export interface TaskParameters {
  input: Record<string, any>;   // Input parameters for task execution
  options: Record<string, any>; // Execution options and settings
  resources: ResourceRequirement[];
}

export interface ResourceRequirement {
  type: 'agent' | 'memory' | 'compute' | 'network' | 'storage';
  amount: number;
  unit: string;
  required: boolean;
}

export interface TaskContext {
  parentTaskId?: string;       // If this is a subtask
  workflowId?: string;         // Part of a larger workflow
  environment: 'development' | 'staging' | 'production';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  audience?: string[];         // Who needs to be notified of results
  securityLevel: 'public' | 'internal' | 'confidential' | 'secret';
}

export interface TaskResult {
  status: 'success' | 'partial' | 'failure';
  output: Record<string, any>;
  metrics: TaskMetrics;
  artifacts: string[];         // Files, documents, or data created
  logs: string[];              // Execution logs
  errors?: string[];           // Error messages if applicable
}

export interface TaskMetrics {
  executionTime: number;       // Actual execution time in ms
  resourcesUsed: Record<string, number>;
  qualityScore?: number;       // 0-100 quality assessment
  efficiencyScore?: number;    // 0-100 efficiency assessment
  accuracyScore?: number;      // 0-100 accuracy assessment
}

export interface TaskFeedback {
  source: string;              // Agent or system that provided feedback
  type: 'quality' | 'efficiency' | 'accuracy' | 'suggestion' | 'error';
  message: string;
  score?: number;              // Numeric feedback (0-100)
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface TaskPlan {
  id: string;
  goalId: string;
  title: string;
  description: string;
  tasks: string[];             // Ordered list of task IDs
  createdAt: Date;
  createdBy: string;
  estimatedCompletion: Date;
  actualCompletion?: Date;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  dependencyGraph: DependencyGraph;
  executionStrategy: ExecutionStrategy;
  contingencyPlans: ContingencyPlan[];
  metadata: Record<string, any>;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  criticalPath: string[];      // Task IDs on the critical path
  parallelBranches: string[][]; // Groups of tasks that can run in parallel
}

export interface DependencyNode {
  taskId: string;
  level: number;               // Depth in dependency hierarchy
  canParallelize: boolean;
  estimatedStart: Date;
  estimatedEnd: Date;
}

export interface DependencyEdge {
  fromTaskId: string;
  toTaskId: string;
  type: 'hard' | 'soft' | 'resource';
  weight: number;              // Strength of dependency (0-1)
  description?: string;
}

export interface ExecutionStrategy {
  type: 'sequential' | 'parallel' | 'hybrid' | 'adaptive';
  maxParallelTasks: number;
  resourceAllocation: ResourceAllocationStrategy;
  failureHandling: FailureHandlingStrategy;
  optimization: OptimizationStrategy;
}

export interface ResourceAllocationStrategy {
  agentPoolSize: number;
  memoryReservation: number;   // MB reserved for execution
  computePriority: 'low' | 'medium' | 'high';
  networkBandwidth?: number;   // For network-intensive tasks
}

export interface FailureHandlingStrategy {
  retryAttempts: number;
  retryDelay: number;          // Seconds between retries
  escalationRules: EscalationRule[];
  fallbackTasks: string[];     // Alternative tasks if primary fails
}

export interface EscalationRule {
  condition: string;           // Condition that triggers escalation
  action: 'retry' | 'reassign' | 'cancel' | 'defer' | 'alert';
  target?: string;             // Agent or system to escalate to
  delay: number;               // Delay before escalation
}

export interface OptimizationStrategy {
  prioritizeBy: 'deadline' | 'priority' | 'resources' | 'dependencies';
  loadBalancing: boolean;
  dynamicReordering: boolean;
  resourcePreemption: boolean; // Can interrupt lower priority tasks
}

export interface ContingencyPlan {
  id: string;
  trigger: ContingencyTrigger;
  actions: ContingencyAction[];
  description: string;
  probability: number;         // 0-1 estimated probability of trigger
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface ContingencyTrigger {
  type: 'task_failure' | 'resource_shortage' | 'deadline_risk' | 'agent_unavailable';
  condition: string;
  threshold?: number;
}

export interface ContingencyAction {
  type: 'reallocate' | 'reschedule' | 'reassign' | 'modify' | 'cancel';
  target: string;              // What to act upon
  parameters: Record<string, any>;
}

// Queue and scheduling types
export interface TaskQueue {
  id: string;
  name: string;
  priority: PriorityLevel;
  tasks: QueuedTask[];
  capacity: number;            // Maximum concurrent tasks
  currentLoad: number;
  strategy: QueueStrategy;
  metrics: QueueMetrics;
}

export interface QueuedTask {
  taskId: string;
  queuedAt: Date;
  estimatedStart: Date;
  position: number;
  waitTime: number;            // Current wait time in ms
}

export interface QueueStrategy {
  algorithm: 'fifo' | 'priority' | 'shortest_first' | 'deadline_first' | 'custom';
  parameters: Record<string, any>;
  preemption: boolean;         // Can interrupt running tasks
}

export interface QueueMetrics {
  averageWaitTime: number;
  throughput: number;          // Tasks per hour
  utilization: number;         // 0-1 queue utilization
  missedDeadlines: number;
  lastUpdated: Date;
}

// Learning and feedback types
export interface TaskPattern {
  id: string;
  pattern: string;
  frequency: number;
  successRate: number;
  averageDuration: number;
  commonFailures: string[];
  recommendations: string[];
  confidence: number;          // 0-1 confidence in pattern validity
}

export interface LearningInsight {
  id: string;
  type: 'efficiency' | 'quality' | 'resource' | 'scheduling' | 'agent';
  insight: string;
  evidence: string[];
  actionable: boolean;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  createdAt: Date;
  appliedAt?: Date;
}

// All types are already exported above via their interface declarations
