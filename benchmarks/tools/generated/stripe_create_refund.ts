import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const stripe_create_refund = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "stripe_create_refund",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "stripe_create_refund",
    description: "Create a Stripe refund",
    schema: z.object({
    charge: z.string().describe("Charge ID"),
    amount: z.number().optional().describe("Refund amount in cents"),
    reason: z.string().optional().describe("Refund reason"),
    }),
  }
);
