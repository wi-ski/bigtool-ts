import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const ec2_stop_instance = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "ec2_stop_instance",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "ec2_stop_instance",
    description: "Stop a running EC2 instance",
    schema: z.object({
    instance_id: z.string().describe("EC2 instance ID"),
    }),
  }
);
