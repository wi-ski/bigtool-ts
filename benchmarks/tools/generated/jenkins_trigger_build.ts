import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const jenkins_trigger_build = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "jenkins_trigger_build",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "jenkins_trigger_build",
    description: "Trigger a Jenkins build",
    schema: z.object({
    job_name: z.string().describe("Jenkins job name"),
    parameters: z.string().optional().describe("Build parameters as JSON"),
    token: z.string().optional().describe("Build trigger token"),
    }),
  }
);
