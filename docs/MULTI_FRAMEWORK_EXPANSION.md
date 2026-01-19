# Multi-Framework Expansion Proposal for bigtool-ts

> **Version:** 1.0.0  
> **Date:** January 2026  
> **Author:** Agent 04 - Multi-Framework Research  

---

## Executive Summary

This document outlines how `@repo/bigtool-ts` can be expanded from its current LangGraph-only implementation to support multiple TypeScript agent frameworks. The goal is to make bigtool-ts a **framework-agnostic tool discovery and management library** that can be used across the TypeScript AI ecosystem.

### Key Findings

1. **Vercel AI SDK** should be the first integration priority due to its massive adoption, clean tool interface, and alignment with bigtool-ts patterns
2. **Mastra** is a strong second priority as an emerging AI-native framework with excellent TypeScript design
3. Most frameworks share similar tool patterns (name, description, parameters, execute function), making a unified adapter approach feasible
4. The core bigtool-ts abstractions (Catalog, Search, Loader) are already framework-agnostic—only the integration layer needs adapters

### Recommended Integration Priority

| Priority | Framework | Effort | Rationale |
|----------|-----------|--------|-----------|
| 1 | **AgentKit (Inngest)** | Low | Already using Inngest, native multi-agent orchestration |
| 2 | Vercel AI SDK | Low | Massive adoption, simple tool interface |
| 3 | Mastra | Low | Excellent TypeScript design, growing adoption |
| 4 | Agent Protocol | Medium | Standardization play, interoperability |
| 5 | CrewAI | High | Python-first, limited TS support |

---

## Framework Comparison Table

| Framework | Stars | Tool Interface | Schema Format | Async Support | Category Filtering | MCP Support |
|-----------|-------|----------------|---------------|---------------|-------------------|-------------|
| **LangChain/LangGraph** | 95k+ | `StructuredTool` | Zod | Yes | No | External |
| **AgentKit (Inngest)** | 2k+ | `createTool()` | Zod | Yes | No | Native |
| **Vercel AI SDK** | 10k+ | `tool()` | Zod | Yes | No | Native |
| **Mastra** | 8k+ | `createTool()` | Zod | Yes | Yes | Native |
| **Agent Protocol** | 1k+ | `Tool` (spec) | JSON Schema | Yes | No | No |
| **CrewAI** | 20k+ | Python-first | Pydantic | Yes | Yes | No |

---

## Per-Framework Deep Dive

### 1. Vercel AI SDK

**Repository:** https://github.com/vercel/ai  
**Website:** https://sdk.vercel.ai  
**Stars:** ~10,000+  
**Adoption:** Very High (powers many production apps)

#### Overview

The Vercel AI SDK is the most widely adopted TypeScript framework for building AI applications. It provides a unified API for working with various LLM providers (OpenAI, Anthropic, Google, etc.) and has first-class support for streaming, tools, and multi-step interactions.

#### Tool System

Tools in Vercel AI SDK are defined using the `tool()` helper:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const weatherTool = tool({
  description: 'Get the current weather for a location',
  parameters: z.object({
    location: z.string().describe('City name'),
    unit: z.enum(['celsius', 'fahrenheit']).optional(),
  }),
  execute: async ({ location, unit }) => {
    // Tool implementation
    return { temperature: 72, condition: 'sunny' };
  },
});
```

**Key Characteristics:**
- Uses Zod for parameter validation (same as LangChain)
- Tools are plain objects, not classes
- `execute` function is async and type-safe
- No built-in tool discovery or search

#### Integration Approach

**Complexity: Low**

The Vercel AI SDK tool format is very similar to LangChain's StructuredTool. We can create a simple adapter:

```typescript
// packages/bigtool-ts/src/adapters/vercel-ai.ts
import { tool as vercelTool, type CoreTool } from 'ai';
import type { ToolMetadata, ToolCatalog, ToolLoader } from '../types.js';

/**
 * Converts bigtool-ts metadata to a Vercel AI SDK tool
 */
export function toVercelTool(
  metadata: ToolMetadata,
  loader: ToolLoader
): CoreTool {
  return vercelTool({
    description: metadata.description,
    parameters: metadata.parameters as Parameters, // Zod schema
    execute: async (args) => {
      const structuredTool = await loader.load(metadata.id);
      return structuredTool.invoke(args);
    },
  });
}

