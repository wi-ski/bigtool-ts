import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const github_actions_rerun = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "github_actions_rerun",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "github_actions_rerun",
    description: "Re-run a failed workflow",
    schema: z.object({
    repo: z.string().describe("Repository (owner/name)"),
    run_id: z.number().describe("Workflow run ID"),
    only_failed: z.boolean().optional().describe("Only re-run failed jobs"),
    }),
  }
);
