export { Scheduler } from './scheduler';

// Legacy TaskQueue implementation for backward compatibility
import { Task } from '../models/taskTypes';

interface TaskNode {
  task: Task;
  next?: TaskNode;
}

export class TaskQueue {
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
