import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const snyk_list_issues = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "snyk_list_issues",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "snyk_list_issues",
    description: "List Snyk security issues",
    schema: z.object({
    org_id: z.string().describe("Organization ID"),
    project_id: z.string().optional().describe("Project ID"),
    severity: z.array(z.string()).optional().describe("Filter by severity"),
    }),
  }
);
