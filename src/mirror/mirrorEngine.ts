// src/mirror/mirrorEngine.ts

import { v4 as uuidv4 } from 'uuid';

export type MirrorEventType =
  | 'memory:read'
  | 'memory:write'
  | 'task:planned'
  | 'task:executed'
  | 'agent:delegated'
  | 'agent:responded'
  | 'error:exception'
  | 'system:heartbeat';

export interface MirrorEvent {
  id: string;
  type: MirrorEventType;
  timestamp: number;
  origin: string; // module or agent name
  payload: any;
}

export class MirrorEngine {
  private eventLog: MirrorEvent[] = [];

  public logEvent(type: MirrorEventType, origin: string, payload: any): void {
    const event: MirrorEvent = {
      id: uuidv4(),
      type,
      timestamp: Date.now(),
      origin,
      payload,
    };

    this.eventLog.push(event);

    // Optional: emit to a log stream or write to disk
    console.log(`[MirrorEngine] ${type} from ${origin}`, payload);
  }

  public getRecentEvents(limit: number = 50): MirrorEvent[] {
    return this.eventLog.slice(-limit).reverse();
  }

  public getEventsByType(type: MirrorEventType): MirrorEvent[] {
    return this.eventLog.filter(event => event.type === type);
  }

  public clear(): void {
    this.eventLog = [];
  }
}

