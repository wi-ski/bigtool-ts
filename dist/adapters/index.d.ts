/**
 * Framework adapters for bigtool-ts.
 *
 * This module provides adapters that convert bigtool-ts tools to
 * framework-specific formats. Each adapter implements the ToolAdapter
 * interface and provides a factory function for easy instantiation.
 *
 * @module adapters
 *
 * @example Inngest AgentKit
 * ```typescript
 * import { createInngestAdapter } from '@repo/bigtool-ts/adapters';
 *
 * const adapter = createInngestAdapter({ catalog, loader, searchIndex });
 * const tools = await adapter.getTools(['github:create_pr']);
 * ```
 *
 * @example Vercel AI SDK
 * ```typescript
 * import { createVercelAdapter } from '@repo/bigtool-ts/adapters';
 *
 * const adapter = createVercelAdapter({ catalog, loader, searchIndex });
 * const tools = await adapter.getToolsAsRecord(['github:create_pr']);
 * ```
 *
 * @example Mastra
 * ```typescript
 * import { createMastraAdapter } from '@repo/bigtool-ts/adapters';
 *
 * const adapter = createMastraAdapter({ catalog, loader, searchIndex });
 * const tools = await adapter.getToolsAsRecord(['github:create_pr']);
 * ```
 */
export type { AdapterConfig, SearchToolOptions, ToolAdapter } from './types.js';
export { InngestAdapter, createInngestAdapter, type InngestTool, type InngestToolOptions, type InngestNetworkRun, type InngestStep, type SearchToolResult, } from './inngest.js';
export { createAgentProtocolHandler, type AgentProtocolHandler, type AgentTool, type ToolExecutionResult, type ToolError, type ToolResult, } from './agent-protocol.js';
export { VercelAIAdapter, createVercelAdapter, } from './vercel-ai.js';
export { MastraAdapter, createMastraAdapter, type MastraTool, type MastraToolContext, } from './mastra.js';
//# sourceMappingURL=index.d.ts.map