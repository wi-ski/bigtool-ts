/**
 * Tool Sources - Different ways to provide tools to bigtool-ts.
 *
 * @module sources
 */
export { LocalSource } from './local.js';
export { MCPSource, createMCPSource, MCPSourceError, MCPToolError, type MCPSourceOptions, type MCPClient, type MCPServerConfig, type MCPStdioConfig, type MCPSSEConfig, type MCPWebSocketConfig, } from './mcp.js';
export { DynamicSource, DynamicSourceError, type DynamicSourceOptions, } from './dynamic.js';
export { withMetadata } from './with-metadata.js';
export type { ToolSource, ToolMetadata, ToolEnhancement, EnhancedTool, } from './types.js';
//# sourceMappingURL=index.d.ts.map