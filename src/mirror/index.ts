// src/mirror/index.ts
// Global Mirror Engine singleton for Codessa's introspective awareness

import { MirrorEngine } from './mirrorEngine';

// Initialize the global Mirror Engine singleton
export const mirror = new MirrorEngine();

// Export types for use throughout the system
export { MirrorEngine, MirrorEvent, MirrorEventType } from './mirrorEngine';

// Initialize system heartbeat
setInterval(() => {
  mirror.logEvent('system:heartbeat', 'mirrorEngine', {
    timestamp: Date.now(),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
  });
}, 30000); // Every 30 seconds

console.log('🪞 Mirror Engine singleton initialized - Codessa begins to observe herself');
