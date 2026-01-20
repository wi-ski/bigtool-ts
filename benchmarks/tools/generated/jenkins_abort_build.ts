import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const jenkins_abort_build = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "jenkins_abort_build",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "jenkins_abort_build",
    description: "Abort a running Jenkins build",
    schema: z.object({
    job_name: z.string().describe("Jenkins job name"),
    build_number: z.number().describe("Build number"),
    }),
  }
);
