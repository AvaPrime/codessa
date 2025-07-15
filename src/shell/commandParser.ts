// src/shell/commandParser.ts

import { Logger } from '../utils/logger';

const logger = new Logger('CommandParser');

export interface Command {
  name: string;
  description: string;
  aliases?: string[];
  parameters?: string[];
  handler: (args: string[]) => Promise<CommandResult>;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  data?: any;
  streaming?: boolean;
}

export class CommandParser {
  private commands: Map<string, Command> = new Map();
  private aliases: Map<string, string> = new Map();

  constructor() {
    this.registerBuiltinCommands();
  }

  registerCommand(command: Command): void {
    this.commands.set(command.name, command);
    
    // Register aliases
    if (command.aliases) {
      command.aliases.forEach(alias => {
        this.aliases.set(alias, command.name);
      });
    }
    
    logger.info(`Registered command: ${command.name}`);
  }

  parseCommand(input: string): { command: string; args: string[] } {
    const parts = input.trim().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);
    
    return { command, args };
  }

  async executeCommand(input: string): Promise<CommandResult> {
    const { command, args } = this.parseCommand(input);
    
    if (!command) {
      return { success: false, message: 'No command provided' };
    }

    // Check if it's an alias
    const commandName = this.aliases.get(command) || command;
    const cmd = this.commands.get(commandName);
    
    if (!cmd) {
      return { 
        success: false, 
        message: `Unknown command: ${command}. Type 'help' for available commands.` 
      };
    }

    try {
      logger.debug(`Executing command: ${commandName} with args: ${args}`);
      return await cmd.handler(args);
    } catch (error) {
      logger.error(`Command execution failed: ${commandName}`, error);
      return { 
        success: false, 
        message: `Command failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  isCommand(input: string): boolean {
    const { command } = this.parseCommand(input);
    const commandName = this.aliases.get(command) || command;
    return this.commands.has(commandName);
  }

  getCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  private registerBuiltinCommands(): void {
    // Help command
    this.registerCommand({
      name: 'help',
      description: 'Show available commands and usage information',
      aliases: ['h', '?'],
      handler: async (args: string[]) => {
        if (args.length > 0) {
          const commandName = this.aliases.get(args[0]) || args[0];
          const cmd = this.commands.get(commandName);
          
          if (cmd) {
            let helpText = `\n📖 ${cmd.name} - ${cmd.description}\n`;
            
            if (cmd.aliases && cmd.aliases.length > 0) {
              helpText += `   Aliases: ${cmd.aliases.join(', ')}\n`;
            }
            
            if (cmd.parameters && cmd.parameters.length > 0) {
              helpText += `   Parameters: ${cmd.parameters.join(', ')}\n`;
            }
            
            return { success: true, message: helpText };
          } else {
            return { success: false, message: `Command not found: ${args[0]}` };
          }
        }

        // Show all commands
        const commands = this.getCommands();
        let helpText = '\n🔥 CodexForge Commands:\n';
        helpText += '═'.repeat(50) + '\n';
        
        commands.forEach(cmd => {
          helpText += `  ${cmd.name.padEnd(15)} - ${cmd.description}\n`;
          if (cmd.aliases && cmd.aliases.length > 0) {
            helpText += `${' '.repeat(17)}(aliases: ${cmd.aliases.join(', ')})\n`;
          }
        });
        
        helpText += '\n💡 Use "help <command>" for detailed information about a specific command.\n';
        
        return { success: true, message: helpText };
      }
    });

    // Clear command
    this.registerCommand({
      name: 'clear',
      description: 'Clear the terminal screen',
      aliases: ['cls'],
      handler: async () => {
        process.stdout.write('\x1B[2J\x1B[0f');
        return { success: true };
      }
    });

    // Status command
    this.registerCommand({
      name: 'status',
      description: 'Show system status and agent information',
      aliases: ['stat', 'info'],
      handler: async () => {
        const status = {
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform
        };
        
        let statusText = '\n🧠 CodexForge Status:\n';
        statusText += '═'.repeat(30) + '\n';
        statusText += `Time: ${status.timestamp}\n`;
        statusText += `Uptime: ${Math.floor(status.uptime)}s\n`;
        statusText += `Memory: ${Math.round(status.memory.heapUsed / 1024 / 1024)}MB\n`;
        statusText += `Node.js: ${status.nodeVersion}\n`;
        statusText += `Platform: ${status.platform}\n`;
        
        return { success: true, message: statusText };
      }
    });

    // History command
    this.registerCommand({
      name: 'history',
      description: 'Show command history',
      aliases: ['hist'],
      handler: async () => {
        // TODO: Implement history tracking
        return { 
          success: true, 
          message: '\n📜 Command history feature coming soon...\n' 
        };
      }
    });

    // Thread commands
    this.registerCommand({
      name: 'thread',
      description: 'Manage conversation threads',
      aliases: ['t'],
      parameters: ['new', 'list', 'switch <id>', 'delete <id>'],
      handler: async (args: string[]) => {
        if (args.length === 0) {
          return { 
            success: false, 
            message: 'Usage: thread <new|list|switch|delete> [id]' 
          };
        }

        const action = args[0];
        
        switch (action) {
          case 'new':
            return { 
              success: true, 
              message: '\n🧵 Creating new conversation thread...\n' 
            };
          case 'list':
            return { 
              success: true, 
              message: '\n📋 Thread list feature coming soon...\n' 
            };
          case 'switch':
            if (args.length < 2) {
              return { success: false, message: 'Usage: thread switch <id>' };
            }
            return { 
              success: true, 
              message: `\n🔄 Switching to thread: ${args[1]}\n` 
            };
          case 'delete':
            if (args.length < 2) {
              return { success: false, message: 'Usage: thread delete <id>' };
            }
            return { 
              success: true, 
              message: `\n🗑️ Deleting thread: ${args[1]}\n` 
            };
          default:
            return { 
              success: false, 
              message: `Unknown thread action: ${action}` 
            };
        }
      }
    });
  }
}
