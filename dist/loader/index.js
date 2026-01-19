/**
 * ToolLoader module.
 *
 * Provides lazy loading of tool implementations with LRU caching.
 * The loader bridges the gap between tool metadata (catalog) and
 * actual tool implementations (sources).
 *
 * @module loader
 */
import { LRUCache } from 'lru-cache';
// Re-export errors from loader.ts
export { ToolNotFoundError, SourceNotFoundError } from './loader.js';
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
export class DefaultToolLoader {
    /** @internal The tool catalog for metadata lookup */
    catalog;
    /** @internal LRU cache for loaded tools */
    cache;
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
    constructor(catalog, options = {}) {
        this.catalog = catalog;
        this.cache = new LRUCache({
            max: options.maxSize ?? 100,
            ttl: options.ttl,
        });
    }
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
    async load(id) {
        // Check cache first
        const cached = this.cache.get(id);
        if (cached) {
            return cached;
        }
        // Get metadata to find the source
        const metadata = this.catalog.getMetadata(id);
        if (!metadata) {
            throw new Error(`ToolLoader: Unknown tool '${id}'`);
        }
        // Get the source
        const source = this.catalog.getSource(metadata.sourceId);
        if (!source) {
            throw new Error(`ToolLoader: No source found for tool '${id}'`);
        }
        // Load from source
        const tool = await source.getTool(id);
        if (!tool) {
            throw new Error(`ToolLoader: Source returned null for tool '${id}'`);
        }
        // Cache and return
        this.cache.set(id, tool);
        return tool;
    }
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
    async warmup(ids) {
        await Promise.all(ids.map(id => this.load(id).catch(() => null)));
    }
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
    evict(id) {
        this.cache.delete(id);
    }
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
    clear() {
        this.cache.clear();
    }
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
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.cache.max,
        };
    }
}
//# sourceMappingURL=index.js.map