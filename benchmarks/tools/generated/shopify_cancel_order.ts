import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const shopify_cancel_order = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "shopify_cancel_order",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "shopify_cancel_order",
    description: "Cancel a Shopify order",
    schema: z.object({
    order_id: z.number().describe("Order ID"),
    reason: z.string().optional().describe("Cancellation reason"),
    restock: z.boolean().optional().describe("Restock items"),
    }),
  }
);
