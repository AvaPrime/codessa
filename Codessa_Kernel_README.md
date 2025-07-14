# Codessa Kernel README

## Overview
The Codessa Kernel acts as the central orchestrator within the Codessa OS environment. It connects various components, including the Agent Registry, Model Router, Memory Manager, Task Planner, and Cognition Loop, facilitating seamless interactions across the entire system.

## Key Responsibilities
- **Agent Lifecycle Management**: Register, track, and manage agent states and capabilities
- **Task Routing & Execution**: Route tasks using the Multi-Model LLM Router with intelligent agent selection
- **Memory Operations**: Interact with the Reflective Memory Protocol for storage and retrieval
- **Event Orchestration**: Handle system events and provide real-time event streaming
- **Goal Decomposition**: Break down complex goals into executable task plans
- **Autonomous Planning**: Manage task scheduling and execution through the cognition loop
- **System State Management**: Keep track of system state, performance metrics, and health

## Architecture

### Core Components
1. **Registry Manager**: Manages agent registration and capabilities
2. **Model Router**: Routes tasks to appropriate LLM models
3. **Memory Manager**: Handles semantic memory storage and retrieval
4. **Goal Decomposer**: Breaks down complex goals into actionable tasks
5. **Scheduler**: Manages task queuing and execution timing
6. **Cognition Loop**: Provides feedback and learning mechanisms

### Event System
The kernel uses an event-driven architecture with the following event categories:
- **System Events**: `system.ready`, `system.shutdown`
- **Agent Events**: `agent.registered`, `agent.modelPreferenceChanged`
- **Directive Events**: `directive.started`, `directive.completed`, `directive.failed`
- **Memory Events**: `memory.queried`, `memory.stored`
- **Planning Events**: `goal.created`, `plan.created`, `plan.completed`, `plan.cancelled`
- **Cognitive Events**: `cognitive.insight`

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- TypeScript (v4.5 or higher)
- Access to the Codessa agent ecosystem
- Configured LLM endpoints (OpenAI, Anthropic, etc.)

### Installation
1. Clone the repository from the source
2. Navigate to the Codessa Kernel directory
3. Install dependencies: `npm install`
4. Build the TypeScript code: `npm run build`

### Configuration
- Ensure `agent_registry.json` contains your agent definitions
- Configure `router_config.json` with model endpoints and routing rules
- Set up environment variables for API keys and database connections
- Configure memory storage settings in `memory_config.json`

### Running the Kernel
```bash
# Development mode
npm run dev

# Production mode
npm start

# With custom configuration
npm start -- --config custom_config.json
```

## Extending the Kernel
Developers can extend the Kernel by adding new directives, integrating additional LLMs, or enhancing memory protocols. Follow the existing architectural patterns for consistency.

## Interfacing with Other Components
- **AetherShell CLI**: Provides command-line access to kernel functionalities.
- **Kernel Event Types**: Captures and responds to various system events (detailed in Kernel_Event_Types.md).

## Troubleshooting
- **Common Issues**: Include kernel startup failures, agent registration errors, etc.
- Check configuration files for errors.
- Ensure all services are running.

## Contribution
Contributors are welcome. Follow the development guidelines provided in the repository.
