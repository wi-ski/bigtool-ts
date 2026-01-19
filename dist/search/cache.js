/**
 * Embedding Cache Implementations
 *
 * Caches computed embeddings to avoid expensive recomputation.
 * Embeddings are relatively stable - tool descriptions don't change often.
 */
// ═══════════════════════════════════════════════════════════════════════════
// Memory Cache - In-memory Map-based cache
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Simple in-memory cache using a Map.
 * Good for development and single-process deployments.
 * Cache is lost on process restart.
 */
export class MemoryCache {
    cache;
    constructor() {
        this.cache = new Map();
    }
    async get(toolId) {
        const embedding = this.cache.get(toolId);
        return embedding ?? null;
    }
    async set(toolId, embedding) {
        this.cache.set(toolId, embedding);
    }
    async invalidate(toolId) {
        this.cache.delete(toolId);
    }
    async clear() {
        this.cache.clear();
    }
    /**
     * Get the current size of the cache
     */
    get size() {
        return this.cache.size;
    }
    /**
     * Check if a tool ID exists in cache
     */
    has(toolId) {
        return this.cache.has(toolId);
    }
    /**
     * Get all cached tool IDs
     */
    keys() {
        return Array.from(this.cache.keys());
    }
}
// ═══════════════════════════════════════════════════════════════════════════
// LRU Cache - Memory cache with size limit
// ═══════════════════════════════════════════════════════════════════════════
/**
 * LRU (Least Recently Used) cache with configurable max size.
 * Automatically evicts oldest entries when capacity is reached.
 */
export class LRUCache {
    cache;
    maxSize;
    constructor(maxSize = 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    async get(toolId) {
        const embedding = this.cache.get(toolId);
        if (embedding !== undefined) {
            // Move to end (most recently used)
            this.cache.delete(toolId);
            this.cache.set(toolId, embedding);
            return embedding;
        }
        return null;
    }
    async set(toolId, embedding) {
        // If key exists, delete it first to update position
        if (this.cache.has(toolId)) {
            this.cache.delete(toolId);
        }
        // Evict oldest entries if at capacity
        while (this.cache.size >= this.maxSize) {
            const oldest = this.cache.keys().next().value;
            if (oldest !== undefined) {
                this.cache.delete(oldest);
            }
        }
        this.cache.set(toolId, embedding);
    }
    async invalidate(toolId) {
        this.cache.delete(toolId);
    }
    async clear() {
        this.cache.clear();
    }
    /**
     * Get the current size of the cache
     */
    get size() {
        return this.cache.size;
    }
}
/**
 * Redis-based cache for production deployments.
 *
 * NOTE: This is a stub implementation. To use Redis caching,
 * install the `redis` package and implement the actual Redis client.
 */
export class RedisCache {
    config;
    memoryFallback;
    constructor(config) {
        this.config = {
            url: config.url,
            prefix: config.prefix ?? "bigtool:embeddings:",
            ttl: config.ttl ?? 0,
        };
        // Use memory fallback until Redis is actually implemented
        this.memoryFallback = new MemoryCache();
        console.warn("[RedisCache] Using memory fallback. Install 'redis' package and implement client for production use.");
    }
    async get(toolId) {
        return this.memoryFallback.get(toolId);
    }
    async set(toolId, embedding) {
        return this.memoryFallback.set(toolId, embedding);
    }
    async invalidate(toolId) {
        return this.memoryFallback.invalidate(toolId);
    }
    async clear() {
        return this.memoryFallback.clear();
    }
}
//# sourceMappingURL=cache.js.map