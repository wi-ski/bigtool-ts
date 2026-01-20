import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const email_send = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "email_send",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "email_send",
    description: "Send an email",
    schema: z.object({
    to: z.string().describe("Recipient"),
    subject: z.string().describe("Subject"),
    body: z.string().describe("Body"),
    }),
  }
);