/**
 * Creates a set of tools for Vercel AI SDK from search results
 */
export async function getVercelTools(
  catalog: ToolCatalog,
  loader: ToolLoader,
  toolIds: string[]
): Promise<Record<string, CoreTool>> {
  const tools: Record<string, CoreTool> = {};
  
  for (const id of toolIds) {
    const metadata = catalog.getMetadata(id);
    if (metadata) {
      tools[metadata.name] = toVercelTool(metadata, loader);
    }
  }
  
  return tools;
}

/**
 * Creates a search_tools tool for Vercel AI SDK
 */
export function createSearchToolForVercel(
  searchIndex: SearchIndex,
  catalog: ToolCatalog,
  limit = 5
): CoreTool {
  return vercelTool({
    description: 'Search for tools by query. Returns tool names and descriptions.',
    parameters: z.object({
      query: z.string().describe('Search query'),
    }),
    execute: async ({ query }) => {
      const results = await searchIndex.search(query, { limit });
      return results.map((r) => {
        const meta = catalog.getMetadata(r.toolId);
        return {
          name: meta?.name ?? r.toolId,
          description: meta?.description ?? '',
          score: r.score,
        };
      });
    },
  });
}
```

#### Usage Example

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { 
  DefaultToolCatalog, 
  OramaSearch,
  DefaultToolLoader,
  LocalSource 
} from '@repo/bigtool-ts';
import { getVercelTools, createSearchToolForVercel } from '@repo/bigtool-ts/vercel';

// Setup
const catalog = new DefaultToolCatalog();
await catalog.register(new LocalSource(myTools));

const search = new OramaSearch();
await search.index(catalog.getAllMetadata());

const loader = new DefaultToolLoader(catalog);

// Use with Vercel AI SDK
const result = await generateText({
  model: openai('gpt-4o'),
  tools: {
    search_tools: createSearchToolForVercel(search, catalog),
    ...await getVercelTools(catalog, loader, ['github:create_pr']),
  },
  prompt: 'Create a PR with the title "Fix bug"',
});
```

---

### 2. Mastra

**Repository:** https://github.com/mastra-ai/mastra  
**Website:** https://mastra.ai  
**Stars:** ~8,000+  
**Adoption:** Growing rapidly

#### Overview

Mastra is an AI-native TypeScript framework designed for building production AI applications. It emphasizes type-safety, composability, and integration with external services. Mastra has built-in support for MCP (Model Context Protocol) and provides excellent patterns for tool management.

#### Tool System

Mastra tools are created using `createTool()`:

```typescript
import { createTool } from '@mastra/core';
import { z } from 'zod';

const weatherTool = createTool({
  id: 'weather',
  name: 'get_weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string(),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    condition: z.string(),
  }),
  execute: async ({ context, input }) => {
    return { temperature: 72, condition: 'sunny' };
  },
});
```

**Key Characteristics:**
- Uses Zod for both input and output schemas
- Tools have explicit `id` and `name` (maps well to bigtool-ts)
- Context injection for accessing integrations
- Built-in output validation
- Native MCP support

#### Integration Approach

**Complexity: Low**

Mastra's tool interface aligns very well with bigtool-ts:

```typescript
// packages/bigtool-ts/src/adapters/mastra.ts
import { createTool, type Tool as MastraTool } from '@mastra/core';
import type { ToolMetadata, ToolLoader } from '../types.js';
import { z } from 'zod';

/**
 * Converts bigtool-ts metadata to a Mastra tool
 */
export function toMastraTool(
  metadata: ToolMetadata,
  loader: ToolLoader
): MastraTool {
  return createTool({
    id: metadata.id,
    name: metadata.name,
    description: metadata.description,
    inputSchema: metadata.parameters as z.ZodSchema,
    execute: async ({ input }) => {
      const tool = await loader.load(metadata.id);
      return tool.invoke(input);
    },
  });
}

/**
 * Creates a Mastra integration from bigtool-ts catalog
 */
export function createMastraIntegration(config: {
  catalog: ToolCatalog;
  loader: ToolLoader;
  searchIndex: SearchIndex;
}) {
  const { catalog, loader, searchIndex } = config;
  
  return {
    name: 'bigtool',
    
    async getTools(filter?: { categories?: string[] }) {
      const metadata = catalog.getAllMetadata();
      const filtered = filter?.categories
        ? metadata.filter((m) => 
            m.categories?.some((c) => filter.categories!.includes(c))
          )
        : metadata;
      
      return filtered.map((m) => toMastraTool(m, loader));
    },
    
    async searchTools(query: string, limit = 5) {
      const results = await searchIndex.search(query, { limit });
      return results.map((r) => {
        const meta = catalog.getMetadata(r.toolId);
        return meta ? toMastraTool(meta, loader) : null;
      }).filter(Boolean);
    },
  };
}
```

