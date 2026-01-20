import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const zendesk_search_tickets = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "zendesk_search_tickets",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "zendesk_search_tickets",
    description: "Search Zendesk tickets",
    schema: z.object({
    query: z.string().describe("Search query"),
    sort_by: z.string().optional().describe("Sort field"),
    sort_order: z.string().optional().describe("Sort order"),
    }),
  }
);
