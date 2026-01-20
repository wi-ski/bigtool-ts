import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const zendesk_add_comment = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "zendesk_add_comment",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "zendesk_add_comment",
    description: "Add a comment to a Zendesk ticket",
    schema: z.object({
    ticket_id: z.number().describe("Ticket ID"),
    body: z.string().describe("Comment body"),
    public: z.boolean().optional().describe("Public or internal comment"),
    }),
  }
);
