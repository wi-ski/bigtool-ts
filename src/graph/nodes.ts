/**
 * Graph Nodes
 *
 * Node factories for the BigTool LangGraph agent.
 */

import {
  isAIMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { StructuredTool } from "@langchain/core/tools";
import type { ToolCatalog, ToolLoader, SearchIndex } from "../types.js";
import type {
  ToolDiscoveryState,
  ToolDiscoveryUpdate,
  SearchQuery,
} from "./state.js";

// ═══════════════════════════════════════════════════════════════════
// AGENT NODE
// ═══════════════════════════════════════════════════════════════════

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
export function createAgentNode(config: AgentNodeConfig) {
  const { llm, loader, pinnedTools, searchTool, systemPrompt } = config;

  return async (
    state: ToolDiscoveryState,
    runnableConfig: RunnableConfig
  ): Promise<Partial<ToolDiscoveryUpdate>> => {
    // Load selected tools from the loader
    const selectedTools = await Promise.all(
      state.selectedToolIds.map(async (id) => {
        try {
          return await loader.load(id);
        } catch {
          // Tool might have been removed - skip it
          return null;
        }
      })
    );

    // Filter out nulls (failed loads)
    const loadedSelectedTools = selectedTools.filter(
      (t): t is StructuredTool => t !== null
    );

    // Combine all tools: search_tools + pinned + selected
    const allTools = [searchTool, ...pinnedTools, ...loadedSelectedTools];

    // Bind tools to the LLM
    if (!llm.bindTools) {
      throw new Error('LLM does not support tool binding');
    }
    const modelWithTools = llm.bindTools(allTools);

    // Prepare messages with optional system prompt
    let messages = state.messages;
    if (
      systemPrompt &&
      (messages.length === 0 || messages[0]._getType() !== "system")
    ) {
      messages = [new SystemMessage(systemPrompt), ...messages];
    }

    // Invoke the LLM
    const response = await modelWithTools.invoke(messages, runnableConfig);

    return { messages: [response] };
  };
}

// ═══════════════════════════════════════════════════════════════════
// SEARCH NODE
// ═══════════════════════════════════════════════════════════════════

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
export function createSearchNode(config: SearchNodeConfig) {
  const { index, catalog, searchLimit = 5 } = config;

  return async (
    state: ToolDiscoveryState,
    _runnableConfig: RunnableConfig
  ): Promise<Partial<ToolDiscoveryUpdate>> => {
    const lastMessage = state.messages[state.messages.length - 1];

    // Verify we have an AI message with tool calls
    if (!isAIMessage(lastMessage) || !lastMessage.tool_calls?.length) {
      return {};
    }

    const toolMessages: ToolMessage[] = [];
    const newToolIds: string[] = [];
    const searchQueries: SearchQuery[] = [];

    // Process each tool call
    for (const toolCall of lastMessage.tool_calls) {
      // Only handle search_tools calls
      if (toolCall.name !== "search_tools") {
        continue;
      }

      const { query } = toolCall.args as { query: string };

      // Execute the search
      const results = await index.search(query, { limit: searchLimit });
      const foundIds = results.map((r) => r.toolId);
      newToolIds.push(...foundIds);

      // Record the search for history
      searchQueries.push({
        query,
        results: foundIds,
        timestamp: Date.now(),
      });

      // Format the response for the LLM
      let content: string;
      if (foundIds.length === 0) {
        content = `No tools found matching "${query}". Try a different search query.`;
      } else {
        const toolDescriptions = foundIds
          .map((id) => {
            const meta = catalog.getMetadata(id);
            return meta ? `- **${meta.name}**: ${meta.description}` : null;
          })
          .filter(Boolean)
          .join("\n");

        content = `Found ${foundIds.length} tool${foundIds.length === 1 ? "" : "s"}:\n${toolDescriptions}\n\nYou can now use these tools.`;
      }

      toolMessages.push(
        new ToolMessage({
          content,
          tool_call_id: toolCall.id ?? "",
          name: "search_tools",
        })
      );
    }

    return {
      messages: toolMessages,
      selectedToolIds: newToolIds,
      searchHistory: searchQueries,
    };
  };
}

// ═══════════════════════════════════════════════════════════════════
// EXECUTE NODE
// ═══════════════════════════════════════════════════════════════════

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
export function createExecuteNode(config: ExecuteNodeConfig) {
  const { loader, pinnedTools } = config;

  return async (
    state: ToolDiscoveryState,
    runnableConfig: RunnableConfig
  ): Promise<Partial<ToolDiscoveryUpdate>> => {
    // Load selected tools
    const selectedTools = await Promise.all(
      state.selectedToolIds.map(async (id) => {
        try {
          return await loader.load(id);
        } catch {
          return null;
        }
      })
    );

    const loadedSelectedTools = selectedTools.filter(
      (t): t is StructuredTool => t !== null
    );

    // Create ToolNode with all available tools
    const allTools = [...pinnedTools, ...loadedSelectedTools];
    const toolNode = new ToolNode(allTools);

    // Execute the tools
    const result = await toolNode.invoke(state, runnableConfig);

    return result;
  };
}

// ═══════════════════════════════════════════════════════════════════
// LEGACY EXPORTS (for backwards compatibility)
// ═══════════════════════════════════════════════════════════════════

/**
 * @deprecated Use createSearchNode instead
 */
export async function searchNode(
  _state: ToolDiscoveryState,
  _config: RunnableConfig
): Promise<Partial<ToolDiscoveryUpdate>> {
  throw new Error(
    "searchNode: Use createSearchNode factory to create a configured node"
  );
}

/**
 * Routing function - determines next node based on last message.
 *
 * Returns:
 * - "search" if agent called search_tools
 * - "execute" if agent called other tools
 * - "end" if agent responded without tool calls
 */
export function routeNode(state: ToolDiscoveryState): "search" | "execute" | "end" {
  const lastMessage = state.messages[state.messages.length - 1];

  if (!lastMessage) {
    return "end";
  }

  // Check if it's an AI message
  if (!isAIMessage(lastMessage)) {
    return "end";
  }

  // Check for tool calls
  if (!lastMessage.tool_calls || lastMessage.tool_calls.length === 0) {
    return "end";
  }

  // Check if it's a search request
  const hasSearchCall = lastMessage.tool_calls.some(
    (tc) => tc.name === "search_tools"
  );

  return hasSearchCall ? "search" : "execute";
}

/**
 * @deprecated Use createExecuteNode instead
 */
export async function executeNode(
  _state: ToolDiscoveryState,
  _config: RunnableConfig
): Promise<Partial<ToolDiscoveryUpdate>> {
  throw new Error(
    "executeNode: Use createExecuteNode factory to create a configured node"
  );
}
