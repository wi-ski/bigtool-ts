/**
 * Search Module Types
 * 
 * Local type definitions for the search module.
 * These extend or adapt the core types for search-specific use.
 */

import type { ToolMetadata as CoreToolMetadata, SearchResult as CoreSearchResult } from '../types/index.js';

// Re-export core types that tests expect
export type { SearchOptions, SearchResult, SearchIndex } from '../types/index.js';

/** Search mode determines which algorithm is used */
export type SearchMode = "bm25" | "vector" | "hybrid";

/**
 * ToolMetadata for search - adapts core type for search use
 * The core ToolMetadata has required `sourceId` field that we make optional here
 */
export interface ToolMetadata {
  /** Unique identifier for the tool */
  id: string;
  /** Human-readable name of the tool */
  name: string;
  /** Description of what the tool does */
  description: string;
  /** Tool parameter schema (JSON Schema format) */
  parameters?: Record<string, unknown>;
  /** Categories for grouping/filtering (e.g., ["github", "git"]) */
  categories?: string[];
  /** Keywords for improved search matching (e.g., ["PR", "pull request"]) */
  keywords?: string[];
  /** Source of the tool for tracking origin */
  source?: "local" | "mcp" | "dynamic";
  /** Source ID (optional for search) */
  sourceId?: string;
}

/**
 * Interface for embedding providers (compatible with LangChain Embeddings)
 */
export interface Embeddings {
  /** Embed a single text string */
  embedQuery(text: string): Promise<number[]>;
  /** Embed multiple texts (for batch efficiency) */
  embedDocuments(texts: string[]): Promise<number[][]>;
}

/**
 * Cache interface for storing computed embeddings.
 * Avoids recomputing embeddings on every index rebuild.
 */
export interface EmbeddingCache {
  /** Retrieve a cached embedding by tool ID */
  get(toolId: string): Promise<number[] | null>;
  /** Store an embedding for a tool ID */
  set(toolId: string, embedding: number[]): Promise<void>;
  /** Remove a cached embedding */
  invalidate(toolId: string): Promise<void>;
  /** Clear all cached embeddings */
  clear(): Promise<void>;
}

/**
 * Field boost weights for BM25 search.
 * Higher values make matches in that field more important.
 */
export interface FieldBoostConfig {
  /** Boost for tool name matches (default: 2) */
  name?: number;
  /** Boost for description matches (default: 1) */
  description?: number;
  /** Boost for keyword matches (default: 1.5) */
  keywords?: number;
  /** Boost for category matches (default: 1) */
  categories?: number;
}

/**
 * Weight configuration for hybrid search.
 * Values should sum to 1 for proper normalization.
 */
export interface HybridWeights {
  /** Weight for BM25 text matching (default: 0.5) */
  bm25: number;
  /** Weight for vector similarity (default: 0.5) */
  vector: number;
}

/**
 * Configuration for BigToolSearch
 */
export interface BigToolSearchConfig {
  /** Search mode: bm25, vector, or hybrid */
  mode: SearchMode;
  /** Required for vector/hybrid modes - embedding provider */
  embeddings?: Embeddings;
  /** Optional cache for embeddings to avoid recomputation */
  cache?: EmbeddingCache;
  /** Field boost weights for BM25 search */
  boost?: FieldBoostConfig;
  /** Weights for combining BM25 and vector scores in hybrid mode */
  weights?: HybridWeights;
  /** Vector embedding dimension (default: 1536 for OpenAI) */
  vectorSize?: number;
}

/**
 * @deprecated Use BigToolSearchConfig instead
 */
export type OramaSearchConfig = BigToolSearchConfig;
