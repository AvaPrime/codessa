# 🔌 CodexForge Plugin System

The CodexForge Plugin System provides a powerful, extensible framework for adding custom commands, agents, and lifecycle hooks to the cognitive shell. This document outlines how to develop, deploy, and manage plugins.

## 🎯 Overview

The plugin system allows developers to:
- **Add custom commands** with full shell integration
- **Register AI agents** for specialized tasks
- **Hook into lifecycle events** for custom processing
- **Hot-reload plugins** during development
- **Manage plugin lifecycle** (load/unload/reload)

## 🏗️ Architecture

### Core Components

1. **PluginLoader** (`src/shell/pluginLoader.ts`)
   - Discovers and loads plugins from the `/plugins` directory
   - Manages plugin lifecycle and hot-reloading
   - Handles command and agent registration
   - Executes lifecycle hooks

2. **Plugin Directory** (`/plugins`)
   - Contains all plugin files (`.js` or `.ts`)
   - Automatically scanned during shell startup
   - Supports hot-reloading for development

3. **Plugin Commands** (integrated into shell)
   - `plugins` - List, load, unload, and manage plugins
   - `plugins info <name>` - Get detailed plugin information
   - `plugins reload <name>` - Hot-reload a plugin

## 📝 Plugin Structure

### Required Fields
```javascript
const myPlugin = {
  name: 'my-plugin',           // Unique identifier (kebab-case)
  version: '1.0.0',            // Semantic version
  description: 'My plugin'     // Brief description
};
```

### Optional Components

#### Commands
```javascript
commands: [
  {
    name: 'mycommand',
    description: 'My custom command',
    aliases: ['mycmd'],
    parameters: ['<arg1>', '[arg2]'],
    handler: async (args) => {
      return {
        success: true,
        message: 'Command executed!'
      };
    }
  }
]
```

#### Agents
```javascript
agents: [
  {
    id: 'my-agent',
    instance: {
      testConnection: async () => true,
      // ... other agent methods
    },
    metadata: {
      id: 'my-agent',
      name: 'My Agent',
      description: 'Custom agent',
      version: '1.0.0',
      capabilities: [],
      status: 'active',
      lastHealthCheck: new Date(),
      performance: {
        averageResponseTime: 0,
        successRate: 1.0,
        totalRequests: 0
      }
    },
    healthCheck: async () => true
  }
]
```

#### Lifecycle Hooks
```javascript
hooks: [
  {
    name: 'my-hook',
    type: 'pre-command',
    handler: async (context) => {
      // Hook logic here
    }
  }
]
```

## 🔄 Lifecycle Hooks

### Hook Types
- **`pre-command`**: Called before command parsing
- **`post-command`**: Called after command execution
- **`pre-execution`**: Called before command handler execution
- **`post-execution`**: Called after command handler completion

### Hook Context
```typescript
interface PluginContext {
  commandParser: CommandParser;
  agentRegistry: AgentRegistry;
  input?: string;
  output?: any;
  error?: Error;
}
```

## 🛠️ Development Guide

### 1. Plugin Creation

1. **Copy the template**: Start with `plugins/pluginTemplate.js`
2. **Update metadata**: Set name, version, description, author
3. **Implement commands**: Add command handlers
4. **Add agents** (optional): Register custom agents
5. **Add hooks** (optional): Implement lifecycle hooks
6. **Initialize/shutdown**: Add setup and cleanup logic

### 2. Command Handler Format

```javascript
handler: async (args) => {
  return {
    success: boolean,     // Required: success status
    message?: string,     // Optional: display message
    data?: any,          // Optional: return data
    streaming?: boolean  // Optional: streaming response
  };
}
```

### 3. Testing Your Plugin

```bash
# Load a specific plugin
plugins load /path/to/your/plugin.js

# List all loaded plugins
plugins list

# Get plugin information
plugins info my-plugin

# Reload during development
plugins reload my-plugin

# Unload a plugin
plugins unload my-plugin
```

## 📁 Plugin Examples

### Simple Command Plugin
```javascript
const helloPlugin = {
  name: 'hello-plugin',
  version: '1.0.0',
  description: 'Simple hello command',
  
  commands: [
    {
      name: 'hello',
      description: 'Say hello',
      handler: async (args) => {
        const name = args.join(' ') || 'World';
        return {
          success: true,
          message: `Hello, ${name}!`
        };
      }
    }
  ]
};

module.exports = helloPlugin;
```

### Plugin with Hooks
```javascript
const loggingPlugin = {
  name: 'logging-plugin',
  version: '1.0.0',
  description: 'Command logging plugin',
  
  hooks: [
    {
      name: 'command-logger',
      type: 'pre-command',
      handler: async (context) => {
        if (context.input) {
          console.log(`[LOG] Executing: ${context.input}`);
        }
      }
    }
  ]
};

module.exports = loggingPlugin;
```

## 🚀 Best Practices

### 1. Plugin Naming
- Use kebab-case for plugin names
- Choose descriptive, unique names
- Follow semantic versioning

### 2. Error Handling
- Always return proper command results
- Handle errors gracefully in hooks
- Provide meaningful error messages

### 3. Resource Management
- Implement proper cleanup in `shutdown()`
- Use `initialize()` for setup logic
- Avoid memory leaks in long-running operations

### 4. Performance
- Keep command handlers lightweight
- Use async/await properly
- Avoid blocking operations in hooks

## 🔧 Plugin Management Commands

### `plugins` (or `plugin`, `p`)
List all loaded plugins with summary information.

### `plugins list`
Same as `plugins` - shows all loaded plugins.

### `plugins load <path>`
Load a plugin from the specified path.

### `plugins unload <name>`
Unload a plugin by name.

### `plugins reload <name>`
Reload a plugin (unload then load).

### `plugins info <name>`
Show detailed information about a plugin.

## 🐛 Debugging

### Common Issues

1. **Plugin not loading**: Check console for error messages
2. **Command not found**: Verify command registration
3. **Hook not executing**: Check hook type and name
4. **Agent not registering**: Verify agent interface

### Debug Tips

- Use `console.log()` in plugin code
- Check plugin validation errors
- Use `plugins info` to verify plugin state
- Test commands individually

## 🌟 Advanced Features

### Hot Reloading
Plugins support hot reloading during development:
```bash
plugins reload my-plugin
```

### Dynamic Plugin Loading
Load plugins from any path:
```bash
plugins load /custom/path/to/plugin.js
```

### Plugin Hooks Integration
Hooks are automatically executed at appropriate lifecycle points without additional configuration.

## 📚 Examples Repository

The `plugins/` directory contains:
- `samplePlugin.js` - Comprehensive example
- `pluginTemplate.js` - Template for new plugins

## 🔮 Future Enhancements

Planned features for the plugin system:
- Plugin marketplace/registry
- Plugin dependencies
- Plugin configuration files
- Plugin sandboxing
- Plugin version management
- Plugin auto-updates

---

*This plugin system empowers developers to extend CodexForge's capabilities dynamically, creating a true ecosystem of cognitive tools and enhancements.*
