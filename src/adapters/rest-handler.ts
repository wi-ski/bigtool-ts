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

import type { ToolMetadata } from '../types.js';
import type { AdapterConfig } from './types.js';

// ═══════════════════════════════════════════════════════════════════
// API TYPES (Wire Format)
// ═══════════════════════════════════════════════════════════════════

/**
 * Tool representation in REST API wire format.
 *
 * Uses JSON Schema for parameters (not Zod) as required by REST APIs.
 */
export interface RestTool {
  /** Unique tool identifier */
  name: string;
  /** Human-readable description */
  description: string;
  /** JSON Schema for tool parameters */
  parameters: Record<string, unknown>;
}

/**
 * Result from tool execution.
 */
export interface RestToolExecutionResult {
  /** Unique identifier for this tool call */
  tool_call_id: string;
  /** Output from the tool (serialized to string) */
  output: string;
}

/**
 * Error response structure.
 */
export interface RestToolError {
  /** Error code for programmatic handling */
  code: 'TOOL_NOT_FOUND' | 'EXECUTION_ERROR';
  /** Human-readable error message */
  message: string;
}

/**
 * Result type for operations that can fail.
 */
export type RestToolResult<T> =
  | { success: true; data: T }
  | { success: false; error: RestToolError };

// ═══════════════════════════════════════════════════════════════════
// HANDLER INTERFACE
// ═══════════════════════════════════════════════════════════════════

/**
 * Framework-agnostic handler for tool REST operations.
 *
 * This interface provides the core operations that can be exposed via any
 * HTTP framework.
 *
 * @example Express integration
 * ```typescript
 * import express from 'express';
 * import { createToolRestHandler } from 'bigtool-ts/adapters';
 *
 * const handler = createToolRestHandler({ catalog, loader, searchIndex });
 * const app = express();
 *
 * app.get('/tools', async (req, res) => {
 *   const tools = await handler.listTools();
 *   res.json(tools);
 * });
 *
 * app.post('/tools/search', async (req, res) => {
 *   const { query, limit } = req.body;
 *   const tools = await handler.searchTools(query, limit);
 *   res.json(tools);
 * });
 *
 * app.post('/tools/execute', async (req, res) => {
 *   const { name, args } = req.body;
 *   const result = await handler.executeTool(name, args);
 *   if (result.success) {
 *     res.json(result.data);
 *   } else {
 *     res.status(400).json(result.error);
 *   }
 * });
 * ```
 */
export interface ToolRestHandler {
  /**
   * List all available tools.
   *
   * @returns Array of tools in REST format
   */
  listTools(): Promise<RestTool[]>;

  /**
   * Search for tools matching a query.
   *
   * @param query - Natural language search query
   * @param limit - Maximum number of results (default: 5)
   * @returns Array of matching tools, sorted by relevance
   */
  searchTools(query: string, limit?: number): Promise<RestTool[]>;

  /**
   * Execute a tool with the given arguments.
   *
   * @param name - Tool name to execute
   * @param args - Arguments to pass to the tool
   * @returns Result containing output or error
   */
  executeTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<RestToolResult<RestToolExecutionResult>>;
}

// ═══════════════════════════════════════════════════════════════════
// IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Convert bigtool-ts metadata to REST wire format.
 */
function toRestTool(metadata: ToolMetadata): RestTool {
  return {
    name: metadata.name,
    description: metadata.description,
    parameters: metadata.parameters ?? {},
  };
}

/**
 * Generate a unique tool call ID.
 */
function generateToolCallId(): string {
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
export function createToolRestHandler(config: AdapterConfig): ToolRestHandler {
  const { catalog, loader, searchIndex } = config;

  return {
    async listTools(): Promise<RestTool[]> {
      const metadata = catalog.getAllMetadata();
      return metadata.map(toRestTool);
    },

    async searchTools(query: string, limit = 5): Promise<RestTool[]> {
      const results = await searchIndex.search(query, { limit });

      const tools: RestTool[] = [];
      for (const result of results) {
        const metadata = catalog.getMetadata(result.toolId);
        if (metadata !== null) {
          tools.push(toRestTool(metadata));
        }
      }

      return tools;
    },

    async executeTool(
      name: string,
      args: Record<string, unknown>
    ): Promise<RestToolResult<RestToolExecutionResult>> {
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
        const output =
          typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult);

        return {
          success: true,
          data: {
            tool_call_id: toolCallId,
            output,
          },
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown execution error';

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
