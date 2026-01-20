import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const intercom_close_conversation = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "intercom_close_conversation",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "intercom_close_conversation",
    description: "Close an Intercom conversation",
    schema: z.object({
    conversation_id: z.string().describe("Conversation ID"),
    }),
  }
);
