// src/shell/pluginLoader.ts

import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { Command, CommandParser } from './commandParser';
import { AgentRegistry } from '../orchestration/agentRegistry';
import { Logger } from '../utils/logger';

const logger = new Logger('PluginLoader');

export interface PluginHook {
  name: string;
  type: 'pre-command' | 'post-command' | 'pre-execution' | 'post-execution';
  handler: (context: any) => Promise<void> | void;
}

export interface PluginDescriptor {
  name: string;
  version: string;
  description: string;
  author?: string;
  commands?: Command[];
  agents?: any[];
  hooks?: {
    'pre-command'?: (input: string) => Promise<string> | string;
    'post-command'?: (input: string, output: any) => Promise<void> | void;
    'pre-execution'?: (commandName: string, args: string[]) => Promise<void> | void;
    'post-execution'?: (commandName: string, result: any) => Promise<void> | void;
  };
  initialize?: (commandParser: CommandParser, agentRegistry: AgentRegistry) => void;
  shutdown?: () => void;
  _filePath?: string; // for reload/unload tracking
}

export interface PluginContext {
  commandParser: CommandParser;
  agentRegistry: AgentRegistry;
  input?: string;
  output?: any;
  error?: Error;
}

export class PluginLoader {
  private pluginDir: string;
  private commandParser: CommandParser;
  private agentRegistry: AgentRegistry;
  private loadedPlugins: Map<string, PluginDescriptor> = new Map();
  private hooks: Map<string, PluginHook[]> = new Map();

  constructor(commandParser: CommandParser, agentRegistry: AgentRegistry) {
    this.pluginDir = join(__dirname, '../../plugins');
    this.commandParser = commandParser;
    this.agentRegistry = agentRegistry;
    
    // Initialize hook registry
    this.hooks.set('pre-command', []);
    this.hooks.set('post-command', []);
    this.hooks.set('pre-execution', []);
    this.hooks.set('post-execution', []);
  }

  /**
   * Load all plugins from the plugins directory
   */
  async loadPlugins(): Promise<void> {
    if (!existsSync(this.pluginDir)) {
      logger.warn(`Plugin directory not found: ${this.pluginDir}`);
      return;
    }

    const pluginPaths = this.discoverPlugins();
    
    for (const pluginPath of pluginPaths) {
      try {
        await this.loadPlugin(pluginPath);
      } catch (error) {
        logger.error(`Failed to load plugin at ${pluginPath}:`, error);
      }
    }

    logger.info(`Loaded ${this.loadedPlugins.size} plugins from ${this.pluginDir}`);
  }

  /**
   * Load a specific plugin
   */
  async loadPlugin(pluginPath: string): Promise<boolean> {
    try {
      // Clear require cache for hot reloading
      delete require.cache[require.resolve(pluginPath)];
      
      const pluginModule = require(pluginPath);
      const plugin: PluginDescriptor = pluginModule.default || pluginModule;
      
      if (!this.validatePlugin(plugin)) {
        logger.error(`Invalid plugin structure in ${pluginPath}`);
        return false;
      }

      // Register plugin components
      await this.registerPlugin(plugin);
      
      this.loadedPlugins.set(plugin.name, plugin);
      logger.info(`Successfully loaded plugin: ${plugin.name} v${plugin.version}`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to load plugin ${pluginPath}:`, error);
      return false;
    }
  }

  /**
   * Unload a plugin by name
   */
  async unloadPlugin(pluginName: string): Promise<boolean> {
    const plugin = this.loadedPlugins.get(pluginName);
    if (!plugin) {
      logger.warn(`Plugin not found: ${pluginName}`);
      return false;
    }

    try {
      // Call shutdown hook if available
      if (plugin.shutdown) {
        await plugin.shutdown();
      }

      // Remove hooks
      if (plugin.hooks) {
        for (const hook of plugin.hooks) {
          const hookList = this.hooks.get(hook.type) || [];
          const index = hookList.findIndex(h => h.name === hook.name);
          if (index !== -1) {
            hookList.splice(index, 1);
          }
        }
      }

      // TODO: Remove commands and agents (would need CommandParser/AgentRegistry support)
      
      this.loadedPlugins.delete(pluginName);
      logger.info(`Unloaded plugin: ${pluginName}`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to unload plugin ${pluginName}:`, error);
      return false;
    }
  }

  /**
   * Execute lifecycle hooks
   */
  async executeHooks(type: string, context: PluginContext): Promise<void> {
    const hooks = this.hooks.get(type) || [];
    
    for (const hook of hooks) {
      try {
        await hook.handler(context);
      } catch (error) {
        logger.error(`Hook ${hook.name} (${type}) failed:`, error);
      }
    }
  }

  /**
   * Get loaded plugins
   */
  getLoadedPlugins(): PluginDescriptor[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): PluginDescriptor | undefined {
    return this.loadedPlugins.get(name);
  }

  /**
   * Discover plugin files
   */
  private discoverPlugins(): string[] {
    if (!statSync(this.pluginDir).isDirectory()) {
      return [];
    }

    return readdirSync(this.pluginDir)
      .filter(name => name.endsWith('.js') || name.endsWith('.ts'))
      .map(name => join(this.pluginDir, name));
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: any): boolean {
    if (!plugin.name || typeof plugin.name !== 'string') {
      logger.error('Plugin missing required name property');
      return false;
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      logger.error('Plugin missing required version property');
      return false;
    }

    if (!plugin.description || typeof plugin.description !== 'string') {
      logger.error('Plugin missing required description property');
      return false;
    }

    return true;
  }

  /**
   * Register plugin components
   */
  private async registerPlugin(plugin: PluginDescriptor): Promise<void> {
    // Register commands
    if (plugin.commands) {
      for (const command of plugin.commands) {
        this.commandParser.registerCommand(command);
        logger.debug(`Registered command: ${command.name} from plugin ${plugin.name}`);
      }
    }

    // Register agents
    if (plugin.agents) {
      for (const agent of plugin.agents) {
        await this.agentRegistry.registerAgent(
          agent.id,
          agent.instance,
          agent.metadata,
          agent.healthCheck
        );
        logger.debug(`Registered agent: ${agent.id} from plugin ${plugin.name}`);
      }
    }

    // Register hooks
    if (plugin.hooks) {
      for (const hook of plugin.hooks) {
        const hookList = this.hooks.get(hook.type) || [];
        hookList.push(hook);
        this.hooks.set(hook.type, hookList);
        logger.debug(`Registered hook: ${hook.name} (${hook.type}) from plugin ${plugin.name}`);
      }
    }

    // Call initialize function if available
    if (plugin.initialize) {
      await plugin.initialize(this.commandParser, this.agentRegistry);
    }
  }
}

