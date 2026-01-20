/**
 * Metrics Collection
 * 
 * Captures token usage, accuracy, latency, and efficiency metrics.
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface BenchmarkResult {
  // Identification
  scenario: string;
  agent: "baseline" | "bigtool";
  runId: string;
  timestamp: string;

  // Token Usage
  tokens: {
    initialContext: number;
    toolDefinitions: number;
    totalInput: number;
    totalOutput: number;
    total: number;
  };

  // Accuracy
  accuracy: {
    correctToolSelected: boolean;
    toolSelectionAttempts: number;
    hallucinatedTools: string[];
    taskCompleted: boolean;
    expectedTools: string[];
    actualTools: string[];
  };

  // Latency
  latency: {
    timeToFirstToolMs: number;
    totalTimeMs: number;
    llmCallCount: number;
    searchLatencyMs?: number; // bigtool only
  };

  // Efficiency
  efficiency: {
    toolsLoaded: number;
    toolsUsed: number;
    contextUtilization: number; // toolsUsed / toolsLoaded
  };

  // Raw data
  messages: unknown[];
  toolCalls: { name: string; args: unknown; result: unknown }[];
}

export interface Scenario {
  name: string;
  description: string;
  userMessage: string;
  expectedTools: string[];
  successCriteria: (result: BenchmarkResult) => boolean;
}

// ═══════════════════════════════════════════════════════════════════
// TOKEN COUNTING
// ═══════════════════════════════════════════════════════════════════

/**
 * Estimate token count (rough approximation).
 * Uses ~4 chars per token which is reasonable for English text.
 */
export function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function countToolDefinitionTokens(tools: unknown[]): number {
  // Approximate token count for tool definitions
  const toolsJson = JSON.stringify(tools);
  return countTokens(toolsJson);
}

// ═══════════════════════════════════════════════════════════════════
// METRICS COLLECTOR
// ═══════════════════════════════════════════════════════════════════

export class MetricsCollector {
  private startTime: number = 0;
  private firstToolTime: number | null = null;
  private llmCalls: number = 0;
  private searchLatencies: number[] = [];
  private toolCalls: { name: string; args: unknown; result: unknown }[] = [];
  private messages: unknown[] = [];
  private inputTokens: number = 0;
  private outputTokens: number = 0;

  start() {
    this.startTime = Date.now();
    this.firstToolTime = null;
    this.llmCalls = 0;
    this.searchLatencies = [];
    this.toolCalls = [];
    this.messages = [];
    this.inputTokens = 0;
    this.outputTokens = 0;
  }

  recordLlmCall(inputTokens: number, outputTokens: number) {
    this.llmCalls++;
    this.inputTokens += inputTokens;
    this.outputTokens += outputTokens;
  }

  recordToolCall(name: string, args: unknown, result: unknown) {
    if (this.firstToolTime === null) {
      this.firstToolTime = Date.now();
    }
    this.toolCalls.push({ name, args, result });
  }

  recordSearchLatency(ms: number) {
    this.searchLatencies.push(ms);
  }

  recordMessage(message: unknown) {
    this.messages.push(message);
  }

  finalize(
    scenario: Scenario,
    agentType: "baseline" | "bigtool",
    toolsLoaded: number
  ): BenchmarkResult {
    const endTime = Date.now();
    const totalTimeMs = endTime - this.startTime;
    const timeToFirstToolMs = this.firstToolTime
      ? this.firstToolTime - this.startTime
      : totalTimeMs;

    const actualTools = [...new Set(this.toolCalls.map((tc) => tc.name))];
    const expectedTools = scenario.expectedTools;

    // Check accuracy
    const correctToolSelected = expectedTools.every((et) =>
      actualTools.some((at) => at.includes(et) || et.includes(at))
    );

    // Find hallucinated tools (called but not in expected or available)
    const hallucinatedTools = actualTools.filter(
      (at) => !expectedTools.some((et) => at.includes(et) || et.includes(at))
    );

    const toolsUsed = actualTools.length;
    const contextUtilization = toolsLoaded > 0 ? toolsUsed / toolsLoaded : 0;

    const result: BenchmarkResult = {
      scenario: scenario.name,
      agent: agentType,
      runId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),

      tokens: {
        initialContext: 0, // Will be set by runner
        toolDefinitions: 0, // Will be set by runner
        totalInput: this.inputTokens,
        totalOutput: this.outputTokens,
        total: this.inputTokens + this.outputTokens,
      },

      accuracy: {
        correctToolSelected,
        toolSelectionAttempts: this.toolCalls.length,
        hallucinatedTools,
        taskCompleted: correctToolSelected, // Simplified - success = correct tool
        expectedTools,
        actualTools,
      },

      latency: {
        timeToFirstToolMs,
        totalTimeMs,
        llmCallCount: this.llmCalls,
        searchLatencyMs:
          this.searchLatencies.length > 0
            ? this.searchLatencies.reduce((a, b) => a + b, 0)
            : undefined,
      },

      efficiency: {
        toolsLoaded,
        toolsUsed,
        contextUtilization,
      },

      messages: this.messages,
      toolCalls: this.toolCalls,
    };

    return result;
  }
}
