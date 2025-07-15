import { EventEmitter } from 'events';

export interface MemoryEntry {
  id: string;
  type: string;
  content: any;
  agent?: string;
  task_id?: string;
  timestamp: string;
  metadata?: any;
}

export class MemoryManager extends EventEmitter {
  private storage: Map<string, MemoryEntry> = new Map();
  private initialized: boolean = false;

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    console.log('🧠 Initializing Memory Manager...');
    this.initialized = true;
    console.log('✅ Memory Manager initialized');
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Memory Manager...');
    this.initialized = false;
    this.storage.clear();
    console.log('✅ Memory Manager shutdown complete');
  }

  async store(data: MemoryEntry): Promise<void> {
    if (!this.initialized) {
      throw new Error('Memory Manager not initialized');
    }

    const id = data.id || `memory-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const entry: MemoryEntry = {
      ...data,
      id,
      timestamp: data.timestamp || new Date().toISOString()
    };

    this.storage.set(id, entry);
    this.emit('memory.stored', entry);
  }

  async search(query: string): Promise<MemoryEntry[]> {
    if (!this.initialized) {
      throw new Error('Memory Manager not initialized');
    }

    const results: MemoryEntry[] = [];
    const queryLower = query.toLowerCase();

    for (const entry of this.storage.values()) {
      const contentStr = JSON.stringify(entry.content).toLowerCase();
      const typeStr = entry.type.toLowerCase();
      
      if (contentStr.includes(queryLower) || typeStr.includes(queryLower)) {
        results.push(entry);
      }
    }

    return results.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async get(id: string): Promise<MemoryEntry | null> {
    if (!this.initialized) {
      throw new Error('Memory Manager not initialized');
    }

    return this.storage.get(id) || null;
  }

  async delete(id: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Memory Manager not initialized');
    }

    const deleted = this.storage.delete(id);
    if (deleted) {
      this.emit('memory.deleted', id);
    }
    return deleted;
  }

  async clear(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Memory Manager not initialized');
    }

    this.storage.clear();
    this.emit('memory.cleared');
  }

  getStats(): { totalEntries: number; memoryUsage: number } {
    return {
      totalEntries: this.storage.size,
      memoryUsage: JSON.stringify(Array.from(this.storage.values())).length
    };
  }
}
