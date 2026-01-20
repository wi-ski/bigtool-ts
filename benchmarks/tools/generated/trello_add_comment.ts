import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const trello_add_comment = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "trello_add_comment",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "trello_add_comment",
    description: "Add comment to Trello card",
    schema: z.object({
    card_id: z.string().describe("Card ID"),
    text: z.string().describe("Comment text"),
    }),
  }
);
