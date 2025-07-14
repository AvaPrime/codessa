export interface Goal {
  id: string;
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: Date;
  requiredResources: string[];
  dependencies: string[];
  constraints: GoalConstraint[];
  createdAt: Date;
  createdBy: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-1
}

export interface GoalConstraint {
  type: 'resource' | 'time' | 'dependency' | 'agent';
  value: any;
  severity: 'soft' | 'hard';
}

export interface ForecastResult {
  id: string;
  goalId: string;
  predictedSuccessProbability: number;
  estimatedCompletionTime: Date;
  estimatedDuration: number;
  confidence: number;
  risks: RiskFactor[];
  recommendations: ForesightRecommendation[];
  alternativeTimelines: TimelineBranch[];
  resourceRequirements: ResourceForecast[];
  timestamp: Date;
}

export interface RiskFactor {
  id: string;
  type: 'resource_shortage' | 'agent_overload' | 'deadline_conflict' | 'dependency_failure' | 'external_disruption';
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  description: string;
  mitigation?: string;
}

export interface RiskAssessment {
  id: string;
  goalId: string;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: RiskFactor[];
  criticalFailurePoints: string[];
  mitigationStrategies: MitigationStrategy[];
  lastUpdated: Date;
}

export interface MitigationStrategy {
  id: string;
  riskFactorId: string;
  strategy: 'resource_reallocation' | 'timeline_adjustment' | 'dependency_bypass' | 'agent_reassignment';
  description: string;
  effectivenessScore: number;
  cost: number;
  implementationTime: number;
}

export interface TimelineBranch {
  id: string;
  scenario: string;
  probability: number;
  outcomes: PredictedOutcome[];
  duration: number;
  resources: ResourceForecast[];
  risks: RiskFactor[];
}

export interface PredictedOutcome {
  type: 'success' | 'partial_success' | 'failure' | 'delayed';
  probability: number;
  description: string;
  impact: string;
  consequences: string[];
}

export interface ResourceForecast {
  resourceType: string;
  requiredAmount: number;
  availableAmount: number;
  utilizationPeak: Date;
  scarcityRisk: number;
  alternatives: string[];
}

export interface ForesightRecommendation {
  id: string;
  type: 'optimization' | 'risk_mitigation' | 'resource_adjustment' | 'timeline_change';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  action: string;
  expectedBenefit: string;
  implementationCost: number;
  urgency: Date;
}

export interface TaskPlan {
  id: string;
  goalId: string;
  tasks: Task[];
  dependencies: PlanDependency[];
  milestones: Milestone[];
  estimatedDuration: number;
  resourceAllocations: ResourceAllocation[];
  riskProfile: RiskAssessment;
  createdAt: Date;
  lastUpdated: Date;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  assignedAgent?: string;
  estimatedDuration: number;
  dependencies: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  progress: number;
  resources: string[];
}

export interface PlanDependency {
  fromTask: string;
  toTask: string;
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish';
  delay?: number;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  targetDate: Date;
  criteria: string[];
  dependencies: string[];
}

export interface ResourceAllocation {
  resourceType: string;
  amount: number;
  duration: number;
  startTime: Date;
  endTime: Date;
  priority: number;
}

export interface ForesightEvent {
  id: string;
  type: 'prediction_ready' | 'high_risk_detected' | 'resource_forecast_overload' | 
        'timeline_conflict' | 'recommendation_generated' | 'goal_failure_predicted';
  goalId?: string;
  data: any;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
  nodeId: string;
}

export interface ForesightConfig {
  predictionHorizon: number; // days
  riskThreshold: number; // 0-1
  confidenceThreshold: number; // 0-1
  maxAlternativeTimelines: number;
  resourceForecastAccuracy: number;
  updateInterval: number; // milliseconds
  enableRealTimeUpdates: boolean;
  machinelearningEnabled: boolean;
}

export interface ForesightMetrics {
  totalPredictions: number;
  accuracyRate: number;
  averageConfidence: number;
  risksPrevented: number;
  resourceWastageReduced: number;
  timelineOptimizations: number;
  predictiveModelPerformance: ModelPerformance;
}

export interface ModelPerformance {
  modelType: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingDataSize: number;
  lastTrainingDate: Date;
  nextRetrainingDate: Date;
}

export interface ForesightAgent {
  id: string;
  type: 'predictor' | 'risk_analyzer' | 'optimizer' | 'monitor';
  capabilities: string[];
  specialization: string[];
  activeGoals: string[];
  status: 'active' | 'idle' | 'busy' | 'maintenance';
  performance: AgentPerformance;
  lastActivity: Date;
}

export interface AgentPerformance {
  predictionsGenerated: number;
  accuracyRate: number;
  averageResponseTime: number;
  successfulMitigations: number;
  resourceUtilization: number;
  errorRate: number;
}
