/**
 * Inngest AgentKit adapter for bigtool-ts.
 *
 * Converts bigtool-ts tools to Inngest AgentKit format and provides
 * search tools for dynamic tool discovery.
 *
 * @module adapters/inngest
 *
 * @example
 * ```typescript
 * import { createInngestAdapter } from '@repo/bigtool-ts/adapters';
 * import { createAgent, openai } from '@inngest/agent-kit';
 *
 * const adapter = createInngestAdapter({ catalog, loader, searchIndex });
 *
 * const agent = createAgent({
 *   name: 'tool-user',
 *   model: openai({ model: 'gpt-4o' }),
 *   tools: [
 *     adapter.createSearchTool(),
 *     adapter.createCallToolTool(),
 *   ],
 *   system: 'You are a helpful assistant...',
 * });
 * ```
 */
import { z } from 'zod';
import { jsonSchemaToZod } from './schema-utils.js';
// ═══════════════════════════════════════════════════════════════════
// ADAPTER IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════
/**
 * Inngest AgentKit adapter for bigtool-ts.
 *
 * Implements the ToolAdapter interface to convert bigtool-ts tools
 * to Inngest AgentKit format. Provides additional tools for dynamic
 * tool discovery and execution.
 *
 * Key features:
 * - Automatic durable execution wrapping via step.run()
 * - Search tool for runtime tool discovery
 * - Call tool for executing discovered tools by name
 *
 * @example Basic usage
 * ```typescript
 * const adapter = createInngestAdapter({ catalog, loader, searchIndex });
 *
 * // Get specific tools by ID
 * const tools = await adapter.getTools(['github:create_pr', 'slack:send']);
 *
 * // Create discovery tools
 * const searchTool = adapter.createSearchTool({ limit: 5 });
 * const callTool = adapter.createCallToolTool();
 * ```
 */
