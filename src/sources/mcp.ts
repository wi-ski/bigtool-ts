/**
 * MCPSource module.
 *
 * Provides a ToolSource implementation that connects to an MCP
 * (Model Context Protocol) server and exposes its tools.
 *
 * Supports two patterns:
 * 1. Pre-connected client: Pass an already-connected MCPClient
 * 2. Config-based: Pass server config and MCPSource manages the connection
 *
 * @module sources/mcp
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import type { StructuredTool } from "@langchain/core/tools";
import type { ToolSource, ToolMetadata, EventEmitter } from "../types.js";
import { createEventEmitter } from "../types.js";

/**
 * MCP Client interface.
 *
 * This is a subset of the @modelcontextprotocol/sdk Client interface.
 * Using an interface allows MCPSource to work with any compatible
 * client without a hard dependency on the MCP SDK.
 *
 * @example Using with MCP SDK
 * ```typescript
 * import { Client } from '@modelcontextprotocol/sdk/client';
 *
 * const client = new Client({ name: 'github' });
 * await client.connect(transport);
 *
 * const source = new MCPSource(client);
 * ```
 */
export interface MCPClient {
  /**
   * Client name, used as default namespace.
   *
   * If not provided, 'mcp' is used.
   */
  name?: string;

  /**
   * List available tools from the MCP server.
   *
   * @returns Promise with array of tool definitions
   */
  listTools(): Promise<{
    tools: Array<{
      name: string;
      description?: string;
      inputSchema?: Record<string, unknown>;
    }>;
  }>;

  /**
   * Call a tool on the MCP server.
   *
   * @param params - Tool call parameters
   * @returns Promise with tool execution result
   */
  callTool(params: {
    name: string;
    arguments?: Record<string, unknown>;
  }): Promise<{
    content?: Array<{ type: string; text?: string }>;
    isError?: boolean;
  }>;
}

/**
 * Configuration options for MCPSource.
 *
 * @example
 * ```typescript
 * const options: MCPSourceOptions = {
 *   namespace: 'github',
 *   refreshInterval: 60000, // Refresh every minute
 * };
 * ```
 */
export interface MCPSourceOptions {
  /**
   * Namespace for tool IDs.
   *
   * Tool IDs are formatted as 'mcp:{namespace}:{toolName}'.
   *
   * @default client.name or 'default'
   */
  namespace?: string;

  /**
   * Refresh interval in milliseconds.
   *
   * If set, the source will periodically refresh its tool list
   * from the MCP server. Set to 0 or omit to disable.
   *
   * @default undefined (no auto-refresh)
   */
  refreshInterval?: number;
}

/**
 * MCPSource connects to an MCP server and provides its tools.
 *
 * Tools are fetched from the MCP server on first access and cached.
 * Wrapper tools are created lazily that delegate execution back to
 * the server.
 *
 * The source can optionally refresh its tool list periodically to
 * pick up new tools or changes from the server.
 *
 * @example Basic usage
 * ```typescript
 * import { MCPSource } from '@repo/bigtool-ts';
 * import { Client } from '@modelcontextprotocol/sdk/client';
 *
 * const client = new Client({ name: 'github' });
 * await client.connect(transport);
 *
 * const source = new MCPSource(client);
 * await catalog.register(source);
 * ```
 *
 * @example With auto-refresh
 * ```typescript
 * const source = new MCPSource(client, {
 *   namespace: 'github',
 *   refreshInterval: 60000, // Check for new tools every minute
 * });
 *
 * // Listen for refresh events
 * source.onRefresh.subscribe((metadata) => {
 *   console.log(`Refreshed: ${metadata.length} tools`);
 * });
 * ```
 */
export class MCPSource implements ToolSource {
  /**
   * Unique identifier for this source.
   *
   * Format: 'mcp:{namespace}' (e.g., 'mcp:github').
   */
  readonly id: string;

  /** @internal The MCP client */
  private client: MCPClient;

  /** @internal Cached tool metadata */
  private metadata: ToolMetadata[] = [];

  /** @internal Cache of wrapped tools */
  private toolCache = new Map<string, StructuredTool>();

  /** @internal Timer for periodic refresh */
  private refreshTimer?: ReturnType<typeof setInterval>;

  /** @internal Whether initial fetch has completed */
  private initialized = false;

  /**
   * Event emitter for refresh notifications.
   *
   * Subscribe to be notified when the tool list is refreshed
   * from the MCP server.
   */
  readonly onRefresh: EventEmitter<ToolMetadata[]> = createEventEmitter();

