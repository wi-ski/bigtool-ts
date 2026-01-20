import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const jira_create_issue = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "jira_create_issue",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "jira_create_issue",
    description: "Create a new Jira issue",
    schema: z.object({
    project: z.string().describe("Project key"),
    summary: z.string().describe("Issue summary"),
    description: z.string().optional().describe("Description"),
    issue_type: z.string().optional().describe("Issue type"),
    }),
  }
);
