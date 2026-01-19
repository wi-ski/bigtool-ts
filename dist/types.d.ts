/**
 * Core type definitions for bigtool-ts.
 *
 * This module defines the fundamental interfaces that power the tool discovery
 * system: sources, catalogs, loaders, search, and events.
 *
 * @module types
 */
import type { StructuredTool } from "@langchain/core/tools";
/**
 * Handler function for events.
 *
 * Event handlers can be synchronous or asynchronous. Async handlers
 * are awaited before the next handler is called.
 *
 * @typeParam T - The event payload type
 *
 * @example
 * ```typescript
 * const handler: EventHandler<ToolsChangedEvent> = async (event) => {
 *   console.log('Tools added:', event.added);
 *   await updateSearchIndex(event);
 * };
 * ```
 */
export type EventHandler<T> = (event: T) => void | Promise<void>;
/**
 * Function to unsubscribe from events.
 *
 * Calling this function removes the handler from the subscriber list.
 * Safe to call multiple times (subsequent calls are no-ops).
 *
 * @example
 * ```typescript
 * const unsubscribe = emitter.subscribe(handler);
 * // Later, when done listening:
 * unsubscribe();
 * ```
 */
export type Unsubscribe = () => void;
/**
 * Simple typed event emitter for tool system events.
 *
 * Provides pub/sub functionality for reacting to changes in the tool
 * system, such as tools being added or removed from the catalog.
 *
 * @typeParam T - The event payload type
 *
 * @example
 * ```typescript
 * const emitter = createEventEmitter<ToolsChangedEvent>();
 *
 * const unsubscribe = emitter.subscribe(async (event) => {
 *   console.log('Added:', event.added.length);
 *   console.log('Removed:', event.removed.length);
 * });
 *
 * await emitter.emit({ added: ['tool1'], removed: [] });
 * unsubscribe();
 * ```
 */
export interface EventEmitter<T> {
    /**
     * Subscribe to events.
     *
     * @param handler - Function called when events are emitted
     * @returns Unsubscribe function to remove the handler
     */
    subscribe(handler: EventHandler<T>): Unsubscribe;
    /**
     * Alias for subscribe.
     *
     * @param handler - Function called when events are emitted
     * @returns Unsubscribe function to remove the handler
     */
    on(handler: EventHandler<T>): Unsubscribe;
    /**
     * Emit an event to all subscribers.
     *
     * Handlers are called sequentially and awaited. Errors in handlers
     * are caught and logged, allowing subsequent handlers to run.
     *
     * @param event - The event payload to emit
     */
    emit(event: T): Promise<void>;
    /**
     * Get the number of active subscribers.
     *
     * @returns Number of subscribed handlers
     */
    subscriberCount(): number;
    /**
     * Remove all subscribers.
     *
     * Call this when disposing of the emitter to prevent memory leaks.
     */
    clear(): void;
}
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
export declare function createEventEmitter<T>(): EventEmitter<T>;
/**
 * Metadata describing a tool for search and discovery.
 *
 * This is the lightweight representation of a tool used for indexing
 * and searching. It does not include the actual executable tool
 * implementation, which is loaded on demand via the ToolLoader.
 *
 * @example
 * ```typescript
 * const metadata: ToolMetadata = {
 *   id: 'github:create_pr',
 *   name: 'create_pr',
 *   description: 'Creates a new pull request on GitHub',
 *   parameters: {
 *     type: 'object',
 *     properties: {
 *       title: { type: 'string' },
 *       body: { type: 'string' },
 *     },
 *     required: ['title'],
 *   },
 *   categories: ['github', 'git'],
 *   keywords: ['PR', 'pull request', 'merge'],
 *   source: 'mcp',
 *   sourceId: 'mcp:github',
 * };
 * ```
 */
