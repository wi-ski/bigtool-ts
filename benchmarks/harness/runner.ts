/**
 * Benchmark Runner
 * 
 * Runs both agents against all scenarios and collects metrics.
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { HumanMessage } from "@langchain/core/messages";
import { createBaselineAgent } from "../agents/baseline-agent.js";
import { createBigtoolAgent } from "../agents/bigtool-agent.js";
import { SCENARIOS } from "../scenarios/index.js";
import { MetricsCollector, BenchmarkResult, countToolDefinitionTokens } from "./metrics.js";
import { allTools, TOOL_COUNT } from "../tools/index.js";

// ═══════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════

const RUNS_PER_SCENARIO = 1; // Increase for statistical significance
const QUICK_MODE = process.argv.includes("--quick");

// ═══════════════════════════════════════════════════════════════════
// RUNNER
// ═══════════════════════════════════════════════════════════════════

async function runBaseline(
  scenario: typeof SCENARIOS[number]
): Promise<BenchmarkResult> {
  console.log(`  [baseline] Running: ${scenario.name}`);
  
  const agent = await createBaselineAgent();
  const collector = new MetricsCollector();
  
  collector.start();
  
  try {
    const result = await agent.invoke({
      messages: [new HumanMessage(scenario.userMessage)],
    });
    
    // Record messages
    for (const msg of result.messages) {
      collector.recordMessage(msg);
      
      // Extract tool calls from AI messages
      if (msg._getType?.() === "ai" && msg.tool_calls?.length) {
        for (const tc of msg.tool_calls) {
          collector.recordToolCall(tc.name, tc.args, null);
        }
      }
    }
    
    // Estimate tokens (rough)
    const inputTokens = JSON.stringify(result.messages).length / 4;
    collector.recordLlmCall(inputTokens, inputTokens * 0.3);
    
  } catch (error) {
    console.error(`  [baseline] Error:`, error);
  }
  
  const metrics = collector.finalize(scenario, "baseline", TOOL_COUNT);
  
  // Set tool definition tokens
  metrics.tokens.toolDefinitions = countToolDefinitionTokens(allTools);
  metrics.tokens.initialContext = metrics.tokens.toolDefinitions;
  
  return metrics;
}

async function runBigtool(
  scenario: typeof SCENARIOS[number]
): Promise<BenchmarkResult> {
  console.log(`  [bigtool] Running: ${scenario.name}`);
  
  const agent = await createBigtoolAgent();
  const collector = new MetricsCollector();
  
  collector.start();
  
  let toolsLoaded = 5; // Default estimate
  
  try {
    const result = await agent.invoke({
      messages: [new HumanMessage(scenario.userMessage)],
    });
    
    // Record messages
    for (const msg of result.messages) {
      collector.recordMessage(msg);
      
      // Extract tool calls
      if (msg._getType?.() === "ai" && msg.tool_calls?.length) {
        for (const tc of msg.tool_calls) {
          collector.recordToolCall(tc.name, tc.args, null);
        }
      }
    }
    
    // Estimate tokens
    const inputTokens = JSON.stringify(result.messages).length / 4;
    collector.recordLlmCall(inputTokens, inputTokens * 0.3);
    
    // Track tools loaded from result if available
    toolsLoaded = (result as any)?.selectedToolIds?.length ?? 5;
    
  } catch (error) {
    console.error(`  [bigtool] Error:`, error);
  }
  
  // For bigtool, only the search_tools tool is loaded initially
  // Selected tools are loaded on-demand
  const metrics = collector.finalize(scenario, "bigtool", toolsLoaded + 1); // +1 for search_tools
  
  // bigtool has minimal initial context (just search_tools)
  metrics.tokens.toolDefinitions = 500; // Approximate for search_tools
  metrics.tokens.initialContext = 500;
  
  return metrics;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  bigtool-ts Benchmark");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Tools: ${TOOL_COUNT}`);
  console.log(`  Scenarios: ${SCENARIOS.length}`);
  console.log(`  Runs per scenario: ${RUNS_PER_SCENARIO}`);
  console.log(`  Mode: ${QUICK_MODE ? "quick" : "full"}`);
  console.log("");
  
  const results: BenchmarkResult[] = [];
  const scenarios = QUICK_MODE ? SCENARIOS.slice(0, 2) : SCENARIOS;
  
  for (const scenario of scenarios) {
    console.log(`\n▶ Scenario: ${scenario.name}`);
    console.log(`  "${scenario.userMessage.slice(0, 50)}..."`);
    
    for (let run = 0; run < RUNS_PER_SCENARIO; run++) {
      // Run baseline
      const baselineResult = await runBaseline(scenario);
      results.push(baselineResult);
      
      // Run bigtool
      const bigtoolResult = await runBigtool(scenario);
      results.push(bigtoolResult);
      
      // Quick comparison
      console.log(`\n  Run ${run + 1} comparison:`);
      console.log(`    Initial context: ${baselineResult.tokens.initialContext} vs ${bigtoolResult.tokens.initialContext} tokens`);
      console.log(`    Tools loaded: ${baselineResult.efficiency.toolsLoaded} vs ${bigtoolResult.efficiency.toolsLoaded}`);
      console.log(`    Correct tool: ${baselineResult.accuracy.correctToolSelected} vs ${bigtoolResult.accuracy.correctToolSelected}`);
    }
  }
  
  // Save results
  const resultsDir = join(import.meta.dirname, "..", "results");
  mkdirSync(resultsDir, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const resultsPath = join(resultsDir, `${timestamp}.json`);
  writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  console.log(`\n\n✅ Results saved to: ${resultsPath}`);
  
  // Print summary
  printSummary(results);
}

function printSummary(results: BenchmarkResult[]) {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("═══════════════════════════════════════════════════════════\n");
  
  const baselineResults = results.filter((r) => r.agent === "baseline");
  const bigtoolResults = results.filter((r) => r.agent === "bigtool");
  
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  
  const baselineAvgContext = avg(baselineResults.map((r) => r.tokens.initialContext));
  const bigtoolAvgContext = avg(bigtoolResults.map((r) => r.tokens.initialContext));
  
  const baselineAccuracy = baselineResults.filter((r) => r.accuracy.correctToolSelected).length / baselineResults.length;
  const bigtoolAccuracy = bigtoolResults.filter((r) => r.accuracy.correctToolSelected).length / bigtoolResults.length;
  
  const baselineAvgTools = avg(baselineResults.map((r) => r.efficiency.toolsLoaded));
  const bigtoolAvgTools = avg(bigtoolResults.map((r) => r.efficiency.toolsLoaded));
  
  console.log("  | Metric              | Baseline    | bigtool-ts  | Improvement |");
  console.log("  |---------------------|-------------|-------------|-------------|");
  console.log(`  | Initial context     | ${baselineAvgContext.toFixed(0).padStart(8)} tk | ${bigtoolAvgContext.toFixed(0).padStart(8)} tk | ${((1 - bigtoolAvgContext / baselineAvgContext) * 100).toFixed(0)}%         |`);
  console.log(`  | Tool accuracy       | ${(baselineAccuracy * 100).toFixed(0).padStart(9)}% | ${(bigtoolAccuracy * 100).toFixed(0).padStart(9)}% | ${bigtoolAccuracy > baselineAccuracy ? "+" : ""}${((bigtoolAccuracy - baselineAccuracy) * 100).toFixed(0)}%        |`);
  console.log(`  | Tools loaded        | ${baselineAvgTools.toFixed(0).padStart(11)} | ${bigtoolAvgTools.toFixed(0).padStart(11)} | ${((1 - bigtoolAvgTools / baselineAvgTools) * 100).toFixed(0)}%         |`);
  console.log("");
}

main().catch(console.error);
