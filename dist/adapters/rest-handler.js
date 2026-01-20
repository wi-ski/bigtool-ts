/**
 * REST API handler for bigtool-ts tool operations.
 *
 * Provides a framework-agnostic handler interface for exposing bigtool-ts
 * tools via REST-like endpoints. Can be integrated with any HTTP framework
 * (Express, Fastify, Hono, etc.).
 *
 * NOTE: This is NOT an Agent Protocol implementation. Agent Protocol defines
 * task/step endpoints (/ap/v1/agent/tasks, /ap/v1/agent/tasks/{id}/steps),
 * not tool endpoints. This adapter provides a convenient REST interface for
 * tool operations:
 * - listTools(): Get all available tools
 * - searchTools(): Find tools by query
 * - executeTool(): Run a specific tool
 *
 * @see https://github.com/AI-Engineers-Foundation/agent-protocol - For actual Agent Protocol spec
 * @module adapters/rest-handler
 */
// ═══════════════════════════════════════════════════════════════════
// IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════
/**
 * Convert bigtool-ts metadata to REST wire format.
 */
function toRestTool(metadata) {
    return {
        name: metadata.name,
        description: metadata.description,
        parameters: metadata.parameters ?? {},
    };
}
/**
 * Generate a unique tool call ID.
 */
function generateToolCallId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `call_${timestamp}_${random}`;
}
/**
 * Creates a framework-agnostic REST handler for tool operations.
 *
 * The handler provides three core operations for tool management:
 * - `listTools()`: Get all available tools
 * - `searchTools()`: Find tools by natural language query
 * - `executeTool()`: Run a specific tool with arguments
 *
 * @param config - Adapter configuration with catalog, loader, and search index
 * @returns Handler instance with tool operations
 *
 * @example Basic usage
 * ```typescript
 * const handler = createToolRestHandler({
 *   catalog,
 *   loader,
 *   searchIndex,
 * });
 *
 * // List all tools
 * const tools = await handler.listTools();
 *
 * // Search for specific tools
 * const githubTools = await handler.searchTools('github pull request', 5);
 *
 * // Execute a tool
 * const result = await handler.executeTool('create_pr', {
 *   title: 'My PR',
 *   body: 'Description',
 * });
 * ```
 */
export function createToolRestHandler(config) {
    const { catalog, loader, searchIndex } = config;
    return {
        async listTools() {
            const metadata = catalog.getAllMetadata();
            return metadata.map(toRestTool);
        },
        async searchTools(query, limit = 5) {
            const results = await searchIndex.search(query, { limit });
            const tools = [];
            for (const result of results) {
                const metadata = catalog.getMetadata(result.toolId);
                if (metadata !== null) {
                    tools.push(toRestTool(metadata));
                }
            }
            return tools;
        },
        async executeTool(name, args) {
            const allMetadata = catalog.getAllMetadata();
            const metadata = allMetadata.find((m) => m.name === name);
            if (metadata === undefined) {
                return {
                    success: false,
                    error: {
                        code: 'TOOL_NOT_FOUND',
                        message: `Tool not found: ${name}`,
                    },
                };
            }
            const tool = await loader.load(metadata.id);
            const toolCallId = generateToolCallId();
            try {
                const rawResult = await tool.invoke(args);
                const output = typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult);
                return {
                    success: true,
                    data: {
                        tool_call_id: toolCallId,
                        output,
                    },
                };
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown execution error';
                return {
                    success: false,
                    error: {
                        code: 'EXECUTION_ERROR',
                        message,
                    },
                };
            }
        },
    };
}
//# sourceMappingURL=rest-handler.js.map