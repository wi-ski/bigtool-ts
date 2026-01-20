/**
 * BigToolSearch module.
 *
 * Provides a powerful search index implementation using @orama/orama,
 * supporting BM25 text search, vector semantic search, and hybrid modes.
 *
 * @module search/orama
 */

import {
  create,
  insert,
  search,
  count,
  type Orama,
  type Results,
  type SearchParams,
  type TypedDocument,
} from "@orama/orama";

import type { SearchIndex, SearchOptions, SearchResult } from '../types/index.js';
import type {
  ToolMetadata,
  BigToolSearchConfig,
  Embeddings,
  EmbeddingCache,
  SearchMode,
} from "./types.js";

import {
  normalizeBM25Scores,
  normalizeOramaVectorScore,
  mergeHybridResults,
} from "./normalize.js";

// ═══════════════════════════════════════════════════════════════════════════
// Orama Schema Types
// ═══════════════════════════════════════════════════════════════════════════

const oramaSchema = {
  id: "string",
  name: "string",
  description: "string",
  keywords: "string",
  categories: "string",
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert ToolMetadata to a flat document for Orama indexing.
 * Arrays are joined into space-separated strings for BM25 search.
 */
function toolToDocument(
  tool: ToolMetadata,
  embedding?: number[]
): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    id: tool.id,
    name: tool.name,
    description: tool.description,
    keywords: (tool.keywords ?? []).join(" "),
    categories: (tool.categories ?? []).join(" "),
  };

  if (embedding) {
    doc.embedding = embedding;
  }

  return doc;
}

/**
 * Create text for embedding by combining all searchable fields.
 */
function toolToEmbeddingText(tool: ToolMetadata): string {
  const parts = [
    tool.name,
    tool.description,
    ...(tool.keywords ?? []),
    ...(tool.categories ?? []),
  ];
  return parts.filter(Boolean).join(" ");
}

