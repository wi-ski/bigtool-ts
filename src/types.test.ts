/**
 * Tests for core type utilities.
 */

import { describe, it, expect, vi } from 'vitest';
import { createEventEmitter, type EventHandler } from './types.js';

interface TestEvent {
  type: string;
  data: unknown;
}

describe('createEventEmitter', () => {
  describe('subscribe', () => {
    it('should call handler when event is emitted', async () => {
      const emitter = createEventEmitter<TestEvent>();
      const handler = vi.fn();

      emitter.subscribe(handler);
      await emitter.emit({ type: 'test', data: { foo: 'bar' } });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ type: 'test', data: { foo: 'bar' } });
    });

    it('should support multiple subscribers', async () => {
      const emitter = createEventEmitter<TestEvent>();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      emitter.subscribe(handler1);
      emitter.subscribe(handler2);
      emitter.subscribe(handler3);

      await emitter.emit({ type: 'test', data: null });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', async () => {
      const emitter = createEventEmitter<TestEvent>();
      const handler = vi.fn();

      const unsubscribe = emitter.subscribe(handler);
      await emitter.emit({ type: 'before', data: null });
      
      unsubscribe();
      await emitter.emit({ type: 'after', data: null });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ type: 'before', data: null });
    });

    it('should allow multiple unsubscribe calls safely', async () => {
      const emitter = createEventEmitter<TestEvent>();
      const handler = vi.fn();

      const unsubscribe = emitter.subscribe(handler);
      unsubscribe();
      unsubscribe(); // Second call should be a no-op
      unsubscribe(); // Third call should also be safe

      await emitter.emit({ type: 'test', data: null });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('on', () => {
    it('should be an alias for subscribe', async () => {
      const emitter = createEventEmitter<TestEvent>();
      const handler = vi.fn();

      emitter.on(handler);
      await emitter.emit({ type: 'test', data: null });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('emit', () => {
    it('should handle async handlers', async () => {
      const emitter = createEventEmitter<TestEvent>();
      const order: number[] = [];

      emitter.subscribe(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        order.push(1);
      });

      emitter.subscribe(async () => {
        order.push(2);
      });

      await emitter.emit({ type: 'test', data: null });

      // Handlers are called sequentially
      expect(order).toEqual([1, 2]);
    });

    it('should catch handler errors and continue to next handler', async () => {
      const emitter = createEventEmitter<TestEvent>();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const handler1 = vi.fn();
      const handler2 = vi.fn(() => {
        throw new Error('Handler 2 failed');
      });
      const handler3 = vi.fn();

      emitter.subscribe(handler1);
      emitter.subscribe(handler2);
      emitter.subscribe(handler3);

      await emitter.emit({ type: 'test', data: null });

      // All handlers should be called despite error in handler2
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);

      // Error should be logged
      expect(consoleSpy).toHaveBeenCalledWith(
        '[EventEmitter] Handler error:',
        'Handler 2 failed'
      );

      consoleSpy.mockRestore();
    });

    it('should handle async handler errors', async () => {
      const emitter = createEventEmitter<TestEvent>();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const handler1 = vi.fn();
      const handler2 = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        throw new Error('Async failure');
      });
      const handler3 = vi.fn();

      emitter.subscribe(handler1);
      emitter.subscribe(handler2);
      emitter.subscribe(handler3);

      await emitter.emit({ type: 'test', data: null });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[EventEmitter] Handler error:',
        'Async failure'
      );

      consoleSpy.mockRestore();
    });

    it('should handle non-Error thrown values', async () => {
      const emitter = createEventEmitter<TestEvent>();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      emitter.subscribe(() => {
        throw 'string error';
      });

      await emitter.emit({ type: 'test', data: null });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[EventEmitter] Handler error:',
        'string error'
      );

      consoleSpy.mockRestore();
    });

    it('should work with empty subscriber list', async () => {
      const emitter = createEventEmitter<TestEvent>();

      // Should not throw
      await emitter.emit({ type: 'test', data: null });
    });
  });

  describe('subscriberCount', () => {
    it('should return 0 for new emitter', () => {
      const emitter = createEventEmitter<TestEvent>();
      expect(emitter.subscriberCount()).toBe(0);
    });

    it('should return correct count after subscriptions', () => {
      const emitter = createEventEmitter<TestEvent>();
      
      emitter.subscribe(() => {});
      expect(emitter.subscriberCount()).toBe(1);
      
      emitter.subscribe(() => {});
      expect(emitter.subscriberCount()).toBe(2);
    });

    it('should decrease count after unsubscribe', () => {
      const emitter = createEventEmitter<TestEvent>();
      
      const unsub1 = emitter.subscribe(() => {});
      emitter.subscribe(() => {});
      expect(emitter.subscriberCount()).toBe(2);
      
      unsub1();
      expect(emitter.subscriberCount()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should remove all subscribers', async () => {
      const emitter = createEventEmitter<TestEvent>();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.subscribe(handler1);
      emitter.subscribe(handler2);
      expect(emitter.subscriberCount()).toBe(2);

      emitter.clear();
      expect(emitter.subscriberCount()).toBe(0);

      await emitter.emit({ type: 'test', data: null });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('type safety', () => {
    it('should enforce event type', async () => {
      interface CustomEvent {
        id: number;
        message: string;
      }

      const emitter = createEventEmitter<CustomEvent>();
      const handler: EventHandler<CustomEvent> = vi.fn();

      emitter.subscribe(handler);
      await emitter.emit({ id: 42, message: 'hello' });

      expect(handler).toHaveBeenCalledWith({ id: 42, message: 'hello' });
    });
  });
});
