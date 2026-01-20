import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const github_actions_list_runs = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "github_actions_list_runs",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "github_actions_list_runs",
    description: "List workflow runs",
    schema: z.object({
    repo: z.string().describe("Repository (owner/name)"),
    workflow_id: z.string().optional().describe("Workflow file name or ID"),
    status: z.string().optional().describe("Filter by status"),
    branch: z.string().optional().describe("Filter by branch"),
    }),
  }
);
