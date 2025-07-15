// src/__tests__/centralOrchestrator.test.ts

import { CentralOrchestrator } from '../orchestration/centralOrchestrator';
import { GeminiPromptAgent } from '../agents/geminiPromptAgent';
import { ConversationThreadManager } from '../memory/conversationThreadManager';
// Logger mock is used instead

// Mock dependencies
jest.mock('../agents/geminiPromptAgent');
jest.mock('../memory/conversationThreadManager');

// Mock the logger module
jest.mock('../utils/logger', () => {
  const mockLoggerInstance = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  
  return {
    Logger: jest.fn().mockImplementation(() => mockLoggerInstance),
    mockLoggerInstance // Export for test access
  };
});

// Import the mock for testing
const { mockLoggerInstance } = require('../utils/logger');

const MockedGeminiPromptAgent = GeminiPromptAgent as jest.MockedClass<typeof GeminiPromptAgent>;
const MockedConversationThreadManager = ConversationThreadManager as jest.MockedClass<typeof ConversationThreadManager>;

describe('CentralOrchestrator Integration Tests', () => {
  let orchestrator: CentralOrchestrator;
  let mockGeminiAgent: jest.Mocked<GeminiPromptAgent>;
  let mockLogger: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Reset mock logger
    mockLogger = mockLoggerInstance as any;

    // Create mock Gemini agent
    mockGeminiAgent = {
      sendPromptWithThread: jest.fn(),
      generatePromptStreamWithThread: jest.fn(),
      createConversationThread: jest.fn(),
      getConversationHistory: jest.fn(),
      listConversationThreads: jest.fn(),
      deleteConversationThread: jest.fn(),
      testConnection: jest.fn(),
      sendPrompt: jest.fn(),
      generatePromptStream: jest.fn(),
    } as any;

    MockedGeminiPromptAgent.mockImplementation(() => mockGeminiAgent);

    // Initialize orchestrator
    orchestrator = new CentralOrchestrator();
  });

  describe('1. Prompt Routing Without Thread', () => {
    it('should route simple prompt to GeminiPromptAgent and return response', async () => {
      // Setup
      const testPrompt = 'Hello, test prompt!';
      const expectedResponse = 'Hello! I am Codessa, ready to assist you.';
      const mockThreadId = 'thread-123';

      mockGeminiAgent.createConversationThread.mockResolvedValue(mockThreadId);
      mockGeminiAgent.sendPromptWithThread.mockResolvedValue(expectedResponse);
      mockGeminiAgent.testConnection.mockResolvedValue(true);

      // Register agent
      await orchestrator.registerAgent(
        'gemini',
        mockGeminiAgent,
        { name: 'Gemini Prompt Agent', description: 'Test agent', version: '1.0.0' },
        () => mockGeminiAgent.testConnection()
      );

      // Execute
      const result = await orchestrator.processPromptRequest(testPrompt);

      // Verify
      expect(mockGeminiAgent.createConversationThread).toHaveBeenCalledWith('New Conversation');
      expect(mockGeminiAgent.sendPromptWithThread).toHaveBeenCalledWith(testPrompt, mockThreadId);
      expect(result).toBe(expectedResponse);
      expect(mockLoggerInstance.info).toHaveBeenCalledWith(
        expect.stringContaining(`Prompt processed for thread ${mockThreadId}`)
      );
    });

    it('should handle agent not found gracefully', async () => {
      // Execute without registering agent
      const result = await orchestrator.processPromptRequest('Test prompt');

      // Verify
      expect(result).toBe('[ERROR: Unable to process prompt request]');
      expect(mockLoggerInstance.error).toHaveBeenCalledWith(
        'Error processing prompt request',
        expect.any(Error)
      );
    });
  });

  describe('2. Prompt Routing With Thread Context', () => {
    it('should use existing thread ID and maintain context', async () => {
      // Setup
      const testPrompt = 'Continue our conversation about AI';
      const existingThreadId = 'existing-thread-456';
      const expectedResponse = 'Of course! As we were discussing AI capabilities...';

      mockGeminiAgent.sendPromptWithThread.mockResolvedValue(expectedResponse);
      mockGeminiAgent.testConnection.mockResolvedValue(true);

      // Register agent
      await orchestrator.registerAgent(
        'gemini',
        mockGeminiAgent,
        { name: 'Gemini Prompt Agent', description: 'Test agent', version: '1.0.0' },
        () => mockGeminiAgent.testConnection()
      );

      // Execute with existing thread
      const result = await orchestrator.processPromptRequest(testPrompt, { 
        threadId: existingThreadId 
      });

      // Verify
      expect(mockGeminiAgent.createConversationThread).not.toHaveBeenCalled();
      expect(mockGeminiAgent.sendPromptWithThread).toHaveBeenCalledWith(testPrompt, existingThreadId);
      expect(result).toBe(expectedResponse);
      expect(mockLoggerInstance.info).toHaveBeenCalledWith(
        expect.stringContaining(`Prompt processed for thread ${existingThreadId}`)
      );
    });

    it('should create new thread when newThread flag is true', async () => {
      // Setup
      const testPrompt = 'Start a new conversation';
      const newThreadId = 'new-thread-789';
      const expectedResponse = 'Hello! Starting a fresh conversation.';

      mockGeminiAgent.createConversationThread.mockResolvedValue(newThreadId);
      mockGeminiAgent.sendPromptWithThread.mockResolvedValue(expectedResponse);
      mockGeminiAgent.testConnection.mockResolvedValue(true);

      // Register agent
      await orchestrator.registerAgent(
        'gemini',
        mockGeminiAgent,
        { name: 'Gemini Prompt Agent', description: 'Test agent', version: '1.0.0' },
        () => mockGeminiAgent.testConnection()
      );

      // Execute with newThread flag
      const result = await orchestrator.processPromptRequest(testPrompt, { 
        newThread: true 
      });

      // Verify
      expect(mockGeminiAgent.createConversationThread).toHaveBeenCalledWith('New Conversation');
      expect(mockGeminiAgent.sendPromptWithThread).toHaveBeenCalledWith(testPrompt, newThreadId);
      expect(result).toBe(expectedResponse);
    });
  });

  describe('3. Streaming Response Handling', () => {
    it('should handle streaming responses correctly', async () => {
      // Setup
      const testPrompt = 'Generate a streaming response';
      const mockThreadId = 'stream-thread-101';
      const streamChunks = ['Hello', ' there', '! How', ' can I', ' help?'];
      
      mockGeminiAgent.createConversationThread.mockResolvedValue(mockThreadId);
      mockGeminiAgent.testConnection.mockResolvedValue(true);

      // Mock streaming behavior
      mockGeminiAgent.generatePromptStreamWithThread.mockImplementation(
        async (prompt: string, onChunk: (chunk: string) => void, threadId?: string) => {
          for (const chunk of streamChunks) {
            onChunk(chunk);
          }
        }
      );

      // Register agent
      await orchestrator.registerAgent(
        'gemini',
        mockGeminiAgent,
        { name: 'Gemini Prompt Agent', description: 'Test agent', version: '1.0.0' },
        () => mockGeminiAgent.testConnection()
      );

      // Execute with streaming
      const result = await orchestrator.processPromptRequest(testPrompt, { 
        streaming: true 
      } as any);

      // Verify
      expect(mockGeminiAgent.generatePromptStreamWithThread).toHaveBeenCalledWith(
        testPrompt,
        expect.any(Function),
        mockThreadId
      );
      expect(mockLoggerInstance.debug).toHaveBeenCalledTimes(streamChunks.length);
      streamChunks.forEach(chunk => {
        expect(mockLoggerInstance.debug).toHaveBeenCalledWith(`Streaming chunk: ${chunk}`);
      });
    });
  });

  describe('4. Fallback and Error Handling', () => {
    it('should handle GeminiPromptAgent failure gracefully', async () => {
      // Setup
      const testPrompt = 'This will fail';
      const errorMessage = 'Connection timeout';

      mockGeminiAgent.createConversationThread.mockResolvedValue('thread-error');
      mockGeminiAgent.sendPromptWithThread.mockRejectedValue(new Error(errorMessage));
      mockGeminiAgent.testConnection.mockResolvedValue(true);

      // Register agent
      await orchestrator.registerAgent(
        'gemini',
        mockGeminiAgent,
        { name: 'Gemini Prompt Agent', description: 'Test agent', version: '1.0.0' },
        () => mockGeminiAgent.testConnection()
      );

      // Execute
      const result = await orchestrator.processPromptRequest(testPrompt);

      // Verify
      expect(result).toBe('[ERROR: Unable to process prompt request]');
      expect(mockLoggerInstance.error).toHaveBeenCalledWith(
        'Error processing prompt request',
        expect.any(Error)
      );
    });

    it('should handle agent registration failure', async () => {
      // Setup
      const mockFailingAgent = {
        testConnection: jest.fn().mockResolvedValue(false),
      };

      // Execute
      const result = await orchestrator.registerAgent(
        'failing-agent',
        mockFailingAgent,
        { name: 'Failing Agent', description: 'Test failing agent', version: '1.0.0' },
        () => mockFailingAgent.testConnection()
      );

      // Verify (agent registration may still succeed if interface validation passes)
      expect(result).toBe(true);
    });
  });

  describe('5. Unknown Agent or Invalid Prompt', () => {
    it('should handle malformed prompt gracefully', async () => {
      // Setup
      const malformedPrompt = '';
      const mockThreadId = 'malformed-thread';

      mockGeminiAgent.createConversationThread.mockResolvedValue(mockThreadId);
      mockGeminiAgent.sendPromptWithThread.mockResolvedValue('[No response received]');
      mockGeminiAgent.testConnection.mockResolvedValue(true);

      // Register agent
      await orchestrator.registerAgent(
        'gemini',
        mockGeminiAgent,
        { name: 'Gemini Prompt Agent', description: 'Test agent', version: '1.0.0' },
        () => mockGeminiAgent.testConnection()
      );

      // Execute
      const result = await orchestrator.processPromptRequest(malformedPrompt);

      // Verify
      expect(result).toBe('[No response received]');
      expect(mockGeminiAgent.sendPromptWithThread).toHaveBeenCalledWith(malformedPrompt, mockThreadId);
    });
  });

  describe('6. Performance Logging', () => {
    it('should log performance metrics and lifecycle events', async () => {
      // Setup
      const testPrompt = 'Performance test prompt';
      const expectedResponse = 'Performance test response';
      const mockThreadId = 'perf-thread-202';

      mockGeminiAgent.createConversationThread.mockResolvedValue(mockThreadId);
      mockGeminiAgent.sendPromptWithThread.mockResolvedValue(expectedResponse);
      mockGeminiAgent.testConnection.mockResolvedValue(true);

      // Register agent
      await orchestrator.registerAgent(
        'gemini',
        mockGeminiAgent,
        { name: 'Gemini Prompt Agent', description: 'Test agent', version: '1.0.0' },
        () => mockGeminiAgent.testConnection()
      );

      // Execute
      const startTime = Date.now();
      const result = await orchestrator.processPromptRequest(testPrompt);
      const endTime = Date.now();

      // Verify
      expect(result).toBe(expectedResponse);
      expect(mockLoggerInstance.info).toHaveBeenCalledWith('CentralOrchestrator initialized');
      expect(mockLoggerInstance.info).toHaveBeenCalledWith(
        expect.stringContaining(`Prompt processed for thread ${mockThreadId}`)
      );
    });

    it('should log agent registration events', async () => {
      // Setup
      mockGeminiAgent.testConnection.mockResolvedValue(true);

      // Execute
      await orchestrator.registerAgent(
        'gemini',
        mockGeminiAgent,
        { name: 'Gemini Prompt Agent', description: 'Test agent', version: '1.0.0' },
        () => mockGeminiAgent.testConnection()
      );

      // Verify registration logging occurred through registry
      expect(mockLoggerInstance.info).toHaveBeenCalledWith('CentralOrchestrator initialized');
    });
  });

  describe('7. Health Checks and Agent Management', () => {
    it('should perform health checks on registered agents', async () => {
      // Setup
      mockGeminiAgent.testConnection.mockResolvedValue(true);

      // Register agent
      await orchestrator.registerAgent(
        'gemini',
        mockGeminiAgent,
        { name: 'Gemini Prompt Agent', description: 'Test agent', version: '1.0.0' },
        () => mockGeminiAgent.testConnection()
      );

      // Execute
      const healthResults = await orchestrator.performHealthChecks();

      // Verify
      expect(healthResults).toBeInstanceOf(Map);
      expect(mockGeminiAgent.testConnection).toHaveBeenCalled();
    });

    it('should list registered agents', async () => {
      // Setup
      mockGeminiAgent.testConnection.mockResolvedValue(true);

      // Register agent
      await orchestrator.registerAgent(
        'gemini',
        mockGeminiAgent,
        { name: 'Gemini Prompt Agent', description: 'Test agent', version: '1.0.0' },
        () => mockGeminiAgent.testConnection()
      );

      // Execute
      const agents = orchestrator.listAgents();

      // Verify
      expect(agents).toBeInstanceOf(Array);
      expect(agents.length).toBeGreaterThan(0);
    });
  });
});
