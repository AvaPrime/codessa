// src/orchestration/centralOrchestrator.ts

import { AgentRegistry } from './agentRegistry';
import { Logger } from '../utils/logger';
import { mirror } from '../mirror';

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
  async processPromptRequest(
    prompt: string,
    options: {
      threadId?: string;
      newThread?: boolean;
      streaming?: boolean;
    } = {},
  ): Promise<string> {
    const { threadId, newThread, streaming } = options;

    // Mirror Engine: Log task planning
    mirror.logEvent('task:planned', 'centralOrchestrator', {
      prompt: prompt.substring(0, 100) + '...',
      options,
      timestamp: Date.now(),
    });

    try {
      const geminiAgent = this._agentRegistry.getAgentInstance('gemini');

      if (!geminiAgent) {
        throw new Error('Gemini agent not found or not active');
      }

      // Handle new thread creation if required
      let currentThreadId = threadId;
      if (newThread || !threadId) {
        currentThreadId =
          await geminiAgent.createConversationThread('New Conversation');
      }

      // Mirror Engine: Log agent delegation
      mirror.logEvent('agent:delegated', 'centralOrchestrator', {
        agent: 'gemini',
        threadId: currentThreadId,
        streaming,
        prompt: prompt.substring(0, 50) + '...',
      });

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
          currentThreadId,
        );
        response = fullResponse;
      } else {
        response = await geminiAgent.sendPromptWithThread(
          prompt,
          currentThreadId,
        );
      }

      // Mirror Engine: Log task execution
      mirror.logEvent('task:executed', 'centralOrchestrator', {
        success: true,
        threadId: currentThreadId,
        responseLength: response.length,
        agent: 'gemini',
      });

      // Mirror Engine: Log agent response
      mirror.logEvent('agent:responded', 'gemini', {
        threadId: currentThreadId,
        responseLength: response.length,
        streaming,
      });

      logger.info(
        `Prompt processed for thread ${currentThreadId}: ${prompt.substring(0, 100)}...`,
      );

      return response;
    } catch (error) {
      // Mirror Engine: Log error
      mirror.logEvent('error:exception', 'centralOrchestrator', {
        error: error.message,
        prompt: prompt.substring(0, 50) + '...',
        options,
      });
      
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
    healthCheck: () => Promise<boolean>,
  ): Promise<boolean> {
    const fullMetadata = {
      id,
      ...metadata,
      capabilities: [
        {
          name: 'prompt_generation',
          description: 'Generates responses from input prompts',
          inputTypes: ['string'],
          outputTypes: ['string'],
          streaming: true,
          contextAware: true,
        },
        {
          name: 'streaming_prompt_generation',
          description: 'Streams responses from input prompts',
          inputTypes: ['string'],
          outputTypes: ['stream'],
          streaming: true,
          contextAware: true,
        },
      ],
      status: 'initializing' as const,
      lastHealthCheck: new Date(),
      performance: {
        averageResponseTime: 0,
        successRate: 1,
        totalRequests: 0,
      },
    };

    return await this._agentRegistry.registerAgent(
      id,
      instance,
      fullMetadata,
      healthCheck,
    );
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
