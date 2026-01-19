# bigtool-ts

Dynamic tool discovery for AI agents. Search and load tools on-demand instead of loading all tools upfront.

Works with **LangGraph**, **Inngest AgentKit**, **Vercel AI SDK**, **Mastra**, and **Agent Protocol**.

[![npm version](https://img.shields.io/npm/v/bigtool-ts)](https://www.npmjs.com/package/bigtool-ts)
[![license](https://img.shields.io/npm/l/bigtool-ts)](https://github.com/wi-ski/bigtool-ts/blob/main/LICENSE)

## Table of Contents

- [The Problem](#the-problem)
- [Quick Start](#quick-start)
- [Framework Integrations](#framework-integrations)
  - [LangGraph](#langgraph)
  - [Inngest AgentKit](#inngest-agentkit)
  - [Vercel AI SDK](#vercel-ai-sdk)
  - [Mastra](#mastra)
  - [Agent Protocol](#agent-protocol)
- [Features](#features)
- [API Reference](#api-reference)
  - [createAgent](#createagentoptions)
  - [LocalSource](#localsource)
  - [MCPSource / createMCPSource](#mcpsource--createmcpsource)
  - [DynamicSource](#dynamicsource)
  - [withMetadata](#withmetadatatool-enhancement)
  - [OramaSearch](#oramasearch)
- [Advanced Usage](#advanced-usage)
- [Architecture](#architecture)

## The Problem

When you have 100s or 1000s of tools, loading them all into context explodes the context window and degrades LLM performance. The model struggles to pick the right tool when presented with too many options.

**bigtool-ts** solves this by giving your agent a `search_tools` capability—it searches for relevant tools, loads only what it needs, and keeps context lean.

## Requirements

- **Node.js** 18.0.0 or higher
- **TypeScript** 5.0+ (recommended)
- A LangChain-compatible LLM (`@langchain/openai`, `@langchain/anthropic`, etc.)

## Quick Start

```bash
pnpm add bigtool-ts
```

```typescript
import { createAgent, LocalSource, OramaSearch } from "bigtool-ts";
import { ChatOpenAI } from "@langchain/openai";

const agent = await createAgent({
  llm: new ChatOpenAI({ model: "gpt-4o" }),
  tools: [myCalculatorTool, myDatabaseTool, myGitHubTool],
  search: new OramaSearch({ mode: "bm25" }),
});

const result = await agent.invoke({
  messages: [{ role: "user", content: "Create a GitHub PR for this change" }],
});
```

## Features

- **Dynamic Discovery** — Agent searches for tools by natural language query
- **Lazy Loading** — Tools loaded on-demand with LRU caching
- **Hybrid Search** — BM25 text search, vector semantic search, or both
- **Multiple Sources** — Local tools, MCP servers, or custom loaders
- **Zero Config Search** — BM25 mode works out of the box, no API keys needed
- **Multi-Framework** — Works with LangGraph, Inngest, Vercel AI, Mastra, and more

---

## Framework Integrations

bigtool-ts works with multiple AI agent frameworks. Choose your framework below for a quick-start snippet.

### LangGraph

Native integration via `createAgent()`. Returns a compiled StateGraph.

```typescript
import { createAgent, LocalSource, OramaSearch } from "bigtool-ts";
import { ChatOpenAI } from "@langchain/openai";

const agent = await createAgent({
  llm: new ChatOpenAI({ model: "gpt-4o" }),
  tools: [myCalculatorTool, myDatabaseTool, myGitHubTool],
  search: new OramaSearch({ mode: "bm25" }),
});

const result = await agent.invoke({
  messages: [{ role: "user", content: "Create a GitHub PR" }],
});
```

### Inngest AgentKit

Use the adapter with Inngest's multi-agent orchestration framework.

```bash
pnpm add @inngest/agent-kit
```

```typescript
import { createAgent, openai } from "@inngest/agent-kit";
import {
  createInngestAdapter,
  DefaultToolCatalog,
  DefaultToolLoader,
  OramaSearch,
  LocalSource,
} from "bigtool-ts";

// Setup bigtool-ts components
const catalog = new DefaultToolCatalog();
await catalog.register(new LocalSource(myTools));

const search = new OramaSearch({ mode: "bm25" });
await search.index(catalog.getAllMetadata());

const loader = new DefaultToolLoader(catalog);

// Create adapter
const adapter = createInngestAdapter({ catalog, loader, searchIndex: search });

// Use with Inngest agent
const agent = createAgent({
  name: "tool-user",
  model: openai({ model: "gpt-4o" }),
  tools: [
    adapter.createSearchTool(),    // Search for tools
    adapter.createCallToolTool(),  // Execute found tools
  ],
});
```

### Vercel AI SDK

Use the adapter with Vercel's AI SDK for `generateText()` and `streamText()`.

```bash
pnpm add ai @ai-sdk/openai
```

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  createVercelAdapter,
  DefaultToolCatalog,
  DefaultToolLoader,
  OramaSearch,
  LocalSource,
} from "bigtool-ts";

// Setup bigtool-ts components
const catalog = new DefaultToolCatalog();
await catalog.register(new LocalSource(myTools));

const search = new OramaSearch({ mode: "bm25" });
await search.index(catalog.getAllMetadata());

const loader = new DefaultToolLoader(catalog);

// Create adapter
const adapter = createVercelAdapter({ catalog, loader, searchIndex: search });

// Use with Vercel AI SDK
const result = await generateText({
  model: openai("gpt-4o"),
  tools: {
    search_tools: adapter.createSearchTool(),
    ...await adapter.getToolsAsRecord(["github:create_pr", "slack:send"]),
  },
  prompt: "Create a PR and notify the team on Slack",
});
```

### Mastra

Use the adapter with Mastra's AI-native TypeScript framework.

```bash
pnpm add @mastra/core
```

```typescript
import { Agent } from "@mastra/core/agent";
import {
  createMastraAdapter,
  DefaultToolCatalog,
  DefaultToolLoader,
  OramaSearch,
  LocalSource,
} from "bigtool-ts";

// Setup bigtool-ts components
const catalog = new DefaultToolCatalog();
await catalog.register(new LocalSource(myTools));

const search = new OramaSearch({ mode: "bm25" });
await search.index(catalog.getAllMetadata());

const loader = new DefaultToolLoader(catalog);

// Create adapter
const adapter = createMastraAdapter({ catalog, loader, searchIndex: search });

// Use with Mastra Agent
const agent = new Agent({
  id: "my-agent",
  name: "Tool User",
  model: "openai/gpt-4o",
  tools: {
    search_tools: adapter.createSearchTool(),
    ...await adapter.getToolsAsRecord(["github:create_pr"]),
  },
});
```

### Agent Protocol

Expose tools via the Agent Protocol REST API specification.

```typescript
import {
  createAgentProtocolHandler,
  DefaultToolCatalog,
  DefaultToolLoader,
  OramaSearch,
  LocalSource,
} from "bigtool-ts";

// Setup bigtool-ts components
const catalog = new DefaultToolCatalog();
await catalog.register(new LocalSource(myTools));

const search = new OramaSearch({ mode: "bm25" });
await search.index(catalog.getAllMetadata());

const loader = new DefaultToolLoader(catalog);

// Create handler
const handler = createAgentProtocolHandler({ catalog, loader, searchIndex: search });

// Use with Express/Fastify/any HTTP framework
app.get("/tools", async (req, res) => {
  const tools = await handler.listTools();
  res.json({ tools });
});

app.post("/tools/search", async (req, res) => {
  const tools = await handler.searchTools(req.body.query);
  res.json({ tools });
});

app.post("/tools/execute", async (req, res) => {
  const result = await handler.executeTool(req.body.name, req.body.args);
  res.json(result);
});
```

---

## API Reference

### `createAgent(options)`

Creates a LangGraph agent with dynamic tool discovery.

```typescript
import { createAgent, OramaSearch } from "bigtool-ts";

const agent = await createAgent({
  // Required
  llm: new ChatOpenAI({ model: "gpt-4o" }),
  search: new OramaSearch({ mode: "bm25" }),

  // Tool sources (pick one or combine)
  tools: [tool1, tool2],           // Array of StructuredTool
  sources: [localSource, mcpSource], // Array of ToolSource

  // Optional
  pinnedTools: [alwaysAvailableTool], // Always in context
  systemPrompt: "You are a helpful assistant.",
  searchLimit: 5,                  // Max tools per search (default: 5)
  cacheSize: 100,                  // LRU cache size (default: 100)
});

// Use like any LangGraph agent
const result = await agent.invoke({
  messages: [{ role: "user", content: "..." }],
});
```

### `LocalSource`

Wraps in-memory StructuredTool instances.

```typescript
import { LocalSource } from "bigtool-ts";

const source = new LocalSource([
  myCalculatorTool,
  myDatabaseTool,
  myGitHubTool,
]);

// Custom namespace (default: "local")
const namedSource = new LocalSource(tools, "my-tools");
```

### `MCPSource` / `createMCPSource`

Connects to an MCP (Model Context Protocol) server. Two patterns supported:

#### Config-based (Recommended)

Pass a configuration object and let bigtool-ts manage the connection:

```typescript
import { createMCPSource } from "bigtool-ts";

// stdio transport (local MCP server)
const githubSource = await createMCPSource({
  name: "github",
  transport: "stdio",
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-github"],
  env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN },
});

// SSE transport (remote MCP server)
const remoteSource = await createMCPSource({
  name: "remote-tools",
  transport: "sse",
  url: "https://mcp.example.com/sse",
  headers: { Authorization: `Bearer ${apiKey}` },
});

// Register with catalog
await catalog.register(githubSource);
await catalog.register(remoteSource);
```

#### Pre-connected Client

Pass an already-connected MCP client:

```typescript
import { MCPSource } from "bigtool-ts";
import { Client } from "@modelcontextprotocol/sdk/client";

const mcpClient = new Client({ name: "my-client" });
await mcpClient.connect(transport);

const source = new MCPSource(mcpClient, {
  namespace: "github",          // Tool ID prefix (default: client.name)
  refreshInterval: 60_000,      // Re-fetch tool list every 60s
});

// Listen for tool list changes
source.onRefresh.on((metadata) => {
  console.log("Tools refreshed:", metadata.length);
});

// Cleanup
source.dispose();
```

#### Loading 100 MCP Servers

```typescript
import { createMCPSource } from "bigtool-ts";

const mcpConfigs = [
  { name: "github", transport: "stdio", command: "npx", args: ["-y", "@mcp/server-github"] },
  { name: "slack", transport: "stdio", command: "npx", args: ["-y", "@mcp/server-slack"] },
  { name: "notion", transport: "stdio", command: "npx", args: ["-y", "@mcp/server-notion"] },
  // ... 97 more
];

// Connect to all servers in parallel
const sources = await Promise.all(
  mcpConfigs.map(config => createMCPSource(config))
);

// Register all
for (const source of sources) {
  await catalog.register(source);
}
```

### `DynamicSource`

Lazy-loads tools on demand via a custom loader function.

```typescript
import { DynamicSource } from "bigtool-ts";

const source = new DynamicSource({
  // Metadata provided upfront for search indexing
  metadata: [
    { id: "send_email", name: "send_email", description: "Send an email" },
    { id: "create_task", name: "create_task", description: "Create a task" },
  ],
  // Loader called when tool is actually needed
  loader: async (id) => {
    const module = await import(`./tools/${id}.js`);
    return module.default;
  },
});
```

### `withMetadata(tool, enhancement)`

Add search metadata to improve tool discovery.

```typescript
import { withMetadata } from "bigtool-ts";

const enhanced = withMetadata(myGitHubTool, {
  categories: ["github", "git", "version-control"],
  keywords: ["PR", "pull request", "merge", "branch"],
});

// Use enhanced tools in LocalSource
const source = new LocalSource([enhanced, otherTool]);
```

### `OramaSearch`

Search index powered by [@orama/orama](https://oramasearch.com/). Supports three modes for different use cases.

#### BM25 Mode (Default)

Fast keyword-based search. **No API keys needed.**

```typescript
import { OramaSearch } from "bigtool-ts";

const search = new OramaSearch({ mode: "bm25" });

// Or with field boosting
const search = new OramaSearch({
  mode: "bm25",
  boost: {
    name: 2,        // Tool name matches worth 2x
    keywords: 1.5,  // Keyword matches worth 1.5x
    description: 1, // Normal weight
    categories: 1,  // Normal weight
  },
});
```

**When to use:** Most cases. Fast, deterministic, works offline.

#### Vector Mode

Semantic search using embeddings. Finds conceptually similar tools even without exact keyword matches.

```typescript
import { OramaSearch } from "bigtool-ts";
import { OpenAIEmbeddings } from "@langchain/openai";

const search = new OramaSearch({
  mode: "vector",
  embeddings: new OpenAIEmbeddings(),
});
```

**When to use:** When users describe tools conceptually (e.g., "something to post on social media" → finds `twitter_post`, `linkedin_share`).

#### Hybrid Mode

Combines BM25 and vector search for best of both worlds.

```typescript
import { OramaSearch } from "bigtool-ts";
import { OpenAIEmbeddings } from "@langchain/openai";

const search = new OramaSearch({
  mode: "hybrid",
  embeddings: new OpenAIEmbeddings(),
  weights: { 
    bm25: 0.4,   // 40% keyword matching
    vector: 0.6, // 60% semantic similarity
  },
  boost: {
    name: 2,
    keywords: 1.5,
    description: 1,
    categories: 1,
  },
});
```

**When to use:** Large tool catalogs where both exact matches and semantic similarity matter.

#### Search Mode Comparison

| Mode | Speed | API Keys | Best For |
|------|-------|----------|----------|
| `bm25` | ⚡ Fast | None | Exact matches, offline use |
| `vector` | 🐢 Slower | Required | Semantic similarity |
| `hybrid` | 🐢 Slower | Required | Large catalogs, mixed queries |

#### Search Options

```typescript
const results = await search.search("create github pr", {
  limit: 10,           // Max results (default: 5)
  threshold: 0.3,      // Min score 0-1 (default: 0)
  categories: ["git"], // Filter by category
});

// Results format
// [{ toolId: "github:create_pr", score: 0.95, matchType: "bm25" }, ...]
```

## Advanced Usage

### Combining Multiple Sources

```typescript
import { createAgent, LocalSource, MCPSource, OramaSearch } from "bigtool-ts";

const agent = await createAgent({
  llm,
  sources: [
    new LocalSource(coreTools, "core"),
    new MCPSource(githubMcp, { namespace: "github" }),
    new MCPSource(slackMcp, { namespace: "slack" }),
  ],
  search: new OramaSearch({ mode: "bm25" }),
});
```

### Pinned Tools (Always Available)

Some tools should always be in context without searching:

```typescript
const agent = await createAgent({
  llm,
  tools: myLargeToolCollection,
  search: new OramaSearch({ mode: "bm25" }),
  pinnedTools: [
    helpTool,      // "Show available commands"
    exitTool,      // "End the conversation"
  ],
});
```

### Custom Catalog and Loader

For advanced use cases, build components individually:

```typescript
import {
  DefaultToolCatalog,
  DefaultToolLoader,
  OramaSearch,
  LocalSource,
} from "bigtool-ts";

// 1. Create catalog
const catalog = new DefaultToolCatalog();

// 2. Register sources
await catalog.register(new LocalSource(tools));

// 3. Create search index
const search = new OramaSearch({ mode: "bm25" });
await search.index(catalog.getAllMetadata());

// 4. Create loader with custom cache settings
const loader = new DefaultToolLoader(catalog, {
  maxSize: 50,
  ttl: 5 * 60 * 1000, // 5 minutes
});

// 5. Listen for catalog changes
catalog.onToolsChanged.on(({ added, removed }) => {
  console.log(`Tools changed: +${added.length} -${removed.length}`);
  search.reindex();
});
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         createAgent()                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ToolSource[]                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ LocalSource  │  │  MCPSource   │  │DynamicSource │          │
│  │  (in-memory) │  │ (MCP server) │  │ (lazy load)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DefaultToolCatalog                           │
│         Registry of all tool metadata from sources               │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│      OramaSearch        │     │   DefaultToolLoader     │
│  BM25 / Vector / Hybrid │     │    LRU-cached loading   │
│                         │     │                         │
│  query → [toolId, ...]  │     │  toolId → StructuredTool│
└─────────────────────────┘     └─────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   LangGraph StateGraph                           │
│                                                                  │
│   START → agent → route → search/execute → agent → ... → END    │
│                                                                  │
│   Agent node has:                                                │
│   - search_tools (always available)                              │
│   - pinnedTools (always available)                               │
│   - selectedTools (loaded after search)                          │
└─────────────────────────────────────────────────────────────────┘
```

**Flow:**

1. **Catalog** collects metadata from all sources
2. **Search** indexes metadata for fast querying
3. **Agent** calls `search_tools("github PR")` → gets relevant tool IDs
4. **Loader** loads actual tool implementations (with LRU caching)
5. **Agent** executes tools and continues conversation

## License

MIT
