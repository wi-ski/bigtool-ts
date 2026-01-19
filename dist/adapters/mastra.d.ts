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
import type { ToolMetadata } from '../types.js';
import type { AdapterConfig, ToolAdapter, SearchToolOptions } from './types.js';
/**
 * Mastra tool execution context.
 *
 * Provides access to Mastra runtime services during tool execution.
 * All properties are optional to handle various execution contexts.
 */
export interface MastraToolContext {
    /** Mastra runtime instance for accessing services */
    mastra?: unknown;
    /** Request context for HTTP-triggered executions */
    requestContext?: unknown;
    /** Tracing context for observability */
    tracingContext?: unknown;
    /** Abort signal for cancellation support */
    abortSignal?: AbortSignal;
    /** Agent-specific context (suspend/resume support) */
    agent?: unknown;
    /** Workflow-specific context */
    workflow?: unknown;
}
/**
 * Mastra tool definition shape.
 *
 * This matches the output of `createTool()` from `@mastra/core/tools`.
 *
 * Key differences from other frameworks:
 * - Uses `id` only (no `name` property)
 * - Execute signature: `(inputData, context?)` NOT `({ input })`
 * - Context is optional second parameter
 */
export interface MastraTool<TInput = unknown, TOutput = unknown> {
    /** Unique identifier for the tool */
    id: string;
    /** Description of what the tool does */
    description: string;
    /** Zod schema for input validation */
    inputSchema: z.ZodSchema<TInput>;
    /** Zod schema for output validation (null if not specified) */
    outputSchema: z.ZodSchema<TOutput> | undefined;
    /** Tool execution function */
    execute: (inputData: TInput, context?: MastraToolContext) => Promise<TOutput>;
}
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
export declare class MastraAdapter implements ToolAdapter<MastraTool> {
    private readonly catalog;
    private readonly loader;
    private readonly searchIndex;
    constructor(config: AdapterConfig);
    /**
     * Convert bigtool-ts metadata to a Mastra tool.
     *
     * Creates a Mastra-compatible tool definition that lazily loads
     * and executes the underlying bigtool-ts tool implementation.
     *
     * @param metadata - Tool metadata from the catalog
     * @returns Mastra tool definition
     */
    toFrameworkTool(metadata: ToolMetadata): MastraTool;
    /**
     * Get tools by IDs as an array.
     *
     * Converts each tool from bigtool-ts format to Mastra format.
     * Tools not found in the catalog are silently skipped.
     *
     * @param toolIds - Array of tool IDs to retrieve
     * @returns Array of Mastra tools
     */
    getTools(toolIds: string[]): Promise<MastraTool[]>;
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
    getToolsAsRecord(toolIds: string[]): Promise<Record<string, MastraTool>>;
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
    createSearchTool(options?: SearchToolOptions): MastraTool;
    /**
     * Extract the tool key from a fully-qualified tool ID.
     *
     * For IDs like 'github:create_pr', returns 'create_pr'.
     * For IDs without a namespace, returns the full ID.
     */
    private extractToolKey;
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
    private buildInputSchema;
}
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
export declare function createMastraAdapter(config: AdapterConfig): MastraAdapter;
//# sourceMappingURL=mastra.d.ts.map