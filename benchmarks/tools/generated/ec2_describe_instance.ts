import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const ec2_describe_instance = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "ec2_describe_instance",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "ec2_describe_instance",
    description: "Get detailed information about an EC2 instance",
    schema: z.object({
    instance_id: z.string().describe("EC2 instance ID"),
    }),
  }
);
