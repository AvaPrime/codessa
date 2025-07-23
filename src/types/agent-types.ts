/**
 * agent-types.ts - Type Definitions for Codessa Agent System
 *
 * This module defines the TypeScript interfaces and types used
 * throughout the autonomous agent execution system.
 */

// Core agent directive structure
export interface CodessaDirective {
  id: string;
  type:
    | 'code-fix'
    | 'test-enhancement'
    | 'performance'
    | 'refactor'
    | 'security'
    | 'documentation';
  priority: number; // 1 = highest, 5 = lowest
  description: string;
  targetFile: string;
  action: string;
  estimatedImpact: 'positive' | 'neutral' | 'risky';
  dependencies?: string[];
  metadata?: Record<string, any>;
}

// Audit system types
export interface AuditIssue {
  id: string;
  file: string;
  line: number;
  column?: number;
  type: 'error' | 'warning' | 'info' | 'style';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  rule?: string;
  suggestedFix?: string;
}

export interface AuditResult {
  issues: AuditIssue[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highPriorityIssues: number;
    filesAnalyzed: number;
    analysisTime: number;
  };
  recommendations: string[];
}

// Refactor operation types
export interface RefactorOperation {
  type: 'fix' | 'rename' | 'extract' | 'inline' | 'move' | 'optimize';
  file: string;
  description: string;
  action: string;
  sourceLocation?: {
    startLine: number;
    endLine: number;
    startColumn?: number;
    endColumn?: number;
  };
  targetLocation?: {
    file: string;
    line: number;
    column?: number;
  };
}

export interface RefactorResult {
  success: boolean;
  changes: string[];
  errors: string[];
  warnings: string[];
  affectedFiles: string[];
}

// Test system types
export interface TestCase {
  name: string;
  description: string;
  file: string;
  function: string;
  type: 'unit' | 'integration' | 'e2e';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
}

export interface TestSuite {
  name: string;
  file: string;
  tests: TestCase[];
  setup?: string;
  teardown?: string;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

export interface TestResult {
  success: boolean;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  suites: TestSuite[];
  coverage?: {
    overall: number;
    files: Record<string, number>;
  };
  duration: number;
}

// Memory and learning types
export interface ExecutionMetrics {
  startTime: Date;
  endTime: Date;
  duration: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpuUsage?: number;
  diskIO?: {
    reads: number;
    writes: number;
  };
}

export interface AgentDecision {
  id: string;
  timestamp: Date;
  context: string;
  decision: string;
  reasoning: string[];
  confidence: number;
  alternatives: string[];
  outcome?: 'success' | 'failure' | 'partial';
}

// Cloud deployment types
export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  provider: 'gcp' | 'aws' | 'azure' | 'supabase';
  region: string;
  resources: {
    memory: string;
    cpu: string;
    storage?: string;
  };
  scaling: {
    min: number;
    max: number;
    targetCPU?: number;
  };
  environment_variables: Record<string, string>;
  secrets: string[];
}

export interface HealthCheck {
  timestamp: Date;
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    database: 'up' | 'down' | 'unknown';
    filesystem: 'up' | 'down' | 'unknown';
    memory: 'normal' | 'high' | 'critical';
    cpu: 'normal' | 'high' | 'critical';
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  issues?: string[];
}

// Communication and integration types
export interface AgentMessage {
  id: string;
  timestamp: Date;
  sender: 'system' | 'agent' | 'user' | 'external';
  recipient: string;
  type: 'command' | 'query' | 'response' | 'notification' | 'error';
  content: string;
  metadata?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ExternalIntegration {
  name: string;
  type: 'api' | 'webhook' | 'database' | 'file_system' | 'version_control';
  endpoint: string;
  authentication: {
    type: 'none' | 'api_key' | 'oauth' | 'basic' | 'certificate';
    credentials?: Record<string, string>;
  };
  capabilities: string[];
  rateLimit?: {
    requests: number;
    per: 'second' | 'minute' | 'hour' | 'day';
  };
}

// Agent personality and behavior types
export interface AgentPersonality {
  name: string;
  traits: {
    cautiousness: number; // 0-1, how careful vs. aggressive
    curiosity: number; // 0-1, how much to explore vs. exploit
    persistence: number; // 0-1, how much to retry vs. give up
    collaboration: number; // 0-1, how much to ask for help
  };
  preferences: {
    codeStyle: 'conservative' | 'modern' | 'experimental';
    testingStrategy: 'thorough' | 'balanced' | 'minimal';
    refactoringApproach: 'gradual' | 'aggressive' | 'on-demand';
  };
  communication: {
    verbosity: 'minimal' | 'normal' | 'detailed';
    tone: 'formal' | 'casual' | 'technical';
    emoji: boolean;
  };
}

// System configuration types
export interface SystemConfig {
  agent: {
    maxConcurrentExecutions: number;
    defaultTimeout: number;
    emergencyStopKeyword: string;
    memoryRetentionDays: number;
  };
  development: {
    autoFixLinting: boolean;
    autoRunTests: boolean;
    autoCommit: boolean;
    maxFileSize: number;
  };
  deployment: {
    autoScale: boolean;
    healthCheckInterval: number;
    deploymentStrategy: 'rolling' | 'blue-green' | 'canary';
  };
  integrations: {
    enabled: string[];
    configurations: Record<string, any>;
  };
}

// Error and exception types
export interface AgentError {
  id: string;
  timestamp: Date;
  type: 'execution' | 'validation' | 'communication' | 'resource' | 'logic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  context: {
    executionId?: string;
    directiveId?: string;
    file?: string;
    function?: string;
  };
  resolution?: {
    strategy: string;
    applied: boolean;
    successful: boolean;
  };
}

// Analytics and reporting types
export interface PerformanceMetrics {
  period: {
    start: Date;
    end: Date;
  };
  executions: {
    total: number;
    successful: number;
    failed: number;
    averageDuration: number;
  };
  changes: {
    totalFiles: number;
    linesAdded: number;
    linesRemoved: number;
    refactorsPerformed: number;
  };
  quality: {
    testCoverage: number;
    lintIssuesFixed: number;
    securityIssuesFound: number;
    performanceImprovements: number;
  };
  resources: {
    averageMemoryUsage: number;
    averageCpuUsage: number;
    diskUsage: number;
  };
}

// Export all types as a convenient namespace
export namespace AgentTypes {
  export type Directive = CodessaDirective;
  export type Issue = AuditIssue;
  export type Result = AuditResult;
  export type Operation = RefactorOperation;
  export type Test = TestCase;
  export type Message = AgentMessage;
  export type Error = AgentError;
  export type Config = SystemConfig;
  export type Metrics = PerformanceMetrics;
  export type Health = HealthCheck;
  export type Personality = AgentPersonality;
}
