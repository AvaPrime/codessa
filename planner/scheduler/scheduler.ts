import { EventEmitter } from 'events';
import { Task, TaskStatus } from '../models/taskTypes';

export class Scheduler extends EventEmitter {
  private taskQueue: Task[] = [];
  private runningTasks: Map<string, Task> = new Map();
  private initialized: boolean = false;
  private running: boolean = false;

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    console.log('📋 Initializing Task Scheduler...');
    this.initialized = true;
    console.log('✅ Task Scheduler initialized');
  }

  start(): void {
    if (!this.initialized) {
      throw new Error('Scheduler not initialized');
    }
    
    this.running = true;
    console.log('🚀 Task Scheduler started');
    this.emit('scheduler.started');
  }

  stop(): void {
    this.running = false;
    console.log('⏹️ Task Scheduler stopped');
    this.emit('scheduler.stopped');
  }

  async queueTask(task: Task): Promise<void> {
    if (!this.initialized) {
      throw new Error('Scheduler not initialized');
    }

    task.status = TaskStatus.QUEUED;
    this.taskQueue.push(task);
    
    console.log(`📝 Task ${task.id} queued`);
    this.emit('task.queued', task);
    
    // Simulate immediate processing for now
    setTimeout(() => this.processNextTask(), 100);
  }

  async cancelTask(taskId: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Scheduler not initialized');
    }

    // Remove from queue
    const queueIndex = this.taskQueue.findIndex(t => t.id === taskId);
    if (queueIndex >= 0) {
      const task = this.taskQueue.splice(queueIndex, 1)[0];
      task.status = TaskStatus.CANCELLED;
      this.emit('task.cancelled', task);
      return true;
    }

    // Cancel running task
    const runningTask = this.runningTasks.get(taskId);
    if (runningTask) {
      runningTask.status = TaskStatus.CANCELLED;
      this.runningTasks.delete(taskId);
      this.emit('task.cancelled', runningTask);
      return true;
    }

    return false;
  }

  private async processNextTask(): Promise<void> {
    if (!this.running || this.taskQueue.length === 0) {
      return;
    }

    const task = this.taskQueue.shift();
    if (!task) return;

    task.status = TaskStatus.RUNNING;
    task.startedAt = new Date();
    this.runningTasks.set(task.id, task);

    console.log(`⚡ Executing task ${task.id}`);
    this.emit('task.started', task);

    try {
      // Simulate task execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mark as completed
      task.status = TaskStatus.COMPLETED;
      task.completedAt = new Date();
      task.actualDuration = task.completedAt.getTime() - (task.startedAt?.getTime() || 0);
      
      this.runningTasks.delete(task.id);
      
      console.log(`✅ Task ${task.id} completed`);
      this.emit('task.completed', task);
      
    } catch (error) {
      // Mark as failed
      task.status = TaskStatus.FAILED;
      this.runningTasks.delete(task.id);
      
      console.error(`❌ Task ${task.id} failed:`, error);
      this.emit('task.failed', task, error);
    }

    // Process next task
    setTimeout(() => this.processNextTask(), 100);
  }

  getQueueStatus(): {
    queuedTasks: number;
    runningTasks: number;
    totalProcessed: number;
  } {
    return {
      queuedTasks: this.taskQueue.length,
      runningTasks: this.runningTasks.size,
      totalProcessed: 0 // Would track this in real implementation
    };
  }

  getTask(taskId: string): Task | null {
    // Check queue
    const queuedTask = this.taskQueue.find(t => t.id === taskId);
    if (queuedTask) return queuedTask;

    // Check running tasks
    const runningTask = this.runningTasks.get(taskId);
    if (runningTask) return runningTask;

    return null;
  }
}