export interface ToolMetadata {
    /**
     * Unique identifier for the tool.
     *
     * Format is typically `sourceId:toolName` (e.g., 'local:calculator',
     * 'mcp:github:create_pr').
     */
    id: string;
    /**
     * Human-readable tool name.
     *
     * This is the name passed to the LLM and used in tool calls.
     */
    name: string;
    /**
     * Description of what the tool does.
     *
     * Used for search matching and displayed to the LLM to help
     * it decide when to use this tool.
     */
    description: string;
    /**
     * JSON Schema for tool parameters.
     *
     * Defines the expected input structure. Optional for tools
     * that take no parameters.
     */
    parameters?: Record<string, unknown>;
    /**
     * Categories for organization and filtering.
     *
     * Used to group related tools and filter search results.
     * Examples: ['github', 'git'], ['database', 'sql']
     */
    categories?: string[];
    /**
     * Additional keywords for improved search matching.
     *
     * Synonyms or related terms that help users find this tool.
     * Examples: ['PR', 'pull request'] for a create_pr tool.
     */
    keywords?: string[];
    /**
     * Source type indicating where this tool comes from.
     *
     * - 'local': In-memory StructuredTool instances
     * - 'mcp': Tools from an MCP (Model Context Protocol) server
     * - 'dynamic': Lazy-loaded tools via custom loader
     */
    source: "local" | "mcp" | "dynamic";
    /**
     * Source identifier for loading the tool.
     *
     * References the ToolSource that can provide the executable
     * tool implementation.
     */
    sourceId: string;
}
/**
 * A source of tools (local, MCP server, dynamic loader).
 *
 * Tool sources are the providers of tools in the system. Each source
 * can provide metadata for discovery and the actual tool implementations
 * when requested.
 *
 * Built-in implementations:
 * - {@link LocalSource}: In-memory StructuredTool instances
 * - {@link MCPSource}: Tools from an MCP server
 * - {@link DynamicSource}: Lazy-loaded tools via custom function
 *
 * @example Custom ToolSource implementation
 * ```typescript
 * class PluginSource implements ToolSource {
 *   readonly id = 'plugins';
 *
 *   async getMetadata(): Promise<ToolMetadata[]> {
 *     const plugins = await loadPluginManifests();
 *     return plugins.map(p => ({
 *       id: `plugins:${p.name}`,
 *       name: p.name,
 *       description: p.description,
 *       source: 'dynamic',
 *       sourceId: this.id,
 *     }));
 *   }
 *
 *   async getTool(id: string): Promise<StructuredTool | null> {
 *     const name = id.replace('plugins:', '');
 *     return loadPluginTool(name);
 *   }
 * }
 * ```
 */
export interface ToolSource {
    /**
     * Unique identifier for this source.
     *
     * Used to namespace tool IDs and locate tools during loading.
     * Examples: 'local', 'mcp:github', 'plugins'
     */
    readonly id: string;
    /**
     * Get metadata for all tools from this source.
     *
     * Called during catalog registration to index tools for search.
     * Should return quickly - avoid heavy computation here.
     *
     * @returns Promise resolving to array of tool metadata
     */
    getMetadata(): Promise<ToolMetadata[]>;
    /**
     * Get an executable tool by ID.
     *
     * Called by the ToolLoader when a tool is needed for execution.
     * May be called multiple times for the same tool (loader caches).
     *
     * @param id - The tool ID (may be prefixed with sourceId)
     * @returns Promise resolving to the tool, or null if not found
     */
    getTool(id: string): Promise<StructuredTool | null>;
    /**
     * Optional event emitter for when tools are refreshed.
     *
     * Emit events when the tool list changes (e.g., MCP server
     * reloads). The catalog listens and updates accordingly.
     */
    onRefresh?: EventEmitter<ToolMetadata[]>;
}
/**
 * Event emitted when tools in the catalog change.
 *
 * Subscribe to catalog.onToolsChanged to react to tool additions
 * or removals, such as updating a search index.
 *
 * @example
 * ```typescript
 * catalog.onToolsChanged.subscribe(async (event) => {
 *   if (event.added.length > 0) {
 *     await searchIndex.reindex();
 *   }
 *   console.log(`Added: ${event.added.length}, Removed: ${event.removed.length}`);
 * });
 * ```
 */
export interface ToolsChangedEvent {
    /**
     * Tool IDs that were added.
     *
     * Empty array if no tools were added.
     */
    added: string[];
    /**
     * Tool IDs that were removed.
     *
     * Empty array if no tools were removed.
     */
    removed: string[];
}
/**
 * The catalog is the source of truth for what tools exist.
 *
 * It aggregates tools from multiple sources and provides a unified
 * view for search indexing and tool loading. The catalog does not
 * store tool implementations—only metadata and source references.
 *
 * @example
 * ```typescript
 * const catalog = new DefaultToolCatalog();
 *
 * // Register sources
 * await catalog.register(new LocalSource(myTools));
 * await catalog.register(new MCPSource(mcpClient));
 *
 * // Query the catalog
 * const allTools = catalog.getAllMetadata();
 * const tool = catalog.getMetadata('local:calculator');
 *
 * // Listen for changes
 * catalog.onToolsChanged.subscribe((event) => {
 *   console.log('Catalog updated:', event);
 * });
 * ```
 */
