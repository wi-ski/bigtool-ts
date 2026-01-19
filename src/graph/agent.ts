/**
 * Agent factory module.
 *
 * This module provides the main entry point for creating LangGraph agents
 * with dynamic tool discovery capabilities.
 *
 * @module graph/agent
 */

import { StateGraph, START, END } from "@langchain/langgraph";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { StructuredTool } from "@langchain/core/tools";
import type { CompiledStateGraph } from "@langchain/langgraph";
import type { ToolSource, SearchIndex, ToolCatalog, ToolLoader } from "../types.js";
import { ToolDiscoveryAnnotation, type ToolDiscoveryState } from "./state.js";
import {
  createAgentNode,
  createSearchNode,
  createExecuteNode,
  routeNode,
} from "./nodes.js";
import { createSearchToolsTool } from "./search-tool.js";
import { DefaultToolCatalog } from "../catalog/index.js";
import { DefaultToolLoader } from "../loader/index.js";
import { LocalSource } from "../sources/local.js";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Configuration options for createAgent.
 *
 * Controls the LLM, tool sources, search behavior, and caching.
 *
 * @example Minimal configuration
 * ```typescript
 * const options: CreateAgentOptions = {
 *   llm: new ChatOpenAI({ model: 'gpt-4o' }),
 *   tools: [myTool1, myTool2],
 *   search: new OramaSearch(),
 * };
 * ```
 *
 * @example Full configuration
 * ```typescript
 * const options: CreateAgentOptions = {
 *   llm: new ChatOpenAI({ model: 'gpt-4o' }),
 *   sources: [
 *     new LocalSource(utilityTools),
 *     new MCPSource(githubClient),
 *   ],
 *   search: new OramaSearch({ mode: 'hybrid', embeddings }),
 *   pinnedTools: [helpTool],
 *   systemPrompt: 'You are a helpful coding assistant.',
 *   searchLimit: 10,
 *   searchThreshold: 0.3,
 *   cacheSize: 200,
 * };
 * ```
 */
export interface CreateAgentOptions {
  /**
   * The LLM to use for the agent.
   *
   * Must support tool binding (bindTools method).
   */
  llm: BaseChatModel;

  /**
   * Tools to register.
   *
   * Can be either an array of StructuredTool instances or
   * an array of ToolSource instances. If StructuredTools are
   * provided, they are wrapped in a LocalSource automatically.
   */
  tools?: StructuredTool[] | ToolSource[];

  /**
   * Tool sources to register.
   *
   * Alternative to `tools` for when you have pre-configured
   * sources. Can be used together with `tools`.
   */
  sources?: ToolSource[];

  /**
   * Search index implementation.
   *
   * Required. Use OramaSearch for most cases.
   */
  search: SearchIndex;

  /**
   * Tools that are always available.
   *
   * These tools bypass search and are always in the LLM's context.
   * Use for frequently-needed tools to avoid search overhead.
   */
  pinnedTools?: StructuredTool[];

  /**
   * System prompt to prepend to conversations.
   *
   * Added as a SystemMessage at the start of the message list
   * if not already present.
   */
  systemPrompt?: string;

  /**
   * Maximum tools returned per search.
   *
   * @default 5
   */
  searchLimit?: number;

  /**
   * Minimum search score threshold (0-1).
   *
   * Results with scores below this are filtered out.
   *
   * @default 0
   */
  searchThreshold?: number;

  /**
   * Maximum tools to cache in the loader.
   *
   * Uses LRU eviction when limit is reached.
   *
   * @default 100
   */
  cacheSize?: number;
}

/**
 * The compiled agent graph type.
 *
 * This is the return type of createAgent and createToolDiscoveryGraph.
 * Can be invoked with messages to run the agent.
 */
export type CompiledToolDiscoveryGraph = CompiledStateGraph<
  ToolDiscoveryState,
  Partial<ToolDiscoveryState>,
  "__start__" | "agent" | "search" | "execute"
>;

// ═══════════════════════════════════════════════════════════════════
// IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Type guard to check if the input is a ToolSource array.
 *
 * @internal
 * @param input - Array to check
 * @returns True if input contains ToolSource instances
 */
function isToolSourceArray(
  input: StructuredTool[] | ToolSource[]
): input is ToolSource[] {
  if (input.length === 0) return false;

  // ToolSource has getMetadata method
  const first = input[0];
  return typeof (first as ToolSource).getMetadata === "function";
}

