/**
 * ToolLoader - Lazy loading of tool implementations with LRU caching.
 *
 * Handles the "last mile" of tool loading:
 * - LocalSource: Tool already in memory, just return it
 * - MCPSource: May need to prepare the tool wrapper
 * - DynamicSource: Actually load/import the tool on demand
 */
import type { StructuredTool } from "@langchain/core/tools";
import type { ToolCatalog, ToolSource, ToolLoader } from "../types.js";
/**
 * Configuration for ToolLoader.
 */
export interface ToolLoaderConfig {
    /** Maximum number of tools to cache (default: 100) */
    maxCacheSize?: number;
    /** Time-to-live for cached tools in milliseconds (default: 5 minutes) */
    ttl?: number;
    /** The tool catalog to use for metadata */
    catalog: ToolCatalog;
    /** Map of source ID to source implementation */
    sources: Map<string, ToolSource>;
}
/**
 * Error thrown when a tool cannot be found.
 */
export declare class ToolNotFoundError extends Error {
    readonly toolId: string;
    constructor(toolId: string, message?: string);
}
/**
 * Error thrown when a source cannot be found.
 */
export declare class SourceNotFoundError extends Error {
    readonly sourceId: string;
    readonly toolId: string;
    constructor(sourceId: string, toolId: string);
}
/**
 * ToolLoader implementation with LRU caching and concurrent load deduplication.
 */
export declare class ToolLoaderImpl implements ToolLoader {
    private readonly cache;
    private readonly catalog;
    private readonly sources;
    private readonly loading;
    private unsubscribe?;
    constructor(config: ToolLoaderConfig);
    /**
     * Load a tool by ID.
     *
     * Uses LRU cache for performance. Concurrent requests for the same
     * tool are deduplicated to prevent multiple loads.
     *
     * @param id - The tool ID to load
     * @returns The loaded StructuredTool
     * @throws ToolNotFoundError if the tool doesn't exist
     * @throws SourceNotFoundError if the tool's source isn't registered
     */
    load(id: string): Promise<StructuredTool>;
    /**
     * Load a tool from its source.
     *
     * @param id - The tool ID to load
     * @returns The loaded StructuredTool
     * @throws ToolNotFoundError if the tool doesn't exist
     * @throws SourceNotFoundError if the tool's source isn't registered
     */
    private loadFromSource;
    /**
     * Pre-load multiple tools in parallel.
     *
     * This is useful for warming up the cache before a batch of operations.
     * Errors are silently ignored - check individual tools with load() if
     * you need error handling.
     *
     * @param ids - Array of tool IDs to pre-load
     */
    warmup(ids: string[]): Promise<void>;
    /**
     * Remove a tool from the cache.
     *
     * The tool will be reloaded from source on next access.
     *
     * @param id - The tool ID to evict
     */
    evict(id: string): void;
    /**
     * Clear the entire cache.
     *
     * All tools will be reloaded from source on next access.
     */
    clear(): void;
    /**
     * Get cache statistics for monitoring.
     */
    get stats(): {
        size: number;
        maxSize: number;
        loading: number;
    };
    /**
     * Dispose of the loader and clean up resources.
     */
    dispose(): void;
}
/**
 * Create a new ToolLoader instance.
 *
 * @param config - Loader configuration
 * @returns A new ToolLoader instance
 */
export declare function createToolLoader(config: ToolLoaderConfig): ToolLoader;
//# sourceMappingURL=loader.d.ts.map