  /**
   * Creates a new MCPSource.
   *
   * @param client - MCP client instance (must be connected)
   * @param options - Configuration options
   *
   * @example
   * ```typescript
   * const source = new MCPSource(client, {
   *   namespace: 'github',
   *   refreshInterval: 60000,
   * });
   * ```
   */
  constructor(client: MCPClient, options: MCPSourceOptions = {}) {
    this.client = client;
    this.id = `mcp:${options.namespace ?? client.name ?? "default"}`;

    if (options.refreshInterval && options.refreshInterval > 0) {
      this.refreshTimer = setInterval(() => {
        this.refresh().catch((err) => {
          console.error(`[MCPSource:${this.id}] Refresh failed:`, err);
        });
      }, options.refreshInterval);
    }
  }

  /**
   * Get metadata for all tools from this MCP server.
   *
   * Fetches from the server on first call, then returns cached metadata.
   * Call refresh() to update the metadata from the server.
   *
   * @returns Promise resolving to array of tool metadata
   *
   * @example
   * ```typescript
   * const metadata = await source.getMetadata();
   * console.log(`MCP server has ${metadata.length} tools`);
   * ```
   */
  async getMetadata(): Promise<ToolMetadata[]> {
    if (!this.initialized) {
      await this.refresh();
    }
    return this.metadata;
  }

  /**
   * Get a tool by its ID.
   *
   * Creates a wrapper tool on first request that delegates execution
   * to the MCP server. Wrappers are cached for subsequent calls.
   *
   * @param id - Tool ID (e.g., 'mcp:github:create_pr' or just 'create_pr')
   * @returns Promise resolving to the tool wrapper, or null if not found
   *
   * @example
   * ```typescript
   * const tool = await source.getTool('mcp:github:create_pr');
   * if (tool) {
   *   const result = await tool.invoke({ title: 'My PR' });
   * }
   * ```
   */
  async getTool(id: string): Promise<StructuredTool | null> {
    // Ensure we have metadata
    if (!this.initialized) {
      await this.refresh();
    }

    // Extract tool name from ID
    // Format: "mcp:namespace:toolName" or just "toolName"
    const parts = id.split(":");
    const toolName = parts[parts.length - 1];

    // Check if tool exists in metadata
    const meta = this.metadata.find((m) => m.name === toolName);
    if (!meta) {
      return null;
    }

    // Return cached wrapper or create new one
    if (!this.toolCache.has(toolName)) {
      const wrapper = this.createToolWrapper(toolName, meta);
      this.toolCache.set(toolName, wrapper);
    }

    return this.toolCache.get(toolName) ?? null;
  }

  /**
   * Refresh the tool list from the MCP server.
   *
   * Fetches the current tool list, updates metadata, clears the
   * tool wrapper cache, and emits an onRefresh event.
   *
   * @throws MCPSourceError if the server request fails
   *
   * @example
   * ```typescript
   * // Manually refresh tools
   * await source.refresh();
   *
   * // Or listen for auto-refresh events
   * source.onRefresh.subscribe((metadata) => {
   *   console.log('Tools refreshed:', metadata.length);
   * });
   * ```
   */
  async refresh(): Promise<void> {
    try {
      const { tools } = await this.client.listTools();

      this.metadata = tools.map((t) => ({
        id: `${this.id}:${t.name}`,
        name: t.name,
        description: t.description ?? "",
        parameters: t.inputSchema,
        source: "mcp" as const,
        sourceId: this.id,
      }));

      this.initialized = true;
      
      // Clear tool cache on refresh since schemas may have changed
      this.toolCache.clear();
      
      this.onRefresh.emit(this.metadata);
    } catch (error) {
      // Wrap error with more context
      const message = error instanceof Error ? error.message : String(error);
      throw new MCPSourceError(
        `Failed to fetch tools from MCP server: ${message}`,
        { cause: error }
      );
    }
  }

  /**
   * Create a wrapper tool that delegates execution to the MCP server.
   */
  private createToolWrapper(
    toolName: string,
    meta: ToolMetadata
  ): StructuredTool {
    const client = this.client;
    const sourceId = this.id;

    return new DynamicStructuredTool({
      name: toolName,
      description: meta.description,
      schema: this.createSchemaFromParameters(meta.parameters),
      func: async (input: Record<string, unknown>) => {
        try {
          const result = await client.callTool({
            name: toolName,
            arguments: input,
          });

          if (result.isError) {
            const errorText = result.content
              ?.filter((c) => c.type === "text")
              .map((c) => c.text)
              .join("\n");
            throw new MCPToolError(
              `MCP tool "${toolName}" returned error: ${errorText ?? "Unknown error"}`
            );
          }

          // Extract text content from result
          const textContent = result.content
            ?.filter((c) => c.type === "text")
            .map((c) => c.text)
            .join("\n");

          return textContent ?? JSON.stringify(result);
        } catch (error) {
          if (error instanceof MCPToolError) {
            throw error;
          }
          const message = error instanceof Error ? error.message : String(error);
          throw new MCPToolError(
            `Failed to execute MCP tool "${toolName}" on ${sourceId}: ${message}`,
            { cause: error }
          );
        }
      },
    });
  }

