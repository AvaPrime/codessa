import { ForesightEvent } from './interfaces/types';
import EventEmitter from 'events';

class ForesightEventSystem extends EventEmitter {
  public emitForesightEvent(event: ForesightEvent): boolean {
    return this.emit(event.type, event);
  }

  public onForesightEvent(eventType: ForesightEvent['type'], listener: (event: ForesightEvent) => void): void {
    this.on(eventType, listener);
  }
}

const foresightEventEmitter = new ForesightEventSystem();

export { foresightEventEmitter, ForesightEventSystem };
