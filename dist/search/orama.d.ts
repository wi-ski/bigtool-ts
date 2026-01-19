/**
 * OramaSearch module.
 *
 * Provides a powerful search index implementation using @orama/orama,
 * supporting BM25 text search, vector semantic search, and hybrid modes.
 *
 * @module search/orama
 */
import type { SearchIndex, SearchOptions, SearchResult } from '../types/index.js';
import type { ToolMetadata, OramaSearchConfig, Embeddings, EmbeddingCache } from "./types.js";
/**
 * Search index implementation using @orama/orama.
 *
 * OramaSearch provides fast, in-memory search for tool discovery.
 * It supports three search modes:
 *
 * - **BM25**: Fast text search using TF-IDF/BM25 algorithm. No API keys
 *   needed. Best for keyword-based queries.
 *
 * - **Vector**: Semantic search using embeddings. Requires an embeddings
 *   provider (e.g., OpenAIEmbeddings). Best for natural language queries.
 *
 * - **Hybrid**: Combines BM25 and vector scores for best results. Uses
 *   weighted combination with configurable weights.
 *
 * @example BM25 Mode (default, no API keys needed)
 * ```typescript
 * import { OramaSearch } from '@repo/bigtool-ts';
 *
 * const search = new OramaSearch({ mode: 'bm25' });
 * await search.index(catalog.getAllMetadata());
 *
 * const results = await search.search('github pull request');
 * console.log(results[0].toolId); // 'github:create_pr'
 * ```
 *
 * @example Vector Mode (semantic search)
 * ```typescript
 * import { OramaSearch } from '@repo/bigtool-ts';
 * import { OpenAIEmbeddings } from '@langchain/openai';
 *
 * const search = new OramaSearch({
 *   mode: 'vector',
 *   embeddings: new OpenAIEmbeddings(),
 *   cache: new MemoryEmbeddingCache(),
 * });
 *
 * await search.index(tools);
 * const results = await search.search('help me merge code changes');
 * ```
 *
 * @example Hybrid Mode (best of both)
 * ```typescript
 * const search = new OramaSearch({
 *   mode: 'hybrid',
 *   embeddings: new OpenAIEmbeddings(),
 *   weights: { bm25: 0.4, vector: 0.6 },
 *   boost: { name: 3, keywords: 2 },
 * });
 * ```
 */
