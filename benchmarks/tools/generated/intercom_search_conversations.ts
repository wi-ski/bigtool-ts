import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const intercom_search_conversations = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "intercom_search_conversations",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "intercom_search_conversations",
    description: "Search Intercom conversations",
    schema: z.object({
    query: z.string().describe("Search query"),
    }),
  }
);
