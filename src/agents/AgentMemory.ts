/**
 * AgentMemory.ts - Persistent Memory and Learning System
 *
 * This module enables Codessa to remember past executions,
 * learn from mistakes, and build institutional knowledge
 * across autonomous execution cycles.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { ExecutionContext, AgentExecutionResult } from './AgentExecutor';

export interface ExecutionRecord {
  id: string;
  timestamp: Date;
  context: ExecutionContext;
  results: any;
  reflection: any;
  success: boolean;
}

export interface CodebaseKnowledge {
  filePath: string;
  lastAnalyzed: Date;
  complexity: number;
  issues: string[];
  improvements: string[];
  testCoverage?: number;
}

export interface LearningInsight {
  id: string;
  timestamp: Date;
  category: 'pattern' | 'antipattern' | 'optimization' | 'failure';
  description: string;
  evidence: string[];
  confidence: number;
  applicability: string[];
}

export class AgentMemory {
  private memoryPath: string;
  private executionHistory: ExecutionRecord[] = [];
  private codebaseKnowledge: Map<string, CodebaseKnowledge> = new Map();
  private learningInsights: LearningInsight[] = [];
  private initialized: boolean = false;

  constructor(memoryPath?: string) {
    this.memoryPath =
      memoryPath || path.join(process.cwd(), '.codessa', 'agent-memory');
  }

  /**
   * 🔧 Initialize Memory System
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure memory directory exists
      await fs.mkdir(this.memoryPath, { recursive: true });

      // Load existing memory files
      await this.loadExecutionHistory();
      await this.loadCodebaseKnowledge();
      await this.loadLearningInsights();

      this.initialized = true;
      console.log(`🧠 AgentMemory initialized at ${this.memoryPath}`);
    } catch (error) {
      console.error('❌ Failed to initialize AgentMemory:', error);
      throw error;
    }
  }

  /**
   * 💾 Store Execution Record
   */
  async storeExecution(record: ExecutionRecord): Promise<void> {
    await this.ensureInitialized();

    this.executionHistory.push(record);

    // Keep only last 100 executions in memory
    if (this.executionHistory.length > 100) {
      this.executionHistory = this.executionHistory.slice(-100);
    }

    // Persist to disk
    await this.saveExecutionHistory();

    // Extract learning insights from this execution
    await this.extractLearningInsights(record);

    console.log(`💾 Stored execution record: ${record.id}`);
  }

  /**
   * 🔍 Retrieve Execution History
   */
  async getExecutionHistory(limit?: number): Promise<ExecutionRecord[]> {
    await this.ensureInitialized();

    if (limit) {
      return this.executionHistory.slice(-limit);
    }

    return [...this.executionHistory];
  }

  /**
   * 📊 Update Codebase Knowledge
   */
  async updateCodebaseKnowledge(workingDirectory: string): Promise<void> {
    await this.ensureInitialized();

    console.log('📊 Updating codebase knowledge...');

    try {
      // Scan for TypeScript files
      const files = await this.findSourceFiles(workingDirectory);

      for (const file of files) {
        const knowledge = await this.analyzeFile(file);
        this.codebaseKnowledge.set(file, knowledge);
      }

      // Persist knowledge to disk
      await this.saveCodebaseKnowledge();

      console.log(`📊 Updated knowledge for ${files.length} files`);
    } catch (error) {
      console.error('❌ Failed to update codebase knowledge:', error);
    }
  }

  /**
   * 🧩 Get File Knowledge
   */
  async getFileKnowledge(
    filePath: string,
  ): Promise<CodebaseKnowledge | undefined> {
    await this.ensureInitialized();
    return this.codebaseKnowledge.get(filePath);
  }

  /**
   * 🎓 Extract Learning Insights
   */
  private async extractLearningInsights(
    record: ExecutionRecord,
  ): Promise<void> {
    const insights: LearningInsight[] = [];

    // Pattern recognition: Successful patterns
    if (record.success && record.results.changes.length > 0) {
      insights.push({
        id: `pattern-${Date.now()}`,
        timestamp: new Date(),
        category: 'pattern',
        description: 'Successful execution pattern detected',
        evidence: record.results.changes,
        confidence: 0.8,
        applicability: ['similar-contexts'],
      });
    }

    // Failure analysis
    if (!record.success) {
      insights.push({
        id: `failure-${Date.now()}`,
        timestamp: new Date(),
        category: 'failure',
        description: 'Execution failure pattern',
        evidence: [record.reflection.summary],
        confidence: 0.9,
        applicability: ['error-prevention'],
      });
    }

    // Performance insights
    if (record.results.changes && record.results.changes.length > 5) {
      insights.push({
        id: `optimization-${Date.now()}`,
        timestamp: new Date(),
        category: 'optimization',
        description: 'High-impact execution detected',
        evidence: record.results.changes,
        confidence: 0.7,
        applicability: ['similar-improvements'],
      });
    }

    // Store new insights
    this.learningInsights.push(...insights);
    await this.saveLearningInsights();
  }

  /**
   * 🔮 Get Relevant Insights
   */
  async getRelevantInsights(
    context: ExecutionContext,
  ): Promise<LearningInsight[]> {
    await this.ensureInitialized();

    return this.learningInsights
      .filter((insight) => insight.confidence > 0.6)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }

  /**
   * 📈 Get Memory Statistics
   */
  async getMemoryStatistics() {
    await this.ensureInitialized();

    const totalExecutions = this.executionHistory.length;
    const successfulExecutions = this.executionHistory.filter(
      (r) => r.success,
    ).length;
    const totalFiles = this.codebaseKnowledge.size;
    const totalInsights = this.learningInsights.length;

    const avgChangesPerExecution =
      totalExecutions > 0
        ? this.executionHistory.reduce(
            (sum, r) => sum + (r.results.changes?.length || 0),
            0,
          ) / totalExecutions
        : 0;

    return {
      totalExecutions,
      successfulExecutions,
      successRate:
        totalExecutions > 0 ? successfulExecutions / totalExecutions : 0,
      totalFiles,
      totalInsights,
      avgChangesPerExecution,
      memorySize: await this.calculateMemorySize(),
    };
  }

  /**
   * 🕒 Get Last Execution Time
   */
  getLastExecutionTime(): Date | null {
    if (this.executionHistory.length === 0) return null;
    return this.executionHistory[this.executionHistory.length - 1].timestamp;
  }

  /**
   * 🛑 Log Emergency Stop
   */
  async logEmergencyStop(timestamp: Date, reason: string): Promise<void> {
    await this.ensureInitialized();

    const emergencyRecord = {
      timestamp,
      reason,
      executionState: this.executionHistory.slice(-5), // Last 5 executions
    };

    const emergencyPath = path.join(this.memoryPath, 'emergency-stops.json');

    try {
      let emergencyHistory = [];
      try {
        const data = await fs.readFile(emergencyPath, 'utf-8');
        emergencyHistory = JSON.parse(data);
      } catch {
        // File doesn't exist yet
      }

      emergencyHistory.push(emergencyRecord);
      await fs.writeFile(
        emergencyPath,
        JSON.stringify(emergencyHistory, null, 2),
      );

      console.log('🛑 Emergency stop logged');
    } catch (error) {
      console.error('❌ Failed to log emergency stop:', error);
    }
  }

  /**
   * 🔧 Private: Ensure Initialization
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * 📁 Private: Find Source Files
   */
  private async findSourceFiles(directory: string): Promise<string[]> {
    const files: string[] = [];

    const scan = async (dir: string) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            // Skip node_modules and hidden directories
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
              await scan(fullPath);
            }
          } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    };

    await scan(directory);
    return files;
  }

  /**
   * 🔍 Private: Analyze File
   */
  private async analyzeFile(filePath: string): Promise<CodebaseKnowledge> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Simple complexity analysis
      const complexity = this.calculateComplexity(content);

      // Basic issue detection
      const issues = this.detectIssues(content);

      return {
        filePath,
        lastAnalyzed: new Date(),
        complexity,
        issues,
        improvements: this.suggestImprovements(content, issues),
      };
    } catch (error: any) {
      return {
        filePath,
        lastAnalyzed: new Date(),
        complexity: 0,
        issues: [`Failed to analyze: ${error.message}`],
        improvements: [],
      };
    }
  }

  /**
   * 🧮 Private: Calculate Complexity
   */
  private calculateComplexity(content: string): number {
    const lines = content.split('\n').length;
    const functions = (content.match(/function|async\s+function|=>/g) || [])
      .length;
    const conditions = (content.match(/if|else|switch|case|while|for/g) || [])
      .length;
    const classes = (content.match(/class\s+\w+/g) || []).length;

    return lines * 0.1 + functions * 2 + conditions * 1.5 + classes * 3;
  }

  /**
   * 🔍 Private: Detect Issues
   */
  private detectIssues(content: string): string[] {
    const issues: string[] = [];

    if (content.includes('console.log')) {
      issues.push('Contains console.log statements');
    }

    if (content.includes('// TODO')) {
      issues.push('Contains TODO comments');
    }

    if (content.includes('any')) {
      issues.push('Uses any type');
    }

    if (content.split('\n').some((line) => line.length > 120)) {
      issues.push('Contains long lines (>120 chars)');
    }

    return issues;
  }

  /**
   * 💡 Private: Suggest Improvements
   */
  private suggestImprovements(content: string, issues: string[]): string[] {
    const improvements: string[] = [];

    if (issues.includes('Contains console.log statements')) {
      improvements.push('Replace console.log with proper logging');
    }

    if (issues.includes('Contains TODO comments')) {
      improvements.push('Address TODO items');
    }

    if (issues.includes('Uses any type')) {
      improvements.push('Add proper type annotations');
    }

    return improvements;
  }

  /**
   * 💾 Private: Load/Save Methods
   */
  private async loadExecutionHistory(): Promise<void> {
    const historyPath = path.join(this.memoryPath, 'execution-history.json');
    try {
      const data = await fs.readFile(historyPath, 'utf-8');
      this.executionHistory = JSON.parse(data).map((record: any) => ({
        ...record,
        timestamp: new Date(record.timestamp),
      }));
    } catch {
      // File doesn't exist yet
      this.executionHistory = [];
    }
  }

  private async saveExecutionHistory(): Promise<void> {
    const historyPath = path.join(this.memoryPath, 'execution-history.json');
    await fs.writeFile(
      historyPath,
      JSON.stringify(this.executionHistory, null, 2),
    );
  }

  private async loadCodebaseKnowledge(): Promise<void> {
    const knowledgePath = path.join(this.memoryPath, 'codebase-knowledge.json');
    try {
      const data = await fs.readFile(knowledgePath, 'utf-8');
      const knowledgeArray = JSON.parse(data);
      this.codebaseKnowledge.clear();

      for (const item of knowledgeArray) {
        this.codebaseKnowledge.set(item.filePath, {
          ...item,
          lastAnalyzed: new Date(item.lastAnalyzed),
        });
      }
    } catch {
      // File doesn't exist yet
      this.codebaseKnowledge.clear();
    }
  }

  private async saveCodebaseKnowledge(): Promise<void> {
    const knowledgePath = path.join(this.memoryPath, 'codebase-knowledge.json');
    const knowledgeArray = Array.from(this.codebaseKnowledge.values());
    await fs.writeFile(knowledgePath, JSON.stringify(knowledgeArray, null, 2));
  }

  private async loadLearningInsights(): Promise<void> {
    const insightsPath = path.join(this.memoryPath, 'learning-insights.json');
    try {
      const data = await fs.readFile(insightsPath, 'utf-8');
      this.learningInsights = JSON.parse(data).map((insight: any) => ({
        ...insight,
        timestamp: new Date(insight.timestamp),
      }));
    } catch {
      // File doesn't exist yet
      this.learningInsights = [];
    }
  }

  private async saveLearningInsights(): Promise<void> {
    const insightsPath = path.join(this.memoryPath, 'learning-insights.json');
    await fs.writeFile(
      insightsPath,
      JSON.stringify(this.learningInsights, null, 2),
    );
  }

  private async calculateMemorySize(): Promise<number> {
    try {
      const files = [
        'execution-history.json',
        'codebase-knowledge.json',
        'learning-insights.json',
      ];
      let totalSize = 0;

      for (const file of files) {
        try {
          const stats = await fs.stat(path.join(this.memoryPath, file));
          totalSize += stats.size;
        } catch {
          // File doesn't exist
        }
      }

      return totalSize;
    } catch {
      return 0;
    }
  }
}

export default AgentMemory;
