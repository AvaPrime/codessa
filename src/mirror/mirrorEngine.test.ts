// src/mirror/mirrorEngine.test.ts

import { MirrorEngine, MirrorEventType } from './mirrorEngine';

describe('MirrorEngine', () => {
  let mirrorEngine: MirrorEngine;

  beforeEach(() => {
    mirrorEngine = new MirrorEngine();
  });

  afterEach(() => {
    mirrorEngine.clear();
  });

  it('should log events correctly', () => {
    const eventType: MirrorEventType = 'memory:read';
    const origin = 'test-origin';
    const payload = { test: 'data' };

    mirrorEngine.logEvent(eventType, origin, payload);

    const events = mirrorEngine.getRecentEvents(1);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe(eventType);
    expect(events[0].origin).toBe(origin);
    expect(events[0].payload).toEqual(payload);
    expect(events[0].id).toBeDefined();
    expect(events[0].timestamp).toBeDefined();
  });

  it('should get recent events in reverse chronological order', () => {
    mirrorEngine.logEvent('memory:read', 'test1', { order: 1 });
    mirrorEngine.logEvent('memory:write', 'test2', { order: 2 });
    mirrorEngine.logEvent('task:planned', 'test3', { order: 3 });

    const events = mirrorEngine.getRecentEvents(3);
    expect(events).toHaveLength(3);
    expect(events[0].payload.order).toBe(3); // Most recent first
    expect(events[1].payload.order).toBe(2);
    expect(events[2].payload.order).toBe(1);
  });

  it('should limit recent events correctly', () => {
    for (let i = 0; i < 10; i++) {
      mirrorEngine.logEvent('system:heartbeat', 'test', { count: i });
    }

    const events = mirrorEngine.getRecentEvents(5);
    expect(events).toHaveLength(5);
    expect(events[0].payload.count).toBe(9); // Most recent
    expect(events[4].payload.count).toBe(5); // 5th most recent
  });

  it('should filter events by type', () => {
    mirrorEngine.logEvent('memory:read', 'test', { type: 'read' });
    mirrorEngine.logEvent('memory:write', 'test', { type: 'write' });
    mirrorEngine.logEvent('task:planned', 'test', { type: 'task' });
    mirrorEngine.logEvent('memory:read', 'test', { type: 'read2' });

    const memoryReadEvents = mirrorEngine.getEventsByType('memory:read');
    expect(memoryReadEvents).toHaveLength(2);
    expect(memoryReadEvents.every(e => e.type === 'memory:read')).toBe(true);

    const taskEvents = mirrorEngine.getEventsByType('task:planned');
    expect(taskEvents).toHaveLength(1);
    expect(taskEvents[0].type).toBe('task:planned');
  });

  it('should clear all events', () => {
    mirrorEngine.logEvent('memory:read', 'test', {});
    mirrorEngine.logEvent('memory:write', 'test', {});
    
    expect(mirrorEngine.getRecentEvents(10)).toHaveLength(2);
    
    mirrorEngine.clear();
    
    expect(mirrorEngine.getRecentEvents(10)).toHaveLength(0);
  });

  it('should handle different event types', () => {
    const eventTypes: MirrorEventType[] = [
      'memory:read',
      'memory:write',
      'task:planned',
      'task:executed',
      'agent:delegated',
      'agent:responded',
      'error:exception',
      'system:heartbeat'
    ];

    eventTypes.forEach(type => {
      mirrorEngine.logEvent(type, 'test', { eventType: type });
    });

    const events = mirrorEngine.getRecentEvents(10);
    expect(events).toHaveLength(8);
    
    eventTypes.forEach(type => {
      const typeEvents = mirrorEngine.getEventsByType(type);
      expect(typeEvents).toHaveLength(1);
      expect(typeEvents[0].type).toBe(type);
    });
  });

  it('should preserve event order within the same millisecond', () => {
    const now = Date.now();
    
    // Mock Date.now to return the same value
    const originalNow = Date.now;
    Date.now = jest.fn(() => now);

    mirrorEngine.logEvent('memory:read', 'test', { order: 1 });
    mirrorEngine.logEvent('memory:write', 'test', { order: 2 });
    mirrorEngine.logEvent('task:planned', 'test', { order: 3 });

    const events = mirrorEngine.getRecentEvents(3);
    expect(events[0].payload.order).toBe(3);
    expect(events[1].payload.order).toBe(2);
    expect(events[2].payload.order).toBe(1);

    // Restore original Date.now
    Date.now = originalNow;
  });
});