export interface ToolCatalog {
    /**
     * Register a new tool source.
     *
     * Fetches metadata from the source and adds all tools to the catalog.
     * Emits a ToolsChangedEvent with the added tool IDs.
     *
     * @param source - The tool source to register
     * @throws Error if a source with the same ID is already registered
     */
    register(source: ToolSource): Promise<void>;
    /**
     * Unregister a tool source by ID.
     *
     * Removes all tools from that source and emits a ToolsChangedEvent.
     * No-op if the source ID doesn't exist.
     *
     * @param sourceId - The source ID to unregister
     */
    unregister(sourceId: string): void;
    /**
     * Get all tool metadata in the catalog.
     *
     * Returns a snapshot of all currently registered tools.
     *
     * @returns Array of all tool metadata
     */
    getAllMetadata(): ToolMetadata[];
    /**
     * Get metadata for a specific tool.
     *
     * @param id - The tool ID to look up
     * @returns Tool metadata, or null if not found
     */
    getMetadata(id: string): ToolMetadata | null;
    /**
     * Get the source for a tool by source ID.
     *
     * Used by the loader to retrieve tool implementations.
     *
     * @param sourceId - The source ID to look up
     * @returns The tool source, or null if not found
     */
    getSource(sourceId: string): ToolSource | null;
    /**
     * Event emitter for tool changes.
     *
     * Subscribe to be notified when tools are added or removed.
     */
    onToolsChanged: EventEmitter<ToolsChangedEvent>;
}
/**
 * Lazy loader for tool implementations with caching.
 *
 * The loader sits between the catalog (metadata) and tool sources
 * (implementations). It caches loaded tools using an LRU policy
 * to avoid repeated loading from sources.
 *
 * @example
 * ```typescript
 * const loader = new DefaultToolLoader(catalog, { maxSize: 50 });
 *
 * // Load a single tool
 * const tool = await loader.load('github:create_pr');
 *
 * // Pre-warm cache for expected tools
 * await loader.warmup(['github:create_pr', 'github:list_repos']);
 *
 * // Invalidate after changes
 * loader.evict('github:create_pr');
 * ```
 */
