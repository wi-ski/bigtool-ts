import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const zendesk_list_tickets = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "zendesk_list_tickets",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "zendesk_list_tickets",
    description: "List Zendesk tickets",
    schema: z.object({
    status: z.string().optional().describe("Filter by status"),
    assignee: z.number().optional().describe("Filter by assignee"),
    requester: z.number().optional().describe("Filter by requester"),
    }),
  }
);