export class InngestAdapter {
    catalog;
    loader;
    searchIndex;
    constructor(config) {
        this.catalog = config.catalog;
        this.loader = config.loader;
        this.searchIndex = config.searchIndex;
    }
    /**
     * Convert bigtool-ts metadata to an Inngest AgentKit tool.
     *
     * The resulting tool wraps the bigtool-ts loader and automatically
     * uses step.run() for durable execution when available.
     *
     * Parameter schemas are converted from JSON Schema to Zod using a
     * simplified converter. For complex schemas, provide tools with Zod
     * schemas directly.
     *
     * @param metadata - Tool metadata from the catalog
     * @returns Inngest-compatible tool
     */
    toFrameworkTool(metadata) {
        const loader = this.loader;
        // Convert JSON Schema parameters to Zod for AgentKit validation
        const parameters = metadata.parameters
            ? jsonSchemaToZod(metadata.parameters)
            : undefined;
        return {
            name: metadata.name,
            description: metadata.description,
            parameters,
            handler: async (input, opts) => {
                const execute = async () => {
                    const tool = await loader.load(metadata.id);
                    return tool.invoke(input);
                };
                // Use step.run for durable execution when available
                if (opts.step) {
                    return opts.step.run(`bigtool:${metadata.name}`, execute);
                }
                return execute();
            },
        };
    }
    /**
     * Get multiple tools by their IDs.
     *
     * Tools not found in the catalog are silently skipped.
     * Use this when you know which tools you need ahead of time.
     *
     * @param toolIds - Array of tool IDs to retrieve
     * @returns Array of Inngest-compatible tools
     */
    async getTools(toolIds) {
        const tools = [];
        for (const id of toolIds) {
            const metadata = this.catalog.getMetadata(id);
            if (metadata) {
                tools.push(this.toFrameworkTool(metadata));
            }
        }
        return tools;
    }
    /**
     * Get all tools from the catalog.
     *
     * Use sparingly - prefer getTools() or createSearchTool() for
     * large catalogs.
     *
     * @returns Array of all Inngest-compatible tools
     */
    async getAllTools() {
        const allMetadata = this.catalog.getAllMetadata();
        return allMetadata.map((m) => this.toFrameworkTool(m));
    }
    /**
     * Get tools filtered by category.
     *
     * @param categories - Categories to filter by (matches any)
     * @returns Array of matching Inngest-compatible tools
     */
    async getToolsByCategory(categories) {
        const allMetadata = this.catalog.getAllMetadata();
        const filtered = allMetadata.filter((m) => m.categories?.some((c) => categories.includes(c)));
        return filtered.map((m) => this.toFrameworkTool(m));
    }
    /**
     * Create a search tool for discovering available tools.
     *
     * This is the core tool for dynamic tool discovery. The agent
     * can search for tools by natural language query and get back
     * matching tool names and descriptions.
     *
     * @param options - Search options (limit, threshold, categories)
     * @returns Inngest-compatible search tool
     *
     * @example
     * ```typescript
     * const searchTool = adapter.createSearchTool({ limit: 5 });
     * // Agent calls: search_tools({ query: "create github pr" })
     * // Returns: [{ name: "create_pr", description: "...", score: 0.95 }]
     * ```
     */
    createSearchTool(options = {}) {
        const { limit = 5, threshold = 0, categories } = options;
        const searchIndex = this.searchIndex;
        const catalog = this.catalog;
        return {
            name: 'search_tools',
            description: 'Search for available tools by query. Use this to discover what tools are available before calling them. Returns tool names and descriptions.',
            parameters: z.object({
                query: z
                    .string()
                    .describe('Natural language search query describing what you want to do'),
            }),
            handler: async (input, opts) => {
                const { query } = input;
                const execute = async () => {
                    const results = await searchIndex.search(query, {
                        limit,
                        threshold,
                        categories,
                    });
                    return results.map((r) => {
                        const meta = catalog.getMetadata(r.toolId);
                        return {
                            name: meta?.name ?? r.toolId,
                            description: meta?.description ?? '',
                            score: r.score,
                        };
                    });
                };
                // Wrap in step.run for durability when available
                if (opts.step) {
                    return opts.step.run('bigtool:search_tools', execute);
                }
                return execute();
            },
        };
    }
    /**
     * Create a tool for executing discovered tools by name.
     *
     * Use this in combination with createSearchTool() to enable
     * dynamic tool discovery and execution patterns.
     *
     * **Note:** Tool lookup uses name matching. If multiple tools share the
     * same name (from different sources), the first match wins. Ensure tool
     * names are unique within your catalog to avoid ambiguity.
     *
     * @returns Inngest-compatible call tool
     *
     * @example
     * ```typescript
     * const callTool = adapter.createCallToolTool();
     * // Agent calls: call_tool({ toolName: "create_pr", arguments: { title: "..." } })
     * ```
     */
    createCallToolTool() {
        const loader = this.loader;
        const catalog = this.catalog;
        return {
            name: 'call_tool',
            description: 'Call a tool by name with the given arguments. Use this after discovering tools via search_tools.',
            parameters: z.object({
                toolName: z.string().describe('The name of the tool to call'),
                arguments: z.record(z.unknown()).describe('Arguments to pass to the tool'),
            }),
            handler: async (input, opts) => {
                const { toolName, arguments: args } = input;
                const execute = async () => {
                    // Find the tool by name
                    const allMetadata = catalog.getAllMetadata();
                    const metadata = allMetadata.find((m) => m.name === toolName);
                    if (!metadata) {
                        throw new Error(`Tool not found: ${toolName}`);
                    }
                    const tool = await loader.load(metadata.id);
                    return tool.invoke(args);
                };
                // Wrap in step.run for durability when available
                if (opts.step) {
                    return opts.step.run(`bigtool:call:${toolName}`, execute);
                }
                return execute();
            },
        };
    }
}
// ═══════════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════
/**
 * Create an Inngest AgentKit adapter.
 *
 * Factory function for creating InngestAdapter instances. Use this
 * as the primary entry point for the adapter.
 *
 * @param config - Adapter configuration with catalog, loader, and search index
 * @returns Configured InngestAdapter instance
 *
 * @example
 * ```typescript
 * import { createInngestAdapter } from '@repo/bigtool-ts/adapters';
 * import { DefaultToolCatalog, OramaSearch, DefaultToolLoader } from '@repo/bigtool-ts';
 *
 * const catalog = new DefaultToolCatalog();
 * await catalog.register(new LocalSource(myTools));
 *
 * const searchIndex = new OramaSearch();
 * await searchIndex.index(catalog.getAllMetadata());
 *
 * const loader = new DefaultToolLoader(catalog);
 *
 * const adapter = createInngestAdapter({ catalog, loader, searchIndex });
 * ```
 */
export function createInngestAdapter(config) {
    return new InngestAdapter(config);
}
//# sourceMappingURL=inngest.js.map