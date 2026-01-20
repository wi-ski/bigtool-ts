import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const ec2_launch_instance = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "ec2_launch_instance",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "ec2_launch_instance",
    description: "Launch a new EC2 instance",
    schema: z.object({
    instance_type: z.string().describe("Instance type (t2.micro, m5.large, etc.)"),
    ami_id: z.string().describe("AMI ID to launch from"),
    key_name: z.string().optional().describe("SSH key pair name"),
    security_groups: z.array(z.string()).optional().describe("Security group IDs"),
    subnet_id: z.string().optional().describe("Subnet to launch in"),
    }),
  }
);
