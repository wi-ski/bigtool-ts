import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const asana_create_task = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "asana_create_task",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "asana_create_task",
    description: "Create an Asana task",
    schema: z.object({
    name: z.string().describe("Task name"),
    project_id: z.string().describe("Project ID"),
    notes: z.string().optional().describe("Task notes"),
    due_date: z.string().optional().describe("Due date"),
    assignee: z.string().optional().describe("Assignee ID"),
    }),
  }
);
