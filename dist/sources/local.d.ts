/**
 * LocalSource module.
 *
 * Provides a ToolSource implementation for in-memory StructuredTool instances.
 *
 * @module sources/local
 */
import type { StructuredTool } from '@langchain/core/tools';
import type { ToolSource, ToolMetadata } from '../types.js';
/**
 * A tool source backed by local StructuredTool instances.
 *
 * LocalSource is the simplest way to add tools to the discovery system.
 * It wraps an array of StructuredTool instances and exposes them through
 * the ToolSource interface.
 *
 * Tools are stored in memory and returned immediately when requested.
 * Use {@link withMetadata} to add categories and keywords for better
 * search matching.
 *
 * @example Basic usage
 * ```typescript
 * import { LocalSource } from '@repo/bigtool-ts';
 *
 * const source = new LocalSource([
 *   calculatorTool,
 *   weatherTool,
 *   searchTool,
 * ]);
 *
 * // Register with catalog
 * await catalog.register(source);
 * ```
 *
 * @example With custom ID
 * ```typescript
 * const utilitySource = new LocalSource(utilityTools, 'utilities');
 * const aiSource = new LocalSource(aiTools, 'ai');
 *
 * // Tools will be namespaced: 'utilities:calculator', 'ai:chat'
 * ```
 *
 * @example With enhanced metadata
 * ```typescript
 * import { LocalSource, withMetadata } from '@repo/bigtool-ts';
 *
 * const tools = [
 *   withMetadata(createPRTool, {
 *     categories: ['github', 'git'],
 *     keywords: ['PR', 'pull request', 'merge'],
 *   }),
 *   withMetadata(reviewPRTool, {
 *     categories: ['github', 'git'],
 *     keywords: ['review', 'approve', 'comment'],
 *   }),
 * ];
 *
 * const source = new LocalSource(tools, 'github');
 * ```
 */
export declare class LocalSource implements ToolSource {
    /**
     * Unique identifier for this source.
     *
     * Used to namespace tool IDs (e.g., 'local:calculator').
     */
    readonly id: string;
    /** @internal Map of tool name to StructuredTool */
    private tools;
    /** @internal Cached metadata for all tools */
    private metadata;
    /**
     * Creates a new LocalSource.
     *
     * @param tools - Array of StructuredTool instances to expose
     * @param id - Optional source identifier (default: 'local')
     *
     * @example
     * ```typescript
     * const source = new LocalSource([tool1, tool2]);
     * const namedSource = new LocalSource([tool1, tool2], 'my-tools');
     * ```
     */
    constructor(tools: StructuredTool[], id?: string);
    /**
     * Extracts metadata from a StructuredTool.
     *
     * @internal
     * @param tool - The tool to extract metadata from
     * @returns Tool metadata for indexing
     */
    private extractMetadata;
    /**
     * Get metadata for all tools in this source.
     *
     * Returns cached metadata extracted during construction.
     * This is synchronous internally but returns a Promise for
     * interface compatibility.
     *
     * @returns Promise resolving to array of tool metadata
     *
     * @example
     * ```typescript
     * const metadata = await source.getMetadata();
     * console.log(`Found ${metadata.length} tools`);
     * ```
     */
    getMetadata(): Promise<ToolMetadata[]>;
    /**
     * Get a tool by its ID.
     *
     * Accepts both prefixed IDs (e.g., 'local:calculator') and bare
     * tool names (e.g., 'calculator'). Returns the tool immediately
     * from memory.
     *
     * @param id - Tool ID or bare name
     * @returns Promise resolving to the tool, or null if not found
     *
     * @example
     * ```typescript
     * const tool = await source.getTool('local:calculator');
     * // or
     * const tool = await source.getTool('calculator');
     * ```
     */
    getTool(id: string): Promise<StructuredTool | null>;
}
//# sourceMappingURL=local.d.ts.map