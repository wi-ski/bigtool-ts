import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const datadog_post_event = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "datadog_post_event",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "datadog_post_event",
    description: "Post an event to Datadog",
    schema: z.object({
    title: z.string().describe("Event title"),
    text: z.string().describe("Event text"),
    alert_type: z.string().optional().describe("Alert type (info, warning, error)"),
    tags: z.array(z.string()).optional().describe("Event tags"),
    }),
  }
);
