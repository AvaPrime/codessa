// plugins/samplePlugin.js
// Sample CodexForge Plugin - Demonstrates plugin system functionality

const samplePlugin = {
  name: 'sample-plugin',
  version: '1.0.0',
  description: 'A sample plugin demonstrating CodexForge plugin capabilities',
  author: 'Codessa Development Team',
  
  // Commands provided by this plugin
  commands: [
    {
      name: 'hello',
      description: 'Say hello from the sample plugin',
      aliases: ['hi'],
      handler: async (args) => {
        const name = args.length > 0 ? args.join(' ') : 'World';
        return {
          success: true,
          message: `\n👋 Hello, ${name}! This greeting comes from the sample plugin.\n`
        };
      }
    },
    {
      name: 'time',
      description: 'Get the current time with plugin formatting',
      handler: async () => {
        const now = new Date();
        return {
          success: true,
          message: `\n⏰ Current time: ${now.toLocaleString()}\n📅 From sample plugin with custom formatting!\n`
        };
      }
    },
    {
      name: 'calc',
      description: 'Simple calculator command',
      parameters: ['<operation> <num1> <num2>'],
      handler: async (args) => {
        if (args.length < 3) {
          return {
            success: false,
            message: 'Usage: calc <operation> <num1> <num2>\nOperations: add, subtract, multiply, divide'
          };
        }
        
        const [operation, num1Str, num2Str] = args;
        const num1 = parseFloat(num1Str);
        const num2 = parseFloat(num2Str);
        
        if (isNaN(num1) || isNaN(num2)) {
          return {
            success: false,
            message: 'Invalid numbers provided'
          };
        }
        
        let result;
        switch (operation.toLowerCase()) {
          case 'add':
            result = num1 + num2;
            break;
          case 'subtract':
            result = num1 - num2;
            break;
          case 'multiply':
            result = num1 * num2;
            break;
          case 'divide':
            if (num2 === 0) {
              return {
                success: false,
                message: 'Cannot divide by zero'
              };
            }
            result = num1 / num2;
            break;
          default:
            return {
              success: false,
              message: 'Unknown operation. Use: add, subtract, multiply, divide'
            };
        }
        
        return {
          success: true,
          message: `\n🧮 ${num1} ${operation} ${num2} = ${result}\n`
        };
      }
    }
  ],
  
  // Lifecycle hooks
  hooks: {
    'pre-command': async (input) => {
      // Log when commands are about to be executed
      if (input && input.startsWith('hello')) {
        console.log('🪝 Sample plugin: About to execute hello command');
      }
      return input; // Return potentially modified input
    },
    'post-command': async (input, output) => {
      // Log after commands complete
      if (input && input.startsWith('time')) {
        console.log('🪝 Sample plugin: Time command completed');
      }
    },
    'pre-execution': async (commandName, args) => {
      if (commandName === 'calc') {
        console.log(`🪝 Sample plugin: About to execute calc with args: ${args.join(', ')}`);
      }
    },
    'post-execution': async (commandName, result) => {
      if (commandName === 'hello') {
        console.log('🪝 Sample plugin: Hello command execution completed');
      }
    }
  },
  
  // Initialize function called when plugin is loaded
  initialize: async (commandParser, agentRegistry) => {
    console.log('🔌 Sample plugin initialized successfully!');
    
    // You can perform additional setup here
    // e.g., connecting to databases, setting up event listeners, etc.
  },
  
  // Shutdown function called when plugin is unloaded
  shutdown: async () => {
    console.log('🔌 Sample plugin shutting down...');
    
    // Cleanup resources here
    // e.g., closing connections, clearing timers, etc.
  }
};

module.exports = samplePlugin;