  /**
   * Create a Zod-like schema from MCP input schema.
   * For simplicity, we create a pass-through schema.
   */
  private createSchemaFromParameters(
    parameters: Record<string, unknown> | undefined
  ): Record<string, unknown> {
    // Return the raw JSON schema - LangChain will handle it
    return parameters ?? {};
  }

  /**
   * Clean up resources.
   *
   * Stops the refresh timer and clears all event subscriptions.
   * Call this when you're done with the source to prevent memory leaks.
   *
   * @example
   * ```typescript
   * // When shutting down
   * source.dispose();
   * catalog.unregister(source.id);
   * ```
   */
  dispose(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    this.onRefresh.clear();
  }
}

/**
 * Error thrown when MCP source operations fail.
 *
 * This error indicates a problem with the MCP server connection
 * or protocol, such as failing to list tools.
 *
 * @example
 * ```typescript
 * try {
 *   await source.refresh();
 * } catch (error) {
 *   if (error instanceof MCPSourceError) {
 *     console.error('MCP server error:', error.message);
 *   }
 * }
 * ```
 */
export class MCPSourceError extends Error {
  /**
   * Creates a new MCPSourceError.
   *
   * @param message - Error message
   * @param options - Error options (e.g., cause)
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MCPSourceError";
  }
}

/**
 * Error thrown when MCP tool execution fails.
 *
 * This error indicates a problem executing a specific tool on
 * the MCP server, such as invalid arguments or server-side errors.
 *
 * @example
 * ```typescript
 * try {
 *   await tool.invoke({ title: '' });
 * } catch (error) {
 *   if (error instanceof MCPToolError) {
 *     console.error('Tool execution failed:', error.message);
 *   }
 * }
 * ```
 */
export class MCPToolError extends Error {
  /**
   * Creates a new MCPToolError.
   *
   * @param message - Error message
   * @param options - Error options (e.g., cause)
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MCPToolError";
  }
}

// ============================================================================
// Config-based MCP Server Connection
// ============================================================================

/**
 * Configuration for connecting to an MCP server via stdio transport.
 *
 * Used when the MCP server is a local process that communicates via stdin/stdout.
 *
 * @example
 * ```typescript
 * const config: MCPStdioConfig = {
 *   name: 'github',
 *   transport: 'stdio',
 *   command: 'npx',
 *   args: ['-y', '@modelcontextprotocol/server-github'],
 *   env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN },
 * };
 * ```
 */
export interface MCPStdioConfig {
  /** Unique name for this server (used as namespace) */
  name: string;

  /** Transport type */
  transport: "stdio";

  /** Command to execute (e.g., 'npx', 'node', 'python') */
  command: string;

  /** Command arguments */
  args?: string[];

  /** Environment variables to pass to the process */
  env?: Record<string, string | undefined>;

  /** Working directory for the process */
  cwd?: string;

  /** Refresh interval in milliseconds (optional) */
  refreshInterval?: number;
}

/**
 * Configuration for connecting to an MCP server via SSE transport.
 *
 * Used when the MCP server is a remote HTTP server using Server-Sent Events.
 *
 * @example
 * ```typescript
 * const config: MCPSSEConfig = {
 *   name: 'remote-tools',
 *   transport: 'sse',
 *   url: 'https://mcp.example.com/sse',
 *   headers: { Authorization: 'Bearer xxx' },
 * };
 * ```
 */
export interface MCPSSEConfig {
  /** Unique name for this server (used as namespace) */
  name: string;

  /** Transport type */
  transport: "sse";

  /** SSE endpoint URL */
  url: string;

  /** Optional HTTP headers for authentication */
  headers?: Record<string, string>;

  /** Refresh interval in milliseconds (optional) */
  refreshInterval?: number;
}

/**
 * Configuration for connecting to an MCP server via WebSocket transport.
 *
 * @example
 * ```typescript
 * const config: MCPWebSocketConfig = {
 *   name: 'realtime-tools',
 *   transport: 'websocket',
 *   url: 'wss://mcp.example.com/ws',
 * };
 * ```
 */
export interface MCPWebSocketConfig {
  /** Unique name for this server (used as namespace) */
  name: string;

