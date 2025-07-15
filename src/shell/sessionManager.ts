// src/shell/sessionManager.ts

import { Logger } from '../utils/logger';
import { GeminiPromptAgent } from '../agents/geminiPromptAgent';

const logger = new Logger('SessionManager');

export interface Session {
  id: string;
  threadId: string;
  name: string;
  createdAt: Date;
  lastActivityAt: Date;
  messageCount: number;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private currentSessionId: string | null = null;
  private geminiAgent: GeminiPromptAgent | null = null;

  constructor() {
    logger.info('SessionManager initialized');
  }

  setGeminiAgent(agent: GeminiPromptAgent): void {
    this.geminiAgent = agent;
  }

  async createSession(name?: string): Promise<Session> {
    if (!this.geminiAgent) {
      throw new Error('GeminiPromptAgent not initialized');
    }

    const sessionId = this.generateSessionId();
    const threadId = await this.geminiAgent.createConversationThread(name || `Session ${sessionId}`);
    
    const session: Session = {
      id: sessionId,
      threadId,
      name: name || `Session ${sessionId}`,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      messageCount: 0
    };

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;

    logger.info(`Created new session: ${sessionId} with thread: ${threadId}`);
    return session;
  }

  getCurrentSession(): Session | null {
    if (!this.currentSessionId) {
      return null;
    }
    return this.sessions.get(this.currentSessionId) || null;
  }

  getCurrentThreadId(): string | null {
    const session = this.getCurrentSession();
    return session ? session.threadId : null;
  }

  switchSession(sessionId: string): boolean {
    if (!this.sessions.has(sessionId)) {
      logger.warn(`Session not found: ${sessionId}`);
      return false;
    }

    this.currentSessionId = sessionId;
    const session = this.sessions.get(sessionId)!;
    session.lastActivityAt = new Date();

    logger.info(`Switched to session: ${sessionId}`);
    return true;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    if (!this.geminiAgent) {
      throw new Error('GeminiPromptAgent not initialized');
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.warn(`Session not found: ${sessionId}`);
      return false;
    }

    // Delete the conversation thread
    await this.geminiAgent.deleteConversationThread(session.threadId);
    
    // Remove from sessions
    this.sessions.delete(sessionId);

    // If this was the current session, clear it
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }

    logger.info(`Deleted session: ${sessionId}`);
    return true;
  }

  listSessions(): Session[] {
    return Array.from(this.sessions.values()).sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  updateSessionActivity(sessionId?: string): void {
    const id = sessionId || this.currentSessionId;
    if (!id) return;

    const session = this.sessions.get(id);
    if (session) {
      session.lastActivityAt = new Date();
      session.messageCount++;
    }
  }

  getSessionStats(): {
    totalSessions: number;
    currentSessionId: string | null;
    totalMessages: number;
    avgMessagesPerSession: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const totalMessages = sessions.reduce((sum, session) => sum + session.messageCount, 0);
    
    return {
      totalSessions: sessions.length,
      currentSessionId: this.currentSessionId,
      totalMessages,
      avgMessagesPerSession: sessions.length > 0 ? totalMessages / sessions.length : 0
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async ensureActiveSession(): Promise<Session> {
    let session = this.getCurrentSession();
    
    if (!session) {
      session = await this.createSession('Default Session');
    }
    
    return session;
  }
}
