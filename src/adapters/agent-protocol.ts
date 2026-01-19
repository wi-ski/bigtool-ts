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

import type { ToolMetadata } from '../types.js';
import type { AdapterConfig } from './types.js';

// ═══════════════════════════════════════════════════════════════════
// API TYPES (Wire Format)
// ═══════════════════════════════════════════════════════════════════

/**
 * Tool representation in Agent Protocol wire format.
 *
 * Uses JSON Schema for parameters (not Zod) as required by REST APIs.
 */
export interface AgentTool {
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
export interface ToolExecutionResult {
  /** Unique identifier for this tool call */
  tool_call_id: string;
  /** Output from the tool (serialized to string) */
  output: string;
}

/**
 * Error response structure.
 */
export interface ToolError {
  /** Error code for programmatic handling */
  code: 'TOOL_NOT_FOUND' | 'EXECUTION_ERROR';
  /** Human-readable error message */
  message: string;
}

/**
 * Result type for operations that can fail.
 */
export type ToolResult<T> =
  | { success: true; data: T }
  | { success: false; error: ToolError };

// ═══════════════════════════════════════════════════════════════════
// HANDLER INTERFACE
// ═══════════════════════════════════════════════════════════════════

/**
 * Framework-agnostic handler for Agent Protocol tool operations.
 *
 * This interface provides the core operations that can be exposed via any
 * HTTP framework or integrated with the Agent Protocol SDK's step mechanism.
 *
 * @example Express integration
 * ```typescript
 * import express from 'express';
 * import { createAgentProtocolHandler } from '@repo/bigtool-ts/adapters';
 *
 * const handler = createAgentProtocolHandler({ catalog, loader, searchIndex });
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
export interface AgentProtocolHandler {
  /**
   * List all available tools.
   *
   * @returns Array of tools in Agent Protocol format
   */
  listTools(): Promise<AgentTool[]>;

  /**
   * Search for tools matching a query.
   *
   * @param query - Natural language search query
   * @param limit - Maximum number of results (default: 5)
   * @returns Array of matching tools, sorted by relevance
   */
  searchTools(query: string, limit?: number): Promise<AgentTool[]>;

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
  ): Promise<ToolResult<ToolExecutionResult>>;
}

// ═══════════════════════════════════════════════════════════════════
// IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Convert bigtool-ts metadata to Agent Protocol wire format.
 *
 * This is a pure function that transforms internal metadata to the
 * external API representation.
 */
function toAgentTool(metadata: ToolMetadata): AgentTool {
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
function generateToolCallId(): string {
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
export function createAgentProtocolHandler(
  config: AdapterConfig
): AgentProtocolHandler {
  const { catalog, loader, searchIndex } = config;

  return {
    async listTools(): Promise<AgentTool[]> {
      const metadata = catalog.getAllMetadata();
      return metadata.map(toAgentTool);
    },

    async searchTools(query: string, limit = 5): Promise<AgentTool[]> {
      const results = await searchIndex.search(query, { limit });

      // Map search results to agent tools
      // Filter out nulls in case metadata was removed between search and lookup
      const tools: AgentTool[] = [];
      for (const result of results) {
        const metadata = catalog.getMetadata(result.toolId);
        if (metadata !== null) {
          tools.push(toAgentTool(metadata));
        }
      }

      return tools;
    },

    async executeTool(
      name: string,
      args: Record<string, unknown>
    ): Promise<ToolResult<ToolExecutionResult>> {
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
