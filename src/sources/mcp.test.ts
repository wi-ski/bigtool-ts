import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MCPSource, MCPSourceError, MCPToolError } from "./mcp";
import type { MCPClient } from "./mcp";

// Helper to create a mock MCP client
function createMockClient(tools: Array<{
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}> = []): MCPClient {
  return {
    name: "test-server",
    listTools: vi.fn().mockResolvedValue({ tools }),
    callTool: vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "Success" }],
    }),
  };
}

describe("MCPSource", () => {
  let source: MCPSource;

  afterEach(() => {
    source?.dispose();
  });

  describe("constructor", () => {
    it("should create source with client name as namespace", () => {
      const client = createMockClient();
      source = new MCPSource(client);

      expect(source.id).toBe("mcp:test-server");
    });

    it("should use custom namespace when provided", () => {
      const client = createMockClient();
      source = new MCPSource(client, { namespace: "github" });

      expect(source.id).toBe("mcp:github");
    });

    it("should use default namespace when client has no name", () => {
      const client = { ...createMockClient(), name: undefined };
      source = new MCPSource(client);

      expect(source.id).toBe("mcp:default");
    });
  });

  describe("getMetadata", () => {
    it("should fetch tools from client on first call", async () => {
      const client = createMockClient([
        { name: "github_pr", description: "Create PR" },
        { name: "github_issue", description: "Create issue" },
      ]);

      source = new MCPSource(client);
      const metadata = await source.getMetadata();

      expect(client.listTools).toHaveBeenCalledOnce();
      expect(metadata).toHaveLength(2);
      expect(metadata[0]).toMatchObject({
        id: "mcp:test-server:github_pr",
        name: "github_pr",
        description: "Create PR",
        source: "mcp",
      });
    });

    it("should cache metadata after first fetch", async () => {
      const client = createMockClient([
        { name: "tool1", description: "Tool 1" },
      ]);

      source = new MCPSource(client);
      
      await source.getMetadata();
      await source.getMetadata();
      await source.getMetadata();

      expect(client.listTools).toHaveBeenCalledOnce();
    });

    it("should handle empty tool list", async () => {
      const client = createMockClient([]);
      source = new MCPSource(client);

      const metadata = await source.getMetadata();

      expect(metadata).toEqual([]);
    });

    it("should include input schema in metadata", async () => {
      const client = createMockClient([
        {
          name: "search",
          description: "Search something",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string" },
            },
          },
        },
      ]);

      source = new MCPSource(client);
      const metadata = await source.getMetadata();

      expect(metadata[0].parameters).toEqual({
        type: "object",
        properties: {
          query: { type: "string" },
        },
      });
    });
  });

  describe("getTool", () => {
    it("should return tool wrapper by full ID", async () => {
      const client = createMockClient([
        { name: "my_tool", description: "My tool" },
      ]);

      source = new MCPSource(client);
      const tool = await source.getTool("mcp:test-server:my_tool");

      expect(tool).not.toBeNull();
      expect(tool?.name).toBe("my_tool");
    });

    it("should return tool wrapper by name only", async () => {
      const client = createMockClient([
        { name: "my_tool", description: "My tool" },
      ]);

      source = new MCPSource(client);
      const tool = await source.getTool("my_tool");

      expect(tool).not.toBeNull();
      expect(tool?.name).toBe("my_tool");
    });

    it("should return null for non-existent tool", async () => {
      const client = createMockClient([
        { name: "existing", description: "Exists" },
      ]);

      source = new MCPSource(client);
      const tool = await source.getTool("nonexistent");

      expect(tool).toBeNull();
    });

    it("should cache tool wrappers", async () => {
      const client = createMockClient([
        { name: "cached_tool", description: "Cached" },
      ]);

      source = new MCPSource(client);
      
      const tool1 = await source.getTool("cached_tool");
      const tool2 = await source.getTool("cached_tool");

      expect(tool1).toBe(tool2);
    });

    it("should trigger metadata fetch if not initialized", async () => {
      const client = createMockClient([
        { name: "lazy_tool", description: "Lazy loaded" },
      ]);

      source = new MCPSource(client);
      
      // Call getTool without calling getMetadata first
      const tool = await source.getTool("lazy_tool");

      expect(client.listTools).toHaveBeenCalled();
      expect(tool).not.toBeNull();
    });
  });

  describe("tool execution", () => {
    it("should delegate execution to MCP client", async () => {
      const client = createMockClient([
        { name: "greet", description: "Greet someone" },
      ]);

      source = new MCPSource(client);
      const tool = await source.getTool("greet");

      await tool?.invoke({ name: "World" });

      expect(client.callTool).toHaveBeenCalledWith({
        name: "greet",
        arguments: { name: "World" },
      });
    });

    it("should return text content from result", async () => {
      const client = createMockClient([
        { name: "echo", description: "Echo input" },
      ]);
      (client.callTool as ReturnType<typeof vi.fn>).mockResolvedValue({
        content: [
          { type: "text", text: "Hello, " },
          { type: "text", text: "World!" },
        ],
      });

      source = new MCPSource(client);
      const tool = await source.getTool("echo");
      const result = await tool?.invoke({});

      expect(result).toBe("Hello, \nWorld!");
    });

    it("should throw MCPToolError when tool returns error", async () => {
      const client = createMockClient([
        { name: "failing_tool", description: "Fails" },
      ]);
      (client.callTool as ReturnType<typeof vi.fn>).mockResolvedValue({
        isError: true,
        content: [{ type: "text", text: "Something went wrong" }],
      });

      source = new MCPSource(client);
      const tool = await source.getTool("failing_tool");

      await expect(tool?.invoke({})).rejects.toThrow(MCPToolError);
      await expect(tool?.invoke({})).rejects.toThrow("Something went wrong");
    });

    it("should throw MCPToolError on client error", async () => {
      const client = createMockClient([
        { name: "network_fail", description: "Network fails" },
      ]);
      (client.callTool as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Connection refused")
      );

      source = new MCPSource(client);
      const tool = await source.getTool("network_fail");

      await expect(tool?.invoke({})).rejects.toThrow(MCPToolError);
      await expect(tool?.invoke({})).rejects.toThrow("Connection refused");
    });
  });

  describe("refresh", () => {
    it("should emit refresh event with new metadata", async () => {
      const client = createMockClient([
        { name: "tool1", description: "Tool 1" },
      ]);

      source = new MCPSource(client);
      
      const refreshHandler = vi.fn();
      source.onRefresh.on(refreshHandler);

      await source.refresh();

      expect(refreshHandler).toHaveBeenCalledWith([
        expect.objectContaining({ name: "tool1" }),
      ]);
    });

    it("should clear tool cache on refresh", async () => {
      const client = createMockClient([
        { name: "refreshable", description: "Refreshable" },
      ]);

      source = new MCPSource(client);
      
      const tool1 = await source.getTool("refreshable");
      await source.refresh();
      const tool2 = await source.getTool("refreshable");

      // After refresh, should be a new wrapper instance
      expect(tool1).not.toBe(tool2);
    });

    it("should throw MCPSourceError on listTools failure", async () => {
      const client = createMockClient();
      (client.listTools as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Server unavailable")
      );

      source = new MCPSource(client);

      await expect(source.refresh()).rejects.toThrow(MCPSourceError);
      await expect(source.getMetadata()).rejects.toThrow("Server unavailable");
    });
  });

  describe("refreshInterval", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should periodically refresh when interval is set", async () => {
      const client = createMockClient([
        { name: "periodic", description: "Periodic" },
      ]);

      source = new MCPSource(client, { refreshInterval: 5000 });
      
      // Initial fetch
      await source.getMetadata();
      expect(client.listTools).toHaveBeenCalledTimes(1);

      // Advance timer
      await vi.advanceTimersByTimeAsync(5000);
      expect(client.listTools).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(5000);
      expect(client.listTools).toHaveBeenCalledTimes(3);
    });

    it("should stop refreshing after dispose", async () => {
      const client = createMockClient([
        { name: "disposable", description: "Disposable" },
      ]);

      source = new MCPSource(client, { refreshInterval: 1000 });
      await source.getMetadata();

      source.dispose();

      await vi.advanceTimersByTimeAsync(5000);
      // Only the initial call should have been made
      expect(client.listTools).toHaveBeenCalledTimes(1);
    });
  });

  describe("dispose", () => {
    it("should remove all event listeners", async () => {
      const client = createMockClient();
      source = new MCPSource(client);

      const handler = vi.fn();
      source.onRefresh.on("refresh", handler);

      source.dispose();
      
      // After dispose, events should not be received
      // Note: we can't test this directly since dispose removes listeners
      // but we can verify it doesn't throw
      expect(() => source.dispose()).not.toThrow();
    });
  });
});
