/**
 * Mastra Adapter for bigtool-ts
 *
 * Converts bigtool-ts tools to Mastra-compatible tools.
 *
 * @module adapters/mastra
 *
 * @example
 * ```typescript
 * import { createMastraAdapter } from '@repo/bigtool-ts/adapters';
 * import { Agent } from '@mastra/core/agent';
 *
 * const adapter = createMastraAdapter({ catalog, loader, searchIndex });
 *
 * const agent = new Agent({
 *   id: 'my-agent',
 *   tools: {
 *     search: adapter.createSearchTool(),
 *     ...await adapter.getToolsAsRecord(['github:create_pr']),
 *   },
 * });
 * ```
 *
 * @remarks
 * Requires `@mastra/core` v1.0.0-beta.24+ as a peer dependency.
 * Install separately: `pnpm add @mastra/core`
 */
import { z } from 'zod';
// ═══════════════════════════════════════════════════════════════════
// ADAPTER IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════
/**
 * Adapter for converting bigtool-ts tools to Mastra format.
 *
 * Implements the `ToolAdapter` interface for Mastra framework
 * compatibility. Provides both array and record output formats
 * to match Mastra's agent API expectations.
 *
 * @example
 * ```typescript
 * const adapter = new MastraAdapter({ catalog, loader, searchIndex });
 *
 * // Get tools as array
 * const tools = await adapter.getTools(['github:create_pr']);
 *
 * // Get tools as Record for Agent constructor
 * const toolRecord = await adapter.getToolsAsRecord(['github:create_pr']);
 * ```
 */
export class MastraAdapter {
    catalog;
    loader;
    searchIndex;
    constructor(config) {
        this.catalog = config.catalog;
        this.loader = config.loader;
        this.searchIndex = config.searchIndex;
    }
    /**
     * Convert bigtool-ts metadata to a Mastra tool.
     *
     * Creates a Mastra-compatible tool definition that lazily loads
     * and executes the underlying bigtool-ts tool implementation.
     *
     * Supports abort signal propagation for cancellation.
     *
     * @param metadata - Tool metadata from the catalog
     * @returns Mastra tool definition
     */
    toFrameworkTool(metadata) {
        const loader = this.loader;
        // Build Zod schema from JSON Schema parameters
        const inputSchema = this.buildInputSchema(metadata.parameters);
        return {
            id: metadata.id,
            description: metadata.description,
            inputSchema,
            outputSchema: undefined,
            execute: async (inputData, context) => {
                // Fail fast on abort before expensive loader call
                context?.abortSignal?.throwIfAborted();
                const tool = await loader.load(metadata.id);
                return tool.invoke(inputData);
            },
        };
    }
    /**
     * Get tools by IDs as an array.
     *
     * Converts each tool from bigtool-ts format to Mastra format.
     * Tools not found in the catalog are silently skipped.
     *
     * @param toolIds - Array of tool IDs to retrieve
     * @returns Array of Mastra tools
     */
    async getTools(toolIds) {
        const tools = [];
        for (const id of toolIds) {
            const metadata = this.catalog.getMetadata(id);
            if (metadata === null) {
                continue;
            }
            tools.push(this.toFrameworkTool(metadata));
        }
        return tools;
    }
    /**
     * Get tools as a Record for Mastra Agent constructor.
     *
     * Mastra agents expect tools in `Record<string, Tool>` format.
     * Uses the tool name (last segment of ID) as the record key.
     *
     * @param toolIds - Array of tool IDs to retrieve
     * @returns Record of tool name to Mastra tool
     *
     * @example
     * ```typescript
     * const tools = await adapter.getToolsAsRecord(['github:create_pr']);
     * // Returns: { create_pr: MastraTool }
     *
     * const agent = new Agent({
     *   tools: {
     *     search: adapter.createSearchTool(),
     *     ...tools,
     *   },
     * });
     * ```
     */
    async getToolsAsRecord(toolIds) {
        const tools = {};
        for (const id of toolIds) {
            const metadata = this.catalog.getMetadata(id);
            if (metadata === null) {
                continue;
            }
            const toolKey = this.extractToolKey(id);
            tools[toolKey] = this.toFrameworkTool(metadata);
        }
        return tools;
    }
    /**
     * Create a search tool for discovering available tools.
     *
     * Returns a Mastra tool that agents can use to search the
     * bigtool-ts catalog using natural language queries.
     *
     * @param options - Search configuration options
     * @returns Mastra search tool
     *
     * @example
     * ```typescript
     * const agent = new Agent({
     *   tools: {
     *     search_tools: adapter.createSearchTool({ limit: 10 }),
     *   },
     * });
     * ```
     */
    createSearchTool(options = {}) {
        const limit = options.limit ?? 5;
        const threshold = options.threshold ?? 0;
        const categories = options.categories;
        const searchIndex = this.searchIndex;
        const catalog = this.catalog;
        const inputSchema = z.object({
            query: z.string().describe('Natural language search query for finding tools'),
        });
        const outputSchema = z.array(z.object({
            id: z.string().describe('Tool ID'),
            description: z.string().describe('Tool description'),
            score: z.number().describe('Relevance score (0-1)'),
        }));
        return {
            id: 'bigtool-search-tools',
            description: 'Search for available tools by query. Use this to discover what tools are available before calling them.',
            inputSchema,
            outputSchema,
            execute: async (inputData) => {
                const results = await searchIndex.search(inputData.query, {
                    limit,
                    threshold,
                    categories,
                });
                return results.map((searchResult) => {
                    const meta = catalog.getMetadata(searchResult.toolId);
                    return {
                        id: searchResult.toolId,
                        description: meta?.description ?? '',
                        score: searchResult.score,
                    };
                });
            },
        };
    }
    // ═══════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════════
    /**
     * Extract the tool key from a fully-qualified tool ID.
     *
     * For IDs like 'github:create_pr', returns 'create_pr'.
     * For IDs without a namespace, returns the full ID.
     */
    extractToolKey(id) {
        const colonIndex = id.lastIndexOf(':');
        if (colonIndex === -1) {
            return id;
        }
        return id.slice(colonIndex + 1);
    }
    /**
     * Build a Zod schema from JSON Schema parameters.
     *
     * Returns a permissive schema that accepts any object shape.
     * Validation is delegated to the underlying bigtool-ts tool,
     * avoiding the complexity of JSON Schema to Zod conversion.
     *
     * @remarks
     * Converting JSON Schema to Zod at runtime would require a
     * library like `json-schema-to-zod`. Since bigtool-ts tools
     * perform their own validation, this passthrough approach
     * avoids that dependency while maintaining compatibility.
     */
    buildInputSchema(_parameters) {
        return z.object({}).passthrough();
    }
}
// ═══════════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════
/**
 * Create a Mastra adapter for bigtool-ts.
 *
 * Factory function that creates a configured `MastraAdapter` instance.
 *
 * @param config - Adapter configuration with catalog, loader, and search index
 * @returns Configured Mastra adapter
 *
 * @example
 * ```typescript
 * import { createMastraAdapter } from '@repo/bigtool-ts/adapters';
 * import { DefaultToolCatalog, DefaultToolLoader, OramaSearch } from '@repo/bigtool-ts';
 *
 * const catalog = new DefaultToolCatalog();
 * const loader = new DefaultToolLoader(catalog);
 * const searchIndex = new OramaSearch();
 *
 * const adapter = createMastraAdapter({ catalog, loader, searchIndex });
 * ```
 */
export function createMastraAdapter(config) {
    return new MastraAdapter(config);
}
//# sourceMappingURL=mastra.js.map