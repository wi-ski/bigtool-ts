import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const stripe_send_invoice = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "stripe_send_invoice",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "stripe_send_invoice",
    description: "Send a Stripe invoice",
    schema: z.object({
    invoice_id: z.string().describe("Invoice ID"),
    }),
  }
);
