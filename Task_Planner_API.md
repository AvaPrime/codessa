# Task Planner API

## Overview
The Task Planner within Codessa Kernel is responsible for decomposing complex goals into executable task plans and scheduling their execution. It includes the Goal Decomposer, Scheduler, and interfaces for interacting with goals and plans.

## Key Components

### Goal Decomposer
- **Purpose**: Break down large goals into smaller, actionable tasks
- **Methods**:
  - `decomposeGoal(goal: Goal): Promise<TaskPlan>`: Takes a `Goal` object as input and returns a `TaskPlan`.

### Scheduler
- **Purpose**: Manages timing and order of task execution
- **Methods**:
  - `queueTask(task: Task): Promise<void>`: Queues a task for execution.
  - `start()`: Begins the scheduling loop for task execution.
  - `cancelTask(taskId: string): Promise<void>`: Cancels a scheduled task.

## Task and Plan Structures

### Goal
```typescript
interface Goal {
  id: string;                    // Unique identifier for the goal
  description: string;           // Brief description of the goal
  priority: PriorityLevel;       // Priority level (low, medium, high)
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  created_at: string;            // ISO timestamp of creation
  dependencies?: string[];       // IDs of prerequisite goals
  metadata?: any;                // Additional context data
}
```

### Task
```typescript
interface Task {
  id: string;                    // Unique identifier for the task
  type: string;                  // Type of task (e.g., 'analysis', 'generation')
  content: string;               // Detailed content or instructions
  agent?: string;                // Assigned agent name
  priority: PriorityLevel;       // Task priority level
  status: 'pending' | 'running' | 'completed' | 'failed';
  dependencies?: string[];       // IDs of prerequisite tasks
  estimated_duration?: number;   // Estimated completion time in minutes
  metadata?: any;                // Additional task-specific data
}
```

### TaskPlan
```typescript
interface TaskPlan {
  id: string;                    // Unique identifier for the plan
  goal_id: string;               // Associated goal ID
  tasks: Task[];                 // List of tasks in execution order
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  created_at: string;            // ISO timestamp of creation
  estimated_completion?: string;  // Estimated completion time
  progress: number;              // Completion percentage (0-100)
}
```

### PriorityLevel
```typescript
type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
```

## API Reference

### Creating and Managing Goals
- `createGoal(description: string, priority: PriorityLevel): Promise<Goal>`
  - **Description**: Creates a new goal and initiates the decomposition process into tasks.

### Accessing Plans
- `getActivePlans(): Promise<TaskPlan[]>`
  - **Description**: Retrieves a list of all active plans.

- `getPlan(planId: string): Promise<TaskPlan | null>`
  - **Description**: Retrieves details of a specific plan by its ID.

### Canceling Plans
- `cancelPlan(planId: string): Promise<void>`
  - **Description**: Cancels a specific task plan, stopping all its tasks.


## Example Usage
```typescript
// Example: Creating a Goal
const goal = await kernel.createGoal('Improve System Performance', 'high');

// Example: Accessing Active Plans
const activePlans = await kernel.getActivePlans();

// Example: Canceling a Plan
await kernel.cancelPlan(goal.id);
```

