/**
 * Vercel AI SDK adapter for bigtool-ts.
 *
 * Converts bigtool-ts tools to Vercel AI SDK format for use with
 * generateText(), streamText(), and other SDK functions.
 *
 * @module adapters/vercel-ai
 */

import { z } from 'zod';
import type { ToolMetadata, SearchResult } from '../types.js';
import type { AdapterConfig, ToolAdapter, SearchToolOptions } from './types.js';

// ═══════════════════════════════════════════════════════════════════
// TYPES (from Vercel AI SDK)
// ═══════════════════════════════════════════════════════════════════

/**
 * Options passed to tool execute functions.
 * Matches the ToolExecutionOptions from 'ai' package.
 */
interface ToolExecutionOptions {
  /** The ID of the tool call */
  toolCallId: string;
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
}

/**
 * Vercel AI SDK Tool type.
 *
 * This is a simplified version of the Tool type from the 'ai' package.
 * We define it here to avoid runtime dependencies on the 'ai' package
 * while maintaining type compatibility.
 *
 * @see https://github.com/vercel/ai - Full type definition
 */
interface VercelTool<INPUT = unknown, OUTPUT = unknown> {
  /** Description for the language model */
  description?: string;
  /** Schema for tool input */
  inputSchema: unknown;
  /** Execute function */
  execute?: (
    input: INPUT,
    options: ToolExecutionOptions
  ) => Promise<OUTPUT> | OUTPUT;
  /** Output schema for validation */
  outputSchema?: unknown;
}

/**
 * A record of tools keyed by name (ToolSet in Vercel AI SDK).
 */
type ToolSet = Record<string, VercelTool>;

// ═══════════════════════════════════════════════════════════════════
// SEARCH RESULT SCHEMA
// ═══════════════════════════════════════════════════════════════════

const searchInputSchema = z.object({
  query: z.string().describe('Natural language search query'),
});

const searchResultSchema = z.object({
  name: z.string(),
  description: z.string(),
  score: z.number(),
});

const searchOutputSchema = z.array(searchResultSchema);

type SearchInput = z.infer<typeof searchInputSchema>;
type SearchOutput = z.infer<typeof searchOutputSchema>;

// ═══════════════════════════════════════════════════════════════════
// ADAPTER IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Vercel AI SDK adapter for bigtool-ts.
 *
 * Converts bigtool-ts tools to Vercel AI SDK format. Tools are lazily
 * loaded when executed, and the adapter handles abort signal propagation.
 *
 * @example Basic usage with streamText
 * ```typescript
 * import { streamText } from 'ai';
 * import { openai } from '@ai-sdk/openai';
 * import { createVercelAdapter } from '@repo/bigtool-ts/adapters';
 *
 * const adapter = createVercelAdapter({ catalog, loader, searchIndex });
 *
 * const result = await streamText({
 *   model: openai('gpt-4o'),
 *   tools: {
 *     search_tools: adapter.createSearchTool(),
 *     ...await adapter.getToolsAsRecord(['github:create_pr']),
 *   },
 *   prompt: 'Create a PR with title "Fix bug"',
 * });
 * ```
 *
 * @example With search tool for dynamic discovery
 * ```typescript
 * const result = await generateText({
 *   model: openai('gpt-4o'),
 *   tools: {
 *     search_tools: adapter.createSearchTool({ limit: 10 }),
 *   },
 *   prompt: 'What tools are available for GitHub?',
 * });
 * ```
 */
export class VercelAIAdapter implements ToolAdapter<VercelTool> {
  private readonly catalog: AdapterConfig['catalog'];
  private readonly loader: AdapterConfig['loader'];
  private readonly searchIndex: AdapterConfig['searchIndex'];

  constructor(config: AdapterConfig) {
    this.catalog = config.catalog;
    this.loader = config.loader;
    this.searchIndex = config.searchIndex;
  }

  /**
   * Convert bigtool-ts metadata to a Vercel AI SDK tool.
   *
   * The returned tool lazily loads the implementation on first execute.
   * Abort signals are checked before loading to fail fast on cancellation.
   *
   * @param metadata - Tool metadata from the catalog
   * @returns Vercel AI SDK compatible tool
   */
  toFrameworkTool(metadata: ToolMetadata): VercelTool {
    const loader = this.loader;

    return {
      description: metadata.description,
      inputSchema: createJsonSchema(metadata.parameters),
      execute: async (args: unknown, options: ToolExecutionOptions) => {
        // Fail fast on abort before expensive loader call
        options.abortSignal?.throwIfAborted();

        const tool = await loader.load(metadata.id);
        return tool.invoke(args);
      },
    };
  }

