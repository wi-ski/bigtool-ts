import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const pagerduty_create_incident = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "pagerduty_create_incident",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "pagerduty_create_incident",
    description: "Create a PagerDuty incident",
    schema: z.object({
    service_id: z.string().describe("Service ID"),
    title: z.string().describe("Incident title"),
    urgency: z.string().optional().describe("Urgency (high, low)"),
    body: z.string().optional().describe("Incident details"),
    }),
  }
);
