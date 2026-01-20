/**
 * Tool Generator
 * 
 * Generates synthetic tools for benchmarking.
 * Each tool has realistic metadata and a mock implementation.
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// ═══════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS BY CATEGORY
// ═══════════════════════════════════════════════════════════════════

interface ToolTemplate {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: "string" | "number" | "boolean" | "array";
    description: string;
    required?: boolean;
  }[];
}

const TOOL_TEMPLATES: Record<string, ToolTemplate[]> = {
  github: [
    {
      name: "create_pr",
      description: "Create a new pull request on GitHub",
      parameters: [
        { name: "title", type: "string", description: "PR title", required: true },
        { name: "body", type: "string", description: "PR description" },
        { name: "head", type: "string", description: "Source branch", required: true },
        { name: "base", type: "string", description: "Target branch", required: true },
        { name: "draft", type: "boolean", description: "Create as draft" },
      ],
    },
    {
      name: "list_prs",
      description: "List pull requests in a repository",
      parameters: [
        { name: "state", type: "string", description: "Filter by state (open, closed, all)" },
        { name: "limit", type: "number", description: "Maximum results" },
      ],
    },
    {
      name: "merge_pr",
      description: "Merge a pull request",
      parameters: [
        { name: "pr_number", type: "number", description: "PR number", required: true },
        { name: "merge_method", type: "string", description: "Merge method (merge, squash, rebase)" },
      ],
    },
    {
      name: "create_issue",
      description: "Create a new GitHub issue",
      parameters: [
        { name: "title", type: "string", description: "Issue title", required: true },
        { name: "body", type: "string", description: "Issue description" },
        { name: "labels", type: "array", description: "Labels to add" },
      ],
    },
    {
      name: "list_issues",
      description: "List issues in a repository",
      parameters: [
        { name: "state", type: "string", description: "Filter by state" },
        { name: "labels", type: "array", description: "Filter by labels" },
      ],
    },
    {
      name: "close_issue",
      description: "Close a GitHub issue",
      parameters: [
        { name: "issue_number", type: "number", description: "Issue number", required: true },
      ],
    },
    {
      name: "create_branch",
      description: "Create a new branch in a repository",
      parameters: [
        { name: "branch_name", type: "string", description: "New branch name", required: true },
        { name: "from_branch", type: "string", description: "Source branch" },
      ],
    },
    {
      name: "delete_branch",
      description: "Delete a branch from a repository",
      parameters: [
        { name: "branch_name", type: "string", description: "Branch to delete", required: true },
      ],
    },
  ],
  slack: [
    {
      name: "post_message",
      description: "Post a message to a Slack channel",
      parameters: [
        { name: "channel", type: "string", description: "Channel name or ID", required: true },
        { name: "text", type: "string", description: "Message text", required: true },
        { name: "thread_ts", type: "string", description: "Thread timestamp for replies" },
      ],
    },
    {
      name: "list_channels",
      description: "List available Slack channels",
      parameters: [
        { name: "types", type: "string", description: "Channel types to include" },
      ],
    },
    {
      name: "send_dm",
      description: "Send a direct message to a user",
      parameters: [
        { name: "user", type: "string", description: "User ID or email", required: true },
        { name: "text", type: "string", description: "Message text", required: true },
      ],
    },
    {
      name: "add_reaction",
      description: "Add a reaction emoji to a message",
      parameters: [
        { name: "channel", type: "string", description: "Channel ID", required: true },
        { name: "timestamp", type: "string", description: "Message timestamp", required: true },
        { name: "emoji", type: "string", description: "Emoji name", required: true },
      ],
    },
    {
      name: "upload_file",
      description: "Upload a file to Slack",
      parameters: [
        { name: "channels", type: "array", description: "Channels to share to" },
        { name: "content", type: "string", description: "File content", required: true },
        { name: "filename", type: "string", description: "Filename", required: true },
      ],
    },
  ],
  jira: [
    {
      name: "create_issue",
      description: "Create a new Jira issue",
      parameters: [
        { name: "project", type: "string", description: "Project key", required: true },
        { name: "summary", type: "string", description: "Issue summary", required: true },
        { name: "description", type: "string", description: "Issue description" },
        { name: "issue_type", type: "string", description: "Issue type (Bug, Task, Story)" },
        { name: "priority", type: "string", description: "Priority level" },
      ],
    },
    {
      name: "update_issue",
      description: "Update an existing Jira issue",
      parameters: [
        { name: "issue_key", type: "string", description: "Issue key (e.g., PROJ-123)", required: true },
        { name: "summary", type: "string", description: "New summary" },
        { name: "description", type: "string", description: "New description" },
        { name: "status", type: "string", description: "New status" },
      ],
    },
    {
      name: "search_issues",
      description: "Search for Jira issues using JQL",
      parameters: [
        { name: "jql", type: "string", description: "JQL query", required: true },
        { name: "max_results", type: "number", description: "Maximum results" },
      ],
    },
    {
      name: "add_comment",
      description: "Add a comment to a Jira issue",
      parameters: [
        { name: "issue_key", type: "string", description: "Issue key", required: true },
        { name: "body", type: "string", description: "Comment text", required: true },
      ],
    },
    {
      name: "assign_issue",
      description: "Assign a Jira issue to a user",
      parameters: [
        { name: "issue_key", type: "string", description: "Issue key", required: true },
        { name: "assignee", type: "string", description: "User to assign", required: true },
      ],
    },
    {
      name: "transition_issue",
      description: "Transition a Jira issue to a new status",
      parameters: [
        { name: "issue_key", type: "string", description: "Issue key", required: true },
        { name: "transition", type: "string", description: "Transition name", required: true },
      ],
    },
  ],
  notion: [
    {
      name: "create_page",
      description: "Create a new Notion page",
      parameters: [
        { name: "parent_id", type: "string", description: "Parent page or database ID", required: true },
        { name: "title", type: "string", description: "Page title", required: true },
        { name: "content", type: "string", description: "Page content in markdown" },
      ],
    },
    {
      name: "update_page",
      description: "Update an existing Notion page",
      parameters: [
        { name: "page_id", type: "string", description: "Page ID", required: true },
        { name: "properties", type: "string", description: "Properties to update as JSON" },
      ],
    },
    {
      name: "search_pages",
      description: "Search for Notion pages",
      parameters: [
        { name: "query", type: "string", description: "Search query", required: true },
      ],
    },
    {
      name: "create_database",
      description: "Create a new Notion database",
      parameters: [
        { name: "parent_id", type: "string", description: "Parent page ID", required: true },
        { name: "title", type: "string", description: "Database title", required: true },
        { name: "properties", type: "string", description: "Property schema as JSON" },
      ],
    },
    {
      name: "query_database",
      description: "Query a Notion database",
      parameters: [
        { name: "database_id", type: "string", description: "Database ID", required: true },
        { name: "filter", type: "string", description: "Filter as JSON" },
        { name: "sorts", type: "string", description: "Sort order as JSON" },
      ],
    },
  ],
  linear: [
    {
      name: "create_issue",
      description: "Create a new Linear issue",
      parameters: [
        { name: "team_id", type: "string", description: "Team ID", required: true },
        { name: "title", type: "string", description: "Issue title", required: true },
        { name: "description", type: "string", description: "Issue description" },
        { name: "priority", type: "number", description: "Priority (0-4)" },
      ],
    },
    {
      name: "update_issue",
      description: "Update a Linear issue",
      parameters: [
        { name: "issue_id", type: "string", description: "Issue ID", required: true },
        { name: "title", type: "string", description: "New title" },
        { name: "state_id", type: "string", description: "New state ID" },
      ],
    },
    {
      name: "list_issues",
      description: "List Linear issues",
      parameters: [
        { name: "team_id", type: "string", description: "Filter by team" },
        { name: "state", type: "string", description: "Filter by state" },
      ],
    },
    {
      name: "add_comment",
      description: "Add a comment to a Linear issue",
      parameters: [
        { name: "issue_id", type: "string", description: "Issue ID", required: true },
        { name: "body", type: "string", description: "Comment text", required: true },
      ],
    },
  ],
  database: [
    {
      name: "query",
      description: "Execute a SQL query on the database",
      parameters: [
        { name: "sql", type: "string", description: "SQL query to execute", required: true },
        { name: "params", type: "array", description: "Query parameters" },
      ],
    },
    {
      name: "insert",
      description: "Insert a record into a table",
      parameters: [
        { name: "table", type: "string", description: "Table name", required: true },
        { name: "data", type: "string", description: "Record data as JSON", required: true },
      ],
    },
    {
      name: "update",
      description: "Update records in a table",
      parameters: [
        { name: "table", type: "string", description: "Table name", required: true },
        { name: "data", type: "string", description: "Update data as JSON", required: true },
        { name: "where", type: "string", description: "WHERE clause", required: true },
      ],
    },
    {
      name: "delete",
      description: "Delete records from a table",
      parameters: [
        { name: "table", type: "string", description: "Table name", required: true },
        { name: "where", type: "string", description: "WHERE clause", required: true },
      ],
    },
    {
      name: "list_tables",
      description: "List all tables in the database",
      parameters: [],
    },
    {
      name: "describe_table",
      description: "Get schema information for a table",
      parameters: [
        { name: "table", type: "string", description: "Table name", required: true },
      ],
    },
  ],
  email: [
    {
      name: "send",
      description: "Send an email",
      parameters: [
        { name: "to", type: "string", description: "Recipient email", required: true },
        { name: "subject", type: "string", description: "Email subject", required: true },
        { name: "body", type: "string", description: "Email body", required: true },
        { name: "cc", type: "array", description: "CC recipients" },
        { name: "bcc", type: "array", description: "BCC recipients" },
      ],
    },
    {
      name: "search",
      description: "Search emails",
      parameters: [
        { name: "query", type: "string", description: "Search query", required: true },
        { name: "limit", type: "number", description: "Maximum results" },
      ],
    },
    {
      name: "get_thread",
      description: "Get an email thread",
      parameters: [
        { name: "thread_id", type: "string", description: "Thread ID", required: true },
      ],
    },
    {
      name: "reply",
      description: "Reply to an email",
      parameters: [
        { name: "message_id", type: "string", description: "Message to reply to", required: true },
        { name: "body", type: "string", description: "Reply body", required: true },
      ],
    },
    {
      name: "create_draft",
      description: "Create an email draft",
      parameters: [
        { name: "to", type: "string", description: "Recipient email", required: true },
        { name: "subject", type: "string", description: "Email subject", required: true },
        { name: "body", type: "string", description: "Email body", required: true },
      ],
    },
  ],
  calendar: [
    {
      name: "create_event",
      description: "Create a calendar event",
      parameters: [
        { name: "title", type: "string", description: "Event title", required: true },
        { name: "start", type: "string", description: "Start time (ISO 8601)", required: true },
        { name: "end", type: "string", description: "End time (ISO 8601)", required: true },
        { name: "attendees", type: "array", description: "Attendee emails" },
        { name: "location", type: "string", description: "Event location" },
      ],
    },
    {
      name: "list_events",
      description: "List calendar events",
      parameters: [
        { name: "start", type: "string", description: "Start of range" },
        { name: "end", type: "string", description: "End of range" },
      ],
    },
    {
      name: "update_event",
      description: "Update a calendar event",
      parameters: [
        { name: "event_id", type: "string", description: "Event ID", required: true },
        { name: "title", type: "string", description: "New title" },
        { name: "start", type: "string", description: "New start time" },
        { name: "end", type: "string", description: "New end time" },
      ],
    },
    {
      name: "delete_event",
      description: "Delete a calendar event",
      parameters: [
        { name: "event_id", type: "string", description: "Event ID", required: true },
      ],
    },
    {
      name: "find_free_time",
      description: "Find available time slots",
      parameters: [
        { name: "attendees", type: "array", description: "Attendee emails", required: true },
        { name: "duration_minutes", type: "number", description: "Meeting duration", required: true },
        { name: "range_days", type: "number", description: "Days to search" },
      ],
    },
  ],
  file: [
    {
      name: "read",
      description: "Read a file's contents",
      parameters: [
        { name: "path", type: "string", description: "File path", required: true },
      ],
    },
    {
      name: "write",
      description: "Write content to a file",
      parameters: [
        { name: "path", type: "string", description: "File path", required: true },
        { name: "content", type: "string", description: "File content", required: true },
      ],
    },
    {
      name: "list",
      description: "List files in a directory",
      parameters: [
        { name: "path", type: "string", description: "Directory path", required: true },
        { name: "recursive", type: "boolean", description: "Include subdirectories" },
      ],
    },
    {
      name: "delete",
      description: "Delete a file",
      parameters: [
        { name: "path", type: "string", description: "File path", required: true },
      ],
    },
    {
      name: "move",
      description: "Move or rename a file",
      parameters: [
        { name: "source", type: "string", description: "Source path", required: true },
        { name: "destination", type: "string", description: "Destination path", required: true },
      ],
    },
    {
      name: "copy",
      description: "Copy a file",
      parameters: [
        { name: "source", type: "string", description: "Source path", required: true },
        { name: "destination", type: "string", description: "Destination path", required: true },
      ],
    },
  ],
  analytics: [
    {
      name: "track_event",
      description: "Track an analytics event",
      parameters: [
        { name: "event", type: "string", description: "Event name", required: true },
        { name: "properties", type: "string", description: "Event properties as JSON" },
        { name: "user_id", type: "string", description: "User identifier" },
      ],
    },
    {
      name: "get_metrics",
      description: "Get analytics metrics",
      parameters: [
        { name: "metric", type: "string", description: "Metric name", required: true },
        { name: "start_date", type: "string", description: "Start date" },
        { name: "end_date", type: "string", description: "End date" },
        { name: "granularity", type: "string", description: "Time granularity (hour, day, week)" },
      ],
    },
    {
      name: "create_report",
      description: "Create an analytics report",
      parameters: [
        { name: "name", type: "string", description: "Report name", required: true },
        { name: "metrics", type: "array", description: "Metrics to include", required: true },
        { name: "dimensions", type: "array", description: "Dimensions to group by" },
      ],
    },
    {
      name: "get_funnel",
      description: "Get funnel analysis",
      parameters: [
        { name: "steps", type: "array", description: "Funnel steps", required: true },
        { name: "date_range", type: "string", description: "Date range" },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// GENERATOR
// ═══════════════════════════════════════════════════════════════════

function generateToolCode(category: string, template: ToolTemplate): string {
  const toolName = `${category}_${template.name}`;
  const className = toolName
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");

  const requiredParams = template.parameters.filter((p) => p.required);
  const optionalParams = template.parameters.filter((p) => !p.required);

  const zodSchema = template.parameters
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
      return `    ${p.name}: ${zodType}.describe("${p.description}"),`;
    })
    .join("\n");

  return `
import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const ${toolName} = tool(
  async (input) => {
    // Mock implementation
    return JSON.stringify({
      success: true,
      tool: "${toolName}",
      input,
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "${toolName}",
    description: "${template.description}",
    schema: z.object({
${zodSchema}
    }),
  }
);
`;
}

function generateIndexFile(tools: string[]): string {
  const imports = tools
    .map((t) => `import { ${t} } from "./generated/${t}.js";`)
    .join("\n");

  const exports = `export const allTools = [\n  ${tools.join(",\n  ")},\n];`;

  return `${imports}\n\n${exports}\n\nexport const TOOL_COUNT = ${tools.length};\n`;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

function main() {
  const generatedDir = join(import.meta.dirname, "generated");
  mkdirSync(generatedDir, { recursive: true });

  const toolNames: string[] = [];

  for (const [category, templates] of Object.entries(TOOL_TEMPLATES)) {
    for (const template of templates) {
      const toolName = `${category}_${template.name}`;
      const code = generateToolCode(category, template);
      const filePath = join(generatedDir, `${toolName}.ts`);
      writeFileSync(filePath, code.trim() + "\n");
      toolNames.push(toolName);
      console.log(`Generated: ${toolName}`);
    }
  }

  // Generate index file
  const indexCode = generateIndexFile(toolNames);
  writeFileSync(join(import.meta.dirname, "index.ts"), indexCode);

  console.log(`\n✅ Generated ${toolNames.length} tools`);
}

main();
