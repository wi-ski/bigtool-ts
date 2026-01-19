/**
 * DynamicSource module.
 *
 * Provides a ToolSource implementation for lazy-loading tools that
 * aren't stored in memory.
 *
 * @module sources/dynamic
 */
/**
 * DynamicSource provides lazy-loaded tools.
 *
 * Metadata is provided upfront for indexing and search, but actual
 * tool implementations are loaded on-demand via a loader function.
 *
 * This is useful for:
 * - Large tool collections where loading all tools upfront is expensive
 * - Tools that require dynamic initialization or configuration
 * - Plugin systems where tools are loaded from external sources
 * - Code-split modules that shouldn't be loaded until needed
 *
 * @example Basic usage
 * ```typescript
 * import { DynamicSource } from '@repo/bigtool-ts';
 *
 * const source = new DynamicSource({
 *   metadata: [
 *     {
 *       id: 'heavy-tool',
 *       name: 'heavy-tool',
 *       description: 'A tool that takes a long time to load',
 *       source: 'dynamic',
 *       sourceId: 'dynamic',
 *     },
 *   ],
 *   loader: async (id) => {
 *     // Only loaded when actually needed
 *     const { createHeavyTool } = await import('./heavy-tool.js');
 *     return createHeavyTool();
 *   },
 * });
 *
 * await catalog.register(source);
 * ```
 *
 * @example Plugin system
 * ```typescript
 * // Load plugin manifest
 * const plugins = await loadPluginManifest();
 *
 * const source = new DynamicSource({
 *   metadata: plugins.map(p => ({
 *     id: p.name,
 *     name: p.name,
 *     description: p.description,
 *     categories: p.categories,
 *     source: 'dynamic',
 *     sourceId: 'dynamic',
 *   })),
 *   loader: async (name) => {
 *     return await loadPlugin(name);
 *   },
 * });
 * ```
 */
export class DynamicSource {
    /**
     * Unique identifier for this source.
     *
     * Always 'dynamic' for DynamicSource instances.
     */
    id = "dynamic";
    /** @internal Cached metadata */
    metadata;
    /** @internal Loader function */
    loader;
    /** @internal Map for fast metadata lookup */
    metadataMap;
    /**
     * Creates a new DynamicSource.
     *
     * @param config - Configuration with metadata and loader function
     *
     * @example
     * ```typescript
     * const source = new DynamicSource({
     *   metadata: toolMetadata,
     *   loader: async (id) => loadTool(id),
     * });
     * ```
     */
    constructor(config) {
        // Normalize metadata to ensure correct ID format and source
        this.metadata = config.metadata.map((m) => ({
            ...m,
            id: m.id.startsWith("dynamic:") ? m.id : `dynamic:${m.id}`,
            source: "dynamic",
            sourceId: this.id,
        }));
        // Build lookup map for efficient access
        this.metadataMap = new Map(this.metadata.map((m) => [this.extractName(m.id), m]));
        this.loader = config.loader;
    }
    /**
     * Get metadata for all tools.
     *
     * Returns the pre-configured metadata immediately without any
     * network or async operations. This makes indexing fast.
     *
     * @returns Promise resolving to array of tool metadata
     *
     * @example
     * ```typescript
     * const metadata = await source.getMetadata();
     * console.log(`${metadata.length} dynamic tools available`);
     * ```
     */
    async getMetadata() {
        return this.metadata;
    }
    /**
     * Get a tool by its ID.
     *
     * Delegates to the loader function provided at construction.
     * Returns null if the tool ID is not in the metadata.
     *
     * @param id - Tool ID ('dynamic:name' or bare 'name')
     * @returns Promise resolving to the loaded tool, or null if not found
     * @throws DynamicSourceError if the loader function fails
     *
     * @example
     * ```typescript
     * const tool = await source.getTool('my-plugin');
     * if (tool) {
     *   const result = await tool.invoke(input);
     * }
     * ```
     */
    async getTool(id) {
        const name = this.extractName(id);
        // Check if tool exists in our metadata
        if (!this.metadataMap.has(name)) {
            return null;
        }
        try {
            return await this.loader(name);
        }
        catch (error) {
            // Re-throw with context
            const message = error instanceof Error ? error.message : String(error);
            throw new DynamicSourceError(`Failed to load dynamic tool "${name}": ${message}`, { cause: error });
        }
    }
    /**
     * Extract the tool name from an ID.
     *
     * @internal
     * @param id - Full or bare tool ID
     * @returns Bare tool name
     */
    extractName(id) {
        return id.startsWith("dynamic:") ? id.slice(8) : id;
    }
}
/**
 * Error thrown when dynamic tool loading fails.
 *
 * This error wraps any error thrown by the loader function,
 * adding context about which tool failed to load.
 *
 * @example
 * ```typescript
 * try {
 *   const tool = await source.getTool('broken-plugin');
 * } catch (error) {
 *   if (error instanceof DynamicSourceError) {
 *     console.error('Plugin failed to load:', error.message);
 *     console.error('Original error:', error.cause);
 *   }
 * }
 * ```
 */
export class DynamicSourceError extends Error {
    /**
     * Creates a new DynamicSourceError.
     *
     * @param message - Error message with context
     * @param options - Error options (e.g., cause)
     */
    constructor(message, options) {
        super(message, options);
        this.name = "DynamicSourceError";
    }
}
//# sourceMappingURL=dynamic.js.map