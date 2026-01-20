/**
 * Master Tool Generator
 * 
 * Combines all themed tools and generates LangChain tool files.
 * Target: 356 tools total
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// Import all theme definitions
import { AWS_TOOLS } from "./themes/aws.js";
import { KUBERNETES_TOOLS } from "./themes/kubernetes.js";
import { CICD_TOOLS } from "./themes/cicd.js";
import { MONITORING_TOOLS } from "./themes/monitoring.js";
import { SECURITY_TOOLS } from "./themes/security.js";
import { DATA_TOOLS } from "./themes/data.js";
import { SUPPORT_TOOLS } from "./themes/support.js";
import { MARKETING_TOOLS } from "./themes/marketing.js";
import { FINANCE_TOOLS } from "./themes/finance.js";
import { HR_TOOLS } from "./themes/hr.js";
import { ECOMMERCE_TOOLS } from "./themes/ecommerce.js";
import { PROJECT_TOOLS } from "./themes/project.js";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface ToolParam {
  name: string;
  type: "string" | "number" | "boolean" | "array";
  desc: string;
  required?: boolean;
}

interface ToolDef {
  name: string;
  desc: string;
  params: ToolParam[];
}

// ═══════════════════════════════════════════════════════════════════
// GENERATOR
// ═══════════════════════════════════════════════════════════════════

function generateToolCode(toolDef: ToolDef): string {
  const zodSchema = toolDef.params
    .map((p) => {
      let zodType: string;
      switch (p.type) {
        case "string":
          zodType = "z.string()";
          break;
        case "number":
          zodType = "z.number()";
          break;
        case "boolean":
          zodType = "z.boolean()";
          break;
        case "array":
          zodType = "z.array(z.string())";
          break;
        default:
          zodType = "z.unknown()";
      }
      if (!p.required) {
        zodType += ".optional()";
      }
      return `    ${p.name}: ${zodType}.describe("${p.desc}"),`;
    })
    .join("\n");

  return `
import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const ${toolDef.name} = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "${toolDef.name}",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "${toolDef.name}",
    description: "${toolDef.desc}",
    schema: z.object({
${zodSchema}
    }),
  }
);
`;
}

function generateIndexFile(toolNames: string[]): string {
  const imports = toolNames
    .map((t) => `import { ${t} } from "./generated/${t}.js";`)
    .join("\n");

  const exports = `export const allTools = [\n  ${toolNames.join(",\n  ")},\n];`;

  return `${imports}\n\n${exports}\n\nexport const TOOL_COUNT = ${toolNames.length};\n`;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

function main() {
  const generatedDir = join(import.meta.dirname, "generated");
  mkdirSync(generatedDir, { recursive: true });

  // Check for --limit flag
  const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
  const toolLimit = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;
  
  // Combine all themes
  const allThemes: Record<string, ToolDef[]> = {
    // Original tools (kept for compatibility)
    github: [
      { name: "github_create_pr", desc: "Create a new pull request on GitHub", params: [
        { name: "title", type: "string", desc: "PR title", required: true },
        { name: "body", type: "string", desc: "PR description" },
        { name: "head", type: "string", desc: "Source branch", required: true },
        { name: "base", type: "string", desc: "Target branch", required: true },
      ]},
      { name: "github_list_prs", desc: "List pull requests in a repository", params: [
        { name: "state", type: "string", desc: "Filter by state" },
        { name: "limit", type: "number", desc: "Maximum results" },
      ]},
      { name: "github_merge_pr", desc: "Merge a pull request", params: [
        { name: "pr_number", type: "number", desc: "PR number", required: true },
        { name: "merge_method", type: "string", desc: "Merge method" },
      ]},
      { name: "github_create_issue", desc: "Create a new GitHub issue", params: [
        { name: "title", type: "string", desc: "Issue title", required: true },
        { name: "body", type: "string", desc: "Issue description" },
        { name: "labels", type: "array", desc: "Labels" },
      ]},
    ],
    slack: [
      { name: "slack_post_message", desc: "Post a message to a Slack channel", params: [
        { name: "channel", type: "string", desc: "Channel name or ID", required: true },
        { name: "text", type: "string", desc: "Message text", required: true },
      ]},
      { name: "slack_send_dm", desc: "Send a direct message", params: [
        { name: "user", type: "string", desc: "User ID", required: true },
        { name: "text", type: "string", desc: "Message", required: true },
      ]},
    ],
    jira: [
      { name: "jira_create_issue", desc: "Create a new Jira issue", params: [
        { name: "project", type: "string", desc: "Project key", required: true },
        { name: "summary", type: "string", desc: "Issue summary", required: true },
        { name: "description", type: "string", desc: "Description" },
        { name: "issue_type", type: "string", desc: "Issue type" },
      ]},
      { name: "jira_update_issue", desc: "Update a Jira issue", params: [
        { name: "issue_key", type: "string", desc: "Issue key", required: true },
        { name: "status", type: "string", desc: "New status" },
      ]},
    ],
    email: [
      { name: "email_send", desc: "Send an email", params: [
        { name: "to", type: "string", desc: "Recipient", required: true },
        { name: "subject", type: "string", desc: "Subject", required: true },
        { name: "body", type: "string", desc: "Body", required: true },
      ]},
    ],
    // New themed tools - take first 10 from each to stay under limit
    aws: AWS_TOOLS.slice(0, toolLimit === 128 ? 10 : 30),
    kubernetes: KUBERNETES_TOOLS.slice(0, toolLimit === 128 ? 10 : 30),
    cicd: CICD_TOOLS.slice(0, toolLimit === 128 ? 10 : 30),
    monitoring: MONITORING_TOOLS.slice(0, toolLimit === 128 ? 10 : 30),
    security: SECURITY_TOOLS.slice(0, toolLimit === 128 ? 10 : 30),
    data: DATA_TOOLS.slice(0, toolLimit === 128 ? 10 : 30),
    support: SUPPORT_TOOLS.slice(0, toolLimit === 128 ? 10 : 30),
    marketing: MARKETING_TOOLS.slice(0, toolLimit === 128 ? 10 : 30),
    finance: FINANCE_TOOLS.slice(0, toolLimit === 128 ? 10 : 30),
    hr: HR_TOOLS.slice(0, toolLimit === 128 ? 9 : 30),
    ecommerce: ECOMMERCE_TOOLS.slice(0, toolLimit === 128 ? 10 : 32),
    project: PROJECT_TOOLS.slice(0, toolLimit === 128 ? 10 : 15),
  };

  const toolNames: string[] = [];

  for (const [theme, tools] of Object.entries(allThemes)) {
    console.log(`\n▶ Generating ${theme} tools (${tools.length})...`);
    
    for (const toolDef of tools) {
      const code = generateToolCode(toolDef);
      const filePath = join(generatedDir, `${toolDef.name}.ts`);
      writeFileSync(filePath, code.trim() + "\n");
      toolNames.push(toolDef.name);
    }
  }

  // Generate index file
  const indexCode = generateIndexFile(toolNames);
  writeFileSync(join(import.meta.dirname, "index.ts"), indexCode);

  console.log(`\n${"═".repeat(50)}`);
  console.log(`✅ Generated ${toolNames.length} tools`);
  console.log(`${"═".repeat(50)}`);
  
  // Print breakdown
  console.log("\nBreakdown by theme:");
  for (const [theme, tools] of Object.entries(allThemes)) {
    console.log(`  ${theme.padEnd(15)} ${tools.length} tools`);
  }
}

main();
