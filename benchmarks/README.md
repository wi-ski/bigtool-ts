# bigtool-ts Benchmarks

Compare dynamic tool discovery (bigtool-ts) vs loading all tools upfront.

## Quick Start

```bash
# Generate 128 tools (OpenAI's limit)
pnpm benchmark:generate:128

# Run benchmark
OPENAI_API_KEY=sk-... pnpm benchmark

# View detailed report
pnpm benchmark:report
```

## Results Summary

### 128 Tools (OpenAI's Limit)

| Metric | Baseline | bigtool-ts | Improvement |
|--------|----------|------------|-------------|
| Initial context | 2,721 tokens | 500 tokens | **-82%** |
| Tools loaded | 128 | 5.8 avg | **-95%** |
| Accuracy | 83% | 83% | Same |

### 356 Tools (Beyond API Limit)

| Metric | Baseline | bigtool-ts | Result |
|--------|----------|------------|--------|
| Status | ❌ **FAILS** | ✅ Works | — |
| Initial context | N/A | 500 tokens | — |
| Tools loaded | N/A | 5.8 avg | — |

> OpenAI has a hard limit of 128 tools. With 356 tools, the traditional approach **literally cannot work**. bigtool-ts solves this.

## Test Scenarios

1. **Single Tool Precision** — "Create a GitHub PR..."
2. **Multi-Tool Workflow** — Jira + GitHub + Slack
3. **Ambiguous Request** — "Notify the team about deployment"
4. **No Tools Needed** — "What's 2 + 2?"
5. **Tool Discovery** — "What project management tools do you have?"
6. **Email Task** — "Send an email to john@example.com"

## Tool Themes (12 categories)

| Theme | Tools |
|-------|-------|
| AWS/Cloud | 30 |
| Kubernetes | 30 |
| CI/CD | 30 |
| Monitoring | 30 |
| Security | 30 |
| Data/ETL | 30 |
| Support | 30 |
| Marketing | 30 |
| Finance | 30 |
| HR | 30 |
| E-commerce | 32 |
| Project Management | 15 |

## Commands

```bash
# Generate all 356 tools
pnpm benchmark:generate

# Generate 128 tools (for fair comparison)
pnpm benchmark:generate:128

# Run full benchmark (6 scenarios)
pnpm benchmark

# Run quick benchmark (2 scenarios)
pnpm benchmark:quick

# Generate detailed report
pnpm benchmark:report
```

## Architecture

```
benchmarks/
├── agents/
│   ├── baseline-agent.ts    # All tools loaded upfront
│   └── bigtool-agent.ts     # Dynamic discovery
├── harness/
│   ├── metrics.ts           # Token/accuracy/latency collection
│   ├── runner.ts            # Runs both agents on scenarios
│   └── reporter.ts          # Generates comparison tables
├── scenarios/
│   └── index.ts             # 6 test scenarios
├── tools/
│   ├── generate-all.ts      # Master generator
│   ├── themes/              # Tool definitions by category
│   └── generated/           # Generated LangChain tools
└── results/                 # JSON benchmark outputs
```
