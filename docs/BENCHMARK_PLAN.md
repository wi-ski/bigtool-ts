# bigtool-ts Benchmark Plan

**Goal:** Quantify the benefits of dynamic tool discovery vs loading all tools upfront.

## Test Setup

### Location
```
.source-references/bigtool-benchmark/
├── agents/
│   ├── baseline-agent.ts      # All tools loaded upfront
│   └── bigtool-agent.ts       # Dynamic discovery with bigtool-ts
├── tools/
│   ├── index.ts               # Export all tools
│   └── generated/             # 100+ generated tools
├── scenarios/
│   ├── single-tool.ts         # User needs 1 specific tool
│   ├── multi-tool.ts          # User needs 3-5 tools
│   ├── exploration.ts         # User doesn't know what they need
│   └── irrelevant.ts          # Task needs no tools
├── harness/
│   ├── runner.ts              # Runs both agents on same scenario
│   ├── metrics.ts             # Collects measurements
│   └── reporter.ts            # Outputs comparison table
├── results/
│   └── [timestamp].json       # Raw results
└── package.json
```

### Tool Generation

Generate 100-500 synthetic tools with realistic metadata:

```typescript
// Categories
const CATEGORIES = [
  'github', 'slack', 'jira', 'notion', 'linear',
  'database', 'email', 'calendar', 'file', 'search',
  'analytics', 'payment', 'shipping', 'inventory', 'crm'
];

// Per category: 5-20 tools
// Example: github_create_pr, github_list_prs, github_merge_pr, ...
```

Each tool:
- Has realistic name, description, parameters
- Actually executes (returns mock data)
- ~200-500 tokens in schema definition

---

## Metrics to Capture

### 1. Token Usage

| Metric | Description |
|--------|-------------|
| `initial_context_tokens` | Tokens used before first user message |
| `tool_definition_tokens` | Tokens for tool schemas specifically |
| `total_input_tokens` | All tokens sent to LLM across conversation |
| `total_output_tokens` | All tokens received from LLM |
| `total_tokens` | Grand total |

### 2. Accuracy

| Metric | Description |
|--------|-------------|
| `correct_tool_selected` | Did agent pick the right tool(s)? |
| `tool_selection_attempts` | How many tries before correct tool? |
| `hallucinated_tools` | Did agent try to call non-existent tools? |
| `task_completed` | Was the overall task successful? |

### 3. Latency

| Metric | Description |
|--------|-------------|
| `time_to_first_tool_call` | Time from user message to first tool execution |
| `total_conversation_time` | Time to complete entire task |
| `llm_call_count` | Number of LLM roundtrips |
| `search_latency_ms` | (bigtool only) Time spent searching |

### 4. Context Efficiency

| Metric | Description |
|--------|-------------|
| `tools_loaded` | Number of tools in context at task end |
| `tools_used` | Number of tools actually called |
| `context_utilization` | `tools_used / tools_loaded` ratio |

---

## Test Scenarios

### Scenario 1: Single Tool Precision
**User:** "Create a GitHub PR with title 'Fix bug' from branch 'fix/bug-123' to 'main'"

- **Expected:** Agent calls `github_create_pr`
- **Measures:** Can agent find the needle in 100+ tools?

### Scenario 2: Multi-Tool Workflow
**User:** "Create a Jira ticket for the bug, then create a GitHub PR linked to it, then post in Slack"

- **Expected:** Agent calls `jira_create_issue`, `github_create_pr`, `slack_post_message`
- **Measures:** Can agent coordinate multiple tools from different categories?

### Scenario 3: Ambiguous Request
**User:** "I need to notify the team about the deployment"

- **Expected:** Agent searches, finds notification tools, picks appropriate one
- **Measures:** Does search help with vague requests?

### Scenario 4: No Tools Needed
**User:** "What's 2 + 2?"

