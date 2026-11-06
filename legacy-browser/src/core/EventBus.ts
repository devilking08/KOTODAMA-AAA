import type { GameEventMap, GameEventName } from '../types';

type Handler<K extends GameEventName> = (payload: GameEventMap[K]) => void;

/**
 * Tiny typed event bus. Systems never reach into each other's fields; they
 * emit facts ("enemy died", "quest advanced") and the UI/audio layers react.
 */
export class EventBus {
  private handlers = new Map<string, Set<(payload: unknown) => void>>();
  private anyHandlers = new Set<(name: string, payload: unknown) => void>();

  on<K extends GameEventName>(event: K, handler: Handler<K>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as (payload: unknown) => void);
    return () => this.off(event, handler);
  }

  once<K extends GameEventName>(event: K, handler: Handler<K>): () => void {
    const off = this.on(event, (payload) => {
      off();
      handler(payload);
    });
    return off;
  }

  off<K extends GameEventName>(event: K, handler: Handler<K>): void {
    this.handlers.get(event)?.delete(handler as (payload: unknown) => void);
  }

  onAny(handler: (name: string, payload: unknown) => void): () => void {
    this.anyHandlers.add(handler);
    return () => this.anyHandlers.delete(handler);
  }

  emit<K extends GameEventName>(event: K, payload: GameEventMap[K]): void {
    const set = this.handlers.get(event);
    if (set) {
      for (const handler of [...set]) {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[EventBus] handler for ${event} failed`, error);
        }
      }
    }
    for (const handler of [...this.anyHandlers]) {
      try {
        handler(event, payload);
      } catch (error) {
        console.error('[EventBus] any-handler failed', error);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
    this.anyHandlers.clear();
  }
}
