/**
 * Results Reporter
 * 
 * Generates comparison tables and visualizations from benchmark results.
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import type { BenchmarkResult } from "./metrics.js";

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ═══════════════════════════════════════════════════════════════════
// REPORT GENERATOR
// ═══════════════════════════════════════════════════════════════════

function generateReport(results: BenchmarkResult[]) {
  const baseline = results.filter((r) => r.agent === "baseline");
  const bigtool = results.filter((r) => r.agent === "bigtool");

  console.log("\n" + "═".repeat(70));
  console.log("  BIGTOOL-TS BENCHMARK REPORT");
  console.log("═".repeat(70) + "\n");

  // ─────────────────────────────────────────────────────────────────
  // OVERVIEW
  // ─────────────────────────────────────────────────────────────────
  console.log("▶ OVERVIEW\n");
  console.log(`  Total runs: ${results.length}`);
  console.log(`  Baseline runs: ${baseline.length}`);
  console.log(`  Bigtool runs: ${bigtool.length}`);
  console.log(`  Scenarios: ${new Set(results.map((r) => r.scenario)).size}`);

  // ─────────────────────────────────────────────────────────────────
  // TOKEN USAGE
  // ─────────────────────────────────────────────────────────────────
  console.log("\n▶ TOKEN USAGE\n");

  const baselineContext = avg(baseline.map((r) => r.tokens.initialContext));
  const bigtoolContext = avg(bigtool.map((r) => r.tokens.initialContext));
  const contextReduction = ((1 - bigtoolContext / baselineContext) * 100).toFixed(1);

  console.log("  | Metric           | Baseline     | bigtool-ts   | Change      |");
  console.log("  |------------------|--------------|--------------|-------------|");
  console.log(
    `  | Initial context  | ${baselineContext.toFixed(0).padStart(10)} | ${bigtoolContext.toFixed(0).padStart(10)} | -${contextReduction}%     |`
  );
  console.log(
    `  | Tool definitions | ${avg(baseline.map((r) => r.tokens.toolDefinitions)).toFixed(0).padStart(10)} | ${avg(bigtool.map((r) => r.tokens.toolDefinitions)).toFixed(0).padStart(10)} |             |`
  );
  console.log(
    `  | Total tokens     | ${avg(baseline.map((r) => r.tokens.total)).toFixed(0).padStart(10)} | ${avg(bigtool.map((r) => r.tokens.total)).toFixed(0).padStart(10)} |             |`
  );

  // ─────────────────────────────────────────────────────────────────
  // ACCURACY
  // ─────────────────────────────────────────────────────────────────
  console.log("\n▶ ACCURACY\n");

  const baselineAccuracy =
    (baseline.filter((r) => r.accuracy.correctToolSelected).length / baseline.length) * 100;
  const bigtoolAccuracy =
    (bigtool.filter((r) => r.accuracy.correctToolSelected).length / bigtool.length) * 100;
  const accuracyChange = (bigtoolAccuracy - baselineAccuracy).toFixed(1);

  console.log("  | Metric              | Baseline | bigtool-ts | Change |");
  console.log("  |---------------------|----------|------------|--------|");
  console.log(
    `  | Correct tool        | ${baselineAccuracy.toFixed(0).padStart(6)}%  | ${bigtoolAccuracy.toFixed(0).padStart(8)}%  | ${Number(accuracyChange) >= 0 ? "+" : ""}${accuracyChange}% |`
  );
  console.log(
    `  | Hallucinated calls  | ${avg(baseline.map((r) => r.accuracy.hallucinatedTools.length)).toFixed(1).padStart(8)} | ${avg(bigtool.map((r) => r.accuracy.hallucinatedTools.length)).toFixed(1).padStart(10)} |        |`
  );

  // ─────────────────────────────────────────────────────────────────
  // EFFICIENCY
  // ─────────────────────────────────────────────────────────────────
  console.log("\n▶ EFFICIENCY\n");

  const baselineTools = avg(baseline.map((r) => r.efficiency.toolsLoaded));
  const bigtoolTools = avg(bigtool.map((r) => r.efficiency.toolsLoaded));
  const toolsReduction = ((1 - bigtoolTools / baselineTools) * 100).toFixed(1);

  console.log("  | Metric              | Baseline | bigtool-ts | Reduction |");
  console.log("  |---------------------|----------|------------|-----------|");
  console.log(
    `  | Tools loaded        | ${baselineTools.toFixed(0).padStart(8)} | ${bigtoolTools.toFixed(1).padStart(10)} | ${toolsReduction}%     |`
  );
  console.log(
    `  | Context utilization | ${(avg(baseline.map((r) => r.efficiency.contextUtilization)) * 100).toFixed(1).padStart(7)}% | ${(avg(bigtool.map((r) => r.efficiency.contextUtilization)) * 100).toFixed(1).padStart(9)}% |           |`
  );

  // ─────────────────────────────────────────────────────────────────
  // PER-SCENARIO BREAKDOWN
  // ─────────────────────────────────────────────────────────────────
  console.log("\n▶ PER-SCENARIO BREAKDOWN\n");

  const scenarios = [...new Set(results.map((r) => r.scenario))];

  for (const scenario of scenarios) {
    const scenarioBaseline = baseline.filter((r) => r.scenario === scenario);
    const scenarioBigtool = bigtool.filter((r) => r.scenario === scenario);

    console.log(`  ${scenario}:`);
    console.log(
      `    Baseline: ${scenarioBaseline[0]?.accuracy.correctToolSelected ? "✓" : "✗"} correct, ${scenarioBaseline[0]?.efficiency.toolsLoaded} tools`
    );
    console.log(
      `    Bigtool:  ${scenarioBigtool[0]?.accuracy.correctToolSelected ? "✓" : "✗"} correct, ${scenarioBigtool[0]?.efficiency.toolsLoaded} tools`
    );
    console.log("");
  }

  // ─────────────────────────────────────────────────────────────────
  // CONCLUSION
  // ─────────────────────────────────────────────────────────────────
  console.log("═".repeat(70));
  console.log("  CONCLUSION");
  console.log("═".repeat(70) + "\n");

  console.log(`  ✓ Context reduction: ${contextReduction}%`);
  console.log(`  ✓ Tool load reduction: ${toolsReduction}%`);
  console.log(`  ✓ Accuracy change: ${Number(accuracyChange) >= 0 ? "+" : ""}${accuracyChange}%`);
  console.log("");
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

function main() {
  const resultsDir = join(import.meta.dirname, "..", "results");
  const files = readdirSync(resultsDir).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.log("No results found. Run the benchmark first:");
    console.log("  pnpm benchmark");
    process.exit(1);
  }

  // Use the most recent results
  const latestFile = files.sort().pop()!;
  const resultsPath = join(resultsDir, latestFile);
  const results: BenchmarkResult[] = JSON.parse(readFileSync(resultsPath, "utf-8"));

  console.log(`Loading results from: ${latestFile}`);
  generateReport(results);
}

main();