export declare class OramaSearch implements SearchIndex {
    /** @internal BM25 database */
    private db;
    /** @internal Vector database */
    private vectorDb;
    /** @internal Resolved configuration */
    private config;
    /** @internal Indexed tools for reindexing */
    private tools;
    /** @internal Embeddings provider */
    private embeddings?;
    /** @internal Embedding cache */
    private cache?;
    /** @internal Whether index() has been called */
    private initialized;
    /**
     * Creates a new OramaSearch instance.
     *
     * @param config - Search configuration (mode, embeddings, etc.)
     * @throws Error if vector/hybrid mode is used without embeddings
     *
     * @example
     * ```typescript
     * // BM25 (default)
     * const search = new OramaSearch();
     *
     * // Explicit mode
     * const search = new OramaSearch({ mode: 'bm25' });
     *
     * // With custom boosts
     * const search = new OramaSearch({
     *   mode: 'bm25',
     *   boost: { name: 3, keywords: 2, description: 1, categories: 1 },
     * });
     * ```
     */
    constructor(config?: OramaSearchConfig);
    /**
     * Index a collection of tools for search.
     *
     * This creates the search index from the provided tool metadata.
     * Call this after registering sources with the catalog.
     * Replaces any existing index.
     *
     * For vector/hybrid modes, this also computes and caches embeddings.
     *
     * @param tools - Array of tool metadata to index
     *
     * @example
     * ```typescript
     * const search = new OramaSearch({ mode: 'bm25' });
     * await search.index(catalog.getAllMetadata());
     * ```
     */
    index(tools: ToolMetadata[]): Promise<void>;
    /**
     * Search for tools matching a query.
     *
     * Uses the configured search mode (BM25, vector, or hybrid).
     * Results are normalized to 0-1 scores and sorted by relevance.
     *
     * @param query - Natural language search query
     * @param options - Search options (limit, threshold, categories)
     * @returns Array of search results sorted by relevance
     * @throws Error if index() has not been called
     *
     * @example
     * ```typescript
     * const results = await search.search('create github pull request', {
     *   limit: 10,
     *   threshold: 0.3,
     * });
     *
     * for (const result of results) {
     *   console.log(`${result.toolId}: ${result.score.toFixed(2)}`);
     * }
     * ```
     */
    search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
    /**
     * Rebuild the index from currently indexed tools.
     *
     * Call this when the catalog changes (tools added/removed).
     * Uses the tools from the last index() call.
     *
     * @throws Error if index() has not been called
     *
     * @example
     * ```typescript
     * // Listen for catalog changes
     * catalog.onToolsChanged.subscribe(async () => {
     *   await search.reindex();
     * });
     * ```
     */
    reindex(): Promise<void>;
    /**
     * Get the number of indexed tools.
     *
     * @returns Number of tools in the index
     *
     * @example
     * ```typescript
     * const indexed = await search.count();
     * console.log(`${indexed} tools indexed`);
     * ```
     */
    count(): Promise<number>;
    private searchBM25;
    private searchVector;
    private searchHybrid;
    /**
     * Compute embeddings for tools, using cache when available.
     */
    private computeEmbeddings;
}
/**
 * Create a BM25-only search index.
 *
 * This is the simplest and fastest option, requiring no API keys.
 * Uses TF-IDF/BM25 algorithm for text matching.
 *
 * @param options - Optional configuration for field boosting
 * @returns Configured OramaSearch instance
 *
 * @example
 * ```typescript
 * import { createBM25Search } from '@repo/bigtool-ts';
 *
 * const search = createBM25Search();
 * await search.index(tools);
 * ```
 *
 * @example With custom boosts
 * ```typescript
 * const search = createBM25Search({
 *   boost: { name: 3, keywords: 2, description: 1, categories: 1 },
 * });
 * ```
 */
export declare function createBM25Search(options?: Pick<OramaSearchConfig, "boost">): OramaSearch;
/**
 * Create a vector search index.
 *
 * Uses semantic similarity via embeddings. Requires an embeddings
 * provider (e.g., OpenAIEmbeddings).
 *
 * @param embeddings - Embeddings provider for computing vectors
 * @param cache - Optional cache for storing computed embeddings
 * @param vectorSize - Embedding dimension (default: 1536 for OpenAI)
 * @returns Configured OramaSearch instance
 *
 * @example
 * ```typescript
 * import { createVectorSearch } from '@repo/bigtool-ts';
 * import { OpenAIEmbeddings } from '@langchain/openai';
 *
 * const search = createVectorSearch(
 *   new OpenAIEmbeddings(),
 *   new MemoryEmbeddingCache(),
 * );
 * ```
 */
export declare function createVectorSearch(embeddings: Embeddings, cache?: EmbeddingCache, vectorSize?: number): OramaSearch;
/**
 * Create a hybrid search index.
 *
 * Combines BM25 text matching with vector semantic similarity
 * for the best results. Uses weighted scoring to merge results.
 *
 * @param embeddings - Embeddings provider for computing vectors
 * @param options - Configuration options
 * @returns Configured OramaSearch instance
 *
 * @example
 * ```typescript
 * import { createHybridSearch } from '@repo/bigtool-ts';
 * import { OpenAIEmbeddings } from '@langchain/openai';
 *
 * const search = createHybridSearch(new OpenAIEmbeddings(), {
 *   weights: { bm25: 0.3, vector: 0.7 },
 *   cache: new MemoryEmbeddingCache(),
 * });
 * ```
 */
export declare function createHybridSearch(embeddings: Embeddings, options?: {
    cache?: EmbeddingCache;
    weights?: {
        bm25: number;
        vector: number;
    };
    boost?: OramaSearchConfig["boost"];
    vectorSize?: number;
}): OramaSearch;
//# sourceMappingURL=orama.d.ts.map