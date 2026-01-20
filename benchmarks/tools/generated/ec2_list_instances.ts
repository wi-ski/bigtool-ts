import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const ec2_list_instances = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "ec2_list_instances",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "ec2_list_instances",
    description: "List EC2 instances with optional filters",
    schema: z.object({
    filters: z.string().optional().describe("Filter criteria as JSON"),
    state: z.string().optional().describe("Instance state filter"),
    }),
  }
);
