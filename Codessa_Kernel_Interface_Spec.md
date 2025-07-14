# Codessa Kernel Interface Specification

## Overview
This document outlines the interfaces and APIs exposed by the Codessa Kernel to facilitate interaction with other components within the Codessa OS.

## API Endpoints
All API calls must be authenticated using a valid API key. Responses are in JSON format.

### /registerAgent
- **Method**: POST
- **Description**: Registers a new agent with the Codessa Kernel.
- **Request Headers**: `{ "Authorization": "Bearer {API_KEY}"}`
- **Request Body**: `{
  "agentID": "string",
  "archetype": "string",
  "capabilities": ["string"],
  "guild": "string"
}`
- **Response**: `{
  "status": "success/failure",
  "message": "string"
}`
- **Error Codes**: 400 - Bad Request, 401 - Unauthorized

### /routeTask
- **Method**: POST
- **Description**: Routes a task to the appropriate agent/model for execution.
- **Request Body**: `{
  "taskID": "string",
  "parameters": { ... }
}`
- **Response**: `{
  "status": "success/failure",
  "result": { ... }
}`

### /getAgentStatus
- **Method**: GET
- **Description**: Retrieves the status and detail of a specific agent by ID.
- **Response**: `{
  "agentID": "string",
  "status": "active/inactive",
  "details": { ... }
}`

### /listAgents
- **Method**: GET
- **Description**: Retrieves a list of all registered agents.
- **Response**: `[
  {
    "agentID": "string",
    "archetype": "string",
    "capabilities": ["string"],
    "guild": "string"
  }
]`

### /queryMemory
- **Method**: POST
- **Description**: Performs a semantic search on the memory system.
- **Request Body**: `{
  "query": "string",
  "limit": 10
}`
- **Response**: `{
  "results": [{ ... }],
  "count": "number"
}`

### /storeMemory
- **Method**: POST
- **Description**: Stores data in the memory system.
- **Request Body**: `{
  "data": { ... },
  "metadata": { ... }
}`
- **Response**: `{
  "status": "success/failure",
  "id": "string"
}`

### /createGoal
- **Method**: POST
- **Description**: Creates a new goal and generates a task plan.
- **Request Body**: `{
  "description": "string",
  "priority": "low|medium|high"
}`
- **Response**: `{
  "goal": { ... },
  "plan": { ... }
}`

### /systemStatus
- **Method**: GET
- **Description**: Retrieves comprehensive system status.
- **Response**: `{
  "initialized": "boolean",
  "activeDirectives": "number",
  "activePlans": "number",
  "uptime": "number",
  "memoryUsage": { ... }
}`

## Event Handling
- **Event Emission**: The Codessa Kernel can emit events that other components can listen to in order to respond to system changes.
- **Example Events**:
  - `agentRegistered`
  - `taskRouted`
  - `statusUpdated`

## Error Handling
Standard error response structure:
```json
{
  "error": {
    "code": 1001,
    "message": "Description of the error"
  }
}
```
Below are common error codes that may be returned by the Codessa Kernel:
- **1001**: Agent not found
- **1002**: Invalid request format
- **1003**: Task execution failure
- **1004**: Unauthorized access attempt
- **1005**: Resource not available

## Security
- All API requests must include the `Authorization` header.
- Sensitive operations must be authorized based on user roles.
- Rate limiting applies to prevent abuse.
- Monitor access logs for unauthorized attempts.

## Versioning
- Current API version: v1.0
- Changes will be versioned according to semantic versioning principles.
