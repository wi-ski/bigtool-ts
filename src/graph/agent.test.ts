/**
 * Agent Integration Tests
 *
 * Tests for the createAgent function and graph nodes.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { SearchIndex, ToolMetadata, SearchResult } from "../types.js";
import { createAgent } from "./agent.js";
import {
  ToolDiscoveryAnnotation,
  type ToolDiscoveryState,
} from "./state.js";
import { routeNode } from "./nodes.js";

// ═══════════════════════════════════════════════════════════════════
// MOCK FACTORIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a mock LLM that returns predetermined responses
 */
function createMockLLM(responses: AIMessage[]): BaseChatModel {
  let callIndex = 0;

  return {
    bindTools: vi.fn().mockReturnThis(),
    invoke: vi.fn().mockImplementation(async () => {
      const response = responses[callIndex] || responses[responses.length - 1];
      callIndex++;
      return response;
    }),
  } as unknown as BaseChatModel;
}

/**
 * Create a mock SearchIndex
 */
function createMockSearchIndex(
  results: Map<string, SearchResult[]>
): SearchIndex {
  let indexedTools: ToolMetadata[] = [];

  return {
    index: vi.fn().mockImplementation(async (tools: ToolMetadata[]) => {
      indexedTools = tools;
    }),
    search: vi.fn().mockImplementation(async (query: string) => {
      return results.get(query) || [];
    }),
    reindex: vi.fn().mockResolvedValue(undefined),
    // Expose indexed tools for testing
    get _indexedTools() {
      return indexedTools;
    },
  };
}

/**
 * Create sample tools for testing
 */
function createSampleTools() {
  const calculatorTool = tool(
    async ({ a, b }) => `${a + b}`,
    {
      name: "calculator",
      description: "Add two numbers together",
      schema: z.object({
        a: z.number().describe("First number"),
        b: z.number().describe("Second number"),
      }),
    }
  );

  const weatherTool = tool(
    async ({ city }) => `Weather in ${city}: Sunny, 72°F`,
    {
      name: "weather",
      description: "Get the current weather for a city",
      schema: z.object({
        city: z.string().describe("City name"),
      }),
    }
  );

  const slackTool = tool(
    async ({ channel, message }) => `Sent "${message}" to #${channel}`,
    {
      name: "slack_send",
      description: "Send a message to a Slack channel",
      schema: z.object({
        channel: z.string().describe("Channel name"),
        message: z.string().describe("Message to send"),
      }),
    }
  );

  return { calculatorTool, weatherTool, slackTool };
}

// ═══════════════════════════════════════════════════════════════════
// ROUTING TESTS
// ═══════════════════════════════════════════════════════════════════

describe("routeNode", () => {
  it("returns 'end' when messages is empty", () => {
    const state: ToolDiscoveryState = {
      messages: [],
      selectedToolIds: [],
      searchHistory: [],
    };

    expect(routeNode(state)).toBe("end");
  });

  it("returns 'end' when last message is a HumanMessage", () => {
    const state: ToolDiscoveryState = {
      messages: [new HumanMessage("Hello")],
      selectedToolIds: [],
      searchHistory: [],
    };

    expect(routeNode(state)).toBe("end");
  });

  it("returns 'end' when AI message has no tool calls", () => {
    const state: ToolDiscoveryState = {
      messages: [new AIMessage("Hello, how can I help?")],
      selectedToolIds: [],
      searchHistory: [],
    };

    expect(routeNode(state)).toBe("end");
  });

  it("returns 'search' when AI message has search_tools call", () => {
    const aiMessage = new AIMessage({
      content: "",
      tool_calls: [
        {
          id: "call_1",
          name: "search_tools",
          args: { query: "github" },
        },
      ],
    });

    const state: ToolDiscoveryState = {
      messages: [aiMessage],
      selectedToolIds: [],
      searchHistory: [],
    };

    expect(routeNode(state)).toBe("search");
  });

  it("returns 'execute' when AI message has non-search tool calls", () => {
    const aiMessage = new AIMessage({
      content: "",
      tool_calls: [
        {
          id: "call_1",
          name: "calculator",
          args: { a: 1, b: 2 },
        },
      ],
    });

    const state: ToolDiscoveryState = {
      messages: [aiMessage],
      selectedToolIds: [],
      searchHistory: [],
    };

    expect(routeNode(state)).toBe("execute");
  });

  it("returns 'search' when mixed tool calls include search_tools", () => {
    const aiMessage = new AIMessage({
      content: "",
      tool_calls: [
        {
          id: "call_1",
          name: "calculator",
          args: { a: 1, b: 2 },
        },
        {
          id: "call_2",
          name: "search_tools",
          args: { query: "slack" },
        },
      ],
    });

    const state: ToolDiscoveryState = {
      messages: [aiMessage],
      selectedToolIds: [],
      searchHistory: [],
    };

    expect(routeNode(state)).toBe("search");
  });
});

