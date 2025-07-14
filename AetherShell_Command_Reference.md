# AetherShell Command Reference

## Overview
AetherShell is the command-line interface for the Codessa OS, providing direct access to kernel functions, agent management, task planning, and system monitoring. This reference guide covers all available commands and their usage.

## Command Structure
```
codessa [global-options] <command> [command-options] [arguments]
```

## Global Options
- `--config <file>`: Use custom configuration file
- `--verbose`: Enable verbose output
- `--json`: Output in JSON format
- `--help`: Show help information
- `--version`: Show version information

## System Commands

### `system-status`
Display comprehensive system status information.

**Usage:**
```bash
codessa system-status [--format <table|json>]
```

**Options:**
- `--format`: Output format (table, json)
- `--watch`: Continuously monitor status

**Example:**
```bash
codessa system-status
# Output:
# 🌟 Codessa System Status:
# Initialized: ✅
# Active Directives: 3
# Active Plans: 2
# Uptime: 2h 45m 12s
# Memory Usage: 256MB / 1GB
```

### `kernel-restart`
Restart the Codessa Kernel with graceful shutdown.

**Usage:**
```bash
codessa kernel-restart [--force]
```

**Options:**
- `--force`: Force restart without graceful shutdown

### `health-check`
Run comprehensive system diagnostics.

**Usage:**
```bash
codessa health-check [--component <name>]
```

**Options:**
- `--component`: Check specific component (kernel, memory, agents, models)

## Agent Management Commands

### `list-agents`
List all registered agents in the system.

**Usage:**
```bash
codessa list-agents [--guild <name>] [--archetype <type>]
```

**Options:**
- `--guild`: Filter by guild name
- `--archetype`: Filter by agent archetype
- `--active`: Show only active agents

**Example:**
```bash
codessa list-agents --guild "Circle of Executors"
# Output:
# Name         Archetype    Guild             Status
# ──────────────────────────────────────────────────
# Ava Prime    Queen        Circle of Executors  Active
# Nova         Specialist   Circle of Executors  Active
```

### `agent-status`
Get detailed status information for a specific agent.

**Usage:**
```bash
codessa agent-status <agent-name> [--history]
```

**Options:**
- `--history`: Include execution history
- `--metrics`: Show performance metrics

**Example:**
```bash
codessa agent-status "Ava Prime"
# Output:
# Agent: Ava Prime
# Archetype: Queen
# Guild: Circle of Executors
# Status: Active
# Capabilities: [planning, coordination, analysis]
# Current Model: gpt-4
# Tasks Completed: 45
# Success Rate: 98.2%
```

### `register-agent`
Register a new agent from JSON definition file.

**Usage:**
```bash
codessa register-agent <file-path>
```

**Example:**
```bash
codessa register-agent ./agents/new-agent.json
# Output:
# ✅ Agent 'DataAnalyst' registered successfully
```

### `agent-logs`
View logs for a specific agent.

**Usage:**
```bash
codessa agent-logs <agent-name> [--lines <n>] [--follow]
```

**Options:**
- `--lines`: Number of lines to show (default: 50)
- `--follow`: Follow log output
- `--level`: Filter by log level (info, warn, error)

## Task Planning Commands

### `create-goal`
Create a new goal and generate task plan.

**Usage:**
```bash
codessa create-goal "<description>" [--priority <level>]
```

**Options:**
- `--priority`: Priority level (low, medium, high, critical)

**Example:**
```bash
codessa create-goal "Optimize database performance" --priority high
# Output:
# 🎯 Goal created: optimize-db-perf-20250714
# 📋 Generated 5 tasks
# ⏱️ Estimated completion: 2h 30m
```

### `list-goals`
List all goals and their status.

**Usage:**
```bash
codessa list-goals [--status <status>] [--priority <level>]
```

**Options:**
- `--status`: Filter by status (pending, active, completed, cancelled)
- `--priority`: Filter by priority level

### `list-plans`
Show active task plans.

**Usage:**
```bash
codessa list-plans [--goal <goal-id>]
```

**Options:**
- `--goal`: Show plans for specific goal
- `--detailed`: Show task breakdown

### `cancel-plan`
Cancel a specific task plan.

**Usage:**
```bash
codessa cancel-plan <plan-id>
```

### `plan-status`
Get detailed status of a task plan.

**Usage:**
```bash
codessa plan-status <plan-id>
```

## Directive Management Commands

### `list-directives`
Show available directives.

**Usage:**
```bash
codessa list-directives [--category <cat>]
```

**Options:**
- `--category`: Filter by category
- `--status`: Filter by status

### `run-directive`
Execute a specific directive.

**Usage:**
```bash
codessa run-directive <directive-name> [--params <json>]
```

**Options:**
- `--params`: JSON parameters for the directive
- `--async`: Run asynchronously

**Example:**
```bash
codessa run-directive "system-optimization" --params '{"target": "memory"}'
# Output:
# 🚀 Directive 'system-optimization' started
# 📊 Progress: [████████████████████] 100%
# ✅ Directive completed successfully
```

### `directive-history`
Show recent directive executions.

**Usage:**
```bash
codessa directive-history [--limit <n>] [--status <status>]
```

**Options:**
- `--limit`: Number of records to show
- `--status`: Filter by execution status

## Memory Management Commands

### `memory-search`
Perform semantic search in memory system.

**Usage:**
```bash
codessa memory-search "<query>" [--limit <n>]
```

**Options:**
- `--limit`: Maximum results to return (default: 10)
- `--type`: Filter by content type

