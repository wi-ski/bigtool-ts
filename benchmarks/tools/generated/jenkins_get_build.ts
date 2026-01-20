import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const jenkins_get_build = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "jenkins_get_build",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "jenkins_get_build",
    description: "Get Jenkins build details",
    schema: z.object({
    job_name: z.string().describe("Jenkins job name"),
    build_number: z.number().describe("Build number"),
    }),
  }
);
