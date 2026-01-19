import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { StructuredTool } from "@langchain/core/tools";
import {
  ToolLoaderImpl,
  createToolLoader,
  ToolNotFoundError,
  SourceNotFoundError,
} from "./loader.js";
import type { ToolCatalog, ToolSource, ToolMetadata, ToolsChangedEvent } from "../types.js";
import { createEventEmitter } from "../types.js";

// ═══════════════════════════════════════════════════════════════════
// TEST UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a mock tool for testing.
 */
function createMockTool(name: string): StructuredTool {
  return {
    name,
    description: `Mock tool: ${name}`,
    schema: {},
    invoke: vi.fn().mockResolvedValue(`Result from ${name}`),
  } as unknown as StructuredTool;
}

/**
 * Create a mock tool source for testing.
 */
function createMockSource(
  id: string,
  tools: Map<string, StructuredTool>
): ToolSource {
  return {
    id,
    getMetadata: vi.fn().mockResolvedValue(
      Array.from(tools.keys()).map((toolId) => ({
        id: toolId,
        name: toolId,
        description: `Tool ${toolId}`,
        source: "local" as const,
        sourceId: id,
      }))
    ),
    getTool: vi.fn().mockImplementation((toolId: string) => {
      return Promise.resolve(tools.get(toolId) ?? null);
    }),
  };
}

/**
 * Create a mock catalog for testing.
 */
function createMockCatalog(
  metadata: Map<string, ToolMetadata>
): ToolCatalog & { emitChange: (event: ToolsChangedEvent) => Promise<void> } {
  const onToolsChanged = createEventEmitter<ToolsChangedEvent>();

  return {
    register: vi.fn().mockResolvedValue(undefined),
    unregister: vi.fn(),
    getAllMetadata: vi.fn().mockReturnValue(Array.from(metadata.values())),
    getMetadata: vi.fn().mockImplementation((id: string) => metadata.get(id) ?? null),
    getSource: vi.fn(),
    onToolsChanged,
    emitChange: (event: ToolsChangedEvent) => onToolsChanged.emit(event),
  };
}

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

