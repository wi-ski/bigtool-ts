import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const slack_send_dm = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "slack_send_dm",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "slack_send_dm",
    description: "Send a direct message",
    schema: z.object({
    user: z.string().describe("User ID"),
    text: z.string().describe("Message"),
    }),
  }
);
