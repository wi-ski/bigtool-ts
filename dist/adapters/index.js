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
// Inngest AgentKit adapter
export { InngestAdapter, createInngestAdapter, } from './inngest.js';
// Agent Protocol adapter
export { createAgentProtocolHandler, } from './agent-protocol.js';
// Vercel AI SDK adapter
export { VercelAIAdapter, createVercelAdapter, } from './vercel-ai.js';
// Mastra adapter
export { MastraAdapter, createMastraAdapter, } from './mastra.js';
//# sourceMappingURL=index.js.map