  /**
   * Get tools by IDs as an array.
   *
   * Missing tools are silently skipped. Use this when you need an array
   * of tools and don't care about the tool names.
   *
   * @param toolIds - Array of tool IDs to load
   * @returns Array of Vercel AI SDK tools
   */
  async getTools(toolIds: string[]): Promise<VercelTool[]> {
    const tools: VercelTool[] = [];

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
   * Get tools by IDs as a record (ToolSet).
   *
   * The record keys are the tool names from metadata. Missing tools are
   * silently skipped. Use this for passing to generateText/streamText.
   *
   * @param toolIds - Array of tool IDs to load
   * @returns Record of tools keyed by name
   *
   * @example
   * ```typescript
   * const tools = await adapter.getToolsAsRecord([
   *   'github:create_pr',
   *   'slack:send_message',
   * ]);
   *
   * const result = await streamText({
   *   model: openai('gpt-4o'),
   *   tools,
   *   prompt: 'Create a PR and notify the team',
   * });
   * ```
   */
  async getToolsAsRecord(toolIds: string[]): Promise<ToolSet> {
    const tools: ToolSet = {};

    for (const id of toolIds) {
      const metadata = this.catalog.getMetadata(id);
      if (metadata === null) {
        continue;
      }
      tools[metadata.name] = this.toFrameworkTool(metadata);
    }

    return tools;
  }

  /**
   * Create a search tool for discovering available tools.
   *
   * The search tool enables dynamic tool discovery in agentic workflows.
   * The LLM can use this tool to find relevant tools before calling them.
   *
   * @param options - Search configuration options
   * @returns Vercel AI SDK tool for searching the catalog
   *
   * @example
   * ```typescript
   * const searchTool = adapter.createSearchTool({
   *   limit: 5,
   *   threshold: 0.3,
   *   categories: ['github'],
   * });
   *
   * const result = await generateText({
   *   model: openai('gpt-4o'),
   *   tools: { search_tools: searchTool },
   *   prompt: 'Find tools for creating pull requests',
   * });
   * ```
   */
  createSearchTool(options: SearchToolOptions = {}): VercelTool {
    const limit = options.limit ?? 5;
    const threshold = options.threshold ?? 0;
    const categories = options.categories;
    const searchIndex = this.searchIndex;
    const catalog = this.catalog;

    return {
      description:
        'Search for available tools by query. Use this to discover what tools are available before calling them.',
      inputSchema: searchInputSchema,
      outputSchema: searchOutputSchema,
      execute: async (input: unknown): Promise<SearchOutput> => {
        // Input is validated by the framework via inputSchema before execute is called
        const { query } = input as SearchInput;
        const results = await searchIndex.search(query, {
          limit,
          threshold,
          categories,
        });

        return results.map((result: SearchResult) => {
          const meta = catalog.getMetadata(result.toolId);
          return {
            name: meta?.name ?? result.toolId,
            description: meta?.description ?? '',
            score: result.score,
          };
        });
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a Vercel AI SDK adapter.
 *
 * Factory function for creating a VercelAIAdapter instance.
 * Use this as the primary entry point for creating adapters.
 *
 * @param config - Adapter configuration with catalog, loader, and searchIndex
 * @returns Configured VercelAIAdapter instance
 *
 * @example
 * ```typescript
 * import { createVercelAdapter } from '@repo/bigtool-ts/adapters';
 *
 * const adapter = createVercelAdapter({
 *   catalog: new DefaultToolCatalog(),
 *   loader: new DefaultToolLoader(catalog),
 *   searchIndex: new OramaSearch(),
 * });
 * ```
 */
export function createVercelAdapter(config: AdapterConfig): VercelAIAdapter {
  return new VercelAIAdapter(config);
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a JSON schema wrapper for Vercel AI SDK.
 *
 * The Vercel AI SDK accepts FlexibleSchema which includes raw JSON Schema.
 * This function wraps the parameters to match the expected format.
 *
 * @param parameters - JSON Schema parameters from tool metadata
 * @returns Wrapped schema for Vercel AI SDK
 */
function createJsonSchema(
  parameters: Record<string, unknown> | undefined
): Record<string, unknown> {
  // Default to empty object schema if no parameters
  const schema = parameters ?? { type: 'object', properties: {} };

  // Return in a format compatible with Vercel AI SDK's jsonSchema() helper
  // The SDK accepts raw JSON Schema objects directly
  return schema;
}
