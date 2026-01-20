import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const snyk_ignore_issue = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "snyk_ignore_issue",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "snyk_ignore_issue",
    description: "Ignore a Snyk issue",
    schema: z.object({
    issue_id: z.string().describe("Issue ID"),
    reason: z.string().describe("Ignore reason"),
    expires: z.string().optional().describe("Expiration date"),
    }),
  }
);
