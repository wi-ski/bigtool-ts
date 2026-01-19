/**
 * ToolLoader - Lazy loading of tool implementations with LRU caching.
 *
 * Handles the "last mile" of tool loading:
 * - LocalSource: Tool already in memory, just return it
 * - MCPSource: May need to prepare the tool wrapper
 * - DynamicSource: Actually load/import the tool on demand
 */

import { LRUCache } from "lru-cache";
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
export class ToolNotFoundError extends Error {
  constructor(
    public readonly toolId: string,
    message?: string
  ) {
    super(message ?? `Tool not found: ${toolId}`);
    this.name = "ToolNotFoundError";
  }
}

/**
 * Error thrown when a source cannot be found.
 */
export class SourceNotFoundError extends Error {
  constructor(
    public readonly sourceId: string,
    public readonly toolId: string
  ) {
    super(`Source not found for tool: ${toolId} (expected source: ${sourceId})`);
    this.name = "SourceNotFoundError";
  }
}

/**
 * Default configuration values.
 */
const DEFAULTS = {
  maxCacheSize: 100,
  ttl: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * ToolLoader implementation with LRU caching and concurrent load deduplication.
 */
export class ToolLoaderImpl implements ToolLoader {
  private readonly cache: LRUCache<string, StructuredTool>;
  private readonly catalog: ToolCatalog;
  private readonly sources: Map<string, ToolSource>;
  private readonly loading = new Map<string, Promise<StructuredTool>>();
  private unsubscribe?: () => void;

  constructor(config: ToolLoaderConfig) {
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
  async load(id: string): Promise<StructuredTool> {
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
    } finally {
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
  private async loadFromSource(id: string): Promise<StructuredTool> {
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
      throw new ToolNotFoundError(
        id,
        `Tool ${id} exists in catalog but source returned null`
      );
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
  async warmup(ids: string[]): Promise<void> {
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
  evict(id: string): void {
    this.cache.delete(id);
    // Also clear any in-progress loading (will be restarted on next load)
    this.loading.delete(id);
  }

  /**
   * Clear the entire cache.
   *
   * All tools will be reloaded from source on next access.
   */
  clear(): void {
    this.cache.clear();
    this.loading.clear();
  }

  /**
   * Get cache statistics for monitoring.
   */
  get stats(): { size: number; maxSize: number; loading: number } {
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
      loading: this.loading.size,
    };
  }

  /**
   * Dispose of the loader and clean up resources.
   */
  dispose(): void {
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
export function createToolLoader(config: ToolLoaderConfig): ToolLoader {
  return new ToolLoaderImpl(config);
}