  /** Transport type */
  transport: "websocket";

  /** WebSocket endpoint URL */
  url: string;

  /** Refresh interval in milliseconds (optional) */
  refreshInterval?: number;
}

/**
 * Union type for all MCP server configurations.
 */
export type MCPServerConfig = MCPStdioConfig | MCPSSEConfig | MCPWebSocketConfig;

/**
 * Creates an MCPSource from a server configuration.
 *
 * This is the preferred way to create an MCPSource when you don't have
 * a pre-connected MCP client. The function handles:
 * - Starting the MCP server process (for stdio transport)
 * - Connecting to remote servers (for SSE/WebSocket transport)
 * - Managing the client lifecycle
 *
 * @param config - Server configuration
 * @returns Promise resolving to a configured MCPSource
 *
 * @example stdio transport (local server)
 * ```typescript
 * import { createMCPSource } from '@repo/bigtool-ts';
 *
 * const source = await createMCPSource({
 *   name: 'github',
 *   transport: 'stdio',
 *   command: 'npx',
 *   args: ['-y', '@modelcontextprotocol/server-github'],
 *   env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN },
 * });
 *
 * // Use like any ToolSource
 * await catalog.register(source);
 * ```
 *
 * @example SSE transport (remote server)
 * ```typescript
 * const source = await createMCPSource({
 *   name: 'remote-tools',
 *   transport: 'sse',
 *   url: 'https://mcp.example.com/sse',
 *   headers: { Authorization: `Bearer ${apiKey}` },
 * });
 * ```
 *
 * @example Multiple servers
 * ```typescript
 * const sources = await Promise.all([
 *   createMCPSource({ name: 'github', transport: 'stdio', command: 'npx', args: ['-y', '@mcp/server-github'] }),
 *   createMCPSource({ name: 'slack', transport: 'stdio', command: 'npx', args: ['-y', '@mcp/server-slack'] }),
 *   createMCPSource({ name: 'notion', transport: 'stdio', command: 'npx', args: ['-y', '@mcp/server-notion'] }),
 * ]);
 *
 * for (const source of sources) {
 *   await catalog.register(source);
 * }
 * ```
 */
export async function createMCPSource(config: MCPServerConfig): Promise<MCPSource> {
  // Dynamic import of MCP SDK to avoid hard dependency
  let Client: typeof import("@modelcontextprotocol/sdk/client/index.js").Client;
  let StdioClientTransport: typeof import("@modelcontextprotocol/sdk/client/stdio.js").StdioClientTransport | undefined;
  let SSEClientTransport: typeof import("@modelcontextprotocol/sdk/client/sse.js").SSEClientTransport | undefined;

  try {
    const sdk = await import("@modelcontextprotocol/sdk/client/index.js");
    Client = sdk.Client;
  } catch {
    throw new MCPSourceError(
      "Failed to import @modelcontextprotocol/sdk. Please install it: pnpm add @modelcontextprotocol/sdk"
    );
  }

  const client = new Client(
    { name: config.name, version: "1.0.0" },
    { capabilities: {} }
  );

  try {
    if (config.transport === "stdio") {
      try {
        const stdioModule = await import("@modelcontextprotocol/sdk/client/stdio.js");
        StdioClientTransport = stdioModule.StdioClientTransport;
      } catch {
        throw new MCPSourceError(
          "Failed to import stdio transport. Ensure @modelcontextprotocol/sdk is installed."
        );
      }

      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: config.env as Record<string, string>,
        cwd: config.cwd,
      });

      await client.connect(transport);
    } else if (config.transport === "sse") {
      try {
        const sseModule = await import("@modelcontextprotocol/sdk/client/sse.js");
        SSEClientTransport = sseModule.SSEClientTransport;
      } catch {
        throw new MCPSourceError(
          "Failed to import SSE transport. Ensure @modelcontextprotocol/sdk is installed."
        );
      }

      const transport = new SSEClientTransport(new URL(config.url));
      await client.connect(transport);
    } else if (config.transport === "websocket") {
      // WebSocket transport - not yet available in MCP SDK
      throw new MCPSourceError(
        `WebSocket transport is not yet supported by the MCP SDK`
      );
    } else {
      throw new MCPSourceError(
        `Unknown transport type: ${(config as MCPServerConfig).transport}`
      );
    }
  } catch (error) {
    if (error instanceof MCPSourceError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new MCPSourceError(
      `Failed to connect to MCP server "${config.name}": ${message}`,
      { cause: error }
    );
  }

  // Create MCPSource with the connected client
  return new MCPSource(client as MCPClient, {
    namespace: config.name,
    refreshInterval: config.refreshInterval,
  });
}
