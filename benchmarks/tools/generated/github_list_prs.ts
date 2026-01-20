import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const github_list_prs = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "github_list_prs",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "github_list_prs",
    description: "List pull requests in a repository",
    schema: z.object({
    state: z.string().optional().describe("Filter by state"),
    limit: z.number().optional().describe("Maximum results"),
    }),
  }
);
