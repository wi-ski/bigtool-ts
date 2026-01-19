import type { SearchIndex, SearchOptions, SearchResult, ToolMetadata } from '../types.js';
/**
 * Configuration for Orama-based search
 */
export interface OramaSearchConfig {
    /** Search mode */
    mode: 'bm25' | 'vector' | 'hybrid';
    /** Embeddings provider (required for vector/hybrid modes) */
    embeddings?: unknown;
    /** Field boosting for BM25/hybrid */
    boost?: {
        name?: number;
        description?: number;
        keywords?: number;
        categories?: number;
    };
    /** Weights for hybrid mode */
    weights?: {
        bm25?: number;
        vector?: number;
    };
    /** Embedding cache */
    cache?: unknown;
}
/**
 * Default search implementation using @orama/orama for BM25 search.
 *
 * Supports three modes:
 * - 'bm25': Fast text search (default, no API keys needed)
 * - 'vector': Semantic search using embeddings
 * - 'hybrid': Combination of BM25 and vector search
 *
 * @example
 * ```typescript
 * // BM25 mode (default)
 * const search = new OramaSearch();
 *
 * // Vector mode
 * const search = new OramaSearch({
 *   mode: 'vector',
 *   embeddings: new OpenAIEmbeddings(),
 * });
 *
 * // Hybrid mode
 * const search = new OramaSearch({
 *   mode: 'hybrid',
 *   embeddings: new OpenAIEmbeddings(),
 *   weights: { bm25: 0.5, vector: 0.5 },
 * });
 * ```
 */
export declare class OramaSearch implements SearchIndex {
    private config;
    private tools;
    private initialized;
    constructor(config?: Partial<OramaSearchConfig>);
    index(tools: ToolMetadata[]): Promise<void>;
    search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
    reindex(): Promise<void>;
    /** Get current configuration */
    getConfig(): OramaSearchConfig;
}
//# sourceMappingURL=index.d.ts.map