/**
 * Test Scenarios
 * 
 * Each scenario tests a different aspect of tool selection.
 */

import type { BenchmarkResult } from "../harness/metrics.js";

export interface Scenario {
  name: string;
  description: string;
  userMessage: string;
  expectedTools: string[];
  successCriteria: (result: BenchmarkResult) => boolean;
}

export const SCENARIOS: Scenario[] = [
  // ═══════════════════════════════════════════════════════════════════
  // SCENARIO 1: Single Tool Precision
  // ═══════════════════════════════════════════════════════════════════
  {
    name: "single-tool-github-pr",
    description: "User needs exactly one specific tool",
    userMessage:
      "Create a GitHub PR with title 'Fix login bug' from branch 'fix/login-123' to 'main'",
    expectedTools: ["github_create_pr"],
    successCriteria: (result) =>
      result.accuracy.actualTools.some((t) => t.includes("github_create_pr")),
  },

  // ═══════════════════════════════════════════════════════════════════
  // SCENARIO 2: Multi-Tool Workflow
  // ═══════════════════════════════════════════════════════════════════
  {
    name: "multi-tool-workflow",
    description: "User needs multiple tools from different categories",
    userMessage:
      "Create a Jira ticket for the login bug, then create a GitHub PR linked to it, and post the PR link in the #dev Slack channel",
    expectedTools: ["jira_create_issue", "github_create_pr", "slack_post_message"],
    successCriteria: (result) => {
      const actual = result.accuracy.actualTools;
      return (
        actual.some((t) => t.includes("jira")) &&
        actual.some((t) => t.includes("github")) &&
        actual.some((t) => t.includes("slack"))
      );
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // SCENARIO 3: Ambiguous Request
  // ═══════════════════════════════════════════════════════════════════
  {
    name: "ambiguous-notification",
    description: "User has a vague request that requires tool discovery",
    userMessage: "I need to notify the team about today's deployment",
    expectedTools: ["slack_post_message", "email_send"],
    successCriteria: (result) => {
      const actual = result.accuracy.actualTools;
      return (
        actual.some((t) => t.includes("slack")) ||
        actual.some((t) => t.includes("email"))
      );
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // SCENARIO 4: No Tools Needed
  // ═══════════════════════════════════════════════════════════════════
  {
    name: "no-tools-math",
    description: "User asks something that doesn't need tools",
    userMessage: "What's 2 + 2?",
    expectedTools: [],
    successCriteria: (result) => result.accuracy.actualTools.length === 0,
  },

  // ═══════════════════════════════════════════════════════════════════
  // SCENARIO 5: Tool Discovery
  // ═══════════════════════════════════════════════════════════════════
  {
    name: "tool-discovery",
    description: "User wants to know what's available",
    userMessage: "What tools do you have for project management?",
    expectedTools: [], // Discovery question, not execution
    successCriteria: (result) => {
      // Success if agent mentions jira, linear, or notion
      const messages = result.messages as any[];
      const lastMessage = messages[messages.length - 1];
      const content = typeof lastMessage?.content === "string" 
        ? lastMessage.content.toLowerCase() 
        : "";
      return (
        content.includes("jira") ||
        content.includes("linear") ||
        content.includes("notion")
      );
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // SCENARIO 6: Email Task
  // ═══════════════════════════════════════════════════════════════════
  {
    name: "single-tool-email",
    description: "Simple email task",
    userMessage: "Send an email to john@example.com with subject 'Meeting Tomorrow' and body 'Let's meet at 2pm'",
    expectedTools: ["email_send"],
    successCriteria: (result) =>
      result.accuracy.actualTools.some((t) => t.includes("email_send")),
  },
];

export const SCENARIO_COUNT = SCENARIOS.length;
