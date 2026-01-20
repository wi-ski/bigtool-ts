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
import type { ToolMetadata } from '../types.js';
import type { AdapterConfig, SearchToolOptions, ToolAdapter } from './types.js';
import { jsonSchemaToZod } from './schema-utils.js';

// ═══════════════════════════════════════════════════════════════════
// INNGEST TYPES (Type-only imports to avoid runtime dependency)
// ═══════════════════════════════════════════════════════════════════

/**
 * Inngest AgentKit tool type.
 *
 * Matches the Tool type from @inngest/agent-kit but defined here
 * to avoid requiring the package as a runtime dependency.
 */
export interface InngestTool {
  name: string;
  description: string | undefined;
  parameters: z.ZodTypeAny | undefined;
  handler: (input: unknown, opts: InngestToolOptions) => unknown | Promise<unknown>;
}

/**
 * Options passed to tool handlers by Inngest AgentKit.
 *
 * These options provide access to agent context, network state,
 * and durable execution primitives.
 */
export interface InngestToolOptions {
  /** The agent executing this tool */
  agent: unknown;
  /** Network run context for accessing shared state (kv store and typed data) */
  network: InngestNetworkRun | undefined;
  /** Step context for durable execution (step.run, step.waitForEvent) */
  step: InngestStep | undefined;
}

/**
 * Inngest network run context for state access.
 */
export interface InngestNetworkRun {
  state: {
    kv: {
      get(key: string): unknown;
      set(key: string, value: unknown): void;
    };
    data: Record<string, unknown>;
  };
}

/**
 * Inngest step context for durable execution.
 *
 * Provides primitives for building reliable, resumable workflows.
 */
export interface InngestStep {
  /**
   * Execute code durably with automatic retries.
   * Results are cached - if the function resumes, cached results are returned.
   */
  run<T>(name: string, fn: () => T | Promise<T>): Promise<T>;
  /**
   * Wait for an external event (human-in-the-loop, webhooks, etc.).
   * The function pauses until the event arrives or timeout is reached.
   */
  waitForEvent(
    name: string,
    opts: { event: string; timeout: string; match?: string }
  ): Promise<unknown>;
}

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
export class InngestAdapter implements ToolAdapter<InngestTool> {
  private readonly catalog: AdapterConfig['catalog'];
  private readonly loader: AdapterConfig['loader'];
  private readonly searchIndex: AdapterConfig['searchIndex'];

  constructor(config: AdapterConfig) {
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
  toFrameworkTool(metadata: ToolMetadata): InngestTool {
    const loader = this.loader;

    // Convert JSON Schema parameters to Zod for AgentKit validation
    const parameters = metadata.parameters
      ? jsonSchemaToZod(metadata.parameters)
      : undefined;

    return {
      name: metadata.name,
      description: metadata.description,
      parameters,
      handler: async (input: unknown, opts: InngestToolOptions) => {
        const execute = async () => {
          const tool = await loader.load(metadata.id);
          return tool.invoke(input as Record<string, unknown>);
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
  async getTools(toolIds: string[]): Promise<InngestTool[]> {
    const tools: InngestTool[] = [];

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
  async getAllTools(): Promise<InngestTool[]> {
    const allMetadata = this.catalog.getAllMetadata();
    return allMetadata.map((m) => this.toFrameworkTool(m));
  }

  /**
   * Get tools filtered by category.
   *
   * @param categories - Categories to filter by (matches any)
   * @returns Array of matching Inngest-compatible tools
   */
  async getToolsByCategory(categories: string[]): Promise<InngestTool[]> {
    const allMetadata = this.catalog.getAllMetadata();
    const filtered = allMetadata.filter((m) =>
      m.categories?.some((c) => categories.includes(c))
    );
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
  createSearchTool(options: SearchToolOptions = {}): InngestTool {
    const { limit = 5, threshold = 0, categories } = options;
    const searchIndex = this.searchIndex;
    const catalog = this.catalog;

    return {
      name: 'search_tools',
      description:
        'Search for available tools by query. Use this to discover what tools are available before calling them. Returns tool names and descriptions.',
      parameters: z.object({
        query: z
          .string()
          .describe('Natural language search query describing what you want to do'),
      }),
      handler: async (
        input: unknown,
        opts: InngestToolOptions
      ): Promise<SearchToolResult[]> => {
        const { query } = input as { query: string };

        const execute = async (): Promise<SearchToolResult[]> => {
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
  createCallToolTool(): InngestTool {
    const loader = this.loader;
    const catalog = this.catalog;

    return {
      name: 'call_tool',
      description:
        'Call a tool by name with the given arguments. Use this after discovering tools via search_tools.',
      parameters: z.object({
        toolName: z.string().describe('The name of the tool to call'),
        arguments: z.record(z.unknown()).describe('Arguments to pass to the tool'),
      }),
      handler: async (input: unknown, opts: InngestToolOptions) => {
        const { toolName, arguments: args } = input as {
          toolName: string;
          arguments: Record<string, unknown>;
        };

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
// RESULT TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Result returned by the search_tools tool.
 */
export interface SearchToolResult {
  /** Tool name */
  name: string;
  /** Tool description */
  description: string;
  /** Relevance score (0-1) */
  score: number;
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
export function createInngestAdapter(config: AdapterConfig): InngestAdapter {
  return new InngestAdapter(config);
}
