// src/shell/codexForge.ts

import { CentralOrchestrator } from '../orchestration/centralOrchestrator';
import { GeminiPromptAgent } from '../agents/geminiPromptAgent';
import { CommandParser, CommandResult } from './commandParser';
import { SessionManager } from './sessionManager';
import { PluginLoader, PluginContext } from './pluginLoader';
import { Logger } from '../utils/logger';
import * as readline from 'readline';
import * as path from 'path';
import * as fs from 'fs';

const logger = new Logger('CodexForge');

export class CodexForge {
  private orchestrator: CentralOrchestrator;
  private geminiAgent: GeminiPromptAgent;
  private commandParser: CommandParser;
  private sessionManager: SessionManager;
  private pluginLoader: PluginLoader;
  private rl: readline.Interface;
  private isProcessing: boolean = false;

  constructor() {
    this.orchestrator = new CentralOrchestrator();
    this.commandParser = new CommandParser();
    this.sessionManager = new SessionManager();
    
    // Initialize Gemini agent
    this.geminiAgent = new GeminiPromptAgent({
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'codessa-project',
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro-latest'
    });
    
    this.sessionManager.setGeminiAgent(this.geminiAgent);
    
    // Initialize plugin loader
    this.pluginLoader = new PluginLoader(this.commandParser, this.orchestrator.agentRegistry);
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      completer: this.completer.bind(this)
    });
    
    this.setupShell();
  }

  private completer(line: string): [string[], string] {
    const commands = this.commandParser.getCommands().map(cmd => cmd.name);
    const hits = commands.filter(cmd => cmd.startsWith(line));
    return [hits.length ? hits : commands, line];
  }

  async setupShell(): Promise<void> {
    try {
      // Register Gemini agent with orchestrator
      await this.orchestrator.registerAgent(
        'gemini',
        this.geminiAgent,
        {
          name: 'Gemini Prompt Agent',
          description: 'Google Gemini AI agent with streaming and context capabilities',
          version: '1.0.0'
        },
        () => this.geminiAgent.testConnection()
      );

      // Create initial session
      await this.sessionManager.ensureActiveSession();
      
      // Register additional commands
      this.registerCodexForgeCommands();
      
      // Load plugins
      await this.pluginLoader.loadPlugins();
      
      this.displayWelcome();
      this.startInputLoop();
      
    } catch (error) {
      console.error('❌ Failed to initialize CodexForge:', error);
      process.exit(1);
    }
  }

  private displayWelcome(): void {
    console.clear();
    console.log('\n🔥 Welcome to CodexForge — Your Cognitive Shell 🔥');
    console.log('═'.repeat(60));
    console.log('🧠 AI-powered interactive shell with memory and streaming');
    console.log('💡 Type "help" for commands or start chatting directly');
    console.log('🧵 Conversation context maintained across sessions');
    console.log('═'.repeat(60));
    
    const session = this.sessionManager.getCurrentSession();
    if (session) {
      console.log(`📝 Current session: ${session.name} (${session.id})`);
      console.log(`🕐 Created: ${session.createdAt.toLocaleString()}`);
      console.log(`💬 Messages: ${session.messageCount}`);
    }
    
    console.log('═'.repeat(60));
  }

  private startInputLoop(): void {
    this.rl.setPrompt('\n🤖 CodexForge> ');
    this.rl.prompt();

    this.rl.on('line', async (line) => {
      if (this.isProcessing) {
        console.log('⏳ Still processing previous input...');
        this.rl.prompt();
        return;
      }
      
      await this.handleInput(line.trim());
      this.rl.prompt();
    }).on('close', () => {
      console.log('\n👋 Exiting CodexForge. Your conversations are saved!');
      process.exit(0);
    });

    // Handle Ctrl+C gracefully
    this.rl.on('SIGINT', () => {
      if (this.isProcessing) {
        console.log('\n⚠️  Interrupting current process...');
        this.isProcessing = false;
      } else {
        console.log('\n👋 Use "exit" or "quit" to leave CodexForge');
      }
      this.rl.prompt();
    });
  }

  private async handleInput(input: string): Promise<void> {
    if (!input) {
      return;
    }

    // Handle exit commands
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      this.rl.close();
      return;
    }

    this.isProcessing = true;
    
    try {
      // Check if it's a command
      if (this.commandParser.isCommand(input)) {
        const result = await this.commandParser.executeCommand(input);
        this.displayCommandResult(result);
      } else {
        // Process as AI prompt
        await this.processAIPrompt(input);
      }
    } catch (error) {
      logger.error('Error processing input:', error);
      console.error('❌ Error processing input:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.isProcessing = false;
    }
  }

  private async processAIPrompt(input: string): Promise<void> {
    const session = await this.sessionManager.ensureActiveSession();
    const threadId = session.threadId;
    
    try {
      console.log('\n🔄 Processing with AI...');
      console.log('─'.repeat(50));
      
      // Use streaming for real-time response
      let fullResponse = '';
      await this.geminiAgent.generatePromptStreamWithThread(
        input,
        (chunk: string) => {
          process.stdout.write(chunk);
          fullResponse += chunk;
        },
        threadId
      );
      
      console.log('\n─'.repeat(50));
      console.log('✅ Response completed');
      
      // Update session activity
      this.sessionManager.updateSessionActivity();
      
      logger.info(`Processed AI prompt: ${input.substring(0, 100)}...`);
      
    } catch (error) {
      logger.error('Error in AI prompt processing:', error);
      console.error('❌ AI processing failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private displayCommandResult(result: CommandResult): void {
    if (result.success) {
      if (result.message) {
        console.log(result.message);
      }
      if (result.data) {
        console.log(JSON.stringify(result.data, null, 2));
      }
    } else {
      console.error(`❌ Command failed: ${result.message}`);
    }
  }

  private registerCodexForgeCommands(): void {
    // Session management commands
    this.commandParser.registerCommand({
      name: 'session',
      description: 'Enhanced session management with full lifecycle',
      aliases: ['s'],
      parameters: ['new [name]', 'list', 'switch <id>', 'delete <id>', 'current', 'stats'],
      handler: async (args: string[]) => {
        if (args.length === 0) {
          const current = this.sessionManager.getCurrentSession();
          if (current) {
            return {
              success: true,
              message: `\n📝 Current session: ${current.name} (${current.id})\n   Thread: ${current.threadId}\n   Messages: ${current.messageCount}\n   Last activity: ${current.lastActivityAt.toLocaleString()}\n`
            };
          } else {
            return { success: false, message: 'No active session' };
          }
        }

        const action = args[0];
        
        switch (action) {
          case 'new':
            const name = args.slice(1).join(' ') || undefined;
            const session = await this.sessionManager.createSession(name);
            return {
              success: true,
              message: `\n🆕 Created new session: ${session.name} (${session.id})\n   Thread: ${session.threadId}\n`
            };
            
          case 'list':
            const sessions = this.sessionManager.listSessions();
            if (sessions.length === 0) {
              return { success: true, message: '\n📋 No sessions found\n' };
            }
            
            let listText = '\n📋 Sessions:\n';
            sessions.forEach((s, index) => {
              const current = s.id === this.sessionManager.getCurrentSession()?.id ? ' (current)' : '';
              listText += `   ${index + 1}. ${s.name} (${s.id})${current}\n`;
              listText += `      Messages: ${s.messageCount}, Last: ${s.lastActivityAt.toLocaleString()}\n`;
            });
            
            return { success: true, message: listText };
            
          case 'switch':
            if (args.length < 2) {
              return { success: false, message: 'Usage: session switch <id>' };
            }
            const switchSuccess = this.sessionManager.switchSession(args[1]);
            return {
              success: switchSuccess,
              message: switchSuccess ? `\n🔄 Switched to session: ${args[1]}\n` : `Session not found: ${args[1]}`
            };
            
          case 'delete':
            if (args.length < 2) {
              return { success: false, message: 'Usage: session delete <id>' };
            }
            const deleteSuccess = await this.sessionManager.deleteSession(args[1]);
            return {
              success: deleteSuccess,
              message: deleteSuccess ? `\n🗑️ Deleted session: ${args[1]}\n` : `Session not found: ${args[1]}`
            };
            
          case 'stats':
            const stats = this.sessionManager.getSessionStats();
            return {
              success: true,
              message: `\n📊 Session Statistics:\n   Total sessions: ${stats.totalSessions}\n   Current session: ${stats.currentSessionId || 'none'}\n   Total messages: ${stats.totalMessages}\n   Avg messages/session: ${stats.avgMessagesPerSession.toFixed(1)}\n`
            };
            
          default:
            return { success: false, message: `Unknown session action: ${action}` };
        }
      }
    });

    // Agent status command
    this.commandParser.registerCommand({
      name: 'agents',
      description: 'Show registered agents and their status',
      handler: async () => {
        const agents = this.orchestrator.listAgents();
        const healthResults = await this.orchestrator.performHealthChecks();
        
        if (agents.length === 0) {
          return { success: true, message: '\n🤖 No agents registered\n' };
        }
        
        let agentText = '\n🤖 Registered Agents:\n';
        agents.forEach(agent => {
          const health = healthResults.get(agent.id) ? '✅ Healthy' : '❌ Unhealthy';
          agentText += `   ${agent.metadata.name} (${agent.id})\n`;
          agentText += `      Status: ${agent.metadata.status} ${health}\n`;
          agentText += `      Version: ${agent.metadata.version}\n`;
          agentText += `      Requests: ${agent.metadata.performance.totalRequests}\n`;
          agentText += `      Success rate: ${(agent.metadata.performance.successRate * 100).toFixed(1)}%\n`;
          agentText += `      Avg response time: ${agent.metadata.performance.averageResponseTime.toFixed(0)}ms\n\n`;
        });
        
        return { success: true, message: agentText };
      }
    });

    // Plugin management commands
    this.commandParser.registerCommand({
      name: 'plugins',
      description: 'Manage plugins for CodexForge',
      aliases: ['plugin', 'p'],
      parameters: ['list', 'load <path>', 'unload <name>', 'reload <name>', 'info <name>'],
      handler: async (args: string[]) => {
        if (args.length === 0) {
          const plugins = this.pluginLoader.getLoadedPlugins();
          
          if (plugins.length === 0) {
            return { success: true, message: '\n🔌 No plugins loaded\n' };
          }
          
          let pluginText = '\n🔌 Loaded Plugins:\n';
          plugins.forEach((plugin, index) => {
            pluginText += `   ${index + 1}. ${plugin.name} v${plugin.version}\n`;
            pluginText += `      ${plugin.description}\n`;
            if (plugin.author) {
              pluginText += `      Author: ${plugin.author}\n`;
            }
            pluginText += `      Commands: ${plugin.commands?.length || 0}\n`;
            pluginText += `      Agents: ${plugin.agents?.length || 0}\n`;
            pluginText += `      Hooks: ${plugin.hooks?.length || 0}\n\n`;
          });
          
          return { success: true, message: pluginText };
        }

        const action = args[0];
        
        switch (action) {
          case 'list':
            return this.commandParser.executeCommand('plugins');
            
          case 'load':
            if (args.length < 2) {
              return { success: false, message: 'Usage: plugins load <path>' };
            }
            const loadPath = args[1];
            const loadSuccess = await this.pluginLoader.loadPlugin(loadPath);
            return {
              success: loadSuccess,
              message: loadSuccess ? `\n✅ Plugin loaded from: ${loadPath}\n` : `❌ Failed to load plugin from: ${loadPath}`
            };
            
          case 'unload':
            if (args.length < 2) {
              return { success: false, message: 'Usage: plugins unload <name>' };
            }
            const unloadName = args[1];
            const unloadSuccess = await this.pluginLoader.unloadPlugin(unloadName);
            return {
              success: unloadSuccess,
              message: unloadSuccess ? `\n✅ Plugin unloaded: ${unloadName}\n` : `❌ Plugin not found: ${unloadName}`
            };
            
          case 'reload':
            if (args.length < 2) {
              return { success: false, message: 'Usage: plugins reload <name>' };
            }
            const reloadName = args[1];
            const plugin = this.pluginLoader.getPlugin(reloadName);
            if (!plugin) {
              return { success: false, message: `Plugin not found: ${reloadName}` };
            }
            
            // Unload then reload
            await this.pluginLoader.unloadPlugin(reloadName);
            await this.pluginLoader.loadPlugins(); // Reload all plugins
            
            return {
              success: true,
              message: `\n🔄 Plugin reloaded: ${reloadName}\n`
            };
            
          case 'info':
            if (args.length < 2) {
              return { success: false, message: 'Usage: plugins info <name>' };
            }
            const infoName = args[1];
            const infoPlugin = this.pluginLoader.getPlugin(infoName);
            if (!infoPlugin) {
              return { success: false, message: `Plugin not found: ${infoName}` };
            }
            
            let infoText = `\n🔍 Plugin Information: ${infoPlugin.name}\n`;
            infoText += `Version: ${infoPlugin.version}\n`;
            infoText += `Description: ${infoPlugin.description}\n`;
            if (infoPlugin.author) {
              infoText += `Author: ${infoPlugin.author}\n`;
            }
            
            if (infoPlugin.commands) {
              infoText += `\nCommands (${infoPlugin.commands.length}):\n`;
              infoPlugin.commands.forEach(cmd => {
                infoText += `  - ${cmd.name}: ${cmd.description}\n`;
              });
            }
            
            if (infoPlugin.agents) {
              infoText += `\nAgents (${infoPlugin.agents.length}):\n`;
              infoPlugin.agents.forEach(agent => {
                infoText += `  - ${agent.id}: ${agent.metadata.name}\n`;
              });
            }
            
            if (infoPlugin.hooks) {
              infoText += `\nHooks (${infoPlugin.hooks.length}):\n`;
              infoPlugin.hooks.forEach(hook => {
                infoText += `  - ${hook.name} (${hook.type})\n`;
              });
            }
            
            return { success: true, message: infoText };
            
          default:
            return { success: false, message: `Unknown plugin action: ${action}` };
        }
      }
    });
  }
}

// CLI entry point
if (require.main === module) {
  new CodexForge();
}
