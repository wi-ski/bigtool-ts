import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const k8s_list_services = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "k8s_list_services",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "k8s_list_services",
    description: "List all services",
    schema: z.object({
    namespace: z.string().optional().describe("Kubernetes namespace"),
    }),
  }
);
