import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const stripe_create_customer = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "stripe_create_customer",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "stripe_create_customer",
    description: "Create a Stripe customer",
    schema: z.object({
    email: z.string().describe("Customer email"),
    name: z.string().optional().describe("Customer name"),
    description: z.string().optional().describe("Description"),
    metadata: z.string().optional().describe("Metadata as JSON"),
    }),
  }
);