#### Idiomatic Patterns

Mastra encourages:
- Tools grouped into "Integrations"
- Context-aware tool execution
- Explicit input/output schemas
- Categorization for discovery

---

### 3. AgentKit (Inngest)

**Repository:** https://github.com/inngest/agent-kit  
**Website:** https://agentkit.inngest.com  
**Stars:** ~2,000+  
**Adoption:** Growing rapidly (Inngest ecosystem)

#### Overview

Inngest AgentKit is a TypeScript framework for building multi-agent systems with orchestration, deterministic routing, and powerful debugging tools. It's built by Inngest and integrates seamlessly with their event-driven platform.

**Key Concepts:**
- **Agents**: Stateless units with goals + tools
- **Networks**: Multiple agents collaborating with shared state
- **Routers**: Determine which agent handles each step
- **State**: Persistent history and typed state machines
- **Tools**: Extend agent capabilities (APIs, search, custom operations)

#### Tool System

Inngest AgentKit tools are created using `createTool()`:

```typescript
import { createTool } from '@inngest/agent-kit';
import { z } from 'zod';

const weatherTool = createTool({
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: z.object({
    location: z.string().describe('City name'),
  }),
  handler: async ({ location }, { network, agent }) => {
    // Tool implementation with access to network context
    return { temperature: 72, condition: 'sunny' };
  },
});

// Use in an agent
const agent = createAgent({
  name: 'weather-agent',
  model: openai('gpt-4'),
  tools: [weatherTool],
});
```

**Key Characteristics:**
- Uses Zod for parameter validation (same as LangChain)
- Tools have access to network and agent context
- Native MCP (Model Context Protocol) support
- Built-in tracing and debugging
- Deterministic routing for reproducible agent flows

#### Integration Approach

**Complexity: Low**

Since you're already using Inngest, this is the highest-priority integration:

```typescript
// packages/bigtool-ts/src/adapters/inngest.ts
import { createTool, type Tool as InngestTool } from '@inngest/agent-kit';
import { z } from 'zod';
import type { ToolMetadata, ToolLoader, SearchIndex, ToolCatalog } from '../types.js';
import type { AdapterConfig, ToolAdapter } from './types.js';

/**
 * Inngest AgentKit adapter for bigtool-ts
 */
export class InngestAdapter implements ToolAdapter<InngestTool> {
  private catalog: ToolCatalog;
  private loader: ToolLoader;
  private searchIndex: SearchIndex;

  constructor(config: AdapterConfig) {
    this.catalog = config.catalog;
    this.loader = config.loader;
    this.searchIndex = config.searchIndex;
  }

  toFrameworkTool(metadata: ToolMetadata): InngestTool {
    const loader = this.loader;
  
    return createTool({
    name: metadata.name,
    description: metadata.description,
      parameters: metadata.parameters as z.ZodSchema,
      handler: async (args, context) => {
      const tool = await loader.load(metadata.id);
      return tool.invoke(args);
    },
    });
}

  async getTools(toolIds: string[]): Promise<InngestTool[]> {
    const tools: InngestTool[] = [];
    for (const id of toolIds) {
      const metadata = this.catalog.getMetadata(id);
      if (metadata) {
        tools.push(this.toFrameworkTool(metadata));
      }
    }
    return tools;
  }

  createSearchTool(options: { limit?: number } = {}): InngestTool {
    const { limit = 5 } = options;
    const searchIndex = this.searchIndex;
    const catalog = this.catalog;

    return createTool({
      name: 'search_tools',
      description: 'Search for available tools by query. Use this to discover tools.',
      parameters: z.object({
        query: z.string().describe('Natural language search query'),
      }),
      handler: async ({ query }) => {
        const results = await searchIndex.search(query, { limit });
        return results.map((r) => {
          const meta = catalog.getMetadata(r.toolId);
          return {
            name: meta?.name ?? r.toolId,
            description: meta?.description ?? '',
            score: r.score,
          };
        });
      },
    });
  }
}

// Factory function
export function createInngestAdapter(config: AdapterConfig): InngestAdapter {
  return new InngestAdapter(config);
}
```

