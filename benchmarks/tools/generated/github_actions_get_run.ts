import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const github_actions_get_run = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "github_actions_get_run",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "github_actions_get_run",
    description: "Get details of a workflow run",
    schema: z.object({
    repo: z.string().describe("Repository (owner/name)"),
    run_id: z.number().describe("Workflow run ID"),
    }),
  }
);