// ═══════════════════════════════════════════════════════════════════════════
// BigToolSearch Implementation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Search index implementation using @orama/orama.
 *
 * BigToolSearch provides fast, in-memory search for tool discovery.
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
 * import { BigToolSearch } from 'bigtool-ts';
 *
 * const search = new BigToolSearch({ mode: 'bm25' });
 * await search.index(catalog.getAllMetadata());
 *
 * const results = await search.search('github pull request');
 * console.log(results[0].toolId); // 'github:create_pr'
 * ```
 *
 * @example Vector Mode (semantic search)
 * ```typescript
 * import { BigToolSearch } from 'bigtool-ts';
 * import { OpenAIEmbeddings } from '@langchain/openai';
 *
 * const search = new BigToolSearch({
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
 * const search = new BigToolSearch({
 *   mode: 'hybrid',
 *   embeddings: new OpenAIEmbeddings(),
 *   weights: { bm25: 0.4, vector: 0.6 },
 *   boost: { name: 3, keywords: 2 },
 * });
 * ```
 */
export class BigToolSearch implements SearchIndex {
  /** @internal BM25 database */
  private db: Orama<typeof oramaSchema> | null = null;

  /** @internal Vector database */
  private vectorDb: Orama<any> | null = null;

  /** @internal Resolved configuration */
  private config: Required<Omit<BigToolSearchConfig, 'embeddings' | 'cache'>> & Pick<BigToolSearchConfig, 'embeddings' | 'cache'>;

  /** @internal Indexed tools for reindexing */
  private tools: ToolMetadata[] = [];

  /** @internal Embeddings provider */
  private embeddings?: Embeddings;

  /** @internal Embedding cache */
  private cache?: EmbeddingCache;

  /** @internal Whether index() has been called */
  private initialized = false;

  /**
   * Creates a new BigToolSearch instance.
   *
   * @param config - Search configuration (mode, embeddings, etc.)
   * @throws Error if vector/hybrid mode is used without embeddings
   *
   * @example
   * ```typescript
   * // BM25 (default)
   * const search = new BigToolSearch();
   *
   * // Explicit mode
   * const search = new BigToolSearch({ mode: 'bm25' });
   *
   * // With custom boosts
   * const search = new BigToolSearch({
   *   mode: 'bm25',
   *   boost: { name: 3, keywords: 2, description: 1, categories: 1 },
   * });
   * ```
   */
  constructor(config: BigToolSearchConfig = { mode: "bm25" }) {
    // Validate config
    if ((config.mode === "vector" || config.mode === "hybrid") && !config.embeddings) {
      throw new Error(
        `BigToolSearch: Embeddings provider required for ${config.mode} mode. ` +
        "Pass an embeddings instance (e.g., new OpenAIEmbeddings()) in config."
      );
    }

    this.embeddings = config.embeddings;
    this.cache = config.cache;

    // Set defaults for all config options
    this.config = {
      mode: config.mode,
      embeddings: config.embeddings,
      cache: config.cache,
      boost: {
        name: config.boost?.name ?? 2,
        description: config.boost?.description ?? 1,
        keywords: config.boost?.keywords ?? 1.5,
        categories: config.boost?.categories ?? 1,
      },
      weights: {
        bm25: config.weights?.bm25 ?? 0.5,
        vector: config.weights?.vector ?? 0.5,
      },
      vectorSize: config.vectorSize ?? 1536,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Public API
  // ═══════════════════════════════════════════════════════════════════════

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
   * const search = new BigToolSearch({ mode: 'bm25' });
   * await search.index(catalog.getAllMetadata());
   * ```
   */
  async index(tools: ToolMetadata[]): Promise<void> {
    this.tools = tools;

    // Create BM25 database
    this.db = await create({
      schema: oramaSchema,
    });

    // Insert all tools for BM25
    for (const tool of tools) {
      const doc = toolToDocument(tool);
      await insert(this.db, doc as TypedDocument<typeof this.db>);
    }

    // Create vector database if needed
    const needsVectors = this.config.mode === "vector" || this.config.mode === "hybrid";
    if (needsVectors && this.embeddings) {
      const embeddings = await this.computeEmbeddings(tools);
      
      // Create vector database with dynamic schema
      const vectorSchema = {
        id: "string" as const,
        embedding: `vector[${this.config.vectorSize}]` as const,
      };
      
      this.vectorDb = await create({
        schema: vectorSchema,
      });

      // Insert tools with embeddings
      for (const tool of tools) {
        const embedding = embeddings.get(tool.id);
        if (embedding) {
          await insert(this.vectorDb, {
            id: tool.id,
            embedding,
          } as TypedDocument<typeof this.vectorDb>);
        }
      }
    }

    this.initialized = true;
  }

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
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    if (!this.db || !this.initialized) {
      throw new Error("BigToolSearch: Index not initialized. Call index() first.");
    }

    const mode = (options as { mode?: SearchMode })?.mode ?? this.config.mode;
    const limit = options?.limit ?? 5;
    const threshold = options?.threshold;

    let results: SearchResult[];

    switch (mode) {
      case "bm25":
        results = await this.searchBM25(query, limit);
        break;
      case "vector":
        results = await this.searchVector(query, limit);
        break;
      case "hybrid":
        results = await this.searchHybrid(query, limit);
        break;
      default:
        throw new Error(`BigToolSearch: Unknown search mode: ${mode}`);
    }

    // Apply threshold filter
    if (threshold !== undefined) {
      results = results.filter((r) => r.score >= threshold);
    }

    // Apply limit
    return results.slice(0, limit);
  }

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
  async reindex(): Promise<void> {
    if (this.tools.length === 0) {
      throw new Error("BigToolSearch: No tools to reindex. Call index() first.");
    }
    await this.index(this.tools);
  }

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
  async count(): Promise<number> {
    if (!this.db) return 0;
    return count(this.db);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BM25 Search
  // ═══════════════════════════════════════════════════════════════════════

  private async searchBM25(query: string, limit: number): Promise<SearchResult[]> {
    if (!this.db) return [];

    const searchParams: SearchParams<typeof this.db, TypedDocument<typeof this.db>> = {
      term: query,
      limit,
      boost: {
        name: this.config.boost.name!,
        description: this.config.boost.description!,
        keywords: this.config.boost.keywords!,
        categories: this.config.boost.categories!,
      },
    };

    const results: Results<TypedDocument<typeof this.db>> = await search(this.db, searchParams);

    // Extract raw scores for normalization
    const rawScores = results.hits.map((hit) => hit.score);
    const normalizedScores = normalizeBM25Scores(rawScores);

    return results.hits.map((hit, index) => ({
      toolId: hit.document.id as string,
      score: normalizedScores[index],
      matchType: "bm25" as const,
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Vector Search
  // ═══════════════════════════════════════════════════════════════════════

  private async searchVector(query: string, limit: number): Promise<SearchResult[]> {
    if (!this.vectorDb || !this.embeddings) return [];

    // Embed the query
    const queryEmbedding = await this.embeddings.embedQuery(query);

    // Search by vector similarity
    const results = await search(this.vectorDb, {
      mode: "vector",
      vector: {
        value: queryEmbedding,
        property: "embedding",
      },
      limit,
      similarity: 0.3, // Minimum similarity threshold
    } as SearchParams<typeof this.vectorDb, TypedDocument<typeof this.vectorDb>>);

    return results.hits.map((hit) => ({
      toolId: hit.document.id as string,
      score: normalizeOramaVectorScore(hit.score),
      matchType: "vector" as const,
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Hybrid Search
  // ═══════════════════════════════════════════════════════════════════════

  private async searchHybrid(query: string, limit: number): Promise<SearchResult[]> {
    // Run both searches in parallel
    const [bm25Results, vectorResults] = await Promise.all([
      this.searchBM25(query, limit * 2), // Get more results for better fusion
      this.searchVector(query, limit * 2),
    ]);

    // Merge using weighted combination
    const merged = mergeHybridResults(
      bm25Results,
      vectorResults,
      this.config.weights
    );

    return merged.slice(0, limit);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Embedding Computation
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Compute embeddings for tools, using cache when available.
   */
  private async computeEmbeddings(
    tools: ToolMetadata[]
  ): Promise<Map<string, number[]>> {
    if (!this.embeddings) {
      throw new Error("BigToolSearch: Embeddings provider not configured.");
    }

    const embeddings = new Map<string, number[]>();
    const toCompute: { tool: ToolMetadata; text: string }[] = [];

    // Check cache for existing embeddings
    for (const tool of tools) {
      if (this.cache) {
        const cached = await this.cache.get(tool.id);
        if (cached) {
          embeddings.set(tool.id, cached);
          continue;
        }
      }
      toCompute.push({ tool, text: toolToEmbeddingText(tool) });
    }

    // Compute missing embeddings in batch
    if (toCompute.length > 0) {
      const texts = toCompute.map((t) => t.text);
      const computed = await this.embeddings.embedDocuments(texts);

      for (let i = 0; i < toCompute.length; i++) {
        const toolId = toCompute[i].tool.id;
        const embedding = computed[i];
        embeddings.set(toolId, embedding);

        // Cache the computed embedding
        if (this.cache) {
          await this.cache.set(toolId, embedding);
        }
      }
    }

    return embeddings;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Factory Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a BM25-only search index.
 *
 * This is the simplest and fastest option, requiring no API keys.
 * Uses TF-IDF/BM25 algorithm for text matching.
 *
 * @param options - Optional configuration for field boosting
 * @returns Configured BigToolSearch instance
 *
 * @example
 * ```typescript
 * import { createBM25Search } from 'bigtool-ts';
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
export function createBM25Search(
  options?: Pick<BigToolSearchConfig, "boost">
): BigToolSearch {
  return new BigToolSearch({
    mode: "bm25",
    boost: options?.boost,
  });
}

/**
 * Create a vector search index.
 *
 * Uses semantic similarity via embeddings. Requires an embeddings
 * provider (e.g., OpenAIEmbeddings).
 *
 * @param embeddings - Embeddings provider for computing vectors
 * @param cache - Optional cache for storing computed embeddings
 * @param vectorSize - Embedding dimension (default: 1536 for OpenAI)
 * @returns Configured BigToolSearch instance
 *
 * @example
 * ```typescript
 * import { createVectorSearch } from 'bigtool-ts';
 * import { OpenAIEmbeddings } from '@langchain/openai';
 *
 * const search = createVectorSearch(
 *   new OpenAIEmbeddings(),
 *   new MemoryEmbeddingCache(),
 * );
 * ```
 */
export function createVectorSearch(
  embeddings: Embeddings,
  cache?: EmbeddingCache,
  vectorSize?: number
): BigToolSearch {
  return new BigToolSearch({
    mode: "vector",
    embeddings,
    cache,
    vectorSize,
  });
}

/**
 * Create a hybrid search index.
 *
 * Combines BM25 text matching with vector semantic similarity
 * for the best results. Uses weighted scoring to merge results.
 *
 * @param embeddings - Embeddings provider for computing vectors
 * @param options - Configuration options
 * @returns Configured BigToolSearch instance
 *
 * @example
 * ```typescript
 * import { createHybridSearch } from 'bigtool-ts';
 * import { OpenAIEmbeddings } from '@langchain/openai';
 *
 * const search = createHybridSearch(new OpenAIEmbeddings(), {
 *   weights: { bm25: 0.3, vector: 0.7 },
 *   cache: new MemoryEmbeddingCache(),
 * });
 * ```
 */
export function createHybridSearch(
  embeddings: Embeddings,
  options?: {
    cache?: EmbeddingCache;
    weights?: { bm25: number; vector: number };
    boost?: BigToolSearchConfig["boost"];
    vectorSize?: number;
  }
): BigToolSearch {
  return new BigToolSearch({
    mode: "hybrid",
    embeddings,
    cache: options?.cache,
    weights: options?.weights,
    boost: options?.boost,
    vectorSize: options?.vectorSize,
  });
}

/**
 * @deprecated Use BigToolSearch instead
 */
export const OramaSearch = BigToolSearch;