#### Usage with Inngest Networks

```typescript
import { createNetwork, createAgent, openai } from '@inngest/agent-kit';
import { 
  DefaultToolCatalog, 
  OramaSearch,
  DefaultToolLoader,
  LocalSource 
} from '@repo/bigtool-ts';
import { createInngestAdapter } from '@repo/bigtool-ts/inngest';

// Setup bigtool-ts
const catalog = new DefaultToolCatalog();
await catalog.register(new LocalSource(myTools));

const search = new OramaSearch();
await search.index(catalog.getAllMetadata());

const loader = new DefaultToolLoader(catalog);
const adapter = createInngestAdapter({ catalog, loader, searchIndex: search });

// Create an Inngest agent with bigtool-ts tools
const toolAgent = createAgent({
  name: 'tool-user',
  model: openai('gpt-4o'),
  tools: [
    adapter.createSearchTool(),
    ...await adapter.getTools(['github:create_pr', 'slack:send_message']),
  ],
});

// Use in a network
const network = createNetwork({
  agents: [toolAgent, plannerAgent, executorAgent],
  defaultRouter: /* your router logic */,
});
```

#### Idiomatic Patterns

Inngest AgentKit encourages:
- Stateless agents with network-level state
- Deterministic routing for reproducibility
- MCP integration for external tools
- Tracing for debugging multi-agent flows
- Event-driven execution via Inngest functions

---

### 4. Agent Protocol

**Repository:** https://github.com/AI-Engineers-Foundation/agent-protocol  
**Website:** https://agentprotocol.ai  
**Stars:** ~1,000+  
**Adoption:** Growing as a standard

#### Overview

Agent Protocol is a specification for agent-to-agent and agent-to-client communication. It defines a REST API standard that any agent can implement, enabling interoperability between different agent frameworks. The TypeScript SDK provides types and utilities for implementing the protocol.

#### Tool System

Agent Protocol defines tools in its API spec:

```typescript
// From the Agent Protocol spec
interface AgentTool {
  name: string;
  description: string;
  parameters: JSONSchema7; // Standard JSON Schema
}

interface ToolCall {
  tool_name: string;
  arguments: Record<string, unknown>;
}

interface ToolResult {
  tool_call_id: string;
  output: string;
}
```

**Key Characteristics:**
- REST API-based, not library
- Standard JSON Schema for parameters
- Protocol-level tool discovery endpoint
- Framework-agnostic by design

#### Integration Approach

**Complexity: Medium**

Agent Protocol is a wire protocol, so integration means exposing bigtool-ts via API:

```typescript
// packages/bigtool-ts/src/adapters/agent-protocol.ts
import type { ToolCatalog, ToolLoader, SearchIndex } from '../types.js';

interface AgentProtocolToolHandler {
  listTools(): Promise<AgentTool[]>;
  searchTools(query: string): Promise<AgentTool[]>;
  executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult>;
}

/**
 * Creates an Agent Protocol-compatible handler
 */
export function createAgentProtocolHandler(config: {
  catalog: ToolCatalog;
  loader: ToolLoader;
  searchIndex: SearchIndex;
}): AgentProtocolToolHandler {
  const { catalog, loader, searchIndex } = config;
  
  return {
    async listTools() {
      return catalog.getAllMetadata().map((m) => ({
        name: m.name,
        description: m.description,
        parameters: m.parameters as JSONSchema7,
      }));
    },
    
    async searchTools(query: string) {
      const results = await searchIndex.search(query);
      return results.map((r) => {
        const m = catalog.getMetadata(r.toolId)!;
        return {
          name: m.name,
          description: m.description,
          parameters: m.parameters as JSONSchema7,
        };
      });
    },
    
    async executeTool(name: string, args: Record<string, unknown>) {
      const metadata = catalog.getAllMetadata().find((m) => m.name === name);
      if (!metadata) throw new Error(`Tool not found: ${name}`);
      
      const tool = await loader.load(metadata.id);
      const output = await tool.invoke(args);
      
      return {
        tool_call_id: crypto.randomUUID(),
        output: typeof output === 'string' ? output : JSON.stringify(output),
      };
    },
  };
}

/**
 * Express middleware for Agent Protocol endpoints
 */
export function agentProtocolMiddleware(handler: AgentProtocolToolHandler) {
  return {
    'GET /tools': async (req, res) => {
      const tools = await handler.listTools();
      res.json({ tools });
    },
    'POST /tools/search': async (req, res) => {
      const { query } = req.body;
      const tools = await handler.searchTools(query);
      res.json({ tools });
    },
    'POST /tools/execute': async (req, res) => {
      const { tool_name, arguments: args } = req.body;
      const result = await handler.executeTool(tool_name, args);
      res.json(result);
    },
  };
}
```

