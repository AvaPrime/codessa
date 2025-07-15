// src/__tests__/codexForge.test.ts

import { CommandParser } from '../shell/commandParser';
import { SessionManager } from '../shell/sessionManager';
import { GeminiPromptAgent } from '../agents/geminiPromptAgent';

// Mock dependencies
jest.mock('../agents/geminiPromptAgent');
jest.mock('../utils/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }))
}));

const MockedGeminiPromptAgent = GeminiPromptAgent as jest.MockedClass<typeof GeminiPromptAgent>;

describe('CodexForge Shell Components', () => {
  let commandParser: CommandParser;
  let sessionManager: SessionManager;
  let mockGeminiAgent: jest.Mocked<GeminiPromptAgent>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    commandParser = new CommandParser();
    sessionManager = new SessionManager();
    
    mockGeminiAgent = {
      createConversationThread: jest.fn(),
      deleteConversationThread: jest.fn(),
      testConnection: jest.fn(),
    } as any;
    
    MockedGeminiPromptAgent.mockImplementation(() => mockGeminiAgent);
    sessionManager.setGeminiAgent(mockGeminiAgent);
  });

  describe('CommandParser', () => {
    it('should parse commands correctly', () => {
      const result = commandParser.parseCommand('help test arg');
      expect(result.command).toBe('help');
      expect(result.args).toEqual(['test', 'arg']);
    });

    it('should recognize built-in commands', () => {
      expect(commandParser.isCommand('help')).toBe(true);
      expect(commandParser.isCommand('clear')).toBe(true);
      expect(commandParser.isCommand('status')).toBe(true);
      expect(commandParser.isCommand('nonexistent')).toBe(false);
    });

    it('should execute help command', async () => {
      const result = await commandParser.executeCommand('help');
      expect(result.success).toBe(true);
      expect(result.message).toContain('CodexForge Commands');
    });

    it('should execute clear command', async () => {
      const result = await commandParser.executeCommand('clear');
      expect(result.success).toBe(true);
    });

    it('should execute status command', async () => {
      const result = await commandParser.executeCommand('status');
      expect(result.success).toBe(true);
      expect(result.message).toContain('CodexForge Status');
    });

    it('should handle unknown commands', async () => {
      const result = await commandParser.executeCommand('unknown');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown command');
    });
  });

  describe('SessionManager', () => {
    it('should create a new session', async () => {
      const mockThreadId = 'thread-123';
      mockGeminiAgent.createConversationThread.mockResolvedValue(mockThreadId);
      
      const session = await sessionManager.createSession('Test Session');
      
      expect(session.name).toBe('Test Session');
      expect(session.threadId).toBe(mockThreadId);
      expect(session.messageCount).toBe(0);
      expect(mockGeminiAgent.createConversationThread).toHaveBeenCalledWith('Test Session');
    });

    it('should get current session', async () => {
      const mockThreadId = 'thread-456';
      mockGeminiAgent.createConversationThread.mockResolvedValue(mockThreadId);
      
      const session = await sessionManager.createSession('Current Session');
      const currentSession = sessionManager.getCurrentSession();
      
      expect(currentSession).toBe(session);
      expect(currentSession?.threadId).toBe(mockThreadId);
    });

    it('should get current thread ID', async () => {
      const mockThreadId = 'thread-789';
      mockGeminiAgent.createConversationThread.mockResolvedValue(mockThreadId);
      
      await sessionManager.createSession('Thread Test');
      const threadId = sessionManager.getCurrentThreadId();
      
      expect(threadId).toBe(mockThreadId);
    });

    it('should switch sessions', async () => {
      const mockThreadId1 = 'thread-1';
      const mockThreadId2 = 'thread-2';
      mockGeminiAgent.createConversationThread
        .mockResolvedValueOnce(mockThreadId1)
        .mockResolvedValueOnce(mockThreadId2);
      
      const session1 = await sessionManager.createSession('Session 1');
      const session2 = await sessionManager.createSession('Session 2');
      
      // Switch back to session 1
      const switchResult = sessionManager.switchSession(session1.id);
      expect(switchResult).toBe(true);
      expect(sessionManager.getCurrentSession()?.id).toBe(session1.id);
    });

    it('should delete sessions', async () => {
      const mockThreadId = 'thread-delete';
      mockGeminiAgent.createConversationThread.mockResolvedValue(mockThreadId);
      mockGeminiAgent.deleteConversationThread.mockResolvedValue(true);
      
      const session = await sessionManager.createSession('Delete Test');
      const deleteResult = await sessionManager.deleteSession(session.id);
      
      expect(deleteResult).toBe(true);
      expect(mockGeminiAgent.deleteConversationThread).toHaveBeenCalledWith(mockThreadId);
      expect(sessionManager.getCurrentSession()).toBeNull();
    });

    it('should list sessions', async () => {
      const mockThreadId1 = 'thread-list-1';
      const mockThreadId2 = 'thread-list-2';
      mockGeminiAgent.createConversationThread
        .mockResolvedValueOnce(mockThreadId1)
        .mockResolvedValueOnce(mockThreadId2);
      
      await sessionManager.createSession('List Session 1');
      await sessionManager.createSession('List Session 2');
      
      const sessions = sessionManager.listSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions[0].name).toBe('List Session 1'); // Most recent first
      expect(sessions[1].name).toBe('List Session 2');
    });

    it('should update session activity', async () => {
      const mockThreadId = 'thread-activity';
      mockGeminiAgent.createConversationThread.mockResolvedValue(mockThreadId);
      
      const session = await sessionManager.createSession('Activity Test');
      const initialMessageCount = session.messageCount;
      
      sessionManager.updateSessionActivity();
      
      expect(session.messageCount).toBe(initialMessageCount + 1);
    });

    it('should get session stats', async () => {
      const mockThreadId = 'thread-stats';
      mockGeminiAgent.createConversationThread.mockResolvedValue(mockThreadId);
      
      await sessionManager.createSession('Stats Test');
      sessionManager.updateSessionActivity();
      sessionManager.updateSessionActivity();
      
      const stats = sessionManager.getSessionStats();
      expect(stats.totalSessions).toBe(1);
      expect(stats.totalMessages).toBe(2);
      expect(stats.avgMessagesPerSession).toBe(2);
    });

    it('should ensure active session exists', async () => {
      const mockThreadId = 'thread-ensure';
      mockGeminiAgent.createConversationThread.mockResolvedValue(mockThreadId);
      
      // No session exists initially
      expect(sessionManager.getCurrentSession()).toBeNull();
      
      // Ensure active session should create one
      const session = await sessionManager.ensureActiveSession();
      expect(session).toBeDefined();
      expect(session.name).toBe('Default Session');
      expect(sessionManager.getCurrentSession()).toBe(session);
    });
  });

  describe('Integration Tests', () => {
    it('should handle session commands through CommandParser', async () => {
      const mockThreadId = 'thread-integration';
      mockGeminiAgent.createConversationThread.mockResolvedValue(mockThreadId);
      
      // Register session command with sessionManager
      commandParser.registerCommand({
        name: 'session',
        description: 'Session management for testing',
        handler: async (args: string[]) => {
          if (args[0] === 'new') {
            const name = args.slice(1).join(' ');
            const session = await sessionManager.createSession(name);
            return { success: true, message: `Created new session: ${session.name}` };
          }
          return { success: false, message: 'Invalid session command' };
        }
      });
      
      // Create session through command
      const createResult = await commandParser.executeCommand('session new Integration Test');
      expect(createResult.success).toBe(true);
      expect(createResult.message).toContain('Created new session');
    });

    it('should handle thread commands', async () => {
      const newResult = await commandParser.executeCommand('thread new');
      expect(newResult.success).toBe(true);
      expect(newResult.message).toContain('Creating new conversation thread');
      
      const listResult = await commandParser.executeCommand('thread list');
      expect(listResult.success).toBe(true);
      expect(listResult.message).toContain('Thread list feature coming soon');
    });
  });
});
