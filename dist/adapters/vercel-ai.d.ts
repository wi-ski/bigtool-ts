/**
 * Vercel AI SDK adapter for bigtool-ts.
 *
 * Converts bigtool-ts tools to Vercel AI SDK format for use with
 * generateText(), streamText(), and other SDK functions.
 *
 * @module adapters/vercel-ai
 */
import type { ToolMetadata } from '../types.js';
import type { AdapterConfig, ToolAdapter, SearchToolOptions } from './types.js';
/**
 * Options passed to tool execute functions.
 * Matches ToolCallOptions from 'ai' package v5.x.
 *
 * @see https://github.com/vercel/ai
 */
interface ToolCallOptions {
    /** The ID of the tool call */
    toolCallId: string;
    /** Conversation messages (available in v5+) */
    messages?: unknown[];
    /** Abort signal for cancellation */
    abortSignal?: AbortSignal;
    /** Experimental context data */
    experimental_context?: unknown;
}
/**
 * Vercel AI SDK Tool type.
 *
 * Matches the Tool type from the 'ai' package v5.x.
 * We define it here to avoid requiring 'ai' as a runtime dependency.
 *
 * @see https://github.com/vercel/ai - Full type definition
 */
interface VercelTool<INPUT = unknown, OUTPUT = unknown> {
    /** Description for the language model */
    description?: string;
    /** Schema for tool input (FlexibleSchema - Zod or JSON Schema) */
    inputSchema: unknown;
    /** Execute function - supports sync, async, and AsyncIterable returns */
    execute?: (input: INPUT, options: ToolCallOptions) => Promise<OUTPUT> | OUTPUT | AsyncIterable<OUTPUT>;
    /** Output schema for validation */
    outputSchema?: unknown;
}
/**
 * A record of tools keyed by name (ToolSet in Vercel AI SDK).
 */
type ToolSet = Record<string, VercelTool>;
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
export declare class VercelAIAdapter implements ToolAdapter<VercelTool> {
    private readonly catalog;
    private readonly loader;
    private readonly searchIndex;
    constructor(config: AdapterConfig);
    /**
     * Convert bigtool-ts metadata to a Vercel AI SDK tool.
     *
     * The returned tool lazily loads the implementation on first execute.
     * Abort signals are checked before loading to fail fast on cancellation.
     *
     * @param metadata - Tool metadata from the catalog
     * @returns Vercel AI SDK compatible tool
     */
    toFrameworkTool(metadata: ToolMetadata): VercelTool;
    /**
     * Get tools by IDs as an array.
     *
     * Missing tools are silently skipped. Use this when you need an array
     * of tools and don't care about the tool names.
     *
     * @param toolIds - Array of tool IDs to load
     * @returns Array of Vercel AI SDK tools
     */
    getTools(toolIds: string[]): Promise<VercelTool[]>;
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
    getToolsAsRecord(toolIds: string[]): Promise<ToolSet>;
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
    createSearchTool(options?: SearchToolOptions): VercelTool;
}
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
export declare function createVercelAdapter(config: AdapterConfig): VercelAIAdapter;
export {};
//# sourceMappingURL=vercel-ai.d.ts.map