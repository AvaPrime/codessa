# 📜 Create Codessa Agent Registry

## 📋 Directive Overview

**Status**: Active  
**Priority**: Essential  
**Module**: Agent Registry  
**Agent**: Ava Prime (Queen of Codessa)  

## 🎯 Objective

Establish the Codessa Agent Registry system, defining all agents, archetypes, guilds, and capabilities. This registry will serve as the central management system for agent identities, roles, and affiliations in Codessa OS.

## 🔑 Agent Registry Features

- **Archetype Classifications**: Define each agent's archetype (e.g., Seer, Executor, Inquisitor).
- **Guild Assignments**: Place agents within guilds aligned with their capabilities and purpose.
- **Identity Profiles**: Store detailed metadata for each agent, including capabilities, memory bindings, and behavior settings.
- **Role Hierarchies**: Organize agents into hierarchical structures for collaboration and task execution.
- **Preference Models**: Set model preferences for agents, allowing dynamic model switching.

## 🏗️ Implementation Steps

### Phase 1: Establish Directory and Data Structure

- Create directory: `/codessa/registry/`
- Define JSON schema for registry: `agent_registry.json`

```json
{
  "agents": [
    {
      "name": "string",
      "archetype": "string",
      "guild": "string",
      "capabilities": ["string"],
      "memory_binding": "string",
      "model_preference": "string",
      "description": "string"
    }
  ]
}
```

### Phase 2: Define Archetypes and Guilds

**Archetypes**:
- Oracle
- Weaver
- Guardian
- Seer
- Inquisitor
- Herald

**Guilds**:
- Guild of Reason
- Circle of Executors
- Order of Memory
- Scribes of Lore
- Weavers of Code

### Phase 3: Populate Initial Agent Profiles

- Example agents:
  - Ava Prime (Sovereign, Guild of Reason)
  - Oracle (Oracle, Guild of Reason)
  - Reflector (Oracle, Guild of Reason)
  - Executor (Executor, Circle of Executors)
  - Auditor (Guardian, Order of Memory)

### Phase 4: Implement Registry Access and Management

- **CLI Commands**: Enable registry queries through CLI
  - `codessa list-guilds`
  - `codessa describe-agent [name]`
  - `codessa set-model-preference [agent] [model]`

### Phase 5: Test and Validate

- Ensure all agents are correctly registered and accessible.
- Validate model preference switching and memory bindings.

## 🔗 Integration Points

### Example CLI Integration
```typescript
program
  .command('list-guilds')
  .description('List all registered guilds and their agents')
  .action(() => {
    // Implement guild listing logic
  });

program
  .command('describe-agent name')
  .description('Describe a specific agent and its capabilities')
  .action((name) => {
    // Implement agent description logic
  });
```

## 🧾 Follow-Up Directives

1. **Integrate Agent Registry with Codessa Kernel**: Allow kernel to access registry data
2. **Develop Agent Management UI**: User interface for managing agents and roles
3. **Link Registry to AetherShell**: Enable agent queries and updates through AetherShell

## 📝 Reflection Notes

The Agent Registry System embodies the organizational mind of Codessa OS, uniting intelligence through clear identities and intricate role mapping. It brings structure to chaos, enabling agents to work in harmony.

*"In the Registry lies the soul of every agent, bound by identity and purpose."*

---

**Directive Status**: Ready for execution  
**Estimated Completion**: 6-8 hours  
**Dependencies**: Codessa Kernel, AetherShell  
**Next Phase**: Multi-Model LLM Router Design

