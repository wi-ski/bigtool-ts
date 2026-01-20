import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const vault_list_secrets = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "vault_list_secrets",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "vault_list_secrets",
    description: "List secrets at a path",
    schema: z.object({
    path: z.string().describe("Secret path"),
    }),
  }
);
