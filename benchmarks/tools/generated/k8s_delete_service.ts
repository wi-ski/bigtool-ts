import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const k8s_delete_service = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "k8s_delete_service",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "k8s_delete_service",
    description: "Delete a Kubernetes service",
    schema: z.object({
    name: z.string().describe("Service name"),
    namespace: z.string().optional().describe("Kubernetes namespace"),
    }),
  }
);
