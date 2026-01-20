import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const shopify_list_products = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "shopify_list_products",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "shopify_list_products",
    description: "List Shopify products",
    schema: z.object({
    collection_id: z.number().optional().describe("Filter by collection"),
    product_type: z.string().optional().describe("Filter by type"),
    vendor: z.string().optional().describe("Filter by vendor"),
    limit: z.number().optional().describe("Maximum results"),
    }),
  }
);
