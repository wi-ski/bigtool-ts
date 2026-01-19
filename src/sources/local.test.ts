import { describe, it, expect } from "vitest";
import { LocalSource } from "./local";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { withMetadata } from "./with-metadata";

// Helper to create a mock tool
function createMockTool(name: string, description: string) {
  return new DynamicStructuredTool({
    name,
    description,
    schema: z.object({
      input: z.string().describe("The input parameter"),
    }),
    func: async (input) => {
      return `Result: ${input.input}`;
    },
  });
}

describe("LocalSource", () => {
  describe("constructor", () => {
    it("should create a source with default ID 'local'", () => {
      const tools = [
        createMockTool("tool1", "First tool"),
        createMockTool("tool2", "Second tool"),
      ];

      const source = new LocalSource(tools);

      expect(source.id).toBe("local");
    });

    it("should use custom ID when provided", () => {
      const tools = [createMockTool("tool1", "First tool")];
      
      const source = new LocalSource(tools, "my-custom-source");

      expect(source.id).toBe("my-custom-source");
    });

    it("should handle empty tools array", () => {
      const source = new LocalSource([]);

      expect(source.id).toBe("local");
    });
  });

  describe("getMetadata", () => {
    it("should return metadata for all tools with namespaced IDs", async () => {
      const tools = [
        createMockTool("github_create_pr", "Create a pull request"),
        createMockTool("slack_send_message", "Send a Slack message"),
      ];

      const source = new LocalSource(tools, "local");
      const metadata = await source.getMetadata();

      expect(metadata).toHaveLength(2);
      expect(metadata[0]).toMatchObject({
        id: "local:github_create_pr",  // Namespaced with source ID
        name: "github_create_pr",
        description: "Create a pull request",
        source: "local",
        sourceId: "local",
      });
      expect(metadata[1]).toMatchObject({
        id: "local:slack_send_message",  // Namespaced with source ID
        name: "slack_send_message",
        description: "Send a Slack message",
        source: "local",
        sourceId: "local",
      });
    });

    it("should include tool schema in metadata", async () => {
      const tool = new DynamicStructuredTool({
        name: "test_tool",
        description: "A test tool",
        schema: z.object({
          name: z.string().describe("The name"),
          count: z.number().describe("The count"),
        }),
        func: async () => "result",
      });

      const source = new LocalSource([tool]);
      const metadata = await source.getMetadata();

      expect(metadata[0].parameters).toBeDefined();
    });

    it("should return empty array for empty source", async () => {
      const source = new LocalSource([]);
      const metadata = await source.getMetadata();

      expect(metadata).toEqual([]);
    });

    it("should include categories and keywords from enhanced tools", async () => {
      const tool = withMetadata(
        createMockTool("github_pr", "Create PR"),
        {
          categories: ["github", "git"],
          keywords: ["PR", "pull request", "merge"],
        }
      );

      const source = new LocalSource([tool]);
      const metadata = await source.getMetadata();

      expect(metadata[0].categories).toEqual(["github", "git"]);
      expect(metadata[0].keywords).toEqual(["PR", "pull request", "merge"]);
    });
  });

  describe("getTool", () => {
    it("should return tool by name", async () => {
      const tools = [
        createMockTool("my_tool", "My tool"),
      ];

      const source = new LocalSource(tools);
      const tool = await source.getTool("my_tool");

      expect(tool).not.toBeNull();
      expect(tool?.name).toBe("my_tool");
    });

    it("should return null for non-existent tool", async () => {
      const tools = [
        createMockTool("existing_tool", "Existing tool"),
      ];

      const source = new LocalSource(tools);
      const tool = await source.getTool("nonexistent_tool");

      expect(tool).toBeNull();
    });

    it("should return null for empty string", async () => {
      const source = new LocalSource([]);
      const tool = await source.getTool("");

      expect(tool).toBeNull();
    });

    it("should return the correct tool when multiple exist", async () => {
      const tools = [
        createMockTool("tool_a", "Tool A"),
        createMockTool("tool_b", "Tool B"),
        createMockTool("tool_c", "Tool C"),
      ];

      const source = new LocalSource(tools);
      
      const toolA = await source.getTool("tool_a");
      const toolB = await source.getTool("tool_b");
      const toolC = await source.getTool("tool_c");

      expect(toolA?.name).toBe("tool_a");
      expect(toolB?.name).toBe("tool_b");
      expect(toolC?.name).toBe("tool_c");
    });
  });

  describe("tool execution", () => {
    it("should return a functional tool that can be invoked", async () => {
      const tool = new DynamicStructuredTool({
        name: "greet",
        description: "Greet someone",
        schema: z.object({
          name: z.string(),
        }),
        func: async ({ name }) => `Hello, ${name}!`,
      });

      const source = new LocalSource([tool]);
      const retrieved = await source.getTool("greet");

      expect(retrieved).not.toBeNull();
      const result = await retrieved!.invoke({ name: "World" });
      expect(result).toBe("Hello, World!");
    });
  });
});
