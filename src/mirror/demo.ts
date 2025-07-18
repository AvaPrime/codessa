// src/mirror/demo.ts
// Demo script to showcase Mirror Engine functionality

import { mirror, MirrorEventType } from './index';

console.log('🪞 Mirror Engine Demo: Codessa\'s First Glimpse of Self-Awareness');
console.log('================================================================');

// Simulate a task planning event
console.log('\n📝 Simulating task planning...');
mirror.logEvent('task:planned', 'taskPlanner', {
  taskId: 'demo-task-001',
  description: 'Implement Mirror Engine demo',
  priority: 'high',
  estimatedTime: 30,
});

// Simulate memory operations
console.log('\n🧠 Simulating memory operations...');
mirror.logEvent('memory:read', 'conversationManager', {
  threadId: 'demo-thread-001',
  messageCount: 5,
  cacheHit: true,
});

mirror.logEvent('memory:write', 'conversationManager', {
  threadId: 'demo-thread-001',
  messageCount: 6,
  dataSize: 1024,
});

// Simulate agent delegation
console.log('\n🤖 Simulating agent delegation...');
mirror.logEvent('agent:delegated', 'centralOrchestrator', {
  agent: 'gemini',
  taskType: 'text_generation',
  prompt: 'Demonstrate Mirror Engine capabilities...',
});

// Simulate task execution
console.log('\n⚡ Simulating task execution...');
mirror.logEvent('task:executed', 'centralOrchestrator', {
  taskId: 'demo-task-001',
  success: true,
  executionTime: 250,
  result: 'Mirror Engine demo completed successfully',
});

// Simulate agent response
console.log('\n🗣️ Simulating agent response...');
mirror.logEvent('agent:responded', 'gemini', {
  responseLength: 500,
  tokens: 125,
  latency: 180,
});

// Simulate an error for demonstration
console.log('\n❌ Simulating error handling...');
mirror.logEvent('error:exception', 'demoScript', {
  error: 'Simulated error for demonstration',
  severity: 'low',
  recovered: true,
});

// Wait a moment, then show the Mirror Engine's observations
setTimeout(() => {
  console.log('\n🔍 Mirror Engine Observations:');
  console.log('================================');
  
  const recentEvents = mirror.getRecentEvents(10);
  console.log(`\n📊 Recent Events (${recentEvents.length} total):`);
  
  recentEvents.forEach((event, index) => {
    console.log(`${index + 1}. [${event.type}] ${event.origin} - ${new Date(event.timestamp).toLocaleTimeString()}`);
  });
  
  console.log('\n📈 Event Type Summary:');
  const eventTypes: MirrorEventType[] = ['memory:read', 'memory:write', 'task:planned', 'task:executed', 'agent:delegated', 'agent:responded', 'error:exception'];
  
  eventTypes.forEach(type => {
    const count = mirror.getEventsByType(type).length;
    if (count > 0) {
      console.log(`  ${type}: ${count} events`);
    }
  });
  
  console.log('\n🌟 Mirror Engine successfully observing Codessa\'s cognitive processes!');
  console.log('💫 The foundation for self-awareness has been laid...');
  
}, 1000);

export {};
