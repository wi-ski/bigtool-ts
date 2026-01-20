import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const trello_move_card = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "trello_move_card",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "trello_move_card",
    description: "Move a Trello card",
    schema: z.object({
    card_id: z.string().describe("Card ID"),
    list_id: z.string().describe("Target list ID"),
    }),
  }
);
