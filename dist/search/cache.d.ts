/**
 * Embedding Cache Implementations
 *
 * Caches computed embeddings to avoid expensive recomputation.
 * Embeddings are relatively stable - tool descriptions don't change often.
 */
import type { EmbeddingCache } from "./types.js";
/**
 * Simple in-memory cache using a Map.
 * Good for development and single-process deployments.
 * Cache is lost on process restart.
 */
export declare class MemoryCache implements EmbeddingCache {
    private cache;
    constructor();
    get(toolId: string): Promise<number[] | null>;
    set(toolId: string, embedding: number[]): Promise<void>;
    invalidate(toolId: string): Promise<void>;
    clear(): Promise<void>;
    /**
     * Get the current size of the cache
     */
    get size(): number;
    /**
     * Check if a tool ID exists in cache
     */
    has(toolId: string): boolean;
    /**
     * Get all cached tool IDs
     */
    keys(): string[];
}
/**
 * LRU (Least Recently Used) cache with configurable max size.
 * Automatically evicts oldest entries when capacity is reached.
 */
export declare class LRUCache implements EmbeddingCache {
    private cache;
    private readonly maxSize;
    constructor(maxSize?: number);
    get(toolId: string): Promise<number[] | null>;
    set(toolId: string, embedding: number[]): Promise<void>;
    invalidate(toolId: string): Promise<void>;
    clear(): Promise<void>;
    /**
     * Get the current size of the cache
     */
    get size(): number;
}
/**
 * Configuration for Redis cache
 */
export interface RedisCacheConfig {
    /** Redis connection URL */
    url: string;
    /** Key prefix for namespacing (default: "bigtool:embeddings:") */
    prefix?: string;
    /** TTL in seconds (default: no expiry) */
    ttl?: number;
}
/**
 * Redis-based cache for production deployments.
 *
 * NOTE: This is a stub implementation. To use Redis caching,
 * install the `redis` package and implement the actual Redis client.
 */
export declare class RedisCache implements EmbeddingCache {
    private readonly config;
    private memoryFallback;
    constructor(config: RedisCacheConfig);
    get(toolId: string): Promise<number[] | null>;
    set(toolId: string, embedding: number[]): Promise<void>;
    invalidate(toolId: string): Promise<void>;
    clear(): Promise<void>;
}
//# sourceMappingURL=cache.d.ts.map