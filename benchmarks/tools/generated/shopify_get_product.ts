import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const shopify_get_product = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "shopify_get_product",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "shopify_get_product",
    description: "Get a Shopify product",
    schema: z.object({
    product_id: z.number().describe("Product ID"),
    }),
  }
);
