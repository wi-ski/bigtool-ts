/**
 * LocalSource module.
 *
 * Provides a ToolSource implementation for in-memory StructuredTool instances.
 *
 * @module sources/local
 */

import type { StructuredTool } from '@langchain/core/tools';
import type { ToolSource, ToolMetadata, ToolEnhancement } from '../types.js';

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
export class LocalSource implements ToolSource {
  /**
   * Unique identifier for this source.
   *
   * Used to namespace tool IDs (e.g., 'local:calculator').
   */
  readonly id: string;

  /** @internal Map of tool name to StructuredTool */
  private tools: Map<string, StructuredTool>;

  /** @internal Cached metadata for all tools */
  private metadata: ToolMetadata[];

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
  constructor(tools: StructuredTool[], id?: string) {
    this.id = id ?? 'local';
    this.tools = new Map();
    this.metadata = [];

    for (const tool of tools) {
      this.tools.set(tool.name, tool);
      this.metadata.push(this.extractMetadata(tool));
    }
  }

  /**
   * Extracts metadata from a StructuredTool.
   *
   * @internal
   * @param tool - The tool to extract metadata from
   * @returns Tool metadata for indexing
   */
  private extractMetadata(tool: StructuredTool): ToolMetadata {
    // Check for enhanced metadata - support both __bigtool_metadata and metadata properties
    type EnhancedToolMeta = {
      __bigtool_metadata?: ToolEnhancement;
      metadata?: { categories?: string[]; keywords?: string[] };
    };
    const toolWithMeta = tool as StructuredTool & EnhancedToolMeta;
    const enhancement = toolWithMeta.__bigtool_metadata ?? toolWithMeta.metadata;
    
    // Namespace the tool ID with the source prefix
    const namespacedId = `${this.id}:${tool.name}`;
    
    return {
      id: namespacedId,
      name: tool.name,
      description: tool.description,
      parameters: tool.schema ? JSON.parse(JSON.stringify(tool.schema)) : undefined,
      categories: enhancement?.categories,
      keywords: enhancement?.keywords,
      source: 'local',
      sourceId: this.id,
    };
  }

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
  async getMetadata(): Promise<ToolMetadata[]> {
    return this.metadata;
  }

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
  async getTool(id: string): Promise<StructuredTool | null> {
    // Handle both prefixed ID (local:toolName) and bare name (toolName)
    const bareName = id.startsWith(`${this.id}:`) ? id.slice(this.id.length + 1) : id;
    return this.tools.get(bareName) ?? null;
  }
}