export interface ToolLoader {
    /**
     * Load a tool by ID.
     *
     * Returns cached tool if available, otherwise loads from source.
     * Concurrent requests for the same tool are deduplicated.
     *
     * @param id - The tool ID to load
     * @returns Promise resolving to the loaded tool
     * @throws Error if tool not found in catalog or source returns null
     */
    load(id: string): Promise<StructuredTool>;
    /**
     * Pre-load multiple tools in parallel.
     *
     * Useful for warming up the cache before a batch of operations.
     * Errors are silently ignored—use load() for error handling.
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
}
/**
 * Options for search queries.
 *
 * @example
 * ```typescript
 * const results = await searchIndex.search('github', {
 *   limit: 10,
 *   threshold: 0.3,
 *   categories: ['version-control'],
 * });
 * ```
 */
export interface SearchOptions {
    /**
     * Maximum number of results to return.
     *
     * @default 5
     */
    limit?: number;
    /**
     * Minimum score threshold (0-1).
     *
     * Results with scores below this threshold are excluded.
     *
     * @default 0
     */
    threshold?: number;
    /**
     * Filter by categories.
     *
     * Only tools matching at least one category are returned.
     */
    categories?: string[];
}
/**
 * A single search result.
 *
 * Contains the matched tool ID, relevance score, and the algorithm
 * that produced the match.
 */
export interface SearchResult {
    /**
     * Tool ID of the matched tool.
     *
     * Use this to load the tool via ToolLoader.
     */
    toolId: string;
    /**
     * Relevance score (0-1, normalized).
     *
     * Higher scores indicate better matches. Scores are normalized
     * to [0, 1] range regardless of the underlying algorithm.
     */
    score: number;
    /**
     * How the match was made.
     *
     * - 'bm25': Text-based matching using BM25 algorithm
     * - 'vector': Semantic matching using embeddings
     * - 'hybrid': Combined BM25 and vector scores
     */
    matchType: "bm25" | "vector" | "hybrid";
}
/**
 * Search index for finding tools by query.
 *
 * Provides fast tool discovery using text search (BM25), semantic
 * search (vector embeddings), or a hybrid of both.
 *
 * @example BM25 search (default, no API keys)
 * ```typescript
 * const searchIndex = new OramaSearch({ mode: 'bm25' });
 * await searchIndex.index(catalog.getAllMetadata());
 *
 * const results = await searchIndex.search('create pull request');
 * console.log(results[0].toolId); // 'github:create_pr'
 * ```
 *
 * @example Hybrid search (best quality)
 * ```typescript
 * const searchIndex = new OramaSearch({
 *   mode: 'hybrid',
 *   embeddings: new OpenAIEmbeddings(),
 *   weights: { bm25: 0.4, vector: 0.6 },
 * });
 * ```
 */
export interface SearchIndex {
    /**
     * Index tools for search.
     *
     * Call this after registering sources with the catalog.
     * Replaces any existing index.
     *
     * @param tools - Array of tool metadata to index
     */
    index(tools: ToolMetadata[]): Promise<void>;
    /**
     * Search for tools matching a query.
     *
     * @param query - Natural language search query
     * @param options - Search options (limit, threshold, categories)
     * @returns Array of search results sorted by relevance
     */
    search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
    /**
     * Re-index all tools.
     *
     * Call this when the catalog changes (tools added/removed).
     * Uses the tools from the last index() call.
     */
    reindex(): Promise<void>;
}
/**
 * Enhancement metadata that can be added to a tool.
 *
 * Use this to add search optimization hints to your tools,
 * such as categories for filtering and keywords for better matching.
 *
 * @example
 * ```typescript
 * const enhancement: ToolEnhancement = {
 *   categories: ['github', 'version-control'],
 *   keywords: ['PR', 'pull request', 'merge', 'review'],
 * };
 * ```
 */
export interface ToolEnhancement {
    /**
     * Categories for grouping and filtering.
     *
     * Tools can be filtered by category during search.
     * Use consistent category names across related tools.
     */
    categories?: string[];
    /**
     * Keywords for improved search matching.
     *
     * Add synonyms, abbreviations, and related terms that
     * users might search for.
     */
    keywords?: string[];
}
/**
 * A tool with enhancement metadata attached.
 *
 * The metadata is stored in a private property and extracted
 * during indexing by LocalSource.
 */
export type EnhancedTool = StructuredTool & {
    /** @internal Enhancement metadata for search optimization */
    __bigtool_metadata?: ToolEnhancement;
};
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
export declare function withMetadata<T extends StructuredTool>(tool: T, metadata: ToolEnhancement): T & EnhancedTool;
/**
 * Cache interface for storing computed embeddings.
 *
 * Embedding computation is expensive (requires API calls). This cache
 * stores embeddings by tool ID to avoid recomputation when the search
 * index is rebuilt.
 *
 * @example In-memory implementation
 * ```typescript
 * class MemoryEmbeddingCache implements EmbeddingCache {
 *   private cache = new Map<string, number[]>();
 *
 *   async get(toolId: string): Promise<number[] | null> {
 *     return this.cache.get(toolId) ?? null;
 *   }
 *
 *   async set(toolId: string, embedding: number[]): Promise<void> {
 *     this.cache.set(toolId, embedding);
 *   }
 *
 *   async invalidate(toolId: string): Promise<void> {
 *     this.cache.delete(toolId);
 *   }
 *
 *   async clear(): Promise<void> {
 *     this.cache.clear();
 *   }
 * }
 * ```
 */
export interface EmbeddingCache {
    /**
     * Retrieve a cached embedding by tool ID.
     *
     * @param toolId - The tool ID to look up
     * @returns The cached embedding, or null if not found
     */
    get(toolId: string): Promise<number[] | null>;
    /**
     * Store an embedding for a tool ID.
     *
     * @param toolId - The tool ID to cache for
     * @param embedding - The embedding vector to store
     */
    set(toolId: string, embedding: number[]): Promise<void>;
    /**
     * Remove a cached embedding.
     *
     * Call this when a tool's metadata changes.
     *
     * @param toolId - The tool ID to invalidate
     */
    invalidate(toolId: string): Promise<void>;
    /**
     * Clear all cached embeddings.
     *
     * Call this when performing a full reindex.
     */
    clear(): Promise<void>;
}
/**
 * Event emitted when the catalog changes.
 *
 * Alias for {@link ToolsChangedEvent} for backwards compatibility.
 */
export type CatalogChangeEvent = ToolsChangedEvent;
/**
 * Event emitter for tool refreshes.
 *
 * Used by sources to notify the catalog when their tool list changes.
 * Emits the new complete list of tool metadata.
 */
export type ToolEventEmitter = EventEmitter<ToolMetadata[]>;
//# sourceMappingURL=types.d.ts.map