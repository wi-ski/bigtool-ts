import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const clickup_create_task = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "clickup_create_task",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "clickup_create_task",
    description: "Create a ClickUp task",
    schema: z.object({
    list_id: z.string().describe("List ID"),
    name: z.string().describe("Task name"),
    description: z.string().optional().describe("Description"),
    priority: z.number().optional().describe("Priority (1-4)"),
    due_date: z.number().optional().describe("Due date timestamp"),
    }),
  }
);
