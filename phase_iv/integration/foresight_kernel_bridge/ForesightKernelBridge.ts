/**
 * ForesightKernelBridge.ts
 * 
 * Responsible for integrating foresight agent outputs into the Codessa kernel's task planning system.
 * Translates predictive data into kernel-compatible formats and routes information for proactive scheduling,
 * adaptive resource allocation, and risk-based prioritization.
 */

import { EventEmitter } from "events";

// Interfaces for foresight output and kernel task format
interface ForesightPrediction {
  taskId: string;
  predictedExecutionTime: number; // in milliseconds
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  resourceDemand: Record<string, number>; // e.g. { CPU: 2, GPU: 1 }
  confidence: number; // 0 to 1
  timestamp: number; // when prediction was made
  predictionType: "EXECUTION_TIME" | "RESOURCE_USAGE" | "RISK_ASSESSMENT" | "COMPLETION_PROBABILITY";
}

interface KernelTaskUpdate {
  taskId: string;
  priorityAdjustment: number; // positive or negative number for priority shifts
  scheduleTimestamp?: number; // epoch ms, when to schedule task proactively
  resourceAllocation?: Record<string, number>;
  riskFlag?: boolean;
  confidence: number;
  source: "FORESIGHT_AGENT";
}

interface BridgeMetrics {
  predictionsProcessed: number;
  highConfidencePredictions: number;
  kernelUpdatesGenerated: number;
  averageConfidence: number;
  riskDistribution: Record<string, number>;
}

export class ForesightKernelBridge extends EventEmitter {
  private confidenceThreshold: number;
  private metrics: BridgeMetrics;
  private predictionHistory: Map<string, ForesightPrediction[]>;

  constructor(confidenceThreshold = 0.7) {
    super();
    this.confidenceThreshold = confidenceThreshold;
    this.metrics = {
      predictionsProcessed: 0,
      highConfidencePredictions: 0,
      kernelUpdatesGenerated: 0,
      averageConfidence: 0,
      riskDistribution: { LOW: 0, MEDIUM: 0, HIGH: 0 }
    };
    this.predictionHistory = new Map();
  }

  /**
   * Receives predictions from foresight agents and processes them
   * @param predictions Array of foresight predictions
   */
  public processPredictions(predictions: ForesightPrediction[]): void {
    console.log(`[ForesightKernelBridge] Processing ${predictions.length} predictions`);
    
    predictions.forEach((prediction) => {
      this.updateMetrics(prediction);
      this.storePredictionHistory(prediction);
      
      if (prediction.confidence >= this.confidenceThreshold) {
        const kernelUpdate = this.translatePredictionToKernelTask(prediction);
        this.emit("kernelTaskUpdate", kernelUpdate);
        this.metrics.kernelUpdatesGenerated++;
        console.log(`[ForesightKernelBridge] Generated kernel update for task ${prediction.taskId}`);
      } else {
        this.emit("lowConfidencePrediction", prediction);
        console.log(`[ForesightKernelBridge] Low confidence prediction for task ${prediction.taskId} (${prediction.confidence})`);
      }
    });
  }

  /**
   * Translates foresight prediction into kernel-compatible task update format
   * @param prediction ForesightPrediction object
   * @returns KernelTaskUpdate object
   */
  private translatePredictionToKernelTask(prediction: ForesightPrediction): KernelTaskUpdate {
    const priorityMap = {
      LOW: -1,
      MEDIUM: 0,
      HIGH: 2, // Higher priority for high-risk tasks
    };

    // Proactive scheduling: schedule task earlier based on risk and confidence
    const proactiveBuffer = this.calculateProactiveBuffer(prediction);
    const proactiveScheduleTime = Date.now() + (prediction.predictedExecutionTime * (1 - proactiveBuffer));

    return {
      taskId: prediction.taskId,
      priorityAdjustment: priorityMap[prediction.riskLevel],
      scheduleTimestamp: proactiveScheduleTime,
      resourceAllocation: this.optimizeResourceAllocation(prediction.resourceDemand),
      riskFlag: prediction.riskLevel === "HIGH",
      confidence: prediction.confidence,
      source: "FORESIGHT_AGENT"
    };
  }

  /**
   * Calculate proactive buffer based on prediction risk and confidence
   * @param prediction ForesightPrediction object
   * @returns buffer percentage (0-1)
   */
  private calculateProactiveBuffer(prediction: ForesightPrediction): number {
    const riskMultiplier = {
      LOW: 0.1,
      MEDIUM: 0.2,
      HIGH: 0.3
    };
    
    const confidenceMultiplier = prediction.confidence * 0.2;
    return Math.min(riskMultiplier[prediction.riskLevel] + confidenceMultiplier, 0.5);
  }

  /**
   * Optimize resource allocation based on prediction confidence
   * @param resourceDemand Original resource demand
   * @returns Optimized resource allocation
   */
  private optimizeResourceAllocation(resourceDemand: Record<string, number>): Record<string, number> {
    const optimized: Record<string, number> = {};
    
    Object.entries(resourceDemand).forEach(([resource, demand]) => {
      // Add 10% buffer for high-confidence predictions
      optimized[resource] = Math.ceil(demand * 1.1);
    });
    
    return optimized;
  }

  /**
   * Store prediction in history for analysis
   * @param prediction ForesightPrediction object
   */
  private storePredictionHistory(prediction: ForesightPrediction): void {
    if (!this.predictionHistory.has(prediction.taskId)) {
      this.predictionHistory.set(prediction.taskId, []);
    }
    
    const history = this.predictionHistory.get(prediction.taskId)!;
    history.push(prediction);
    
    // Keep only last 10 predictions per task
    if (history.length > 10) {
      history.shift();
    }
  }

  /**
   * Update internal metrics
   * @param prediction ForesightPrediction object
   */
  private updateMetrics(prediction: ForesightPrediction): void {
    this.metrics.predictionsProcessed++;
    
    if (prediction.confidence >= this.confidenceThreshold) {
      this.metrics.highConfidencePredictions++;
    }
    
    this.metrics.riskDistribution[prediction.riskLevel]++;
    
    // Update average confidence
    const totalConfidence = this.metrics.averageConfidence * (this.metrics.predictionsProcessed - 1) + prediction.confidence;
    this.metrics.averageConfidence = totalConfidence / this.metrics.predictionsProcessed;
  }

  /**
   * Get current bridge metrics
   * @returns BridgeMetrics object
   */
  public getMetrics(): BridgeMetrics {
    return { ...this.metrics };
  }

  /**
   * Get prediction history for a specific task
   * @param taskId Task identifier
   * @returns Array of predictions for the task
   */
  public getPredictionHistory(taskId: string): ForesightPrediction[] {
    return this.predictionHistory.get(taskId) || [];
  }

  /**
   * Adjust the confidence threshold dynamically
   * @param threshold number between 0 and 1
   */
  public setConfidenceThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error("Confidence threshold must be between 0 and 1.");
    }
    this.confidenceThreshold = threshold;
    console.log(`[ForesightKernelBridge] Confidence threshold updated to ${threshold}`);
  }

  /**
   * Reset metrics and history
   */
  public reset(): void {
    this.metrics = {
      predictionsProcessed: 0,
      highConfidencePredictions: 0,
      kernelUpdatesGenerated: 0,
      averageConfidence: 0,
      riskDistribution: { LOW: 0, MEDIUM: 0, HIGH: 0 }
    };
    this.predictionHistory.clear();
    console.log("[ForesightKernelBridge] Metrics and history reset");
  }
}
