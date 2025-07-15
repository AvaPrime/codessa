// src/agents/geminiPromptAgent.ts
import { GoogleAuth } from 'google-auth-library';
import { VertexAI, HarmBlockThreshold, HarmCategory } from '@google-cloud/vertexai';
import { Logger } from '../utils/logger';
import { ConversationThreadManager } from '../memory/conversationThreadManager';

const logger = new Logger('GeminiPromptAgent');

export interface GeminiConfig {
  projectId: string;
  location?: string;
  model?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export class GeminiPromptAgent {
  private vertexAI: VertexAI;
  private config: GeminiConfig;
  private conversationManager: ConversationThreadManager;

  constructor(config: GeminiConfig) {
    this.config = {
      location: 'us-central1',
      model: 'gemini-1.5-pro-latest',
      ...config
    };

    this.vertexAI = new VertexAI({ 
      project: this.config.projectId, 
      location: this.config.location
    });
    
    // Initialize conversation thread manager
    this.conversationManager = new ConversationThreadManager(`${this.config.projectId}-gemini-node`);
    
    logger.info(`GeminiPromptAgent initialized for project: ${this.config.projectId}`);
  }

  async sendPrompt(prompt: string, context: string[] = []): Promise<string> {
    try {
      const model = this.vertexAI.getGenerativeModel({
        model: this.config.model!,
        safetySettings: [
          { 
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, 
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE 
          },
          { 
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, 
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE 
          },
          { 
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, 
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE 
          },
          { 
            category: HarmCategory.HARM_CATEGORY_HARASSMENT, 
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE 
          }
        ],
      });

      // Build chat history from context
      const history: ChatMessage[] = context.map((c, index) => ({
        role: index % 2 === 0 ? 'user' : 'model',
        parts: [{ text: c }]
      }));

      const chat = model.startChat({ history });

      logger.info(`Sending prompt to Gemini: "${prompt.substring(0, 100)}..."`);
      const result = await chat.sendMessage(prompt);
      const response = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!response) {
        logger.warn('No response received from Gemini');
        return '[No response received]';
      }

      logger.info('Gemini response received successfully');
      return response;
    } catch (error) {
      logger.error('Error in GeminiPromptAgent.sendPrompt', error);
      return '[ERROR: Unable to retrieve response]';
    }
  }

async generatePromptStream(prompt: string, onChunk: (chunk: string) => void, context: string[] = []): Promise<void> {
    try {
      const model = this.vertexAI.getGenerativeModel({
        model: this.config.model!,
        safetySettings: [
          { 
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, 
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE 
          },
          { 
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, 
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE 
          },
          { 
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, 
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE 
          },
          { 
            category: HarmCategory.HARM_CATEGORY_HARASSMENT, 
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE 
          }
        ],
      });

      // Build chat history from context
      const history: ChatMessage[] = context.map((c, index) => ({
        role: index % 2 === 0 ? 'user' : 'model',
        parts: [{ text: c }]
      }));

      const chat = model.startChat({ history });

      logger.info(`Sending streaming prompt to Gemini: "${prompt.substring(0, 100)}..."`);
      const streamingResult = await chat.sendMessageStream(prompt);

      // Process the stream and call onChunk for each piece
      let fullResponse = '';
      for await (const chunk of streamingResult.stream) {
        const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
        if (chunkText) {
          logger.debug(`Received chunk: ${chunkText}`);
          fullResponse += chunkText;
          onChunk(chunkText);
        }
      }
      
      logger.info('Streaming response completed');
      logger.debug(`Full response: ${fullResponse}`);
    } catch (error) {
      logger.error('Error in GeminiPromptAgent.generatePromptStream', error);
      throw error;
    }
  }

  onStreamChunk(callback: (chunk: string) => void): (chunk: string) => void {
    return (chunk: string) => {
      callback(chunk);
    };
  }

  // === Threaded Conversation Methods ===

  /**
   * Send a prompt with conversation thread context
   */
  async sendPromptWithThread(prompt: string, threadId?: string, contextLimit: number = 10): Promise<string> {
    try {
      let context: string[] = [];
      
      // If threadId is provided, fetch conversation history
      if (threadId) {
        context = await this.conversationManager.getRecentContext(threadId, contextLimit);
        logger.debug(`Retrieved ${context.length} context messages for thread ${threadId}`);
        
        // Add user message to thread
        await this.conversationManager.addMessage(threadId, 'user', prompt);
      }
      
      // Send prompt with context
      const response = await this.sendPrompt(prompt, context);
      
      // Add assistant response to thread if threadId provided
      if (threadId && response !== '[ERROR: Unable to retrieve response]') {
        await this.conversationManager.addMessage(threadId, 'assistant', response);
      }
      
      return response;
    } catch (error) {
      logger.error('Error in GeminiPromptAgent.sendPromptWithThread', error);
      return '[ERROR: Unable to retrieve response with thread]';
    }
  }

  /**
   * Stream a prompt with conversation thread context
   */
  async generatePromptStreamWithThread(
    prompt: string,
    onChunk: (chunk: string) => void,
    threadId?: string,
    contextLimit: number = 10
  ): Promise<void> {
    try {
      let context: string[] = [];
      
      // If threadId is provided, fetch conversation history
      if (threadId) {
        context = await this.conversationManager.getRecentContext(threadId, contextLimit);
        logger.debug(`Retrieved ${context.length} context messages for thread ${threadId}`);
        
        // Add user message to thread
        await this.conversationManager.addMessage(threadId, 'user', prompt);
      }
      
      // Stream prompt with context
      let fullResponse = '';
      const wrappedOnChunk = (chunk: string) => {
        fullResponse += chunk;
        onChunk(chunk);
      };
      
      await this.generatePromptStream(prompt, wrappedOnChunk, context);
      
      // Add assistant response to thread if threadId provided
      if (threadId && fullResponse) {
        await this.conversationManager.addMessage(threadId, 'assistant', fullResponse);
      }
      
    } catch (error) {
      logger.error('Error in GeminiPromptAgent.generatePromptStreamWithThread', error);
      throw error;
    }
  }

  /**
   * Create a new conversation thread
   */
  async createConversationThread(title?: string): Promise<string> {
    return await this.conversationManager.createThread(title);
  }

  /**
   * Get conversation thread history
   */
  async getConversationHistory(threadId: string, limit?: number) {
    return await this.conversationManager.getThreadHistory(threadId, limit);
  }

  /**
   * List all conversation threads
   */
  async listConversationThreads() {
    return await this.conversationManager.listThreads();
  }

  /**
   * Delete a conversation thread
   */
  async deleteConversationThread(threadId: string): Promise<boolean> {
    return await this.conversationManager.deleteThread(threadId);
  }

  /**
   * Get conversation and memory statistics
   */
  getConversationStats() {
    return this.conversationManager.getMemoryStats();
  }

  async testConnection(): Promise<boolean> {
    try {
      const testResponse = await this.sendPrompt('Hello, can you confirm you are working?');
      return testResponse !== '[ERROR: Unable to retrieve response]';
    } catch (error) {
      logger.error('Connection test failed', error);
      return false;
    }
  }
}
