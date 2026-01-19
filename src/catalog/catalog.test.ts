/**
 * ToolCatalog Unit Tests
 *
 * Tests for the DefaultToolCatalog implementation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { DefaultToolCatalog } from "./index";
import type { ToolSource, ToolMetadata, EventEmitter } from "../types";

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a mock ToolSource for testing
 */
function createMockSource(
  id: string,
  tools: Omit<ToolMetadata, "sourceId">[],
  options: { withRefresh?: boolean } = {}
): ToolSource & {
  triggerRefresh: (tools: ToolMetadata[]) => Promise<void>;
} {
  const refreshHandlers: Array<(data: ToolMetadata[]) => void | Promise<void>> = [];

  // Create onRefresh that matches the EventEmitter<ToolMetadata[]> interface
  const onRefresh: EventEmitter<ToolMetadata[]> | undefined = options.withRefresh
    ? {
        subscribe(handler: (data: ToolMetadata[]) => void): () => void {
          refreshHandlers.push(handler);
          return () => {
            const idx = refreshHandlers.indexOf(handler);
            if (idx >= 0) refreshHandlers.splice(idx, 1);
          };
        },
        on(handler: (data: ToolMetadata[]) => void): () => void {
          refreshHandlers.push(handler);
          return () => {
            const idx = refreshHandlers.indexOf(handler);
            if (idx >= 0) refreshHandlers.splice(idx, 1);
          };
        },
        async emit(data: ToolMetadata[]): Promise<void> {
          for (const handler of refreshHandlers) {
            await handler(data);
          }
        },
        subscriberCount(): number {
          return refreshHandlers.length;
        },
        clear(): void {
          refreshHandlers.length = 0;
        },
      }
    : undefined;

  return {
    id,
    onRefresh,
    async getMetadata() {
      return tools.map((t) => ({ ...t, sourceId: id }));
    },
    async getTool(_toolId: string) {
      return null; // Mock - returns null for simplicity
    },
    async triggerRefresh(newTools: ToolMetadata[]) {
      if (onRefresh) {
        await onRefresh.emit(newTools);
      }
    },
  };
}

// =============================================================================
// DefaultToolCatalog Tests
// =============================================================================

