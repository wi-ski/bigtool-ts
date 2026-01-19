/**
 * ToolLoader module.
 *
 * Provides lazy loading of tool implementations with LRU caching.
 * The loader bridges the gap between tool metadata (catalog) and
 * actual tool implementations (sources).
 *
 * @module loader
 */
import type { StructuredTool } from '@langchain/core/tools';
import type { ToolLoader, ToolCatalog } from '../types.js';
export { ToolNotFoundError, SourceNotFoundError } from './loader.js';
/**
 * Configuration options for DefaultToolLoader.
 *
 * @example
 * ```typescript
 * const options: ToolLoaderOptions = {
 *   maxSize: 50,    // Cache up to 50 tools
 *   ttl: 300000,    // Expire after 5 minutes
 * };
 * ```
 */
export interface ToolLoaderOptions {
    /**
     * Maximum number of tools to cache.
     *
     * When the limit is reached, least recently used tools are evicted.
     *
     * @default 100
     */
    maxSize?: number;
    /**
     * Time-to-live for cached tools in milliseconds.
     *
     * After this time, tools are evicted from cache and reloaded
     * from source on next access.
     *
     * @default undefined (no expiry)
     */
    ttl?: number;
}
/**
 * Default tool loader with LRU caching.
 *
 * Caches loaded tools to avoid repeated loading from sources.
 * Uses an LRU (Least Recently Used) eviction policy when the
 * cache is full.
 *
 * The loader:
 * 1. Checks cache for existing tool
 * 2. If not cached, looks up metadata in catalog
 * 3. Gets the source from the catalog
 * 4. Loads the tool from the source
 * 5. Caches and returns the tool
 *
 * @example Basic usage
 * ```typescript
 * import { DefaultToolLoader } from 'bigtool-ts';
 *
 * const loader = new DefaultToolLoader(catalog, { maxSize: 50 });
 *
 * // Load a tool
 * const tool = await loader.load('github:create_pr');
 *
 * // Tool is now cached - subsequent loads are instant
 * const sameTool = await loader.load('github:create_pr');
 * ```
 *
 * @example With TTL
 * ```typescript
 * const loader = new DefaultToolLoader(catalog, {
 *   maxSize: 100,
 *   ttl: 5 * 60 * 1000, // 5 minutes
 * });
 * ```
 */
export declare class DefaultToolLoader implements ToolLoader {
    /** @internal The tool catalog for metadata lookup */
    private catalog;
    /** @internal LRU cache for loaded tools */
    private cache;
    /**
     * Creates a new DefaultToolLoader.
     *
     * @param catalog - The tool catalog for metadata and source lookup
     * @param options - Cache configuration options
     *
     * @example
     * ```typescript
     * const loader = new DefaultToolLoader(catalog);
     * const loaderWithOptions = new DefaultToolLoader(catalog, { maxSize: 50 });
     * ```
     */
    constructor(catalog: ToolCatalog, options?: ToolLoaderOptions);
    /**
     * Load a tool by ID.
     *
     * Returns cached tool if available, otherwise loads from source.
     *
     * @param id - The tool ID to load
     * @returns Promise resolving to the loaded tool
     * @throws Error if tool not found in catalog or source returns null
     *
     * @example
     * ```typescript
     * const tool = await loader.load('github:create_pr');
     * const result = await tool.invoke({ title: 'My PR' });
     * ```
     */
    load(id: string): Promise<StructuredTool>;
    /**
     * Pre-load multiple tools in parallel.
     *
     * Useful for warming up the cache before a batch of operations.
     * Errors are silently ignored—use load() for error handling.
     *
     * @param ids - Array of tool IDs to pre-load
     *
     * @example
     * ```typescript
     * // Warm up cache with expected tools
     * await loader.warmup([
     *   'github:create_pr',
     *   'github:list_repos',
     *   'github:get_issues',
     * ]);
     * ```
     */
    warmup(ids: string[]): Promise<void>;
    /**
     * Remove a tool from the cache.
     *
     * The tool will be reloaded from source on next access.
     *
     * @param id - The tool ID to evict
     *
     * @example
     * ```typescript
     * // Invalidate after tool update
     * loader.evict('github:create_pr');
     * ```
     */
    evict(id: string): void;
    /**
     * Clear the entire cache.
     *
     * All tools will be reloaded from source on next access.
     *
     * @example
     * ```typescript
     * // Clear cache after major changes
     * loader.clear();
     * ```
     */
    clear(): void;
    /**
     * Get cache statistics for monitoring.
     *
     * @returns Object with current size and max size
     *
     * @example
     * ```typescript
     * const stats = loader.getStats();
     * console.log(`Cache: ${stats.size}/${stats.maxSize}`);
     * ```
     */
    getStats(): {
        size: number;
        maxSize: number;
    };
}
//# sourceMappingURL=index.d.ts.map