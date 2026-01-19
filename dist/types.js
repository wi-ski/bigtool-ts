/**
 * Core type definitions for bigtool-ts.
 *
 * This module defines the fundamental interfaces that power the tool discovery
 * system: sources, catalogs, loaders, search, and events.
 *
 * @module types
 */
/**
 * Creates a simple typed event emitter.
 *
 * @typeParam T - The event payload type
 * @returns A new EventEmitter instance
 *
 * @example
 * ```typescript
 * interface MyEvent {
 *   type: string;
 *   data: unknown;
 * }
 *
 * const emitter = createEventEmitter<MyEvent>();
 *
 * emitter.on((event) => {
 *   console.log(event.type, event.data);
 * });
 *
 * await emitter.emit({ type: 'test', data: { foo: 'bar' } });
 * ```
 */
export function createEventEmitter() {
    let handlers = [];
    const subscribe = (handler) => {
        handlers = [...handlers, handler];
        let unsubscribed = false;
        return () => {
            if (unsubscribed)
                return;
            unsubscribed = true;
            handlers = handlers.filter((h) => h !== handler);
        };
    };
    return {
        subscribe,
        on: subscribe,
        async emit(event) {
            const currentHandlers = handlers;
            for (const handler of currentHandlers) {
                try {
                    await handler(event);
                }
                catch (err) {
                    // Log but don't break the event chain
                    console.error('[EventEmitter] Handler error:', err instanceof Error ? err.message : err);
                }
            }
        },
        subscriberCount() {
            return handlers.length;
        },
        clear() {
            handlers = [];
        },
    };
}
/**
 * Attach enhancement metadata to a tool.
 *
 * This is a fluent helper that adds search optimization hints
 * to a StructuredTool. The metadata is used during indexing
 * to improve search results.
 *
 * @typeParam T - The tool type (must extend StructuredTool)
 * @param tool - The tool to enhance
 * @param metadata - Enhancement metadata (categories, keywords)
 * @returns The same tool instance with metadata attached
 *
 * @example
 * ```typescript
 * import { withMetadata } from '@repo/bigtool-ts';
 *
 * const createPRTool = new DynamicStructuredTool({
 *   name: 'create_pr',
 *   description: 'Creates a GitHub pull request',
 *   schema: z.object({ title: z.string() }),
 *   func: async (input) => { ... },
 * });
 *
 * const enhanced = withMetadata(createPRTool, {
 *   categories: ['github', 'git'],
 *   keywords: ['PR', 'pull request', 'merge'],
 * });
 *
 * // Use in a LocalSource
 * const source = new LocalSource([enhanced]);
 * ```
 */
export function withMetadata(tool, metadata) {
    const enhanced = tool;
    enhanced.__bigtool_metadata = metadata;
    return enhanced;
}
//# sourceMappingURL=types.js.map