describe("DefaultToolCatalog", () => {
  describe("register", () => {
    it("should register a source and add its tools", async () => {
      const catalog = new DefaultToolCatalog();
      const source = createMockSource("local", [
        {
          id: "local:tool1",
          name: "tool1",
          description: "First tool",
          source: "local",
        },
        {
          id: "local:tool2",
          name: "tool2",
          description: "Second tool",
          source: "local",
        },
        {
          id: "local:tool3",
          name: "tool3",
          description: "Third tool",
          source: "local",
        },
      ]);

      await catalog.register(source);

      const allMetadata = catalog.getAllMetadata();
      expect(allMetadata).toHaveLength(3);
      expect(allMetadata.map((m) => m.id).sort()).toEqual([
        "local:tool1",
        "local:tool2",
        "local:tool3",
      ]);
    });

    it("should emit onToolsChanged when tools are added", async () => {
      const catalog = new DefaultToolCatalog();
      const handler = vi.fn();
      catalog.onToolsChanged.subscribe(handler);

      const source = createMockSource("local", [
        {
          id: "local:tool1",
          name: "tool1",
          description: "First tool",
          source: "local",
        },
      ]);

      await catalog.register(source);

      expect(handler).toHaveBeenCalledWith({
        added: ["local:tool1"],
        removed: [],
      });
    });

    it("should throw when registering duplicate source ID", async () => {
      const catalog = new DefaultToolCatalog();
      const source1 = createMockSource("same-id", []);
      const source2 = createMockSource("same-id", []);

      await catalog.register(source1);

      await expect(catalog.register(source2)).rejects.toThrow(
        "Source with id 'same-id' already registered"
      );
    });

    it("should handle sources with no tools", async () => {
      const catalog = new DefaultToolCatalog();
      const handler = vi.fn();
      catalog.onToolsChanged.subscribe(handler);

      const source = createMockSource("empty", []);

      await catalog.register(source);

      expect(catalog.getAllMetadata()).toHaveLength(0);
      // Event is still emitted but with empty arrays
      expect(handler).toHaveBeenCalledWith({
        added: [],
        removed: [],
      });
    });
  });

  describe("namespace collision prevention", () => {
    it("should keep tools from different sources separate", async () => {
      const catalog = new DefaultToolCatalog();

      const source1 = createMockSource("source1", [
        {
          id: "source1:getData",
          name: "getData",
          description: "Get data from source 1",
          source: "local",
        },
      ]);

      const source2 = createMockSource("source2", [
        {
          id: "source2:getData",
          name: "getData",
          description: "Get data from source 2",
          source: "mcp",
        },
      ]);

      await catalog.register(source1);
      await catalog.register(source2);

      const allMetadata = catalog.getAllMetadata();
      expect(allMetadata).toHaveLength(2);

      const tool1 = catalog.getMetadata("source1:getData");
      const tool2 = catalog.getMetadata("source2:getData");

      expect(tool1?.description).toBe("Get data from source 1");
      expect(tool2?.description).toBe("Get data from source 2");
    });
  });

  describe("unregister", () => {
    it("should remove all tools from the source", async () => {
      const catalog = new DefaultToolCatalog();
      const source = createMockSource("local", [
        {
          id: "local:tool1",
          name: "tool1",
          description: "First tool",
          source: "local",
        },
        {
          id: "local:tool2",
          name: "tool2",
          description: "Second tool",
          source: "local",
        },
      ]);

      await catalog.register(source);
      expect(catalog.getAllMetadata()).toHaveLength(2);

      catalog.unregister("local");
      expect(catalog.getAllMetadata()).toHaveLength(0);
    });

    it("should emit onToolsChanged with removed IDs", async () => {
      const catalog = new DefaultToolCatalog();
      const source = createMockSource("local", [
        {
          id: "local:tool1",
          name: "tool1",
          description: "First tool",
          source: "local",
        },
      ]);

      await catalog.register(source);

      const handler = vi.fn();
      catalog.onToolsChanged.subscribe(handler);

      catalog.unregister("local");

      expect(handler).toHaveBeenCalledWith({
        added: [],
        removed: ["local:tool1"],
      });
    });

    it("should silently ignore unregistering non-existent source", () => {
      const catalog = new DefaultToolCatalog();

      // Should not throw
      expect(() => catalog.unregister("non-existent")).not.toThrow();
    });

    it("should only remove tools from the specified source", async () => {
      const catalog = new DefaultToolCatalog();

      const source1 = createMockSource("source1", [
        {
          id: "source1:tool",
          name: "tool",
          description: "Tool from source 1",
          source: "local",
        },
      ]);

      const source2 = createMockSource("source2", [
        {
          id: "source2:tool",
          name: "tool",
          description: "Tool from source 2",
          source: "local",
        },
      ]);

      await catalog.register(source1);
      await catalog.register(source2);

      catalog.unregister("source1");

      const remaining = catalog.getAllMetadata();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe("source2:tool");
    });
  });

  describe("getMetadata", () => {
    it("should return tool metadata by ID", async () => {
      const catalog = new DefaultToolCatalog();
      const source = createMockSource("local", [
        {
          id: "local:myTool",
          name: "myTool",
          description: "My tool description",
          source: "local",
          categories: ["utils"],
          keywords: ["helper"],
        },
      ]);

      await catalog.register(source);

      const meta = catalog.getMetadata("local:myTool");
      expect(meta).toMatchObject({
        id: "local:myTool",
        name: "myTool",
        description: "My tool description",
        source: "local",
        sourceId: "local",
        categories: ["utils"],
        keywords: ["helper"],
      });
    });

    it("should return null for non-existent tool", () => {
      const catalog = new DefaultToolCatalog();
      expect(catalog.getMetadata("non-existent")).toBeNull();
    });
  });

  describe("getAllMetadata", () => {
    it("should return immutable snapshot", async () => {
      const catalog = new DefaultToolCatalog();
      const source = createMockSource("local", [
        {
          id: "local:tool1",
          name: "tool1",
          description: "Tool 1",
          source: "local",
        },
      ]);

      await catalog.register(source);

      const snapshot1 = catalog.getAllMetadata();
      const snapshot2 = catalog.getAllMetadata();

      // Should be different array instances
      expect(snapshot1).not.toBe(snapshot2);

      // But have the same content
      expect(snapshot1).toEqual(snapshot2);
    });
  });

  describe("getSource", () => {
    it("should return source by source ID", async () => {
      const catalog = new DefaultToolCatalog();
      const source = createMockSource("mySource", [
        {
          id: "mySource:tool1",
          name: "tool1",
          description: "Tool 1",
          source: "local",
        },
      ]);

      await catalog.register(source);

      // getSource takes sourceId, not toolId
      expect(catalog.getSource("mySource")).toBe(source);
    });

    it("should return null for non-existent source", () => {
      const catalog = new DefaultToolCatalog();
      expect(catalog.getSource("non-existent")).toBeNull();
    });
  });

  describe("MCP refresh handling", () => {
    it("should update tools when source emits refresh", async () => {
      const catalog = new DefaultToolCatalog();
      const source = createMockSource(
        "mcp",
        [
          {
            id: "mcp:tool1",
            name: "tool1",
            description: "Original tool",
            source: "mcp",
          },
        ],
        { withRefresh: true }
      );

      await catalog.register(source);
      expect(catalog.getAllMetadata()).toHaveLength(1);

      // Simulate MCP refresh with new tools
      await source.triggerRefresh([
        {
          id: "mcp:tool1",
          name: "tool1",
          description: "Updated tool",
          source: "mcp",
          sourceId: "mcp",
        },
        {
          id: "mcp:tool2",
          name: "tool2",
          description: "New tool",
          source: "mcp",
          sourceId: "mcp",
        },
      ]);

      const allMetadata = catalog.getAllMetadata();
      expect(allMetadata).toHaveLength(2);
      expect(catalog.getMetadata("mcp:tool1")?.description).toBe("Updated tool");
      expect(catalog.getMetadata("mcp:tool2")?.description).toBe("New tool");
    });

    it("should emit correct diff events on refresh", async () => {
      const catalog = new DefaultToolCatalog();
      const source = createMockSource(
        "mcp",
        [
          {
            id: "mcp:keep",
            name: "keep",
            description: "Will be kept",
            source: "mcp",
          },
          {
            id: "mcp:remove",
            name: "remove",
            description: "Will be removed",
            source: "mcp",
          },
        ],
        { withRefresh: true }
      );

      await catalog.register(source);

      const handler = vi.fn();
      catalog.onToolsChanged.subscribe(handler);

      // Refresh: keep one, remove one, add one
      await source.triggerRefresh([
        {
          id: "mcp:keep",
          name: "keep",
          description: "Still here",
          source: "mcp",
          sourceId: "mcp",
        },
        {
          id: "mcp:added",
          name: "added",
          description: "Newly added",
          source: "mcp",
          sourceId: "mcp",
        },
      ]);

      expect(handler).toHaveBeenCalledWith({
        added: ["mcp:added"],
        removed: ["mcp:remove"],
      });
    });

    it("should not emit event when refresh has no changes", async () => {
      const catalog = new DefaultToolCatalog();
      const source = createMockSource(
        "mcp",
        [
          {
            id: "mcp:tool1",
            name: "tool1",
            description: "Tool",
            source: "mcp",
          },
        ],
        { withRefresh: true }
      );

      await catalog.register(source);

      const handler = vi.fn();
      catalog.onToolsChanged.subscribe(handler);

      // Refresh with same tools
      await source.triggerRefresh([
        {
          id: "mcp:tool1",
          name: "tool1",
          description: "Tool",
          source: "mcp",
          sourceId: "mcp",
        },
      ]);

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
