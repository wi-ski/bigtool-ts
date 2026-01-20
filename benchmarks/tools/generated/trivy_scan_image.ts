import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const trivy_scan_image = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "trivy_scan_image",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "trivy_scan_image",
    description: "Scan a container image with Trivy",
    schema: z.object({
    image: z.string().describe("Image to scan"),
    severity: z.string().optional().describe("Minimum severity"),
    ignore_unfixed: z.boolean().optional().describe("Ignore unfixed vulnerabilities"),
    }),
  }
);
