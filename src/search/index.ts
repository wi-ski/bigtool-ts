import type { SearchIndex, SearchOptions, SearchResult, ToolMetadata } from '../types.js';

/**
 * Configuration for BigTool search
 */
export interface BigToolSearchConfig {
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
 * @deprecated Use BigToolSearchConfig instead
 */
export type OramaSearchConfig = BigToolSearchConfig;

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
 * const search = new BigToolSearch();
 * 
 * // Vector mode
 * const search = new BigToolSearch({
 *   mode: 'vector',
 *   embeddings: new OpenAIEmbeddings(),
 * });
 * 
 * // Hybrid mode
 * const search = new BigToolSearch({
 *   mode: 'hybrid',
 *   embeddings: new OpenAIEmbeddings(),
 *   weights: { bm25: 0.5, vector: 0.5 },
 * });
 * ```
 */
export class BigToolSearch implements SearchIndex {
  private config: BigToolSearchConfig;
  private tools: ToolMetadata[] = [];
  private initialized = false;

  constructor(config: Partial<BigToolSearchConfig> = {}) {
    this.config = {
      mode: config.mode ?? 'bm25',
      embeddings: config.embeddings,
      boost: config.boost ?? {
        name: 2,
        keywords: 1.5,
        description: 1,
        categories: 1,
      },
      weights: config.weights ?? {
        bm25: 0.5,
        vector: 0.5,
      },
      cache: config.cache,
    };

    // Validate config
    if ((this.config.mode === 'vector' || this.config.mode === 'hybrid') && !this.config.embeddings) {
      throw new Error(`BigToolSearch: 'embeddings' is required for '${this.config.mode}' mode`);
    }
  }

  async index(tools: ToolMetadata[]): Promise<void> {
    this.tools = tools;
    
    // TODO: Initialize Orama index
    // In a real implementation:
    // 1. Create Orama database with schema
    // 2. Index all tools
    // 3. If vector mode, compute/cache embeddings
    
    this.initialized = true;
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    if (!this.initialized) {
      throw new Error('BigToolSearch: Must call index() before searching');
    }

    const limit = options.limit ?? 5;
    const threshold = options.threshold ?? 0;

    // TODO: Implement actual Orama search
    // For now, return a basic text match implementation
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    for (const tool of this.tools) {
      let score = 0;
      const matchType: SearchResult['matchType'] = this.config.mode;

      // Simple text matching (placeholder for BM25)
      const searchText = [
        tool.name,
        tool.description,
        ...(tool.keywords ?? []),
        ...(tool.categories ?? []),
      ].join(' ').toLowerCase();

      if (searchText.includes(queryLower)) {
        score = 0.8;
      } else {
        // Partial word match
        const queryWords = queryLower.split(/\s+/);
        const matchCount = queryWords.filter(word => searchText.includes(word)).length;
        score = matchCount / queryWords.length * 0.6;
      }

      // Filter by categories if specified
      if (options.categories && options.categories.length > 0) {
        const toolCategories = new Set(tool.categories ?? []);
        const hasCategory = options.categories.some(c => toolCategories.has(c));
        if (!hasCategory) {
          continue;
        }
      }

      if (score >= threshold) {
        results.push({
          toolId: tool.id,
          score,
          matchType,
        });
      }
    }

    // Sort by score descending and limit
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async reindex(): Promise<void> {
    if (this.tools.length > 0) {
      await this.index(this.tools);
    }
  }

  /** Get current configuration */
  getConfig(): BigToolSearchConfig {
    return { ...this.config };
  }
}

/**
 * @deprecated Use BigToolSearch instead
 */
export const OramaSearch = BigToolSearch;
