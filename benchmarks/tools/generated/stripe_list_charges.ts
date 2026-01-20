import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const stripe_list_charges = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "stripe_list_charges",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "stripe_list_charges",
    description: "List Stripe charges",
    schema: z.object({
    customer: z.string().optional().describe("Filter by customer"),
    created: z.string().optional().describe("Created filter as JSON"),
    limit: z.number().optional().describe("Maximum results"),
    }),
  }
);
