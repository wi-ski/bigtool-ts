import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const datadog_list_monitors = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "datadog_list_monitors",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "datadog_list_monitors",
    description: "List Datadog monitors",
    schema: z.object({
    tags: z.array(z.string()).optional().describe("Filter by tags"),
    name: z.string().optional().describe("Filter by name"),
    }),
  }
);
