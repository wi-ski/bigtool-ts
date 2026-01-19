/**
 * Tool Sources - Different ways to provide tools to bigtool-ts.
 * 
 * @module sources
 */

// LocalSource - Wraps in-memory StructuredTool instances
export { LocalSource } from './local.js';

// MCPSource - Connects to MCP servers
export { 
  MCPSource,
  createMCPSource,
  MCPSourceError, 
  MCPToolError,
  type MCPSourceOptions, 
  type MCPClient,
  type MCPServerConfig,
  type MCPStdioConfig,
  type MCPSSEConfig,
  type MCPWebSocketConfig,
} from './mcp.js';

// DynamicSource - Lazy-loads tools on demand
export { 
  DynamicSource, 
  DynamicSourceError,
  type DynamicSourceOptions,
} from './dynamic.js';

// Re-export withMetadata utility for convenience
export { withMetadata } from './with-metadata.js';

// Re-export types
export type { 
  ToolSource, 
  ToolMetadata, 
  ToolEnhancement,
  EnhancedTool,
} from './types.js';
