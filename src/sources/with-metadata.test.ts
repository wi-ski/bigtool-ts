import { describe, it, expect } from "vitest";
import { withMetadata } from "./with-metadata";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolEnhancement, EnhancedTool } from "./types";

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

describe("withMetadata", () => {
  it("should attach categories to tool", () => {
    const tool = createMockTool("test", "Test tool");
    
    const enhanced = withMetadata(tool, {
      categories: ["category1", "category2"],
    });

    expect(enhanced.__bigtool_metadata?.categories).toEqual(["category1", "category2"]);
  });

  it("should attach keywords to tool", () => {
    const tool = createMockTool("test", "Test tool");
    
    const enhanced = withMetadata(tool, {
      keywords: ["keyword1", "keyword2", "keyword3"],
    });

    expect(enhanced.__bigtool_metadata?.keywords).toEqual(["keyword1", "keyword2", "keyword3"]);
  });

  it("should attach both categories and keywords", () => {
    const tool = createMockTool("test", "Test tool");
    
    const enhanced = withMetadata(tool, {
      categories: ["github", "git"],
      keywords: ["PR", "pull request", "merge"],
    });

    expect(enhanced.__bigtool_metadata?.categories).toEqual(["github", "git"]);
    expect(enhanced.__bigtool_metadata?.keywords).toEqual(["PR", "pull request", "merge"]);
  });

  it("should return the same tool instance", () => {
    const tool = createMockTool("test", "Test tool");
    
    const enhanced = withMetadata(tool, {
      categories: ["test"],
    });

    expect(enhanced).toBe(tool);
  });

  it("should preserve tool functionality", async () => {
    const tool = new DynamicStructuredTool({
      name: "greet",
      description: "Greet someone",
      schema: z.object({ name: z.string() }),
      func: async ({ name }) => `Hello, ${name}!`,
    });
    
    const enhanced = withMetadata(tool, {
      categories: ["greeting"],
    });

    const result = await enhanced.invoke({ name: "World" });
    expect(result).toBe("Hello, World!");
  });

  it("should handle empty metadata object", () => {
    const tool = createMockTool("test", "Test tool");
    
    const enhanced = withMetadata(tool, {});

    expect(enhanced.__bigtool_metadata).toEqual({});
  });

  it("should handle empty arrays", () => {
    const tool = createMockTool("test", "Test tool");
    
    const enhanced = withMetadata(tool, {
      categories: [],
      keywords: [],
    });

    expect(enhanced.__bigtool_metadata?.categories).toEqual([]);
    expect(enhanced.__bigtool_metadata?.keywords).toEqual([]);
  });
});