---

### 5. CrewAI

**Repository:** https://github.com/crewAIInc/crewAI  
**Website:** https://crewai.com  
**Stars:** ~20,000+  
**Adoption:** Very high (Python), limited TypeScript

#### Overview

CrewAI is a Python-first multi-agent framework for orchestrating AI agents working together. It has experimental TypeScript bindings but the core is Python.

#### Tool System (Python)

```python
from crewai import tool

@tool
def search_web(query: str) -> str:
    """Search the web for information."""
    return f"Results for: {query}"
```

**TypeScript bindings (experimental):**

```typescript
import { Tool } from 'crewai-js';

const searchTool = new Tool({
  name: 'search_web',
  description: 'Search the web for information',
  func: async (query: string) => {
    return `Results for: ${query}`;
  },
});
```

#### Integration Approach

**Complexity: High**

CrewAI TypeScript support is limited. Integration would require:
1. Wrapping bigtool-ts tools in CrewAI's `Tool` class
2. Potentially contributing to crewai-js for better tool support
3. Or building a bridge layer for Python CrewAI

```typescript
// packages/bigtool-ts/src/adapters/crewai.ts (experimental)
import { Tool as CrewAITool } from 'crewai-js';
import type { ToolMetadata, ToolLoader } from '../types.js';

/**
 * Converts bigtool-ts metadata to CrewAI tool (experimental)
 * 
 * Note: CrewAI TypeScript support is limited. This adapter
 * may require updates as the crewai-js library matures.
 */
export function toCrewAITool(
  metadata: ToolMetadata,
  loader: ToolLoader
): CrewAITool {
  return new CrewAITool({
    name: metadata.name,
    description: metadata.description,
    func: async (args: string) => {
      const parsedArgs = JSON.parse(args);
      const tool = await loader.load(metadata.id);
      const result = await tool.invoke(parsedArgs);
      return typeof result === 'string' ? result : JSON.stringify(result);
    },
  });
}
```

**Recommendation:** Deprioritize CrewAI until their TypeScript SDK matures.

---

### 6. Other Notable Frameworks

#### ElizaOS

**Repository:** https://github.com/elizaos/eliza  
**Stars:** ~15,000+

ElizaOS is a multi-agent simulation framework. Tools are called "actions" and have a different execution model focused on autonomous agents.

```typescript
const action: Action = {
  name: 'SEND_MESSAGE',
  description: 'Send a message to another agent',
  validate: async (runtime, message) => true,
  handler: async (runtime, message, state) => {
    // Action implementation
  },
};
```

**Integration complexity:** Medium-High (different execution model)

#### OpenAI Assistants API (direct)

While not a framework, many developers use OpenAI's Assistants API directly:

```typescript
const tool = {
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string' },
      },
    },
  },
};
```

**Integration complexity:** Low (JSON Schema based)

---

## Architecture Proposal

### Making bigtool-ts Framework-Agnostic

