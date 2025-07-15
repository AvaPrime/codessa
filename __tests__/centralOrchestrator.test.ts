import { CentralOrchestrator } from '../src/orchestration/centralOrchestrator';
import { AgentRegistry } from '../src/orchestration/agentRegistry';

// Mock dependencies
jest.mock('../src/orchestration/agentRegistry');
jest.mock('../src/utils/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }))
}));

describe('CentralOrchestrator', () => {
  let orchestrator: CentralOrchestrator;
  let mockAgentRegistry: jest.Mocked<AgentRegistry>;
  let mockGeminiAgent: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock Gemini agent
    mockGeminiAgent = {
      testConnection: jest.fn().mockResolvedValue(true),
      createConversationThread: jest.fn().mockResolvedValue('thread_12345'),
      sendPromptWithThread: jest.fn().mockResolvedValue('Test response from Gemini'),
      sendPrompt: jest.fn().mockResolvedValue('Test response'),
      generatePromptStream: jest.fn(),
      listConversationThreads: jest.fn(),
      getConversationHistory: jest.fn(),
      deleteConversationThread: jest.fn()
    };

    // Mock AgentRegistry
    mockAgentRegistry = {
      registerAgent: jest.fn().mockResolvedValue(true),
      getAgentInstance: jest.fn(),
      getAgent: jest.fn(),
      findAgentsByCapability: jest.fn(),
      listAgents: jest.fn(),
      listActiveAgents: jest.fn(),
      unregisterAgent: jest.fn(),
      performHealthChecks: jest.fn().mockResolvedValue(new Map([['gemini', true]])),
      updateAgentPerformance: jest.fn(),
      getRegistryStats: jest.fn()
    } as any;

    // Mock the AgentRegistry constructor
    (AgentRegistry as jest.MockedClass<typeof AgentRegistry>).mockImplementation(() => mockAgentRegistry);

    orchestrator = new CentralOrchestrator();
  });

  describe('Agent Registration', () => {
    it('should register an agent successfully', async () => {
      const result = await orchestrator.registerAgent(
        'gemini',
        mockGeminiAgent,
        {
          name: 'Gemini Agent',
          description: 'Test agent',
          version: '1.0.0'
        },
        async () => true
      );

      expect(result).toBe(true);
      expect(mockAgentRegistry.registerAgent).toHaveBeenCalledWith(
        'gemini',
        mockGeminiAgent,
        expect.objectContaining({
          name: 'Gemini Agent',
          description: 'Test agent',
          version: '1.0.0',
          capabilities: expect.arrayContaining([
            expect.objectContaining({
              name: 'prompt_generation',
              streaming: true,
              contextAware: true
            })
          ])
        }),
        expect.any(Function)
      );
    });

    it('should list registered agents', () => {
      const mockAgents = [
        {
          id: 'gemini',
          instance: mockGeminiAgent,
          metadata: {
            id: 'gemini',
            name: 'Gemini',
            description: 'Test agent',
            version: '1.0.0',
            capabilities: [],
            status: 'active' as const,
            lastHealthCheck: new Date(),
            performance: {
              averageResponseTime: 0,
              successRate: 1,
              totalRequests: 0
            }
          },
          healthCheck: jest.fn()
        }
      ];

      mockAgentRegistry.listAgents.mockReturnValue(mockAgents);

      const result = orchestrator.listAgents();
      expect(result).toEqual(mockAgents);
      expect(mockAgentRegistry.listAgents).toHaveBeenCalled();
    });
  });

  describe('Prompt Processing', () => {
    beforeEach(() => {
      // Setup agent registry to return our mock agent
      mockAgentRegistry.getAgentInstance.mockReturnValue(mockGeminiAgent);
    });

    it('should process prompt request successfully', async () => {
      const prompt = 'Hello, how are you?';
      const expectedResponse = 'Test response from Gemini';

      const result = await orchestrator.processPromptRequest(prompt);

      expect(result).toBe(expectedResponse);
      expect(mockAgentRegistry.getAgentInstance).toHaveBeenCalledWith('gemini');
      expect(mockGeminiAgent.createConversationThread).toHaveBeenCalledWith('New Conversation');
      expect(mockGeminiAgent.sendPromptWithThread).toHaveBeenCalledWith(prompt, 'thread_12345');
    });

    it('should process prompt request with existing thread', async () => {
      const prompt = 'Continue our conversation';
      const threadId = 'existing_thread_123';

      const result = await orchestrator.processPromptRequest(prompt, { threadId });

      expect(result).toBe('Test response from Gemini');
      expect(mockGeminiAgent.createConversationThread).not.toHaveBeenCalled();
      expect(mockGeminiAgent.sendPromptWithThread).toHaveBeenCalledWith(prompt, threadId);
    });

    it('should create new thread when newThread flag is true', async () => {
      const prompt = 'Start a new conversation';
      const existingThreadId = 'old_thread_123';

      const result = await orchestrator.processPromptRequest(prompt, { 
        threadId: existingThreadId, 
        newThread: true 
      });

      expect(result).toBe('Test response from Gemini');
      expect(mockGeminiAgent.createConversationThread).toHaveBeenCalledWith('New Conversation');
      expect(mockGeminiAgent.sendPromptWithThread).toHaveBeenCalledWith(prompt, 'thread_12345');
    });

    it('should handle agent not found error', async () => {
      mockAgentRegistry.getAgentInstance.mockReturnValue(null);

      const result = await orchestrator.processPromptRequest('Test prompt');

      expect(result).toBe('[ERROR: Unable to process prompt request]');
    });

    it('should handle agent execution error', async () => {
      mockGeminiAgent.sendPromptWithThread.mockRejectedValue(new Error('Agent error'));

      const result = await orchestrator.processPromptRequest('Test prompt');

      expect(result).toBe('[ERROR: Unable to process prompt request]');
    });

    it('should handle thread creation error', async () => {
      mockGeminiAgent.createConversationThread.mockRejectedValue(new Error('Thread creation failed'));

      const result = await orchestrator.processPromptRequest('Test prompt');

      expect(result).toBe('[ERROR: Unable to process prompt request]');
    });
  });

  describe('Health Checks', () => {
    it('should perform health checks on all agents', async () => {
      const expectedResults = new Map([['gemini', true]]);
      mockAgentRegistry.performHealthChecks.mockResolvedValue(expectedResults);

      const result = await orchestrator.performHealthChecks();

      expect(result).toEqual(expectedResults);
      expect(mockAgentRegistry.performHealthChecks).toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('should handle complete workflow from registration to prompt processing', async () => {
      // Register agent
      await orchestrator.registerAgent(
        'gemini',
        mockGeminiAgent,
        {
          name: 'Gemini Agent',
          description: 'Test agent',
          version: '1.0.0'
        },
        async () => true
      );

      // Setup agent registry to return our mock agent
      mockAgentRegistry.getAgentInstance.mockReturnValue(mockGeminiAgent);

      // Process prompt
      const result = await orchestrator.processPromptRequest('Hello world');

      expect(result).toBe('Test response from Gemini');
      expect(mockAgentRegistry.registerAgent).toHaveBeenCalled();
      expect(mockGeminiAgent.sendPromptWithThread).toHaveBeenCalledWith('Hello world', 'thread_12345');
    });

    it('should handle multiple sequential prompts in same thread', async () => {
      mockAgentRegistry.getAgentInstance.mockReturnValue(mockGeminiAgent);

      const threadId = 'persistent_thread_123';
      
      // First prompt
      const result1 = await orchestrator.processPromptRequest('First message', { threadId });
      expect(result1).toBe('Test response from Gemini');
      
      // Second prompt in same thread
      const result2 = await orchestrator.processPromptRequest('Second message', { threadId });
      expect(result2).toBe('Test response from Gemini');

      // Verify thread was not recreated
      expect(mockGeminiAgent.createConversationThread).not.toHaveBeenCalled();
      expect(mockGeminiAgent.sendPromptWithThread).toHaveBeenCalledTimes(2);
      expect(mockGeminiAgent.sendPromptWithThread).toHaveBeenNthCalledWith(1, 'First message', threadId);
      expect(mockGeminiAgent.sendPromptWithThread).toHaveBeenNthCalledWith(2, 'Second message', threadId);
    });
  });
});
