/**
 * Agent Protocol adapter for bigtool-ts.
 *
 * @deprecated This module is misnamed. It provides a REST API for tools,
 * NOT an Agent Protocol implementation. Agent Protocol defines task/step
 * endpoints, not tool endpoints.
 *
 * Use `createToolRestHandler` from './rest-handler.js' instead.
 *
 * All exports from this module are re-exported with deprecation notices
 * for backwards compatibility.
 *
 * @module adapters/agent-protocol
 */
// Re-export everything from rest-handler with original names for backwards compatibility
export { createToolRestHandler as createAgentProtocolHandler, } from './rest-handler.js';
//# sourceMappingURL=agent-protocol.js.map