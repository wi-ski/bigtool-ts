import { describe, it, expect, vi } from "vitest";
import { DynamicSource, DynamicSourceError } from "./dynamic";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolMetadata } from "./types";

// Helper to create a mock tool
function createMockTool(name: string, description: string) {
  return new DynamicStructuredTool({
    name,
    description,
    schema: z.object({
      input: z.string(),
    }),
    func: async (input) => `Result: ${input.input}`,
  });
}

// Helper to create tool metadata
function createMetadata(
  id: string,
  name: string,
  description: string
): ToolMetadata {
  return {
    id,
    name,
    description,
    source: "dynamic",
  };
}

describe("DynamicSource", () => {
  describe("constructor", () => {
    it("should create source with id 'dynamic'", () => {
      const source = new DynamicSource({
        metadata: [],
        loader: async () => createMockTool("test", "Test"),
      });

      expect(source.id).toBe("dynamic");
    });

    it("should normalize metadata IDs with dynamic: prefix", async () => {
      const source = new DynamicSource({
        metadata: [
          createMetadata("tool1", "tool1", "Tool 1"),
          createMetadata("tool2", "tool2", "Tool 2"),
        ],
        loader: async () => createMockTool("test", "Test"),
      });

      const metadata = await source.getMetadata();

      expect(metadata[0].id).toBe("dynamic:tool1");
      expect(metadata[1].id).toBe("dynamic:tool2");
    });

    it("should not double-prefix already prefixed IDs", async () => {
      const source = new DynamicSource({
        metadata: [
          createMetadata("dynamic:already_prefixed", "already_prefixed", "Already prefixed"),
        ],
        loader: async () => createMockTool("test", "Test"),
      });

      const metadata = await source.getMetadata();

      expect(metadata[0].id).toBe("dynamic:already_prefixed");
    });

    it("should set source to 'dynamic' for all metadata", async () => {
      const source = new DynamicSource({
        metadata: [
          { id: "tool1", name: "tool1", description: "Tool 1", source: "local" as const },
        ],
        loader: async () => createMockTool("test", "Test"),
      });

      const metadata = await source.getMetadata();

      expect(metadata[0].source).toBe("dynamic");
    });
  });

  describe("getMetadata", () => {
    it("should return provided metadata", async () => {
      const inputMetadata: ToolMetadata[] = [
        createMetadata("search", "search", "Search documents"),
        createMetadata("summarize", "summarize", "Summarize text"),
      ];

      const source = new DynamicSource({
        metadata: inputMetadata,
        loader: async () => createMockTool("test", "Test"),
      });

      const metadata = await source.getMetadata();

      expect(metadata).toHaveLength(2);
      expect(metadata[0].name).toBe("search");
      expect(metadata[1].name).toBe("summarize");
    });

    it("should return empty array for empty metadata", async () => {
      const source = new DynamicSource({
        metadata: [],
        loader: async () => createMockTool("test", "Test"),
      });

      const metadata = await source.getMetadata();

      expect(metadata).toEqual([]);
    });

    it("should preserve categories and keywords", async () => {
      const source = new DynamicSource({
        metadata: [
          {
            id: "github_pr",
            name: "github_pr",
            description: "Create PR",
            source: "dynamic",
            categories: ["github", "git"],
            keywords: ["PR", "pull request"],
          },
        ],
        loader: async () => createMockTool("test", "Test"),
      });

      const metadata = await source.getMetadata();

      expect(metadata[0].categories).toEqual(["github", "git"]);
      expect(metadata[0].keywords).toEqual(["PR", "pull request"]);
    });
  });

  describe("getTool", () => {
    it("should call loader with tool name", async () => {
      const loader = vi.fn().mockResolvedValue(
        createMockTool("lazy_tool", "Lazy loaded tool")
      );

      const source = new DynamicSource({
        metadata: [createMetadata("lazy_tool", "lazy_tool", "Lazy tool")],
        loader,
      });

      await source.getTool("dynamic:lazy_tool");

      expect(loader).toHaveBeenCalledWith("lazy_tool");
    });

    it("should accept ID with dynamic: prefix", async () => {
      const loader = vi.fn().mockResolvedValue(
        createMockTool("prefixed", "Prefixed tool")
      );

      const source = new DynamicSource({
        metadata: [createMetadata("prefixed", "prefixed", "Prefixed")],
        loader,
      });

      const tool = await source.getTool("dynamic:prefixed");

      expect(tool).not.toBeNull();
      expect(loader).toHaveBeenCalledWith("prefixed");
    });

    it("should accept ID without prefix", async () => {
      const loader = vi.fn().mockResolvedValue(
        createMockTool("unprefixed", "Unprefixed tool")
      );

      const source = new DynamicSource({
        metadata: [createMetadata("unprefixed", "unprefixed", "Unprefixed")],
        loader,
      });

      const tool = await source.getTool("unprefixed");

      expect(tool).not.toBeNull();
      expect(loader).toHaveBeenCalledWith("unprefixed");
    });

    it("should return null for unknown tool", async () => {
      const loader = vi.fn();

      const source = new DynamicSource({
        metadata: [createMetadata("known", "known", "Known tool")],
        loader,
      });

      const tool = await source.getTool("unknown");

      expect(tool).toBeNull();
      expect(loader).not.toHaveBeenCalled();
    });

    it("should return the tool from loader", async () => {
      const expectedTool = createMockTool("loaded", "Loaded tool");
      const loader = vi.fn().mockResolvedValue(expectedTool);

      const source = new DynamicSource({
        metadata: [createMetadata("loaded", "loaded", "Loaded")],
        loader,
      });

      const tool = await source.getTool("loaded");

      expect(tool).toBe(expectedTool);
    });

    it("should throw DynamicSourceError when loader fails", async () => {
      const loader = vi.fn().mockRejectedValue(new Error("Load failed"));

      const source = new DynamicSource({
        metadata: [createMetadata("failing", "failing", "Failing tool")],
        loader,
      });

      await expect(source.getTool("failing")).rejects.toThrow(DynamicSourceError);
      await expect(source.getTool("failing")).rejects.toThrow("Load failed");
    });

    it("should preserve error cause", async () => {
      const originalError = new Error("Original error");
      const loader = vi.fn().mockRejectedValue(originalError);

      const source = new DynamicSource({
        metadata: [createMetadata("error_cause", "error_cause", "Error cause")],
        loader,
      });

      try {
        await source.getTool("error_cause");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(DynamicSourceError);
        expect((error as DynamicSourceError).cause).toBe(originalError);
      }
    });
  });

  describe("loaded tool execution", () => {
    it("should return a functional tool", async () => {
      const source = new DynamicSource({
        metadata: [createMetadata("greet", "greet", "Greet someone")],
        loader: async (name) => {
          return new DynamicStructuredTool({
            name,
            description: "Greet someone",
            schema: z.object({ name: z.string() }),
            func: async ({ name }) => `Hello, ${name}!`,
          });
        },
      });

      const tool = await source.getTool("greet");
      const result = await tool?.invoke({ name: "World" });

      expect(result).toBe("Hello, World!");
    });

    it("should load different tools based on name", async () => {
      const source = new DynamicSource({
        metadata: [
          createMetadata("add", "add", "Add numbers"),
          createMetadata("multiply", "multiply", "Multiply numbers"),
        ],
        loader: async (name) => {
          if (name === "add") {
            return new DynamicStructuredTool({
              name: "add",
              description: "Add numbers",
              schema: z.object({ a: z.number(), b: z.number() }),
              func: async ({ a, b }) => String(a + b),
            });
          }
          return new DynamicStructuredTool({
            name: "multiply",
            description: "Multiply numbers",
            schema: z.object({ a: z.number(), b: z.number() }),
            func: async ({ a, b }) => String(a * b),
          });
        },
      });

      const addTool = await source.getTool("add");
      const multiplyTool = await source.getTool("multiply");

      expect(await addTool?.invoke({ a: 2, b: 3 })).toBe("5");
      expect(await multiplyTool?.invoke({ a: 2, b: 3 })).toBe("6");
    });
  });

  describe("edge cases", () => {
    it("should handle special characters in tool names", async () => {
      const loader = vi.fn().mockResolvedValue(
        createMockTool("special-tool_v2.0", "Special tool")
      );

      const source = new DynamicSource({
        metadata: [createMetadata("special-tool_v2.0", "special-tool_v2.0", "Special")],
        loader,
      });

      const tool = await source.getTool("dynamic:special-tool_v2.0");

      expect(tool).not.toBeNull();
      expect(loader).toHaveBeenCalledWith("special-tool_v2.0");
    });

    it("should not cache tools (loader called each time)", async () => {
      const loader = vi.fn().mockResolvedValue(
        createMockTool("uncached", "Uncached tool")
      );

      const source = new DynamicSource({
        metadata: [createMetadata("uncached", "uncached", "Uncached")],
        loader,
      });

      await source.getTool("uncached");
      await source.getTool("uncached");
      await source.getTool("uncached");

      expect(loader).toHaveBeenCalledTimes(3);
    });
  });
});