// ═══════════════════════════════════════════════════════════════════
// STATE ANNOTATION TESTS
// ═══════════════════════════════════════════════════════════════════

describe("ToolDiscoveryAnnotation", () => {
  it("exports State and Update types", () => {
    // Just verify the annotation is properly structured
    expect(ToolDiscoveryAnnotation).toBeDefined();
    expect(ToolDiscoveryAnnotation.spec).toBeDefined();
    expect(ToolDiscoveryAnnotation.spec.messages).toBeDefined();
    expect(ToolDiscoveryAnnotation.spec.selectedToolIds).toBeDefined();
    expect(ToolDiscoveryAnnotation.spec.searchHistory).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// CREATE AGENT TESTS
// ═══════════════════════════════════════════════════════════════════

describe("createAgent", () => {
  const { calculatorTool, weatherTool, slackTool } = createSampleTools();

  it("creates a compiled graph", async () => {
    const mockLLM = createMockLLM([
      new AIMessage("I can help with that!"),
    ]);

    const mockSearch = createMockSearchIndex(new Map());

    const agent = await createAgent({
      llm: mockLLM,
      tools: [calculatorTool, weatherTool],
      search: mockSearch,
    });

    expect(agent).toBeDefined();
    expect(typeof agent.invoke).toBe("function");
  });

  it("indexes tools on creation", async () => {
    const mockLLM = createMockLLM([
      new AIMessage("Hello!"),
    ]);

    const mockSearch = createMockSearchIndex(new Map());

    await createAgent({
      llm: mockLLM,
      tools: [calculatorTool, weatherTool, slackTool],
      search: mockSearch,
    });

    expect(mockSearch.index).toHaveBeenCalled();
    const indexedTools = (mockSearch as unknown as { _indexedTools: ToolMetadata[] })._indexedTools;
    expect(indexedTools).toHaveLength(3);
    expect(indexedTools.map((t) => t.name)).toContain("calculator");
    expect(indexedTools.map((t) => t.name)).toContain("weather");
    expect(indexedTools.map((t) => t.name)).toContain("slack_send");
  });

  it("simple flow: user asks → LLM responds directly → END", async () => {
    const mockLLM = createMockLLM([
      new AIMessage("Hello! How can I help you today?"),
    ]);

    const mockSearch = createMockSearchIndex(new Map());

    const agent = await createAgent({
      llm: mockLLM,
      tools: [calculatorTool],
      search: mockSearch,
    });

    const result = await agent.invoke({
      messages: [new HumanMessage("Hi!")],
    });

    expect(result.messages).toHaveLength(2); // Human + AI
    expect(result.messages[1].content).toBe("Hello! How can I help you today?");
    expect(result.selectedToolIds).toEqual([]);
  });

  it("search flow: user asks → LLM searches → finds tools", async () => {
    // LLM first calls search_tools, then responds with the tools
    const searchCall = new AIMessage({
      content: "",
      tool_calls: [
        {
          id: "call_search",
          name: "search_tools",
          args: { query: "math" },
        },
      ],
    });

    const finalResponse = new AIMessage({
      content: "I found a calculator tool that can help you add numbers!",
    });

    const mockLLM = createMockLLM([searchCall, finalResponse]);

    const mockSearch = createMockSearchIndex(
      new Map([
        ["math", [{ toolId: "calculator", score: 0.9, matchType: "bm25" }]],
      ])
    );

    const agent = await createAgent({
      llm: mockLLM,
      tools: [calculatorTool, weatherTool],
      search: mockSearch,
    });

    const result = await agent.invoke({
      messages: [new HumanMessage("Can you help me add numbers?")],
    });

    // Should have: Human, AI (search call), Tool (search result), AI (final)
    expect(result.messages.length).toBeGreaterThanOrEqual(3);
    expect(result.selectedToolIds).toContain("calculator");
    expect(result.searchHistory).toHaveLength(1);
    expect(result.searchHistory[0].query).toBe("math");
  });

  it("pinned tools are always available", async () => {
    const mockLLM = createMockLLM([
      new AIMessage("Using pinned calculator..."),
    ]);

    const mockSearch = createMockSearchIndex(new Map());

    const agent = await createAgent({
      llm: mockLLM,
      tools: [weatherTool, slackTool],
      pinnedTools: [calculatorTool],
      search: mockSearch,
    });

    // Invoke the agent to trigger bindTools
    await agent.invoke({
      messages: [new HumanMessage("Help me calculate")],
    });

    // Pinned tools should be bound to LLM when invoked
    expect(mockLLM.bindTools).toHaveBeenCalled();
  });

  it("system prompt is prepended to messages", async () => {
    const mockLLM = createMockLLM([
      new AIMessage("I'm a helpful assistant!"),
    ]);

    const mockSearch = createMockSearchIndex(new Map());

    const agent = await createAgent({
      llm: mockLLM,
      tools: [calculatorTool],
      search: mockSearch,
      systemPrompt: "You are a helpful math assistant.",
    });

    await agent.invoke({
      messages: [new HumanMessage("Help me!")],
    });

    // The LLM invoke should have received the system prompt
    expect(mockLLM.invoke).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════
// MULTIPLE SEARCHES TEST
// ═══════════════════════════════════════════════════════════════════

describe("multiple searches", () => {
  const { calculatorTool, weatherTool, slackTool } = createSampleTools();

  it("accumulates selectedToolIds across multiple searches", async () => {
    // First search for math tools
    const firstSearchCall = new AIMessage({
      content: "",
      tool_calls: [
        {
          id: "call_1",
          name: "search_tools",
          args: { query: "math" },
        },
      ],
    });

    // Second search for weather tools
    const secondSearchCall = new AIMessage({
      content: "",
      tool_calls: [
        {
          id: "call_2",
          name: "search_tools",
          args: { query: "weather" },
        },
      ],
    });

    // Final response
    const finalResponse = new AIMessage({
      content: "I can help with both math and weather!",
    });

    const mockLLM = createMockLLM([
      firstSearchCall,
      secondSearchCall,
      finalResponse,
    ]);

    const mockSearch = createMockSearchIndex(
      new Map([
        ["math", [{ toolId: "calculator", score: 0.9, matchType: "bm25" }]],
        ["weather", [{ toolId: "weather", score: 0.9, matchType: "bm25" }]],
      ])
    );

    const agent = await createAgent({
      llm: mockLLM,
      tools: [calculatorTool, weatherTool, slackTool],
      search: mockSearch,
    });

    const result = await agent.invoke({
      messages: [new HumanMessage("I need help with math and weather")],
    });

    // Should have both tools selected (deduplicated by reducer)
    expect(result.selectedToolIds).toContain("calculator");
    expect(result.selectedToolIds).toContain("weather");
    expect(result.searchHistory).toHaveLength(2);
  });
});
