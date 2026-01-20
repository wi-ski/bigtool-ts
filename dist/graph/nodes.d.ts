/**
 * Graph Nodes
 *
 * Node factories for the BigTool LangGraph agent.
 */
import type { RunnableConfig } from "@langchain/core/runnables";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { StructuredTool } from "@langchain/core/tools";
import type { ToolCatalog, ToolLoader, SearchIndex } from "../types.js";
import type { ToolDiscoveryState, ToolDiscoveryUpdate } from "./state.js";
/**
 * Configuration for the agent node
 */
export interface AgentNodeConfig {
    /** The LLM to use */
    llm: BaseChatModel;
    /** Tool catalog for metadata lookups */
    catalog: ToolCatalog;
    /** Tool loader for loading selected tools */
    loader: ToolLoader;
    /** Tools that are always available (bypass search) */
    pinnedTools: StructuredTool[];
    /** The search_tools tool */
    searchTool: StructuredTool;
    /** Optional system prompt to prepend */
    systemPrompt?: string;
}
/**
 * Creates the agent node that invokes the LLM with bound tools.
 *
 * The agent always has access to:
 * 1. search_tools - for discovering new tools
 * 2. pinnedTools - always available tools
 * 3. selectedTools - tools discovered via search
 *
 * @param config - Agent node configuration
 * @returns A node function for the StateGraph
 */
export declare function createAgentNode(config: AgentNodeConfig): (state: ToolDiscoveryState, runnableConfig: RunnableConfig) => Promise<Partial<ToolDiscoveryUpdate>>;
/**
 * Configuration for the search node
 */
export interface SearchNodeConfig {
    /** Search index for finding tools */
    index: SearchIndex;
    /** Tool catalog for metadata lookups */
    catalog: ToolCatalog;
    /** Maximum results per search (default: 5) */
    searchLimit?: number;
}
/**
 * Creates the search node that executes search_tools calls.
 *
 * This node:
 * 1. Extracts search_tools calls from the last message
 * 2. Executes searches against the index
 * 3. Updates selectedToolIds with found tools
 * 4. Returns ToolMessages with search results
 *
 * @param config - Search node configuration
 * @returns A node function for the StateGraph
 */
export declare function createSearchNode(config: SearchNodeConfig): (state: ToolDiscoveryState, _runnableConfig: RunnableConfig) => Promise<Partial<ToolDiscoveryUpdate>>;
/**
 * Configuration for the execute node
 */
export interface ExecuteNodeConfig {
    /** Tool loader for loading tools */
    loader: ToolLoader;
    /** Tools that are always available */
    pinnedTools: StructuredTool[];
}
/**
 * Creates the execute node that runs selected tools.
 *
 * Uses LangGraph's ToolNode to execute tool calls from the last message.
 * Tools are loaded from the loader + pinnedTools.
 *
 * @param config - Execute node configuration
 * @returns A node function for the StateGraph
 */
export declare function createExecuteNode(config: ExecuteNodeConfig): (state: ToolDiscoveryState, runnableConfig: RunnableConfig) => Promise<Partial<ToolDiscoveryUpdate>>;
/**
 * @deprecated Use createSearchNode instead
 */
export declare function searchNode(_state: ToolDiscoveryState, _config: RunnableConfig): Promise<Partial<ToolDiscoveryUpdate>>;
/**
 * Routing function - determines next node based on last message.
 *
 * Returns:
 * - "search" if agent called search_tools (search takes priority)
 * - "execute" if agent called other tools
 * - "end" if agent responded without tool calls
 */
export declare function routeNode(state: ToolDiscoveryState): "search" | "execute" | "end";
/**
 * Routing function after search - checks if there are non-search tool calls.
 *
 * When the LLM calls both search_tools AND other tools in the same turn,
 * after search completes we need to check if there are remaining tool calls
 * to execute.
 *
 * Returns:
 * - "execute" if there are non-search tool calls in the original AI message
 * - "agent" if only search was called
 */
export declare function routeAfterSearch(state: ToolDiscoveryState): "execute" | "agent";
/**
 * @deprecated Use createExecuteNode instead
 */
export declare function executeNode(_state: ToolDiscoveryState, _config: RunnableConfig): Promise<Partial<ToolDiscoveryUpdate>>;
//# sourceMappingURL=nodes.d.ts.map