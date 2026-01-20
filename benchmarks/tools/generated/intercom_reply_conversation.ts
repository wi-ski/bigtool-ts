import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const intercom_reply_conversation = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "intercom_reply_conversation",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "intercom_reply_conversation",
    description: "Reply to an Intercom conversation",
    schema: z.object({
    conversation_id: z.string().describe("Conversation ID"),
    body: z.string().describe("Reply body"),
    message_type: z.string().optional().describe("Message type (comment, note)"),
    }),
  }
);
