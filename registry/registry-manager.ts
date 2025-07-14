import { readFile, writeFile } from 'fs/promises';
import path from 'path';

interface Agent {
  name: string;
  archetype: string;
  guild: string;
  capabilities: string[];
  memory_binding: string;
  model_preference: string;
  description: string;
}

interface Guild {
  name: string;
  domain: string;
  archetype: string;
  members: string[];
  description: string;
}

interface AgentRegistry {
  agents: Agent[];
}

interface GuildDefinitions {
  guilds: Guild[];
}

class RegistryManager {
  private registryPath: string;
  private guildPath: string;

  constructor(registryPath: string = './registry/agent_registry.json', guildPath: string = './registry/guild_definitions.json') {
    this.registryPath = registryPath;
    this.guildPath = guildPath;
  }

  async loadRegistry(): Promise<AgentRegistry> {
    try {
      const content = await readFile(this.registryPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load agent registry: ${error.message}`);
    }
  }

  async loadGuilds(): Promise<GuildDefinitions> {
    try {
      const content = await readFile(this.guildPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load guild definitions: ${error.message}`);
    }
  }

  async saveRegistry(registry: AgentRegistry): Promise<void> {
    try {
      await writeFile(this.registryPath, JSON.stringify(registry, null, 2));
    } catch (error) {
      throw new Error(`Failed to save agent registry: ${error.message}`);
    }
  }

  async saveGuilds(guilds: GuildDefinitions): Promise<void> {
    try {
      await writeFile(this.guildPath, JSON.stringify(guilds, null, 2));
    } catch (error) {
      throw new Error(`Failed to save guild definitions: ${error.message}`);
    }
  }

  async listAgents(): Promise<Agent[]> {
    const registry = await this.loadRegistry();
    return registry.agents;
  }

  async getAgent(name: string): Promise<Agent | null> {
    const registry = await this.loadRegistry();
    return registry.agents.find(agent => agent.name === name) || null;
  }

  async registerAgent(agent: Agent): Promise<void> {
    const registry = await this.loadRegistry();
    const existingAgent = registry.agents.find(a => a.name === agent.name);
    
    if (existingAgent) {
      throw new Error(`Agent ${agent.name} is already registered`);
    }

    registry.agents.push(agent);
    await this.saveRegistry(registry);

    // Update guild membership
    await this.addAgentToGuild(agent.name, agent.guild);
  }

  async updateAgent(name: string, updates: Partial<Agent>): Promise<void> {
    const registry = await this.loadRegistry();
    const agentIndex = registry.agents.findIndex(agent => agent.name === name);
    
    if (agentIndex === -1) {
      throw new Error(`Agent ${name} not found`);
    }

    registry.agents[agentIndex] = { ...registry.agents[agentIndex], ...updates };
    await this.saveRegistry(registry);
  }

  async removeAgent(name: string): Promise<void> {
    const registry = await this.loadRegistry();
    const agentIndex = registry.agents.findIndex(agent => agent.name === name);
    
    if (agentIndex === -1) {
      throw new Error(`Agent ${name} not found`);
    }

    const agent = registry.agents[agentIndex];
    registry.agents.splice(agentIndex, 1);
    await this.saveRegistry(registry);

    // Remove from guild
    await this.removeAgentFromGuild(name, agent.guild);
  }

  async listGuilds(): Promise<Guild[]> {
    const guilds = await this.loadGuilds();
    return guilds.guilds;
  }

  async getGuild(name: string): Promise<Guild | null> {
    const guilds = await this.loadGuilds();
    return guilds.guilds.find(guild => guild.name === name) || null;
  }

  async getAgentsByGuild(guildName: string): Promise<Agent[]> {
    const registry = await this.loadRegistry();
    return registry.agents.filter(agent => agent.guild === guildName);
  }

  async getAgentsByArchetype(archetype: string): Promise<Agent[]> {
    const registry = await this.loadRegistry();
    return registry.agents.filter(agent => agent.archetype === archetype);
  }

  async setModelPreference(agentName: string, modelPreference: string): Promise<void> {
    await this.updateAgent(agentName, { model_preference: modelPreference });
  }

  async addAgentToGuild(agentName: string, guildName: string): Promise<void> {
    const guilds = await this.loadGuilds();
    const guild = guilds.guilds.find(g => g.name === guildName);
    
    if (!guild) {
      throw new Error(`Guild ${guildName} not found`);
    }

    if (!guild.members.includes(agentName)) {
      guild.members.push(agentName);
      await this.saveGuilds(guilds);
    }
  }

  async removeAgentFromGuild(agentName: string, guildName: string): Promise<void> {
    const guilds = await this.loadGuilds();
    const guild = guilds.guilds.find(g => g.name === guildName);
    
    if (!guild) {
      return; // Guild doesn't exist, nothing to remove
    }

    const memberIndex = guild.members.indexOf(agentName);
    if (memberIndex > -1) {
      guild.members.splice(memberIndex, 1);
      await this.saveGuilds(guilds);
    }
  }

  async getAgentCapabilities(agentName: string): Promise<string[]> {
    const agent = await this.getAgent(agentName);
    return agent ? agent.capabilities : [];
  }

  async addCapability(agentName: string, capability: string): Promise<void> {
    const agent = await this.getAgent(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    if (!agent.capabilities.includes(capability)) {
      agent.capabilities.push(capability);
      await this.updateAgent(agentName, { capabilities: agent.capabilities });
    }
  }

  async removeCapability(agentName: string, capability: string): Promise<void> {
    const agent = await this.getAgent(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    const capabilityIndex = agent.capabilities.indexOf(capability);
    if (capabilityIndex > -1) {
      agent.capabilities.splice(capabilityIndex, 1);
      await this.updateAgent(agentName, { capabilities: agent.capabilities });
    }
  }
}

export { RegistryManager, Agent, Guild, AgentRegistry, GuildDefinitions };
