// src/memory/conversationThreadManager.ts

import { MemorySegment } from '../../sync/interfaces/syncTypes';
import { MemorySyncManager } from '../../sync/memory/memorySyncManager';
import { Logger } from '../utils/logger';
import { mirror } from '../mirror';

const logger = new Logger('ConversationThreadManager');

export interface ConversationMessage {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ConversationThread {
  id: string;
  title?: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export class ConversationThreadManager {
  private memorySyncManager: MemorySyncManager;
  private nodeId: string;

  constructor(nodeId: string = 'codessa-core-node') {
    this.nodeId = nodeId;
    this.memorySyncManager = new MemorySyncManager(nodeId);

    logger.info(`ConversationThreadManager initialized for node: ${nodeId}`);
  }

  /**
   * Create a new conversation thread
   */
  async createThread(
    title?: string,
    metadata?: Record<string, any>,
  ): Promise<string> {
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const thread: ConversationThread = {
      id: threadId,
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata,
    };

    await this.saveThread(thread);

    logger.info(`Created conversation thread: ${threadId}`);
    return threadId;
  }

  /**
   * Add a message to a conversation thread
   */
  async addMessage(
    threadId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, any>,
  ): Promise<string> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const message: ConversationMessage = {
      id: messageId,
      threadId,
      role,
      content,
      timestamp: new Date(),
      metadata,
    };

    // Get existing thread
    const thread = await this.getThread(threadId);
    if (!thread) {
      throw new Error(`Thread not found: ${threadId}`);
    }

    // Add message to thread
    thread.messages.push(message);
    thread.updatedAt = new Date();

    // Save updated thread
    await this.saveThread(thread);

    logger.debug(
      `Added message to thread ${threadId}: ${role} - ${content.substring(0, 100)}...`,
    );
    return messageId;
  }

  /**
   * Get conversation thread history
   */
  async getThreadHistory(
    threadId: string,
    limit?: number,
  ): Promise<ConversationMessage[]> {
    const thread = await this.getThread(threadId);
    if (!thread) {
      logger.warn(`Thread not found: ${threadId}`);
      return [];
    }

    let messages = thread.messages;

    // Apply limit if specified
    if (limit && limit > 0) {
      messages = messages.slice(-limit);
    }

    logger.debug(
      `Retrieved ${messages.length} messages from thread ${threadId}`,
    );
    return messages;
  }

  /**
   * Get conversation thread
   */
  async getThread(threadId: string): Promise<ConversationThread | null> {
    const segment = this.memorySyncManager.getMemorySegment(
      `conversation_thread_${threadId}`,
    );

    if (!segment) {
      return null;
    }

    // Mirror Engine: Log memory read
    mirror.logEvent('memory:read', 'conversationThreadManager', {
      segmentId: segment.id,
      threadId: threadId,
      messageCount: (segment.content as ConversationThread)?.messages?.length || 0,
      found: true,
    });

    return segment.content as ConversationThread;
  }

  /**
   * List all conversation threads
   */
  async listThreads(): Promise<ConversationThread[]> {
    const segments = this.memorySyncManager.getSegmentsByType('episodic');

    return segments
      .filter(segment => segment.id.startsWith('conversation_thread_'))
      .map(segment => segment.content as ConversationThread)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Delete a conversation thread
   */
  async deleteThread(threadId: string): Promise<boolean> {
    const segment = this.memorySyncManager.getMemorySegment(
      `conversation_thread_${threadId}`,
    );

    if (!segment) {
      logger.warn(`Thread not found for deletion: ${threadId}`);
      return false;
    }

    // Create a "deleted" segment to replace the original
    const deletedSegment: MemorySegment = {
      id: `conversation_thread_${threadId}`,
      type: 'episodic',
      content: null,
      timestamp: new Date(),
      nodeId: this.nodeId,
      version: segment.version + 1,
      dependencies: [],
      checksum: '',
    };

    await this.memorySyncManager.addMemorySegment(deletedSegment);

    logger.info(`Deleted conversation thread: ${threadId}`);
    return true;
  }

  /**
   * Format thread history for Gemini context
   */
  formatForGeminiContext(messages: ConversationMessage[]): string[] {
    return messages.map(msg => {
      const prefix = msg.role === 'user' ? 'Human: ' : 'Assistant: ';
      return `${prefix}${msg.content}`;
    });
  }

  /**
   * Get recent context for a thread (formatted for Gemini)
   */
  async getRecentContext(
    threadId: string,
    limit: number = 10,
  ): Promise<string[]> {
    const messages = await this.getThreadHistory(threadId, limit);
    return this.formatForGeminiContext(messages);
  }

  /**
   * Save thread to memory
   */
  private async saveThread(thread: ConversationThread): Promise<void> {
    const segment: MemorySegment = {
      id: `conversation_thread_${thread.id}`,
      type: 'episodic',
      content: thread,
      timestamp: new Date(),
      nodeId: this.nodeId,
      version: 1,
      dependencies: [],
      checksum: '',
    };

    await this.memorySyncManager.addMemorySegment(segment);

    // Mirror Engine: Log memory write
    mirror.logEvent('memory:write', 'conversationThreadManager', {
      segmentId: segment.id,
      type: segment.type,
      threadId: thread.id,
      messageCount: thread.messages.length,
      size: JSON.stringify(thread).length,
    });
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): any {
    const stats = this.memorySyncManager.getMemoryStats();
    const threadSegments = this.memorySyncManager
      .getSegmentsByType('episodic')
      .filter(segment => segment.id.startsWith('conversation_thread_'));

    return {
      ...stats,
      conversationThreads: threadSegments.length,
      totalMessages: threadSegments.reduce((total, segment) => {
        const thread = segment.content as ConversationThread;
        return total + (thread?.messages?.length || 0);
      }, 0),
    };
  }
}
