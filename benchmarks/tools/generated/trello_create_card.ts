import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const trello_create_card = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "trello_create_card",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "trello_create_card",
    description: "Create a Trello card",
    schema: z.object({
    list_id: z.string().describe("List ID"),
    name: z.string().describe("Card name"),
    desc: z.string().optional().describe("Description"),
    due: z.string().optional().describe("Due date"),
    }),
  }
);
