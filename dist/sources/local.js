/**
 * LocalSource module.
 *
 * Provides a ToolSource implementation for in-memory StructuredTool instances.
 *
 * @module sources/local
 */
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
export class LocalSource {
    /**
     * Unique identifier for this source.
     *
     * Used to namespace tool IDs (e.g., 'local:calculator').
     */
    id;
    /** @internal Map of tool name to StructuredTool */
    tools;
    /** @internal Cached metadata for all tools */
    metadata;
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
    constructor(tools, id) {
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
    extractMetadata(tool) {
        const toolWithMeta = tool;
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
    async getMetadata() {
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
    async getTool(id) {
        // Handle both prefixed ID (local:toolName) and bare name (toolName)
        const bareName = id.startsWith(`${this.id}:`) ? id.slice(this.id.length + 1) : id;
        return this.tools.get(bareName) ?? null;
    }
}
//# sourceMappingURL=local.js.map