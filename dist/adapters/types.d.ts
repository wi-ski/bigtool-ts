/**
 * Common types for framework adapters
 * @module adapters/types
 */
import type { ToolCatalog, ToolLoader, SearchIndex, ToolMetadata } from '../types.js';
/**
 * Configuration for creating framework adapters
 */
export interface AdapterConfig {
    catalog: ToolCatalog;
    loader: ToolLoader;
    searchIndex: SearchIndex;
}
/**
 * Options for creating search tools
 */
export interface SearchToolOptions {
    /** Maximum number of results to return (default: 5) */
    limit?: number;
    /** Minimum score threshold (default: 0) */
    threshold?: number;
    /** Filter by categories */
    categories?: string[];
}
/**
 * Common interface that all adapters implement
 */
export interface ToolAdapter<TFrameworkTool> {
    /**
     * Convert a bigtool-ts metadata to framework-specific tool
     */
    toFrameworkTool(metadata: ToolMetadata): TFrameworkTool;
    /**
     * Get tools by IDs, converted to framework format
     */
    getTools(toolIds: string[]): Promise<TFrameworkTool[]>;
    /**
     * Create a search tool in framework format
     */
    createSearchTool(options?: SearchToolOptions): TFrameworkTool;
}
//# sourceMappingURL=types.d.ts.map