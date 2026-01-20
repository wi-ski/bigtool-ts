import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const jenkins_get_console_output = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "jenkins_get_console_output",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "jenkins_get_console_output",
    description: "Get Jenkins build console output",
    schema: z.object({
    job_name: z.string().describe("Jenkins job name"),
    build_number: z.number().describe("Build number"),
    }),
  }
);
