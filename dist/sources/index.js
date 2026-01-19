/**
 * Tool Sources - Different ways to provide tools to bigtool-ts.
 *
 * @module sources
 */
// LocalSource - Wraps in-memory StructuredTool instances
export { LocalSource } from './local.js';
// MCPSource - Connects to MCP servers
export { MCPSource, createMCPSource, MCPSourceError, MCPToolError, } from './mcp.js';
// DynamicSource - Lazy-loads tools on demand
export { DynamicSource, DynamicSourceError, } from './dynamic.js';
// Re-export withMetadata utility for convenience
export { withMetadata } from './with-metadata.js';
//# sourceMappingURL=index.js.map