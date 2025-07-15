// src/shell/pluginLoaderV2.ts
// Enhanced plugin loader with improved hook management and streamlined structure

import { readdirSync, statSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { Command, CommandParser } from './commandParser';
import { AgentRegistry } from '../orchestration/agentRegistry';
import { Logger } from '../utils/logger';

const logger = new Logger('PluginLoader');

export interface PluginAgent {
  name: string;
  description: string;
  run: (input: any, context: any) => Promise<any> | any;
}

export interface PluginDescriptor {
  name: string;
  version: string;
  description?: string;
  author?: string;
  commands?: Command[];
  agents?: PluginAgent[];
  hooks?: {
    'pre-command'?: (input: string) => Promise<string> | string;
    'post-command'?: (input: string, output: any) => Promise<void> | void;
    'pre-execution'?: (commandName: string, args: string[]) => Promise<void> | void;
    'post-execution'?: (commandName: string, result: any) => Promise<void> | void;
  };
  initialize?: (commandParser: CommandParser, agentRegistry: AgentRegistry) => Promise<void> | void;
  shutdown?: () => Promise<void> | void;
  _filePath?: string; // Internal: for reload/unload tracking
}

export class PluginLoader {
  private plugins: Map<string, PluginDescriptor> = new Map();
  private commands: Map<string, Command> = new Map();
  private agents: Map<string, PluginAgent> = new Map();
  private hooks: {
    'pre-command': Array<(input: string) => Promise<string> | string>;
    'post-command': Array<(input: string, output: any) => Promise<void> | void>;
    'pre-execution': Array<(commandName: string, args: string[]) => Promise<void> | void>;
    'post-execution': Array<(commandName: string, result: any) => Promise<void> | void>;
  } = {
    'pre-command': [],
    'post-command': [],
    'pre-execution': [],
    'post-execution': [],
  };

  constructor(
    private commandParser: CommandParser,
    private agentRegistry: AgentRegistry,
    private pluginDir: string = join(__dirname, '../../plugins')
  ) {}

  /**
   * Discover and load all plugins from the plugins directory
   */
  async loadPlugins(): Promise<void> {
    if (!existsSync(this.pluginDir)) {
      logger.warn(`Plugin directory not found: ${this.pluginDir}`);
      return;
    }

    const files = readdirSync(this.pluginDir);
    const pluginFiles = files.filter(file => {
      const ext = file.split('.').pop();
      return ext === 'js' || ext === 'ts';
    });

    for (const file of pluginFiles) {
      const filePath = join(this.pluginDir, file);
      try {
        await this.loadPlugin(filePath);
      } catch (error) {
        logger.error(`Failed to load plugin ${file}:`, error);
      }
    }

    logger.info(`Loaded ${this.plugins.size} plugins from ${this.pluginDir}`);
  }

  /**
   * Load a plugin from file path
   */
  async loadPlugin(filePath: string): Promise<boolean> {
    try {
      const resolvedPath = resolve(filePath);
      
      // Clear require cache for hot reloading
      delete require.cache[require.resolve(resolvedPath)];
      
      const pluginModule = require(resolvedPath);
      const plugin: PluginDescriptor = pluginModule.default || pluginModule.plugin || pluginModule;
      
      if (!this.validatePlugin(plugin)) {
        throw new Error('Invalid plugin format: missing required fields');
      }

      if (this.plugins.has(plugin.name)) {
        throw new Error(`Plugin "${plugin.name}" already loaded`);
      }

      plugin._filePath = resolvedPath;
      this.plugins.set(plugin.name, plugin);

      // Initialize plugin
      if (plugin.initialize) {
        await plugin.initialize(this.commandParser, this.agentRegistry);
      }

      // Register commands
      if (plugin.commands) {
        for (const cmd of plugin.commands) {
          if (this.commands.has(cmd.name)) {
            logger.warn(`Command "${cmd.name}" from plugin "${plugin.name}" conflicts with existing command. Skipped.`);
            continue;
          }
          this.commands.set(cmd.name, cmd);
          this.commandParser.registerCommand(cmd);
          logger.debug(`Registered command: ${cmd.name} from plugin ${plugin.name}`);
        }
      }

      // Register agents
      if (plugin.agents) {
        for (const agent of plugin.agents) {
          if (this.agents.has(agent.name)) {
            logger.warn(`Agent "${agent.name}" from plugin "${plugin.name}" conflicts with existing agent. Skipped.`);
            continue;
          }
          this.agents.set(agent.name, agent);
          logger.debug(`Registered agent: ${agent.name} from plugin ${plugin.name}`);
        }
      }

      // Register hooks
      if (plugin.hooks) {
        for (const hookName of Object.keys(plugin.hooks) as (keyof PluginDescriptor['hooks'])[]) {
          const hookFn = plugin.hooks[hookName];
          if (hookFn) {
            this.hooks[hookName].push(hookFn);
            logger.debug(`Registered hook: ${hookName} from plugin ${plugin.name}`);
          }
        }
      }

      logger.info(`Plugin "${plugin.name}" v${plugin.version} loaded successfully`);
      return true;
      
    } catch (error) {
      logger.error(`Failed to load plugin ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Unload a plugin by name
   */
  async unloadPlugin(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      logger.warn(`Plugin "${name}" is not loaded`);
      return false;
    }

    try {
      // Call shutdown hook if available
      if (plugin.shutdown) {
        await plugin.shutdown();
      }

      // Remove commands
      if (plugin.commands) {
        for (const cmd of plugin.commands) {
          this.commands.delete(cmd.name);
          // TODO: Remove from CommandParser (would need unregisterCommand method)
        }
      }

      // Remove agents
      if (plugin.agents) {
        for (const agent of plugin.agents) {
          this.agents.delete(agent.name);
          // TODO: Remove from AgentRegistry (would need unregisterAgent method)
        }
      }

      // Remove hooks
      if (plugin.hooks) {
        for (const hookName of Object.keys(plugin.hooks) as (keyof PluginDescriptor['hooks'])[]) {
          const hookFn = plugin.hooks[hookName];
          if (hookFn) {
            this.hooks[hookName] = this.hooks[hookName].filter(fn => fn !== hookFn);
          }
        }
      }

      this.plugins.delete(name);
      logger.info(`Plugin "${name}" unloaded successfully`);
      return true;
      
    } catch (error) {
      logger.error(`Failed to unload plugin "${name}":`, error);
      return false;
    }
  }

  /**
   * Reload a plugin by name
   */
  async reloadPlugin(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      logger.warn(`Plugin "${name}" is not loaded`);
      return false;
    }

    if (!plugin._filePath) {
      logger.error(`Plugin "${name}" missing file path for reload`);
      return false;
    }

    const filePath = plugin._filePath;
    
    try {
      await this.unloadPlugin(name);
      const success = await this.loadPlugin(filePath);
      
      if (success) {
        logger.info(`Plugin "${name}" reloaded successfully`);
      }
      
      return success;
      
    } catch (error) {
      logger.error(`Failed to reload plugin "${name}":`, error);
      return false;
    }
  }

  /**
   * Execute lifecycle hooks
   */
  async runHook<T extends keyof PluginDescriptor['hooks']>(
    hookName: T,
    ...args: Parameters<NonNullable<PluginDescriptor['hooks'][T]>>
  ): Promise<any> {
    const hooks = this.hooks[hookName];
    
    for (const hookFn of hooks) {
      try {
        const result = await hookFn(...args);
        // For pre-command hooks, allow input modification
        if (hookName === 'pre-command' && result !== undefined) {
          args[0] = result as any;
        }
      } catch (error) {
        logger.error(`Hook ${hookName} failed:`, error);
      }
    }
    
    // Return modified input for pre-command hooks
    if (hookName === 'pre-command') {
      return args[0];
    }
  }

  /**
   * Get command by name
   */
  getCommand(name: string): Command | undefined {
    return this.commands.get(name);
  }

  /**
   * Get agent by name
   */
  getAgent(name: string): PluginAgent | undefined {
    return this.agents.get(name);
  }

  /**
   * List all loaded plugins
   */
  getLoadedPlugins(): PluginDescriptor[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): PluginDescriptor | undefined {
    return this.plugins.get(name);
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: any): plugin is PluginDescriptor {
    if (!plugin || typeof plugin !== 'object') {
      logger.error('Plugin must be an object');
      return false;
    }

    if (!plugin.name || typeof plugin.name !== 'string') {
      logger.error('Plugin missing required name property');
      return false;
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      logger.error('Plugin missing required version property');
      return false;
    }

    return true;
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    return {
      totalPlugins: this.plugins.size,
      totalCommands: this.commands.size,
      totalAgents: this.agents.size,
      totalHooks: Object.values(this.hooks).reduce((sum, hooks) => sum + hooks.length, 0)
    };
  }
}