The current bigtool-ts architecture already separates concerns well:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRAMEWORK LAYER                               │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐            │
│  │ LangGraph │ │  Inngest  │ │ Vercel AI │ │  Mastra   │            │
│  │  Adapter  │ │  Adapter  │ │  Adapter  │ │  Adapter  │            │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘            │
│        │             │             │             │                   │
│        └─────────────┴──────┬──────┴─────────────┘                   │
│                             │                                        │
├─────────────────────────────┼────────────────────────────────────────┤
│                        CORE LAYER                                    │
│                             │                                        │
│  ┌─────────────────────────┼─────────────────────────────┐          │
│  │                    ToolCatalog                        │          │
│  │      (Source of truth for tool metadata)              │          │
│  └──────────┬───────────────┬───────────────┬────────────┘          │
│             │               │               │                        │
│  ┌──────────▼────┐ ┌────────▼──────┐ ┌──────▼──────────┐            │
│  │  SearchIndex  │ │  ToolLoader   │ │  ToolSources    │            │
│  │ (BM25/Vector) │ │ (LRU Cache)   │ │ (Local/MCP/Dyn) │            │
│  └───────────────┘ └───────────────┘ └─────────────────┘            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Proposed File Structure

```
packages/bigtool-ts/
├── src/
│   ├── index.ts              # Main exports (framework-agnostic)
│   ├── types.ts              # Core types
│   ├── catalog/              # ToolCatalog implementation
│   ├── search/               # SearchIndex implementations
│   ├── loader/               # ToolLoader implementation
│   ├── sources/              # Tool sources (Local, MCP, Dynamic)
│   │
│   ├── adapters/             # NEW: Framework adapters
│   │   ├── index.ts          # Adapter exports
│   │   ├── types.ts          # Common adapter types
│   │   ├── langgraph.ts      # LangGraph adapter (extract from graph/)
│   │   ├── inngest.ts        # Inngest AgentKit adapter ⭐
│   │   ├── vercel-ai.ts      # Vercel AI SDK adapter
│   │   ├── mastra.ts         # Mastra adapter
│   │   └── agent-protocol.ts # Agent Protocol adapter
│   │
│   └── graph/                # LangGraph-specific (uses adapter)
│       ├── agent.ts
│       ├── nodes.ts
│       └── state.ts
│
├── langgraph.ts              # Re-export: import from '@repo/bigtool-ts/langgraph'
├── inngest.ts                # Re-export: import from '@repo/bigtool-ts/inngest' ⭐
├── vercel.ts                 # Re-export: import from '@repo/bigtool-ts/vercel'
└── mastra.ts                 # Re-export: import from '@repo/bigtool-ts/mastra'
```

### Common Adapter Interface

```typescript
// packages/bigtool-ts/src/adapters/types.ts

/**
 * Configuration for creating framework adapters
 */
export interface AdapterConfig {
  catalog: ToolCatalog;
  loader: ToolLoader;
  searchIndex: SearchIndex;
}

/**
 * Common interface that all adapters implement
 */
export interface ToolAdapter<TFrameworkTool> {
  /**
   * Convert a bigtool-ts metadata to framework-specific tool
   */
  toFrameworkTool(metadata: ToolMetadata): TFrameworkTool;
  
  /**
   * Get tools by IDs, converted to framework format
   */
  getTools(toolIds: string[]): Promise<TFrameworkTool[]>;
  
  /**
   * Create a search tool in framework format
   */
  createSearchTool(options?: SearchToolOptions): TFrameworkTool;
}

/**
 * Options for creating search tools
 */
export interface SearchToolOptions {
  limit?: number;
  threshold?: number;
  categories?: string[];
}
```

### Package Exports (package.json)

```json
{
  "name": "@repo/bigtool-ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./langgraph": {
      "import": "./dist/langgraph.js",
      "types": "./dist/langgraph.d.ts"
    },
    "./inngest": {
      "import": "./dist/inngest.js",
      "types": "./dist/inngest.d.ts"
    },
    "./vercel": {
      "import": "./dist/vercel.js",
      "types": "./dist/vercel.d.ts"
    },
    "./mastra": {
      "import": "./dist/mastra.js",
      "types": "./dist/mastra.d.ts"
    }
  },
  "peerDependencies": {
    "@langchain/core": ">=0.2.0",
    "@langchain/langgraph": ">=0.2.0",
    "@inngest/agent-kit": ">=0.1.0",
    "ai": ">=3.0.0",
    "@mastra/core": ">=0.1.0"
  },
  "peerDependenciesMeta": {
    "@langchain/core": { "optional": true },
    "@langchain/langgraph": { "optional": true },
    "@inngest/agent-kit": { "optional": true },
    "ai": { "optional": true },
    "@mastra/core": { "optional": true }
  }
}
```

---

## Example Adapter Code Sketches

### Complete Vercel AI SDK Adapter

