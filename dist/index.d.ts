/**
 * @module @repo/bigtool-ts
 *
 * BigTool-TS: Dynamic tool discovery and management for LangGraph agents.
 *
 * This package provides a complete system for managing large tool collections
 * with intelligent search-based discovery. Instead of loading all tools into
 * the LLM context, agents can search for and load tools on demand.
 *
 * ## Core Concepts
 *
 * - **ToolSource**: Provides tools from a specific origin (local, MCP server, dynamic)
 * - **ToolCatalog**: Registry that aggregates tools from multiple sources
 * - **SearchIndex**: Enables fast tool discovery via text or semantic search
 * - **ToolLoader**: Lazy-loads tool implementations with LRU caching
 *
 * ## Quick Start
 *
 * @example Basic usage with local tools
 * ```typescript
 * import { createAgent, OramaSearch } from '@repo/bigtool-ts';
 * import { ChatOpenAI } from '@langchain/openai';
 *
 * const agent = await createAgent({
 *   llm: new ChatOpenAI({ model: 'gpt-4o' }),
 *   tools: [myTool1, myTool2, myTool3],
 *   search: new OramaSearch(),
 * });
 *
 * const result = await agent.invoke({
 *   messages: [{ role: 'user', content: 'Create a GitHub PR' }]
 * });
 * ```
 *
 * @example Advanced usage with multiple sources
 * ```typescript
 * import {
 *   createAgent,
 *   LocalSource,
 *   MCPSource,
 *   OramaSearch,
 * } from '@repo/bigtool-ts';
 *
 * const agent = await createAgent({
 *   llm: new ChatOpenAI({ model: 'gpt-4o' }),
 *   sources: [
 *     new LocalSource(myLocalTools),
 *     new MCPSource(mcpClient, { namespace: 'github' }),
 *   ],
 *   search: new OramaSearch({ mode: 'hybrid', embeddings }),
 *   pinnedTools: [alwaysAvailableTool],
 * });
 * ```
 *
 * @packageDocumentation
 */
export { createAgent, createToolDiscoveryGraph } from './graph/agent.js';
export type { CreateAgentOptions } from './graph/agent.js';
export type { ToolSource, ToolMetadata, ToolCatalog, ToolsChangedEvent, SearchIndex, SearchOptions, SearchResult, ToolLoader, EventEmitter, EventHandler, Unsubscribe, ToolEnhancement, EnhancedTool, } from './types.js';
export { createEventEmitter, withMetadata } from './types.js';
export { LocalSource } from './sources/local.js';
export { MCPSource, createMCPSource, type MCPSourceOptions, type MCPClient, type MCPServerConfig, type MCPStdioConfig, type MCPSSEConfig, type MCPWebSocketConfig, } from './sources/mcp.js';
export { DynamicSource, type DynamicSourceOptions } from './sources/dynamic.js';
export { DefaultToolCatalog } from './catalog/index.js';
export { OramaSearch, type OramaSearchConfig } from './search/index.js';
export { DefaultToolLoader, type ToolLoaderOptions, } from './loader/index.js';
export { ToolNotFoundError, SourceNotFoundError } from './loader/loader.js';
export { ToolDiscoveryAnnotation, type ToolDiscoveryState, type ToolDiscoveryUpdate, type SearchQuery } from './graph/state.js';
export { searchNode, routeNode, executeNode } from './graph/nodes.js';
//# sourceMappingURL=index.d.ts.map