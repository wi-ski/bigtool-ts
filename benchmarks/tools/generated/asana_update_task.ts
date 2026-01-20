import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const asana_update_task = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "asana_update_task",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "asana_update_task",
    description: "Update an Asana task",
    schema: z.object({
    task_id: z.string().describe("Task ID"),
    name: z.string().optional().describe("New name"),
    completed: z.boolean().optional().describe("Mark complete"),
    }),
  }
);