```typescript
// packages/bigtool-ts/src/adapters/vercel-ai.ts
import { tool as createVercelTool, type CoreTool } from 'ai';
import { z } from 'zod';
import type {
  ToolMetadata,
  ToolCatalog,
  ToolLoader,
  SearchIndex,
} from '../types.js';
import type { AdapterConfig, ToolAdapter, SearchToolOptions } from './types.js';

/**
 * Vercel AI SDK adapter for bigtool-ts
 */
export class VercelAIAdapter implements ToolAdapter<CoreTool> {
  private catalog: ToolCatalog;
  private loader: ToolLoader;
  private searchIndex: SearchIndex;

  constructor(config: AdapterConfig) {
    this.catalog = config.catalog;
    this.loader = config.loader;
    this.searchIndex = config.searchIndex;
  }

  toFrameworkTool(metadata: ToolMetadata): CoreTool {
    const loader = this.loader;
    
    return createVercelTool({
      description: metadata.description,
      parameters: metadata.parameters as z.ZodSchema,
      execute: async (args) => {
        const tool = await loader.load(metadata.id);
        return tool.invoke(args);
      },
    });
  }

  async getTools(toolIds: string[]): Promise<CoreTool[]> {
    const tools: CoreTool[] = [];
    
    for (const id of toolIds) {
      const metadata = this.catalog.getMetadata(id);
      if (metadata) {
        tools.push(this.toFrameworkTool(metadata));
      }
    }
    
    return tools;
  }

  async getToolsAsRecord(toolIds: string[]): Promise<Record<string, CoreTool>> {
    const tools: Record<string, CoreTool> = {};
    
    for (const id of toolIds) {
      const metadata = this.catalog.getMetadata(id);
      if (metadata) {
        tools[metadata.name] = this.toFrameworkTool(metadata);
      }
    }
    
    return tools;
  }

  createSearchTool(options: SearchToolOptions = {}): CoreTool {
    const { limit = 5, threshold = 0, categories } = options;
    const searchIndex = this.searchIndex;
    const catalog = this.catalog;

    return createVercelTool({
      description:
        'Search for available tools by query. Use this to discover what tools are available before calling them.',
      parameters: z.object({
        query: z.string().describe('Natural language search query'),
      }),
      execute: async ({ query }) => {
        const results = await searchIndex.search(query, {
          limit,
          threshold,
          categories,
        });

        return results.map((r) => {
          const meta = catalog.getMetadata(r.toolId);
          return {
            name: meta?.name ?? r.toolId,
            description: meta?.description ?? '',
            score: r.score,
          };
        });
      },
    });
  }
}

// Factory function for convenience
export function createVercelAdapter(config: AdapterConfig): VercelAIAdapter {
  return new VercelAIAdapter(config);
}
```

### Complete Mastra Adapter