**Example:**
```bash
codessa memory-search "database optimization techniques"
# Output:
# 🔍 Found 5 results:
# 1. Database Indexing Strategies (score: 0.92)
# 2. Query Optimization Guide (score: 0.88)
# 3. Performance Tuning Best Practices (score: 0.85)
```

### `memory-store`
Store data in the memory system.

**Usage:**
```bash
codessa memory-store <file-path> [--type <type>] [--metadata <json>]
```

**Options:**
- `--type`: Content type
- `--metadata`: Additional metadata as JSON

### `memory-stats`
Display memory system statistics.

**Usage:**
```bash
codessa memory-stats
```

**Example:**
```bash
codessa memory-stats
# Output:
# 📊 Memory Statistics:
# Total Records: 1,247
# Storage Used: 156MB
# Recent Queries: 89
# Cache Hit Rate: 94.2%
```

## Model Management Commands

### `model-status`
Show status of available models.

**Usage:**
```bash
codessa model-status [--model <name>]
```

**Options:**
- `--model`: Show specific model details

### `model-switch`
Change agent model preference.

**Usage:**
```bash
codessa model-switch <agent-name> <model-name>
```

**Example:**
```bash
codessa model-switch "Ava Prime" "gpt-4-turbo"
# Output:
# ✅ Agent 'Ava Prime' model preference updated to 'gpt-4-turbo'
```

### `route-test`
Test task routing logic.

**Usage:**
```bash
codessa route-test "<task-description>" [--agent <name>]
```

**Options:**
- `--agent`: Test routing to specific agent

## Guild Management Commands

### `guild-roster`
List all agents in a guild.

**Usage:**
```bash
codessa guild-roster <guild-name>
```

### `guild-status`
Display guild information and statistics.

**Usage:**
```bash
codessa guild-status <guild-name>
```

## Monitoring Commands

### `watch-events`
Monitor kernel events in real-time.

**Usage:**
```bash
codessa watch-events [--filter <pattern>] [--type <event-type>]
```

**Options:**
- `--filter`: Filter events by pattern
- `--type`: Filter by event type

**Example:**
```bash
codessa watch-events --type "directive.*"
# Output:
# 🚀 directive.started: system-optimization
# 📊 directive.progress: 45%
# ✅ directive.completed: system-optimization
```

### `performance-metrics`
Display system performance metrics.

**Usage:**
```bash
codessa performance-metrics [--interval <seconds>]
```

**Options:**
- `--interval`: Update interval in seconds

## Configuration Commands

### `config-show`
Display current configuration.

**Usage:**
```bash
codessa config-show [--section <name>]
```

**Options:**
- `--section`: Show specific configuration section

### `config-set`
Update configuration values.

**Usage:**
```bash
codessa config-set <key> <value>
```

**Example:**
```bash
codessa config-set "logging.level" "debug"
```

## Utility Commands

### `export-data`
Export system data for backup or analysis.

**Usage:**
```bash
codessa export-data <output-file> [--format <format>]
```

**Options:**
- `--format`: Export format (json, csv, yaml)
- `--include`: Data types to include

### `import-data`
Import data from backup or external source.

**Usage:**
```bash
codessa import-data <input-file> [--merge]
```

**Options:**
- `--merge`: Merge with existing data
- `--validate`: Validate before import

### `shell-info`
Display AetherShell information and statistics.

**Usage:**
```bash
codessa shell-info
```

## Advanced Features

### Command Aliases
Create custom command shortcuts:
```bash
# Create alias
codessa alias create "ss" "system-status"

# Use alias
codessa ss
```

### Command History
Access command history:
```bash
# Show history
codessa history

# Execute previous command
codessa !!

# Execute specific history item
codessa !5
```

### Batch Operations
Execute multiple commands from file:
```bash
codessa batch-exec commands.txt
```

### Output Redirection
Redirect command output:
```bash
# Save to file
codessa list-agents > agents.txt

# Append to file
codessa memory-stats >> system-report.txt

# Pipe to other commands
codessa list-agents | grep "Active"
```

## Environment Variables

### Configuration
- `CODESSA_CONFIG`: Path to configuration file
- `CODESSA_LOG_LEVEL`: Logging level (debug, info, warn, error)
- `CODESSA_API_KEY`: API key for authentication

### Output Control
- `CODESSA_OUTPUT_FORMAT`: Default output format (table, json, yaml)
- `CODESSA_NO_COLOR`: Disable colored output
- `CODESSA_PAGER`: Custom pager for long output

## Error Handling

### Common Error Codes
- `E001`: Kernel not initialized
- `E002`: Invalid command syntax
- `E003`: Permission denied
- `E004`: Resource not found
- `E005`: Operation timeout

### Debugging
Enable debug mode for troubleshooting:
```bash
codessa --verbose <command>
```

## Examples and Use Cases

### System Monitoring Workflow
```bash
# Check system status
codessa system-status

# Monitor events
codessa watch-events &

# Check agent performance
codessa list-agents --format json | jq '.[] | select(.success_rate < 0.9)'
```

### Task Management Workflow
```bash
# Create and track goal
codessa create-goal "Improve API response time"
codessa list-plans --detailed
codessa watch-events --type "plan.*"
```

### Agent Management Workflow
```bash
# Register new agent
codessa register-agent ./config/new-agent.json

# Monitor agent performance
codessa agent-status "NewAgent" --metrics

# Adjust model preference
codessa model-switch "NewAgent" "claude-3"
```

---

*AetherShell provides powerful command-line access to all Codessa OS functions, enabling efficient system management and monitoring through an intuitive terminal interface.*
