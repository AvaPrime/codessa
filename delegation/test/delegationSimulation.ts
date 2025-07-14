import { CodessaDelegationEngine } from '../logic/delegationEngine';
import { Task, Agent, DelegationConfig } from '../interfaces/delegationTypes';
import * as fs from 'fs';
import * as path from 'path';

const agents: Agent[] = [
  {
    id: 'agent_1',
    name: 'Alpha',
    capabilities: ['compute', 'reasoning'],
    currentWorkload: 15,
    maxCapacity: 100,
    successRate: 0.9,
    averageResponseTime: 120,
    specializationScore: { 'compute': 0.9, 'reasoning': 0.8 },
    lastActiveAt: new Date(),
    status: 'active',
    trustLevel: 0.8
  },
  {
    id: 'agent_2',
    name: 'Beta',
    capabilities: ['analytics', 'storage'],
    currentWorkload: 60,
    maxCapacity: 100,
    successRate: 0.85,
    averageResponseTime: 160,
    specializationScore: { 'analytics': 0.85, 'storage': 0.9 },
    lastActiveAt: new Date(),
    status: 'active',
    trustLevel: 0.9
  },
  {
    id: 'agent_3',
    name: 'Gamma',
    capabilities: ['network', 'optimization'],
    currentWorkload: 50,
    maxCapacity: 100,
    successRate: 0.87,
    averageResponseTime: 90,
    specializationScore: { 'optimization': 0.8, 'network': 0.85 },
    lastActiveAt: new Date(),
    status: 'active',
    trustLevel: 0.85
  }
];

const task: Task = {
  id: 'task_1',
  type: 'analysis',
  description: 'Perform analysis using reasoning and computation',
  priority: 'high',
  requiredCapabilities: ['compute', 'reasoning'],
  estimatedComplexity: 30,
  estimatedDuration: 1800,
  dependencies: [],
  payload: {},
  createdAt: new Date(),
  createdBy: 'System'
};

async function runDelegationSimulation() {
  const config: DelegationConfig = {
    maxRetries: 3,
    defaultTimeout: 10000,
    maxConcurrentDelegations: 5,
    loadBalancingStrategy: 'capability_based',
    fallbackStrategy: 'retry',
    healthCheckInterval: 30000,
    metricsCollectionEnabled: true
  };

  const engine = new CodessaDelegationEngine(config);
  agents.forEach(agent => engine.registerAgent(agent));

  const requestId = 'delegation_'+Date.now();
  const response = await engine.delegateTask({
    id: requestId,
    task: task,
    originAgent: 'System',
    fallbackStrategy: 'retry',
    timestamp: new Date()
  });

  console.log('Delegation Response:', response);

  const output = path.join(__dirname, 'outputs', 'delegationLogs.json');
  fs.writeFileSync(output, JSON.stringify(response, null, 2));
  console.log('Simulation complete. Results logged to:', output);
}

runDelegationSimulation().catch(console.error);
