import { GeminiPromptAgent } from '../src/agents/geminiPromptAgent';

// Mock the modules
const mockSendMessage = jest.fn();
const mockStartChat = jest.fn();
const mockGetGenerativeModel = jest.fn();

jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel
  })),
  HarmBlockThreshold: {
    BLOCK_LOW_AND_ABOVE: 'BLOCK_LOW_AND_ABOVE'
  },
  HarmCategory: {
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT'
  }
}));

jest.mock('google-auth-library', () => ({
  GoogleAuth: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('../src/utils/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }))
}));

jest.mock('../src/memory/conversationThreadManager', () => ({
  ConversationThreadManager: jest.fn().mockImplementation(() => ({
    createThread: jest.fn(),
    getRecentContext: jest.fn(),
    addMessage: jest.fn(),
    getThreadHistory: jest.fn(),
    listThreads: jest.fn(),
    deleteThread: jest.fn(),
    getMemoryStats: jest.fn()
  }))
}));

// Test Suite
describe('GeminiPromptAgent', () => {
  let agent: GeminiPromptAgent;

  beforeEach(() => {
    // Reset mocks
    mockSendMessage.mockClear();
    mockStartChat.mockClear();
    mockGetGenerativeModel.mockClear();
    
    // Setup mock chain
    mockSendMessage.mockResolvedValue({
      response: {
        candidates: [{ content: { parts: [{ text: 'Test Response' }] } }]
      }
    });
    
    mockStartChat.mockReturnValue({
      sendMessage: mockSendMessage
    });
    
    mockGetGenerativeModel.mockReturnValue({
      startChat: mockStartChat
    });
    
    agent = new GeminiPromptAgent({ projectId: 'test-project' });
  });

  it('should respond with a valid output', async () => {
    const result = await agent.sendPrompt('Hello, who are you?');
    expect(result).toBe('Test Response');
    expect(mockSendMessage).toHaveBeenCalledWith('Hello, who are you?');
  });

  it('should initialize with authentication', () => {
    expect(agent).toBeTruthy();
  });

  it('should handle errors gracefully', async () => {
    // Mock an error scenario
    mockSendMessage.mockRejectedValueOnce(new Error('Test Error'));
    
    const response = await agent.sendPrompt('This should fail');
    expect(response).toBe('[ERROR: Unable to retrieve response]');
  });

  it('should handle empty responses', async () => {
    // Mock empty response
    mockSendMessage.mockResolvedValueOnce({
      response: {
        candidates: []
      }
    });
    
    const result = await agent.sendPrompt('Empty response test');
    expect(result).toBe('[No response received]');
  });

  it('should handle streaming responses', async () => {
    // Mock streaming response
    const mockSendMessageStream = jest.fn();
    mockStartChat.mockReturnValue({
      sendMessage: mockSendMessage,
      sendMessageStream: mockSendMessageStream
    });
    
    // Mock stream chunks
    const mockStream = {
      stream: [
        { candidates: [{ content: { parts: [{ text: 'Hello ' }] } }] },
        { candidates: [{ content: { parts: [{ text: 'world!' }] } }] }
      ]
    };
    
    mockSendMessageStream.mockResolvedValue(mockStream);
    
    const chunks: string[] = [];
    const onChunk = (chunk: string) => chunks.push(chunk);
    
    await agent.generatePromptStream('Test streaming', onChunk);
    
    expect(chunks).toEqual(['Hello ', 'world!']);
    expect(mockSendMessageStream).toHaveBeenCalledWith('Test streaming');
  });

  it('should handle streaming errors', async () => {
    // Mock streaming error
    const mockSendMessageStream = jest.fn();
    mockStartChat.mockReturnValue({
      sendMessage: mockSendMessage,
      sendMessageStream: mockSendMessageStream
    });
    
    mockSendMessageStream.mockRejectedValue(new Error('Stream error'));
    
    const onChunk = jest.fn();
    
    await expect(agent.generatePromptStream('Test error', onChunk))
      .rejects.toThrow('Stream error');
  });

  describe('Threaded Conversation Methods', () => {
    let mockConversationManager: any;

    beforeEach(() => {
      mockConversationManager = {
        createThread: jest.fn(),
        getRecentContext: jest.fn(),
        addMessage: jest.fn(),
        getThreadHistory: jest.fn(),
        listThreads: jest.fn(),
        deleteThread: jest.fn(),
        getMemoryStats: jest.fn()
      };

      // Mock the conversation manager
      (agent as any).conversationManager = mockConversationManager;
    });

    it('should create a new conversation thread', async () => {
      const expectedThreadId = 'thread_12345';
      mockConversationManager.createThread.mockResolvedValue(expectedThreadId);

      const result = await agent.createConversationThread('Test Thread');
      
      expect(result).toBe(expectedThreadId);
      expect(mockConversationManager.createThread).toHaveBeenCalledWith('Test Thread');
    });

    it('should send prompt with thread context', async () => {
      const threadId = 'thread_12345';
      const contextMessages = ['Human: Hello', 'Assistant: Hi there!'];
      
      mockConversationManager.getRecentContext.mockResolvedValue(contextMessages);
      mockConversationManager.addMessage.mockResolvedValue('msg_123');

      const result = await agent.sendPromptWithThread('How are you?', threadId);
      
      expect(result).toBe('Test Response');
      expect(mockConversationManager.getRecentContext).toHaveBeenCalledWith(threadId, 10);
      expect(mockConversationManager.addMessage).toHaveBeenCalledWith(threadId, 'user', 'How are you?');
      expect(mockConversationManager.addMessage).toHaveBeenCalledWith(threadId, 'assistant', 'Test Response');
    });

    it('should handle threaded streaming', async () => {
      const threadId = 'thread_12345';
      const contextMessages = ['Human: Hello', 'Assistant: Hi there!'];
      
      mockConversationManager.getRecentContext.mockResolvedValue(contextMessages);
      mockConversationManager.addMessage.mockResolvedValue('msg_123');

      // Mock streaming response
      const mockSendMessageStream = jest.fn();
      mockStartChat.mockReturnValue({
        sendMessage: mockSendMessage,
        sendMessageStream: mockSendMessageStream
      });
      
      const mockStream = {
        stream: [
          { candidates: [{ content: { parts: [{ text: 'Streaming ' }] } }] },
          { candidates: [{ content: { parts: [{ text: 'response!' }] } }] }
        ]
      };
      
      mockSendMessageStream.mockResolvedValue(mockStream);
      
      const chunks: string[] = [];
      const onChunk = (chunk: string) => chunks.push(chunk);
      
      await agent.generatePromptStreamWithThread('Test streaming', onChunk, threadId);
      
      expect(chunks).toEqual(['Streaming ', 'response!']);
      expect(mockConversationManager.getRecentContext).toHaveBeenCalledWith(threadId, 10);
      expect(mockConversationManager.addMessage).toHaveBeenCalledWith(threadId, 'user', 'Test streaming');
      expect(mockConversationManager.addMessage).toHaveBeenCalledWith(threadId, 'assistant', 'Streaming response!');
    });

    it('should get conversation history', async () => {
      const threadId = 'thread_12345';
      const expectedHistory = [
        { id: 'msg_1', role: 'user', content: 'Hello' },
        { id: 'msg_2', role: 'assistant', content: 'Hi there!' }
      ];
      
      mockConversationManager.getThreadHistory.mockResolvedValue(expectedHistory);
      
      const result = await agent.getConversationHistory(threadId, 5);
      
      expect(result).toEqual(expectedHistory);
      expect(mockConversationManager.getThreadHistory).toHaveBeenCalledWith(threadId, 5);
    });

    it('should list conversation threads', async () => {
      const expectedThreads = [
        { id: 'thread_1', title: 'Thread 1' },
        { id: 'thread_2', title: 'Thread 2' }
      ];
      
      mockConversationManager.listThreads.mockResolvedValue(expectedThreads);
      
      const result = await agent.listConversationThreads();
      
      expect(result).toEqual(expectedThreads);
      expect(mockConversationManager.listThreads).toHaveBeenCalled();
    });

    it('should delete conversation thread', async () => {
      const threadId = 'thread_12345';
      
      mockConversationManager.deleteThread.mockResolvedValue(true);
      
      const result = await agent.deleteConversationThread(threadId);
      
      expect(result).toBe(true);
      expect(mockConversationManager.deleteThread).toHaveBeenCalledWith(threadId);
    });

    it('should get conversation statistics', () => {
      const expectedStats = {
        totalThreads: 5,
        totalMessages: 20,
        memoryUsage: '1.2MB'
      };
      
      mockConversationManager.getMemoryStats.mockReturnValue(expectedStats);
      
      const result = agent.getConversationStats();
      
      expect(result).toEqual(expectedStats);
      expect(mockConversationManager.getMemoryStats).toHaveBeenCalled();
    });

    it('should handle single-turn prompts without thread', async () => {
      const result = await agent.sendPromptWithThread('Hello without thread');
      
      expect(result).toBe('Test Response');
      expect(mockConversationManager.getRecentContext).not.toHaveBeenCalled();
      expect(mockConversationManager.addMessage).not.toHaveBeenCalled();
    });
  });
});