describe("ToolLoaderImpl", () => {
  let catalog: ReturnType<typeof createMockCatalog>;
  let sources: Map<string, ToolSource>;
  let loader: ToolLoaderImpl;

  const tool1 = createMockTool("tool1");
  const tool2 = createMockTool("tool2");
  const tool3 = createMockTool("tool3");

  beforeEach(() => {
    // Set up metadata
    const metadata = new Map<string, ToolMetadata>([
      [
        "local:tool1",
        {
          id: "local:tool1",
          name: "tool1",
          description: "Tool 1",
          source: "local",
          sourceId: "local",
        },
      ],
      [
        "local:tool2",
        {
          id: "local:tool2",
          name: "tool2",
          description: "Tool 2",
          source: "local",
          sourceId: "local",
        },
      ],
      [
        "mcp:github:create_pr",
        {
          id: "mcp:github:create_pr",
          name: "create_pr",
          description: "Create a PR",
          source: "mcp",
          sourceId: "mcp:github",
        },
      ],
    ]);

    catalog = createMockCatalog(metadata);

    // Set up sources
    const localTools = new Map<string, StructuredTool>([
      ["local:tool1", tool1],
      ["local:tool2", tool2],
    ]);
    const localSource = createMockSource("local", localTools);

    const mcpTools = new Map<string, StructuredTool>([
      ["mcp:github:create_pr", tool3],
    ]);
    const mcpSource = createMockSource("mcp:github", mcpTools);

    sources = new Map([
      ["local", localSource],
      ["mcp:github", mcpSource],
    ]);

    loader = new ToolLoaderImpl({
      catalog,
      sources,
      maxCacheSize: 10,
      ttl: 60000,
    });
  });

  afterEach(() => {
    loader.dispose();
  });

  describe("load", () => {
    it("should load a tool from source", async () => {
      const result = await loader.load("local:tool1");
      expect(result).toBe(tool1);
      expect(sources.get("local")?.getTool).toHaveBeenCalledWith("local:tool1");
    });

    it("should cache loaded tools", async () => {
      // First load
      await loader.load("local:tool1");
      expect(sources.get("local")?.getTool).toHaveBeenCalledTimes(1);

      // Second load should use cache
      const result = await loader.load("local:tool1");
      expect(result).toBe(tool1);
      expect(sources.get("local")?.getTool).toHaveBeenCalledTimes(1);
    });

    it("should deduplicate concurrent loads", async () => {
      // Start multiple concurrent loads
      const [result1, result2, result3] = await Promise.all([
        loader.load("local:tool1"),
        loader.load("local:tool1"),
        loader.load("local:tool1"),
      ]);

      // All should return the same tool
      expect(result1).toBe(tool1);
      expect(result2).toBe(tool1);
      expect(result3).toBe(tool1);

      // But source should only be called once
      expect(sources.get("local")?.getTool).toHaveBeenCalledTimes(1);
    });

    it("should load from MCP source", async () => {
      const result = await loader.load("mcp:github:create_pr");
      expect(result).toBe(tool3);
      expect(sources.get("mcp:github")?.getTool).toHaveBeenCalledWith(
        "mcp:github:create_pr"
      );
    });

    it("should throw ToolNotFoundError for unknown tool ID", async () => {
      await expect(loader.load("unknown:tool")).rejects.toThrow(
        ToolNotFoundError
      );
      await expect(loader.load("unknown:tool")).rejects.toThrow(
        "Tool not found: unknown:tool"
      );
    });

    it("should throw SourceNotFoundError for unregistered source", async () => {
      // Add metadata for a tool with an unregistered source
      (catalog.getMetadata as ReturnType<typeof vi.fn>).mockImplementation(
        (id: string) => {
          if (id === "unknown:source:tool") {
            return {
              id: "unknown:source:tool",
              name: "tool",
              description: "Test",
              source: "unknown",
              sourceId: "unknown:source",
            };
          }
          return null;
        }
      );

      await expect(loader.load("unknown:source:tool")).rejects.toThrow(
        SourceNotFoundError
      );
    });

    it("should throw ToolNotFoundError when source returns null", async () => {
      (sources.get("local")?.getTool as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      await expect(loader.load("local:tool1")).rejects.toThrow(
        /exists in catalog but source returned null/
      );
    });
  });

  describe("warmup", () => {
    it("should load multiple tools in parallel", async () => {
      await loader.warmup(["local:tool1", "local:tool2"]);

      // Both tools should now be cached
      expect(loader.stats.size).toBe(2);

      // Subsequent loads should use cache
      await loader.load("local:tool1");
      await loader.load("local:tool2");
      expect(sources.get("local")?.getTool).toHaveBeenCalledTimes(2);
    });

    it("should silently ignore errors during warmup", async () => {
      // This should not throw even though one tool doesn't exist
      await expect(
        loader.warmup(["local:tool1", "nonexistent:tool"])
      ).resolves.not.toThrow();

      // The existing tool should still be cached
      expect(loader.stats.size).toBe(1);
    });
  });

  describe("evict", () => {
    it("should remove a tool from cache", async () => {
      // Load and verify cached
      await loader.load("local:tool1");
      expect(loader.stats.size).toBe(1);

      // Evict
      loader.evict("local:tool1");
      expect(loader.stats.size).toBe(0);

      // Next load should hit source again
      await loader.load("local:tool1");
      expect(sources.get("local")?.getTool).toHaveBeenCalledTimes(2);
    });
  });

  describe("clear", () => {
    it("should remove all tools from cache", async () => {
      // Load multiple tools
      await loader.load("local:tool1");
      await loader.load("local:tool2");
      expect(loader.stats.size).toBe(2);

      // Clear
      loader.clear();
      expect(loader.stats.size).toBe(0);
    });
  });

  describe("catalog change handling", () => {
    it("should evict tools when catalog removes them", async () => {
      // Load a tool
      await loader.load("local:tool1");
      expect(loader.stats.size).toBe(1);

      // Simulate catalog removing the tool
      await catalog.emitChange({ added: [], removed: ["local:tool1"] });

      // Tool should be evicted
      expect(loader.stats.size).toBe(0);
    });

    it("should not evict tools for added-only events", async () => {
      // Load a tool
      await loader.load("local:tool1");
      expect(loader.stats.size).toBe(1);

      // Simulate catalog adding new tools
      await catalog.emitChange({ added: ["new:tool"], removed: [] });

      // Original tool should still be cached
      expect(loader.stats.size).toBe(1);
    });
  });

  describe("stats", () => {
    it("should report cache statistics", async () => {
      expect(loader.stats).toEqual({
        size: 0,
        maxSize: 10,
        loading: 0,
      });

      await loader.load("local:tool1");

      expect(loader.stats).toEqual({
        size: 1,
        maxSize: 10,
        loading: 0,
      });
    });
  });
});

describe("createToolLoader", () => {
  it("should create a ToolLoader instance", () => {
    const catalog = createMockCatalog(new Map());
    const loader = createToolLoader({
      catalog,
      sources: new Map(),
    });

    expect(loader).toBeDefined();
    expect(typeof loader.load).toBe("function");
    expect(typeof loader.warmup).toBe("function");
    expect(typeof loader.evict).toBe("function");
    expect(typeof loader.clear).toBe("function");
  });
});

describe("TTL expiration", () => {
  it("should re-load from source after eviction", async () => {
    // Note: lru-cache TTL doesn't work well with fake timers
    // So we test eviction behavior instead
    const metadata = new Map<string, ToolMetadata>([
      [
        "local:tool1",
        {
          id: "local:tool1",
          name: "tool1",
          description: "Tool 1",
          source: "local",
          sourceId: "local",
        },
      ],
    ]);
    const catalog = createMockCatalog(metadata);

    const tools = new Map<string, StructuredTool>([
      ["local:tool1", createMockTool("tool1")],
    ]);
    const source = createMockSource("local", tools);
    const sources = new Map([["local", source]]);

    const loader = new ToolLoaderImpl({
      catalog,
      sources,
    });

    // First load
    await loader.load("local:tool1");
    expect(source.getTool).toHaveBeenCalledTimes(1);

    // Second load - should use cache
    await loader.load("local:tool1");
    expect(source.getTool).toHaveBeenCalledTimes(1);

    // Evict the tool
    loader.evict("local:tool1");

    // Third load after eviction - should reload from source
    await loader.load("local:tool1");
    expect(source.getTool).toHaveBeenCalledTimes(2);

    loader.dispose();
  });
});
