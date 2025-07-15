// plugins/testPlugin.js
// Simple test plugin to verify plugin system functionality

module.exports = {
  name: 'test-plugin',
  version: '1.0.0',
  description: 'A simple test plugin for verification',
  author: 'CodexForge Team',
  
  commands: [
    {
      name: 'test',
      description: 'Test command from plugin',
      handler: async (args) => {
        return {
          success: true,
          message: `\n✅ Test plugin is working! Args: ${args.join(', ') || 'none'}\n`
        };
      }
    },
    {
      name: 'echo',
      description: 'Echo the input arguments',
      handler: async (args) => {
        return {
          success: true,
          message: `\n🔊 Echo: ${args.join(' ')}\n`
        };
      }
    }
  ],
  
  hooks: {
    'pre-command': async (input) => {
      console.log(`🔍 Test plugin pre-command: ${input}`);
      return input;
    },
    'post-command': async (input, output) => {
      console.log(`✅ Test plugin post-command: ${input}`);
    }
  },
  
  initialize: async () => {
    console.log('🚀 Test plugin initialized!');
  },
  
  shutdown: async () => {
    console.log('🛑 Test plugin shutting down!');
  }
};
