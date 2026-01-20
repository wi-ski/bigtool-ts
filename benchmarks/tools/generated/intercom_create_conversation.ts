import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const intercom_create_conversation = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "intercom_create_conversation",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "intercom_create_conversation",
    description: "Create an Intercom conversation",
    schema: z.object({
    user_id: z.string().describe("User ID"),
    body: z.string().describe("Message body"),
    }),
  }
);