- **Expected:** Agent answers directly without tool calls
- **Measures:** Does having 100+ tools cause unnecessary tool calls?

### Scenario 5: Tool Discovery
**User:** "What can you help me with for project management?"

- **Expected:** Agent searches and lists relevant tools
- **Measures:** Can bigtool agent discover without loading all?

### Scenario 6: High Tool Count Stress Test
**User:** "Send an email to john@example.com"

- **Tool counts:** 50, 100, 200, 500
- **Measures:** How does accuracy degrade with tool count?

---

## Implementation Plan

### Phase 1: Setup (Day 1)
- [ ] Create benchmark repo structure
- [ ] Implement tool generator
- [ ] Generate 100 tools across 10 categories
- [ ] Create baseline agent (all tools upfront)
- [ ] Create bigtool agent (dynamic discovery)

### Phase 2: Harness (Day 1-2)
- [ ] Implement test runner
- [ ] Implement metrics collector (token counting, timing)
- [ ] Implement scenario loader
- [ ] Add result persistence (JSON)

### Phase 3: Scenarios (Day 2)
- [ ] Implement all 6 scenarios
- [ ] Add ground truth annotations (expected tools)
- [ ] Add accuracy checker

### Phase 4: Run & Analyze (Day 2-3)
- [ ] Run full benchmark suite
- [ ] Generate comparison tables
- [ ] Create visualizations (if useful)
- [ ] Document findings

---

## Expected Outcomes

Based on Anthropic's published numbers and similar benchmarks:

| Metric | Baseline (100 tools) | bigtool-ts | Improvement |
|--------|---------------------|------------|-------------|
| Initial context tokens | ~50,000 | ~5,000 | **~90%** |
| Tool selection accuracy | ~50-60% | ~75-85% | **+25-30%** |
| Hallucinated tool calls | Higher | Lower | Better |
| Context utilization | ~5% | ~60%+ | **12x** |

---

## Code Sketches

### Baseline Agent

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { allTools } from "../tools";

export const baselineAgent = createReactAgent({
  llm: new ChatOpenAI({ model: "gpt-4o" }),
  tools: allTools, // All 100+ tools loaded upfront
});
```

### bigtool Agent

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, LocalSource, OramaSearch } from "bigtool-ts";
import { allTools } from "../tools";

export const bigtoolAgent = await createAgent({
  llm: new ChatOpenAI({ model: "gpt-4o" }),
  tools: allTools,
  search: new OramaSearch({ mode: "bm25" }),
});
```

### Metrics Collector

```typescript
interface BenchmarkResult {
  scenario: string;
  agent: "baseline" | "bigtool";
  
  // Tokens
  initialContextTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  
  // Accuracy
  correctToolSelected: boolean;
  toolSelectionAttempts: number;
  hallucinatedTools: string[];
  taskCompleted: boolean;
  
  // Latency
  timeToFirstToolMs: number;
  totalTimeMs: number;
  llmCallCount: number;
  
  // Efficiency
  toolsLoaded: number;
  toolsUsed: number;
}
```

### Runner

```typescript
async function runBenchmark(scenario: Scenario): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  
  // Run baseline
  const baselineResult = await runWithMetrics(baselineAgent, scenario);
  results.push({ ...baselineResult, agent: "baseline" });
  
  // Run bigtool
  const bigtoolResult = await runWithMetrics(bigtoolAgent, scenario);
  results.push({ ...bigtoolResult, agent: "bigtool" });
  
  return results;
}
```

---

## Open Questions

1. **LLM choice:** GPT-4o? Claude? Both?
2. **Runs per scenario:** 3-5 for statistical significance?
3. **Token counting:** Use tiktoken or LLM's reported usage?
4. **Cost tracking:** Worth tracking $ spent per scenario?

---

## Next Steps

1. Create the benchmark repo structure
2. Implement tool generator
3. Build the test harness
4. Run initial tests with 50 tools
5. Scale up to 100-500 tools
