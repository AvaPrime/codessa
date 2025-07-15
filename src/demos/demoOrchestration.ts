// src/demos/demoOrchestration.ts

import { CentralOrchestrator } from '../orchestration/centralOrchestrator';
import { GeminiPromptAgent } from '../agents/geminiPromptAgent';
import { Logger } from '../utils/logger';
import * as readline from 'readline';

const logger = new Logger('DemoOrchestration');

interface DemoConfig {
  projectId: string;
  location?: string;
  model?: string;
}

class OrchestrationDemo {
  private orchestrator: CentralOrchestrator;
  private geminiAgent: GeminiPromptAgent;
  private config: DemoConfig;
  private currentThreadId?: string;

  constructor(config: DemoConfig) {
    this.config = config;
    this.orchestrator = new CentralOrchestrator();
    this.geminiAgent = new GeminiPromptAgent({
      projectId: config.projectId,
      location: config.location,
      model: config.model
    });
  }

  async initialize(): Promise<void> {
    try {
      logger.info('🚀 Initializing Codessa Central Orchestration Demo...');
      
      // Register GeminiPromptAgent with orchestrator
      const registrationSuccess = await this.orchestrator.registerAgent(
        'gemini',
        this.geminiAgent,
        {
          name: 'Gemini Prompt Agent',
          description: 'Google Gemini AI agent with streaming and context capabilities',
          version: '1.0.0'
        },
        () => this.geminiAgent.testConnection()
      );

      if (!registrationSuccess) {
        throw new Error('Failed to register Gemini agent');
      }

      // Create initial conversation thread
      this.currentThreadId = await this.geminiAgent.createConversationThread('Codessa CLI Demo');
      
      logger.info('✅ Orchestration system initialized successfully');
      logger.info(`🧵 Thread ID: ${this.currentThreadId}`);
      
    } catch (error) {
      logger.error('❌ Failed to initialize orchestration demo:', error);
      throw error;
    }
  }

  async processPrompt(prompt: string, options: { streaming?: boolean; newThread?: boolean } = {}): Promise<string> {
    const startTime = Date.now();
    
    try {
      logger.info(`📝 Processing prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`);
      
      if (options.streaming) {
        return await this.processStreamingPrompt(prompt, options);
      } else {
        return await this.processRegularPrompt(prompt, options);
      }
      
    } catch (error) {
      logger.error('❌ Error processing prompt:', error);
      return '[ERROR: Unable to process prompt]';
    } finally {
      const duration = Date.now() - startTime;
      logger.info(`⏱️ Processing completed in ${duration}ms`);
    }
  }

  private async processRegularPrompt(prompt: string, options: { newThread?: boolean }): Promise<string> {
    const threadId = options.newThread ? undefined : this.currentThreadId;
    
    const response = await this.orchestrator.processPromptRequest(prompt, {
      threadId,
      newThread: options.newThread
    });

    // Update current thread ID if new thread was created
    if (options.newThread || !this.currentThreadId) {
      const threads = await this.geminiAgent.listConversationThreads();
      this.currentThreadId = threads[0]?.id || this.currentThreadId;
    }

    return response;
  }

  private async processStreamingPrompt(prompt: string, options: { newThread?: boolean }): Promise<string> {
    const threadId = options.newThread ? undefined : this.currentThreadId;
    let fullResponse = '';
    
    console.log('\n🔄 Streaming response:');
    console.log('─'.repeat(50));
    
    try {
      await this.geminiAgent.generatePromptStreamWithThread(
        prompt,
        (chunk: string) => {
          process.stdout.write(chunk);
          fullResponse += chunk;
        },
        threadId
      );
      
      console.log('\n─'.repeat(50));
      
      // Update current thread ID if new thread was created
      if (options.newThread || !this.currentThreadId) {
        const threads = await this.geminiAgent.listConversationThreads();
        this.currentThreadId = threads[0]?.id || this.currentThreadId;
      }
      
      return fullResponse;
      
    } catch (error) {
      logger.error('❌ Streaming error:', error);
      return '[ERROR: Streaming failed]';
    }
  }

