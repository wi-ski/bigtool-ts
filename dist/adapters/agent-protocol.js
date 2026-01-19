/**
 * Agent Protocol adapter for bigtool-ts.
 *
 * IMPORTANT: Agent Protocol is a task/step-oriented specification, NOT a tool-oriented one.
 * The protocol defines Tasks (high-level goals) and Steps (actions), with no native tool endpoints.
 *
 * This adapter provides a framework-agnostic handler interface that maps bigtool-ts
 * tool operations to a REST-like API. It can be used with any HTTP framework
 * (Express, Fastify, Hono, etc.) or integrated with the Agent Protocol SDK.
 *
 * @see https://github.com/AI-Engineers-Foundation/agent-protocol
 * @module adapters/agent-protocol
 */
// ═══════════════════════════════════════════════════════════════════
// IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════
/**
 * Convert bigtool-ts metadata to Agent Protocol wire format.
 *
 * This is a pure function that transforms internal metadata to the
 * external API representation.
 */
function toAgentTool(metadata) {
    return {
        name: metadata.name,
        description: metadata.description,
        parameters: metadata.parameters ?? {},
    };
}
/**
 * Generate a unique tool call ID.
 *
 * Uses timestamp + random suffix for uniqueness without external dependencies.
 */
function generateToolCallId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `call_${timestamp}_${random}`;
}
/**
 * Creates a framework-agnostic Agent Protocol handler.
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
 * const handler = createAgentProtocolHandler({
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
export function createAgentProtocolHandler(config) {
    const { catalog, loader, searchIndex } = config;
    return {
        async listTools() {
            const metadata = catalog.getAllMetadata();
            return metadata.map(toAgentTool);
        },
        async searchTools(query, limit = 5) {
            const results = await searchIndex.search(query, { limit });
            // Map search results to agent tools
            // Filter out nulls in case metadata was removed between search and lookup
            const tools = [];
            for (const result of results) {
                const metadata = catalog.getMetadata(result.toolId);
                if (metadata !== null) {
                    tools.push(toAgentTool(metadata));
                }
            }
            return tools;
        },
        async executeTool(name, args) {
            // Find tool by name (search through metadata)
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
            // Load and execute the tool
            const tool = await loader.load(metadata.id);
            // Attempt execution with error handling
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
//# sourceMappingURL=agent-protocol.js.map