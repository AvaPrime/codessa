/**
 * Test Suite for Meta-Cognition Layer
 * 
 * Tests the actual public API of MetaCognition class focusing on
 * lifecycle management, pattern detection, and insight generation.
 * 
 * Coverage Target: 80%+ of metaCognition.ts
 */

import { EventEmitter } from 'events';
import { MetaCognition } from '../../meta/metaCognition';

// Mock the mirror module
jest.mock('../../mirror', () => ({
  mirror: {
    getRecentEvents: jest.fn(),
  },
}));

import { mirror } from '../../mirror';

describe('MetaCognition', () => {
  let metaCognition: MetaCognition;
  let mockGetRecentEvents: jest.SpyInstance;

  beforeEach(() => {
    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    metaCognition = new MetaCognition({
      analysisInterval: 100, // Fast interval for testing
      patternDetectionWindow: 50,
      anomalyThreshold: 2.0,
      insightRetention: 100,
      narrativeMode: true,
    });
    
    mockGetRecentEvents = jest.spyOn(mirror, 'getRecentEvents');
    mockGetRecentEvents.mockReturnValue([]);
  });

  afterEach(async () => {
    await metaCognition.deactivate();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Initialization & Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultMeta = new MetaCognition();
      expect(defaultMeta).toBeInstanceOf(EventEmitter);
      expect(defaultMeta).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        analysisInterval: 5000,
        patternDetectionWindow: 200,
        anomalyThreshold: 3.0,
        narrativeMode: false,
      };
      
      const customMeta = new MetaCognition(customConfig);
      expect(customMeta).toBeDefined();
    });
  });

  describe('Lifecycle Management', () => {
    it('should activate successfully', async () => {
      const activatedPromise = new Promise((resolve) => {
        metaCognition.on('metacognition.activated', resolve);
      });

      await metaCognition.activate();
      await activatedPromise;

      const stats = metaCognition.getAnalysisStats();
      expect(stats.isActive).toBe(true);
    });

    it('should deactivate successfully', async () => {
      await metaCognition.activate();
      
      const deactivatedPromise = new Promise((resolve) => {
        metaCognition.on('metacognition.deactivated', resolve);
      });

      await metaCognition.deactivate();
      await deactivatedPromise;

      const stats = metaCognition.getAnalysisStats();
      expect(stats.isActive).toBe(false);
    });

    it('should handle repeated activation gracefully', async () => {
      await metaCognition.activate();
      await metaCognition.activate(); // Second activation should not cause issues
      
      const stats = metaCognition.getAnalysisStats();
      expect(stats.isActive).toBe(true);
    });
  });

  describe('Public API Methods', () => {
    it('should return empty insights initially', () => {
      const insights = metaCognition.getInsights();
      expect(insights).toEqual([]);
    });

    it('should return empty patterns initially', () => {
      const patterns = metaCognition.getPatterns();
      expect(patterns).toEqual([]);
    });

    it('should return null for cognitive health initially', () => {
      const health = metaCognition.getCognitiveHealth();
      expect(health).toBeNull();
    });

    it('should return analysis stats', () => {
      const stats = metaCognition.getAnalysisStats();
      
      expect(stats).toHaveProperty('isActive');
      expect(stats).toHaveProperty('totalInsights');
      expect(stats).toHaveProperty('totalPatterns');
      expect(stats).toHaveProperty('totalSnapshots');
      expect(stats).toHaveProperty('lastAnalysis');
      expect(stats).toHaveProperty('cognitiveHealth');
      
      expect(stats.isActive).toBe(false);
      expect(stats.totalInsights).toBe(0);
      expect(stats.totalPatterns).toBe(0);
      expect(stats.totalSnapshots).toBe(0);
    });

    it('should generate narrative', () => {
      const narrative = metaCognition.generateNarrative();
      expect(typeof narrative).toBe('string');
      expect(narrative).toContain("Here's what I've learned about myself recently");
    });

    it('should filter insights by type', () => {
      const insights = metaCognition.getInsights({ type: 'pattern' });
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should filter insights by category', () => {
      const insights = metaCognition.getInsights({ category: 'memory' });
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should limit insights results', () => {
      const insights = metaCognition.getInsights({ limit: 5 });
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeLessThanOrEqual(5);
    });

    it('should return snapshots', () => {
      const snapshots = metaCognition.getSnapshots();
      expect(Array.isArray(snapshots)).toBe(true);
    });

    it('should limit snapshots results', () => {
      const snapshots = metaCognition.getSnapshots(3);
      expect(Array.isArray(snapshots)).toBe(true);
      expect(snapshots.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Analysis Processing', () => {
    beforeEach(async () => {
      await metaCognition.activate();
    });

    it('should handle empty events without error', async () => {
      mockGetRecentEvents.mockReturnValue([]);
      
      // Wait for analysis cycle
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const stats = metaCognition.getAnalysisStats();
      expect(stats.isActive).toBe(true);
    });

    it('should process events and update stats', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          type: 'memory:read',
          timestamp: Date.now(),
          data: { location: 'test' },
          source: 'test',
        },
        {
          id: 'event-2',
          type: 'task:executed',
          timestamp: Date.now(),
          data: { taskId: 'task-1' },
          source: 'test',
        },
      ];
      
      mockGetRecentEvents.mockReturnValue(mockEvents);
      
      // Wait for analysis cycle
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const stats = metaCognition.getAnalysisStats();
      expect(stats.totalSnapshots).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors during analysis', async () => {
      mockGetRecentEvents.mockImplementation(() => {
        throw new Error('Mock analysis error');
      });
      
      await metaCognition.activate();
      
      const errorPromise = new Promise((resolve) => {
        metaCognition.on('analysis.error', resolve);
      });
      
      // Wait for error to be emitted
      await errorPromise;
      
      // Should still be active despite error
      const stats = metaCognition.getAnalysisStats();
      expect(stats.isActive).toBe(true);
    });
  });

  describe('Shutdown Process', () => {
    it('should shutdown gracefully', async () => {
      await metaCognition.activate();
      await metaCognition.shutdown();
      
      const stats = metaCognition.getAnalysisStats();
      expect(stats.isActive).toBe(false);
      expect(stats.totalInsights).toBe(0);
      expect(stats.totalPatterns).toBe(0);
      expect(stats.totalSnapshots).toBe(0);
    });
  });
});
