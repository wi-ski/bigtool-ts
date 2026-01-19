/**
 * ToolLoader - Lazy loading of tool implementations with LRU caching.
 *
 * Handles the "last mile" of tool loading:
 * - LocalSource: Tool already in memory, just return it
 * - MCPSource: May need to prepare the tool wrapper
 * - DynamicSource: Actually load/import the tool on demand
 */
import { LRUCache } from "lru-cache";
/**
 * Error thrown when a tool cannot be found.
 */
export class ToolNotFoundError extends Error {
    toolId;
    constructor(toolId, message) {
        super(message ?? `Tool not found: ${toolId}`);
        this.toolId = toolId;
        this.name = "ToolNotFoundError";
    }
}
/**
 * Error thrown when a source cannot be found.
 */
export class SourceNotFoundError extends Error {
    sourceId;
    toolId;
    constructor(sourceId, toolId) {
        super(`Source not found for tool: ${toolId} (expected source: ${sourceId})`);
        this.sourceId = sourceId;
        this.toolId = toolId;
        this.name = "SourceNotFoundError";
    }
}
/**
 * Default configuration values.
 */
const DEFAULTS = {
    maxCacheSize: 100,
    ttl: 5 * 60 * 1000, // 5 minutes
};
/**
 * ToolLoader implementation with LRU caching and concurrent load deduplication.
 */
export class ToolLoaderImpl {
    cache;
    catalog;
    sources;
    loading = new Map();
    unsubscribe;
    constructor(config) {
        this.cache = new LRUCache({
            max: config.maxCacheSize ?? DEFAULTS.maxCacheSize,
            ttl: config.ttl ?? DEFAULTS.ttl,
        });
        this.catalog = config.catalog;
        this.sources = config.sources;
        // Listen for catalog changes to invalidate cache
        this.unsubscribe = this.catalog.onToolsChanged.subscribe(({ removed }) => {
            for (const id of removed) {
                this.evict(id);
            }
        });
    }
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
    async load(id) {
        // 1. Check cache first
        const cached = this.cache.get(id);
        if (cached) {
            return cached;
        }
        // 2. Check if already loading (dedup concurrent requests)
        const existing = this.loading.get(id);
        if (existing) {
            return existing;
        }
        // 3. Load from source
        const loadPromise = this.loadFromSource(id);
        this.loading.set(id, loadPromise);
        try {
            const tool = await loadPromise;
            this.cache.set(id, tool);
            return tool;
        }
        finally {
            this.loading.delete(id);
        }
    }
    /**
     * Load a tool from its source.
     *
     * @param id - The tool ID to load
     * @returns The loaded StructuredTool
     * @throws ToolNotFoundError if the tool doesn't exist
     * @throws SourceNotFoundError if the tool's source isn't registered
     */
    async loadFromSource(id) {
        // Get metadata to find the source
        const metadata = this.catalog.getMetadata(id);
        if (!metadata) {
            throw new ToolNotFoundError(id);
        }
        // Get the source
        const source = this.sources.get(metadata.sourceId);
        if (!source) {
            throw new SourceNotFoundError(metadata.sourceId, id);
        }
        // Load from source
        const tool = await source.getTool(id);
        if (!tool) {
            throw new ToolNotFoundError(id, `Tool ${id} exists in catalog but source returned null`);
        }
        return tool;
    }
    /**
     * Pre-load multiple tools in parallel.
     *
     * This is useful for warming up the cache before a batch of operations.
     * Errors are silently ignored - check individual tools with load() if
     * you need error handling.
     *
     * @param ids - Array of tool IDs to pre-load
     */
    async warmup(ids) {
        // Load all tools in parallel, ignoring failures
        await Promise.allSettled(ids.map((id) => this.load(id)));
    }
    /**
     * Remove a tool from the cache.
     *
     * The tool will be reloaded from source on next access.
     *
     * @param id - The tool ID to evict
     */
    evict(id) {
        this.cache.delete(id);
        // Also clear any in-progress loading (will be restarted on next load)
        this.loading.delete(id);
    }
    /**
     * Clear the entire cache.
     *
     * All tools will be reloaded from source on next access.
     */
    clear() {
        this.cache.clear();
        this.loading.clear();
    }
    /**
     * Get cache statistics for monitoring.
     */
    get stats() {
        return {
            size: this.cache.size,
            maxSize: this.cache.max,
            loading: this.loading.size,
        };
    }
    /**
     * Dispose of the loader and clean up resources.
     */
    dispose() {
        this.unsubscribe?.();
        this.clear();
    }
}
/**
 * Create a new ToolLoader instance.
 *
 * @param config - Loader configuration
 * @returns A new ToolLoader instance
 */
export function createToolLoader(config) {
    return new ToolLoaderImpl(config);
}
//# sourceMappingURL=loader.js.map