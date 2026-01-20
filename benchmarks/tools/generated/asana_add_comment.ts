import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const asana_add_comment = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "asana_add_comment",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "asana_add_comment",
    description: "Add comment to Asana task",
    schema: z.object({
    task_id: z.string().describe("Task ID"),
    text: z.string().describe("Comment text"),
    }),
  }
);
