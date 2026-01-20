import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const stripe_create_charge = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "stripe_create_charge",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "stripe_create_charge",
    description: "Create a Stripe charge",
    schema: z.object({
    amount: z.number().describe("Amount in cents"),
    currency: z.string().describe("Currency code"),
    customer: z.string().optional().describe("Customer ID"),
    source: z.string().optional().describe("Payment source"),
    description: z.string().optional().describe("Charge description"),
    }),
  }
);
