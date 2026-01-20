import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const jira_update_issue = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "jira_update_issue",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "jira_update_issue",
    description: "Update a Jira issue",
    schema: z.object({
    issue_key: z.string().describe("Issue key"),
    status: z.string().optional().describe("New status"),
    }),
  }
);