  async getStats(): Promise<any> {
    const agents = this.orchestrator.listAgents();
    const threadStats = this.geminiAgent.getConversationStats();
    
    return {
      orchestrator: {
        registeredAgents: agents.length,
        activeAgents: agents.filter(a => a.metadata.status === 'active').length
      },
      geminiAgent: {
        currentThreadId: this.currentThreadId,
        conversationStats: threadStats
      }
    };
  }

  async startInteractiveSession(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n🎯 Codessa Interactive Orchestration Demo');
    console.log('─'.repeat(50));
    console.log('Commands:');
    console.log('  /stream <prompt>     - Stream response');
    console.log('  /new <prompt>        - Start new thread');
    console.log('  /stats               - Show statistics');
    console.log('  /threads             - List conversation threads');
    console.log('  /quit                - Exit demo');
    console.log('─'.repeat(50));

    const askQuestion = (): void => {
      rl.question('\n🤖 Codessa> ', async (input) => {
        const trimmedInput = input.trim();
        
        if (trimmedInput === '/quit') {
          console.log('\n👋 Goodbye!');
          rl.close();
          return;
        }

        if (trimmedInput === '/stats') {
          const stats = await this.getStats();
          console.log('\n📊 System Statistics:');
          console.log(JSON.stringify(stats, null, 2));
          askQuestion();
          return;
        }

        if (trimmedInput === '/threads') {
          const threads = await this.geminiAgent.listConversationThreads();
          console.log('\n🧵 Conversation Threads:');
          threads.forEach((thread, index) => {
            console.log(`  ${index + 1}. ${thread.id} - ${thread.title || 'Untitled'}`);
          });
          askQuestion();
          return;
        }

        if (trimmedInput.startsWith('/stream ')) {
          const prompt = trimmedInput.substring(8);
          await this.processPrompt(prompt, { streaming: true });
          askQuestion();
          return;
        }

        if (trimmedInput.startsWith('/new ')) {
          const prompt = trimmedInput.substring(5);
          console.log('\n🆕 Starting new conversation thread...');
          const response = await this.processPrompt(prompt, { newThread: true });
          console.log(`\n📝 Response: ${response}`);
          askQuestion();
          return;
        }

        if (trimmedInput.length > 0) {
          const response = await this.processPrompt(trimmedInput);
          console.log(`\n📝 Response: ${response}`);
        }

        askQuestion();
      });
    };

    askQuestion();
  }
}

// CLI Entry Point
async function main(): Promise<void> {
  const config: DemoConfig = {
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id',
    location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro-latest'
  };

  const demo = new OrchestrationDemo(config);

  try {
    await demo.initialize();
    
    const prompt = process.argv[2];
    
    if (prompt) {
      // Single prompt mode
      console.log('\n🎯 Codessa Single Prompt Demo');
      console.log('─'.repeat(50));
      
      const isStreaming = process.argv.includes('--stream');
      const isNewThread = process.argv.includes('--new');
      
      const startTime = Date.now();
      const response = await demo.processPrompt(prompt, { 
        streaming: isStreaming, 
        newThread: isNewThread 
      });
      const endTime = Date.now();
      
      if (!isStreaming) {
        console.log(`\n📝 Response: ${response}`);
      }
      
      console.log(`\n📊 Summary:`);
      console.log(`   ⏱️ Duration: ${endTime - startTime}ms`);
      console.log(`   🧵 Thread ID: ${(await demo.getStats()).geminiAgent.currentThreadId}`);
      console.log(`   📊 Tokens: [Generated by Gemini]`);
      
    } else {
      // Interactive mode
      await demo.startInteractiveSession();
    }
    
  } catch (error) {
    logger.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { OrchestrationDemo };
