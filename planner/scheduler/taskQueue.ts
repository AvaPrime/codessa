import { Task } from '../models/task';

interface TaskNode {
  task: Task;
  next?: TaskNode;
}

class TaskQueue {
  private head?: TaskNode;
  private tail?: TaskNode;

  enqueue(task: Task): void {
    const node: TaskNode = { task };
    if (!this.tail) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
  }

  dequeue(): Task | undefined {
    if (!this.head) return undefined;
    const { task } = this.head;
    this.head = this.head.next;
    if (!this.head) this.tail = undefined;
    return task;
  }

  peek(): Task | undefined {
    return this.head?.task;
  }
}

class Scheduler {
  private taskQueue: TaskQueue;

  constructor() {
    this.taskQueue = new TaskQueue();
  }

  schedule(task: Task): void {
    // Implement priority and deadline-based scheduling
    // Add Deferred and Recurring support
    this.taskQueue.enqueue(task);
  }

  executeNext(): void {
    const task = this.taskQueue.dequeue();
    if (task) {
      // Attempt to execute task
      console.log(`Executing: ${task.name}`);
      // Handle execution logic
    }
  }
  
  loop(): void {
    // This loop simulates active autonomous task execution
    setInterval(() => {
      this.executeNext();
    }, 1000);
  }
}

export { TaskQueue, Scheduler };
