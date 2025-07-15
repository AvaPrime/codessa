// src/orchestration/centralOrchestrator.ts

import { AgentRegistry } from './agentRegistry';
import { Logger } from '../utils/logger';

const logger = new Logger('CentralOrchestrator');

export class CentralOrchestrator {
  private _agentRegistry: AgentRegistry;

  constructor() {
    this._agentRegistry = new AgentRegistry();
    logger.info('CentralOrchestrator initialized');
  }

  /**
   * Process a prompt request
   */
  async processPromptRequest(prompt: string, options: { threadId?: string; newThread?: boolean; streaming?: boolean } = {}): Promise<string> {
    const { threadId, newThread, streaming } = options;

    try {
      const geminiAgent = this._agentRegistry.getAgentInstance('gemini');

      if (!geminiAgent) {
        throw new Error('Gemini agent not found or not active');
      }

      // Handle new thread creation if required
      let currentThreadId = threadId;
      if (newThread || !threadId) {
        currentThreadId = await geminiAgent.createConversationThread('New Conversation');
      }

      // Handle streaming vs regular response
      let response: string;
      if (streaming) {
        let fullResponse = '';
        await geminiAgent.generatePromptStreamWithThread(
          prompt,
          (chunk: string) => {
            logger.debug(`Streaming chunk: ${chunk}`);
            fullResponse += chunk;
          },
          currentThreadId
        );
        response = fullResponse;
      } else {
        response = await geminiAgent.sendPromptWithThread(prompt, currentThreadId);
      }

      logger.info(`Prompt processed for thread ${currentThreadId}: ${prompt.substring(0, 100)}...`);

      return response;
    } catch (error) {
      logger.error('Error processing prompt request', error);
      return '[ERROR: Unable to process prompt request]';
    }
  }

  /**
   * Register an agent with the orchestrator
   */
  async registerAgent(
    id: string,
    instance: any,
    metadata: { name: string; description: string; version: string },
    healthCheck: () => Promise<boolean>
  ): Promise<boolean> {
    const fullMetadata = {
      id,
      ...metadata,
      capabilities: [{
    name: 'prompt_generation',
        description: 'Generates responses from input prompts',
        inputTypes: ['string'],
        outputTypes: ['string'],
        streaming: true,
        contextAware: true
      },
      {
        name: 'streaming_prompt_generation',
        description: 'Streams responses from input prompts',
        inputTypes: ['string'],
        outputTypes: ['stream'],
        streaming: true,
        contextAware: true
      }],
      status: 'initializing' as const,
      lastHealthCheck: new Date(),
      performance: {
        averageResponseTime: 0,
        successRate: 1,
        totalRequests: 0
      }
    };

    return await this._agentRegistry.registerAgent(id, instance, fullMetadata, healthCheck);
  }

  /**
   * List all registered agents
   */
  listAgents() {
    return this._agentRegistry.listAgents();
  }

  /**
   * Perform health checks
   */
  performHealthChecks() {
    return this._agentRegistry.performHealthChecks();
  }

  /**
   * Get the agent registry instance
   */
  get agentRegistry(): AgentRegistry {
    return this._agentRegistry;
  }
}