/**
 * Creates a LangGraph agent with dynamic tool discovery.
 *
 * This is the main entry point for bigtool-ts. It creates a complete
 * agent graph that can discover and use tools based on user requests.
 *
 * ## How It Works
 *
 * The agent follows this workflow:
 *
 * 1. **Agent Node**: LLM receives the conversation plus available tools
 *    (search_tools + pinned + previously discovered tools)
 *
 * 2. **Routing**: Based on the LLM's response:
 *    - If it calls `search_tools` → go to Search Node
 *    - If it calls other tools → go to Execute Node
 *    - If no tool calls → END
 *
 * 3. **Search Node**: Executes the search query, updates state with
 *    discovered tool IDs, returns to Agent Node
 *
 * 4. **Execute Node**: Runs the called tools, returns results to
 *    Agent Node
 *
 * @param options - Configuration options for the agent
 * @returns Promise resolving to the compiled agent graph
 *
 * @example Basic usage
 * ```typescript
 * import { createAgent, OramaSearch } from '@repo/bigtool-ts';
 * import { ChatOpenAI } from '@langchain/openai';
 *
 * const agent = await createAgent({
 *   llm: new ChatOpenAI({ model: 'gpt-4o' }),
 *   tools: [calculatorTool, weatherTool, searchTool],
 *   search: new OramaSearch(),
 * });
 *
 * const result = await agent.invoke({
 *   messages: [{ role: 'user', content: 'What is the weather in NYC?' }]
 * });
 * ```
 *
 * @example With MCP and pinned tools
 * ```typescript
 * const agent = await createAgent({
 *   llm: new ChatOpenAI({ model: 'gpt-4o' }),
 *   sources: [
 *     new MCPSource(githubClient, { namespace: 'github' }),
 *     new MCPSource(slackClient, { namespace: 'slack' }),
 *   ],
 *   search: new OramaSearch({ mode: 'hybrid', embeddings }),
 *   pinnedTools: [helpTool],
 *   systemPrompt: 'You are a DevOps assistant.',
 *   searchLimit: 10,
 * });
 * ```
 *
 * @throws Error if LLM does not support tool binding
 */
export async function createAgent(
  options: CreateAgentOptions
): Promise<CompiledToolDiscoveryGraph> {
  const {
    llm,
    tools = [],
    sources = [],
    search: searchIndex,
    pinnedTools = [],
    systemPrompt,
    searchLimit = 5,
    cacheSize = 100,
  } = options;

  // 1. Create catalog
  const catalog: ToolCatalog = new DefaultToolCatalog();

  // 2. Collect all sources
  const allSources: ToolSource[] = [...sources];

  if (tools.length > 0) {
    if (isToolSourceArray(tools)) {
      allSources.push(...tools);
    } else {
      allSources.push(new LocalSource(tools));
    }
  }

  // 3. Register all sources with catalog
  for (const source of allSources) {
    await catalog.register(source);
  }

  // 4. Index tools for search
  const allMetadata = catalog.getAllMetadata();
  await searchIndex.index(allMetadata);

  // 5. Create loader
  const loader: ToolLoader = new DefaultToolLoader(catalog, {
    maxSize: cacheSize,
  });

  // 6. Create search_tools tool
  const searchTool = createSearchToolsTool({
    index: searchIndex,
    catalog,
    limit: searchLimit,
  });

  // 7. Build the graph
  const workflow = new StateGraph(ToolDiscoveryAnnotation)
    .addNode(
      "agent",
      createAgentNode({
        llm,
        catalog,
        loader,
        pinnedTools,
        searchTool,
        systemPrompt,
      })
    )
    .addNode(
      "search",
      createSearchNode({
        index: searchIndex,
        catalog,
        searchLimit,
      })
    )
    .addNode(
      "execute",
      createExecuteNode({
        loader,
        pinnedTools,
      })
    )
    .addEdge(START, "agent")
    .addConditionalEdges("agent", routeNode, {
      search: "search",
      execute: "execute",
      end: END,
    })
    .addEdge("search", "agent")
    .addEdge("execute", "agent");

  // 8. Compile and return
  return workflow.compile();
}

// ═══════════════════════════════════════════════════════════════════
// SUBGRAPH FACTORY
// ═══════════════════════════════════════════════════════════════════

/**
 * Creates the tool discovery graph for advanced composition.
 *
 * This is functionally identical to createAgent but named to clarify
 * its use as a subgraph in larger LangGraph workflows.
 *
 * Use this when you want to integrate tool discovery into an existing
 * LangGraph workflow rather than using the full agent standalone.
 *
 * @param options - Configuration options (same as createAgent)
 * @returns Promise resolving to the compiled discovery graph
 *
 * @example Embedding in a larger workflow
 * ```typescript
 * import { createToolDiscoveryGraph, OramaSearch } from '@repo/bigtool-ts';
 * import { StateGraph } from '@langchain/langgraph';
 *
 * // Create the discovery subgraph
 * const discoveryGraph = await createToolDiscoveryGraph({
 *   llm: new ChatOpenAI({ model: 'gpt-4o' }),
 *   tools: myTools,
 *   search: new OramaSearch(),
 * });
 *
 * // Integrate into your main workflow
 * const mainGraph = new StateGraph(MyAnnotation)
 *   .addNode('preprocess', preprocessNode)
 *   .addNode('discover', discoveryGraph)
 *   .addNode('postprocess', postprocessNode)
 *   .addEdge('preprocess', 'discover')
 *   .addEdge('discover', 'postprocess');
 * ```
 *
 * @see {@link createAgent} for standalone agent usage
 */
export async function createToolDiscoveryGraph(
  options: CreateAgentOptions
): Promise<CompiledToolDiscoveryGraph> {
  // Same implementation as createAgent - the full graph IS the discovery graph
  return createAgent(options);
}
