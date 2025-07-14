export interface Task {
  id: string;
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiredCapabilities: string[];
  estimatedComplexity: number;
  estimatedDuration: number;
  dependencies: string[];
  payload: any;
  deadline?: Date;
  createdAt: Date;
  createdBy: string;
}

export interface Agent {
  id: string;
  name: string;
  capabilities: string[];
  currentWorkload: number;
  maxCapacity: number;
  successRate: number;
  averageResponseTime: number;
  specializationScore: Record<string, number>;
  lastActiveAt: Date;
  status: 'active' | 'busy' | 'idle' | 'offline';
  location?: string;
  trustLevel: number;
}

export interface DelegationRequest {
  id: string;
  task: Task;
  originAgent: string;
  preferredAgent?: string;
  exclusions?: string[];
  constraints?: DelegationConstraints;
  fallbackStrategy: 'retry' | 'queue' | 'escalate';
  timestamp: Date;
}

export interface DelegationConstraints {
  maxResponseTime?: number;
  minTrustLevel?: number;
  requiredLocation?: string;
  maxWorkload?: number;
  requiredSuccessRate?: number;
}

export interface DelegationResponse {
  id: string;
  requestId: string;
  status: 'accepted' | 'rejected' | 'deferred' | 'counter_offer';
  assignedAgent?: string;
  reason?: string;
  estimatedStartTime?: Date;
  estimatedCompletionTime?: Date;
  counterOffer?: DelegationCounterOffer;
  timestamp: Date;
}

export interface DelegationCounterOffer {
  suggestedDelay: number;
  modifiedPriority: 'low' | 'medium' | 'high' | 'critical';
  suggestedAlternativeAgent?: string;
  requiredResources?: string[];
}

export interface DelegationResult {
  id: string;
  requestId: string;
  task: Task;
  assignedAgent: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  startTime?: Date;
  completionTime?: Date;
  result?: any;
  error?: string;
  performanceMetrics?: DelegationMetrics;
  timestamp: Date;
}

export interface DelegationMetrics {
  responseTime: number;
  executionTime: number;
  qualityScore: number;
  resourceUtilization: number;
  errorRate: number;
}

export interface CapabilityMatch {
  agentId: string;
  matchScore: number;
  capabilityScores: Record<string, number>;
  workloadFactor: number;
  trustFactor: number;
  locationFactor: number;
  overallScore: number;
  reasoning: string[];
}

export interface DelegationStrategy {
  name: string;
  description: string;
  evaluate(task: Task, agents: Agent[]): Promise<CapabilityMatch[]>;
  selectOptimalAgent(matches: CapabilityMatch[]): Promise<string>;
}

export interface DelegationEngine {
  delegateTask(request: DelegationRequest): Promise<DelegationResponse>;
  findOptimalAgent(task: Task, constraints?: DelegationConstraints): Promise<Agent | null>;
  monitorDelegation(delegationId: string): Promise<DelegationResult>;
  cancelDelegation(delegationId: string): Promise<boolean>;
  getAgentWorkload(agentId: string): Promise<number>;
  updateAgentCapabilities(agentId: string, capabilities: string[]): Promise<boolean>;
  getDelegationHistory(agentId?: string): Promise<DelegationResult[]>;
  getDelegationAnalytics(): Promise<DelegationAnalytics>;
}

export interface DelegationAnalytics {
  totalDelegations: number;
  successRate: number;
  averageResponseTime: number;
  averageExecutionTime: number;
  agentUtilization: Record<string, number>;
  taskTypeDistribution: Record<string, number>;
  failureReasons: Record<string, number>;
  topPerformingAgents: string[];
  workloadBalance: number;
}

export interface DelegationEvent {
  id: string;
  type: 'delegation_requested' | 'delegation_accepted' | 'delegation_rejected' | 
        'delegation_completed' | 'delegation_failed' | 'agent_overloaded' | 
        'task_reassigned' | 'delegation_cancelled';
  delegationId: string;
  agentId?: string;
  taskId: string;
  data: any;
  timestamp: Date;
}

export interface LoadBalancer {
  distributeTask(task: Task, availableAgents: Agent[]): Promise<Agent>;
  rebalanceWorkload(agentIds: string[]): Promise<boolean>;
  getSystemLoad(): Promise<number>;
  predictLoad(timeHorizon: number): Promise<number>;
}

export interface FallbackHandler {
  handleFailure(request: DelegationRequest, error: string): Promise<DelegationResponse>;
  retryDelegation(request: DelegationRequest, maxRetries: number): Promise<DelegationResponse>;
  escalateDelegation(request: DelegationRequest): Promise<DelegationResponse>;
}

export interface DelegationConfig {
  maxRetries: number;
  defaultTimeout: number;
  maxConcurrentDelegations: number;
  loadBalancingStrategy: 'round_robin' | 'least_loaded' | 'capability_based' | 'hybrid';
  fallbackStrategy: 'retry' | 'queue' | 'escalate';
  healthCheckInterval: number;
  metricsCollectionEnabled: boolean;
}