```typescript
// packages/bigtool-ts/src/adapters/mastra.ts
import { createTool, type Tool as MastraTool } from '@mastra/core';
import { z } from 'zod';
import type {
  ToolMetadata,
  ToolCatalog,
  ToolLoader,
  SearchIndex,
} from '../types.js';
import type { AdapterConfig, ToolAdapter, SearchToolOptions } from './types.js';

/**
 * Mastra adapter for bigtool-ts
 */
export class MastraAdapter implements ToolAdapter<MastraTool> {
  private catalog: ToolCatalog;
  private loader: ToolLoader;
  private searchIndex: SearchIndex;

  constructor(config: AdapterConfig) {
    this.catalog = config.catalog;
    this.loader = config.loader;
    this.searchIndex = config.searchIndex;
  }

  toFrameworkTool(metadata: ToolMetadata): MastraTool {
    const loader = this.loader;

    return createTool({
      id: metadata.id,
      name: metadata.name,
      description: metadata.description,
      inputSchema: metadata.parameters as z.ZodSchema,
      execute: async ({ input }) => {
        const tool = await loader.load(metadata.id);
        return tool.invoke(input);
      },
    });
  }

  async getTools(toolIds: string[]): Promise<MastraTool[]> {
    const tools: MastraTool[] = [];

    for (const id of toolIds) {
      const metadata = this.catalog.getMetadata(id);
      if (metadata) {
        tools.push(this.toFrameworkTool(metadata));
      }
    }

    return tools;
  }

  async getToolsByCategory(categories: string[]): Promise<MastraTool[]> {
    const allMetadata = this.catalog.getAllMetadata();
    const filtered = allMetadata.filter((m) =>
      m.categories?.some((c) => categories.includes(c))
    );
    return filtered.map((m) => this.toFrameworkTool(m));
  }

  createSearchTool(options: SearchToolOptions = {}): MastraTool {
    const { limit = 5, threshold = 0, categories } = options;
    const searchIndex = this.searchIndex;
    const catalog = this.catalog;

    return createTool({
      id: 'bigtool:search_tools',
      name: 'search_tools',
      description:
        'Search for available tools by query. Returns tool names and descriptions.',
      inputSchema: z.object({
        query: z.string().describe('Natural language search query'),
      }),
      outputSchema: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          score: z.number(),
        })
      ),
      execute: async ({ input }) => {
        const results = await searchIndex.search(input.query, {
          limit,
          threshold,
          categories,
        });

        return results.map((r) => {
          const meta = catalog.getMetadata(r.toolId);
          return {
            name: meta?.name ?? r.toolId,
            description: meta?.description ?? '',
            score: r.score,
          };
        });
      },
    });
  }
}

// Factory function
export function createMastraAdapter(config: AdapterConfig): MastraAdapter {
  return new MastraAdapter(config);
}

/**
 * Creates a Mastra Integration from bigtool-ts
 */
export function createMastraIntegration(config: AdapterConfig) {
  const adapter = new MastraAdapter(config);

  return {
    name: 'bigtool',
    tools: async () => {
      const metadata = config.catalog.getAllMetadata();
      return metadata.map((m) => adapter.toFrameworkTool(m));
    },
    searchTools: async (query: string, limit = 5) => {
      const results = await config.searchIndex.search(query, { limit });
      return results
        .map((r) => {
          const meta = config.catalog.getMetadata(r.toolId);
          return meta ? adapter.toFrameworkTool(meta) : null;
        })
        .filter((t): t is MastraTool => t !== null);
    },
  };
}
```

---

## Implementation Roadmap

### Phase 1: Refactor Core (1-2 days)

1. Extract LangGraph-specific code into `adapters/langgraph.ts`
2. Create `adapters/types.ts` with common adapter interface
3. Ensure core modules have no LangChain imports
4. Update exports in `package.json`

### Phase 2: Inngest AgentKit Adapter (1 day) ⭐ PRIORITY

1. Implement `InngestAdapter` class
2. Add peer dependency for `@inngest/agent-kit`
3. Create usage examples with Inngest Networks
4. Add tests
5. **Note:** Already using Inngest, so this has immediate value

### Phase 3: Vercel AI SDK Adapter (1 day)

1. Implement `VercelAIAdapter` class
2. Add peer dependency for `ai` package
3. Create usage examples
4. Add tests

### Phase 4: Mastra Adapter (1 day)

1. Implement `MastraAdapter` class
2. Implement `createMastraIntegration` helper
3. Add peer dependency for `@mastra/core`
4. Create usage examples
5. Add tests

### Phase 5: Agent Protocol (2 days)

1. Implement protocol handler
2. Create Express/Fastify middleware helpers
3. Add endpoint examples
4. Add tests

### Phase 6: CrewAI Adapter (optional, when TS support matures)

1. Monitor crewai-js library development
2. Implement adapter when TypeScript SDK stabilizes
3. Focus on cross-language interop if Python bridge needed

---

## Conclusion

bigtool-ts is well-positioned for multi-framework expansion. The core abstractions (Catalog, Search, Loader, Sources) are already framework-agnostic. The primary work is creating thin adapter layers that convert bigtool-ts tools to framework-specific formats.

**Key recommendations:**

1. **Start with Inngest AgentKit** - Already using Inngest, immediate value for multi-agent workflows
2. **Add Vercel AI SDK second** - Highest adoption, simplest integration
3. **Add Mastra third** - Excellent TypeScript design, growing quickly
4. **Keep adapters thin** - Just convert types, don't add logic
5. **Use optional peer dependencies** - Users only install what they need
6. **Maintain LangGraph as primary** - It's the most feature-complete for single-agent use

The proposed architecture maintains backward compatibility while enabling bigtool-ts to become the universal tool management solution for TypeScript AI agents.
