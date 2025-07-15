// plugins/pluginTemplate.js
// CodexForge Plugin Template - Copy this file to create new plugins

const myPlugin = {
  // Required fields
  name: 'my-plugin',                    // Unique plugin name (kebab-case)
  version: '1.0.0',                     // Semantic version
  description: 'My awesome plugin',     // Brief description
  
  // Optional fields
  author: 'Your Name',                  // Plugin author
  
  // Commands provided by this plugin
  commands: [
    {
      name: 'mycommand',                // Command name
      description: 'My custom command', // Command description
      aliases: ['mycmd'],               // Optional aliases
      parameters: ['<arg1>', '[arg2]'], // Optional parameter descriptions
      handler: async (args) => {
        // Command logic here
        // args: array of command arguments
        
        return {
          success: true,
          message: 'Command executed successfully!'
        };
      }
    }
  ],
  
  // Agents provided by this plugin (optional)
  agents: [
    {
      id: 'my-agent',
      instance: {
        // Agent implementation
        testConnection: async () => true,
        // Add other agent methods here
      },
      metadata: {
        id: 'my-agent',
        name: 'My Agent',
        description: 'My custom agent',
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
      healthCheck: async () => {
        // Health check logic
        return true;
      }
    }
  ],
  
  // Lifecycle hooks (optional)
  hooks: {
    'pre-command': async (input) => {
      // Pre-command logic - can modify input
      // input: string - the user's input
      console.log(`Pre-command hook: ${input}`);
      return input; // Return potentially modified input
    },
    'post-command': async (input, output) => {
      // Post-command logic
      // input: string - the user's input
      // output: any - the command's output
      console.log(`Post-command hook: ${input}`);
    },
    'pre-execution': async (commandName, args) => {
      // Pre-execution logic
      // commandName: string - the command being executed
      // args: string[] - command arguments
      console.log(`Pre-execution hook: ${commandName} with args: ${args.join(', ')}`);
    },
    'post-execution': async (commandName, result) => {
      // Post-execution logic
      // commandName: string - the command that was executed
      // result: any - the command's result
      console.log(`Post-execution hook: ${commandName} completed`);
    }
  },
  
  // Initialize function (optional)
  initialize: async (commandParser, agentRegistry) => {
    console.log('🔌 My plugin initialized!');
    
    // Setup logic here
    // - Connect to databases
    // - Initialize services
    // - Set up event listeners
    // - etc.
  },
  
  // Shutdown function (optional)
  shutdown: async () => {
    console.log('🔌 My plugin shutting down...');
    
    // Cleanup logic here
    // - Close connections
    // - Clear timers
    // - Save state
    // - etc.
  }
};

module.exports = myPlugin;

/*
PLUGIN DEVELOPMENT GUIDE:

1. Copy this template to a new file in the plugins directory
2. Update the plugin metadata (name, version, description, author)
3. Implement your commands in the commands array
4. Add agents if needed in the agents array
5. Add lifecycle hooks if needed in the hooks array
6. Implement initialize() for setup logic
7. Implement shutdown() for cleanup logic
8. Test your plugin with: plugins load /path/to/your/plugin.js

Command Handler Return Format:
{
  success: boolean,     // Whether the command succeeded
  message?: string,     // Optional message to display
  data?: any,          // Optional data to return
  streaming?: boolean  // Whether this is a streaming response
}

Hook Types:
- 'pre-command': Called before command parsing
- 'post-command': Called after command execution
- 'pre-execution': Called before command handler execution
- 'post-execution': Called after command handler completion

Plugin Context:
- commandParser: Access to command parser
- agentRegistry: Access to agent registry
- input?: User input string
- output?: Command output
- error?: Any error that occurred
*/
