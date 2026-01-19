/**
 * Agent Protocol Adapter Tests
 *
 * Tests behavior of the framework-agnostic Agent Protocol handler.
 * Focus on what the handler does, not how it does it.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAgentProtocolHandler } from './agent-protocol.js';
import type { AdapterConfig } from './types.js';
import type {
  ToolCatalog,
  ToolLoader,
  SearchIndex,
  ToolMetadata,
  SearchResult,
} from '../types.js';
import type { StructuredTool } from '@langchain/core/tools';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a mock ToolMetadata for testing
 */
function createToolMetadata(
  name: string,
  description: string,
  parameters: Record<string, unknown> = {}
): ToolMetadata {
  return {
    id: `test:${name}`,
    name,
    description,
    parameters,
    source: 'local',
    sourceId: 'test',
  };
}

/**
 * Create a mock StructuredTool that returns a predictable result
 */
function createMockTool(name: string, result: unknown): StructuredTool {
  return {
    name,
    description: `Mock ${name} tool`,
    invoke: vi.fn().mockResolvedValue(result),
  } as unknown as StructuredTool;
}

/**
 * Create a mock StructuredTool that throws an error
 */
function createFailingTool(name: string, errorMessage: string): StructuredTool {
  return {
    name,
    description: `Failing ${name} tool`,
    invoke: vi.fn().mockRejectedValue(new Error(errorMessage)),
  } as unknown as StructuredTool;
}

/**
 * Create mock adapter config with controllable behavior
 */
function createMockConfig(options: {
  tools?: ToolMetadata[];
  searchResults?: SearchResult[];
  loadedTools?: Map<string, StructuredTool>;
}): AdapterConfig {
  const tools = options.tools ?? [];
  const searchResults = options.searchResults ?? [];
  const loadedTools = options.loadedTools ?? new Map();

  const catalog: ToolCatalog = {
    getAllMetadata: vi.fn().mockReturnValue(tools),
    getMetadata: vi.fn((id: string) => tools.find((t) => t.id === id) ?? null),
    getSource: vi.fn().mockReturnValue(null),
    register: vi.fn(),
    unregister: vi.fn(),
    onToolsChanged: {
      subscribe: vi.fn().mockReturnValue(() => {}),
      on: vi.fn().mockReturnValue(() => {}),
      emit: vi.fn(),
      subscriberCount: vi.fn().mockReturnValue(0),
      clear: vi.fn(),
    },
  };

  const searchIndex: SearchIndex = {
    search: vi.fn().mockResolvedValue(searchResults),
    index: vi.fn(),
    reindex: vi.fn(),
  };

  const loader: ToolLoader = {
    load: vi.fn((id: string) => {
      const tool = loadedTools.get(id);
      if (!tool) {
        throw new Error(`Tool not found: ${id}`);
      }
      return Promise.resolve(tool);
    }),
    warmup: vi.fn(),
    evict: vi.fn(),
    clear: vi.fn(),
  };

  return { catalog, loader, searchIndex };
}

// =============================================================================
// Tests
// =============================================================================

describe('AgentProtocolHandler', () => {
  describe('listTools', () => {
    it('returns all tools in Agent Protocol format', async () => {
      const tools = [
        createToolMetadata('create_pr', 'Create a pull request', {
          type: 'object',
          properties: { title: { type: 'string' } },
        }),
        createToolMetadata('list_repos', 'List repositories'),
      ];

      const config = createMockConfig({ tools });
      const handler = createAgentProtocolHandler(config);

      const result = await handler.listTools();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'create_pr',
        description: 'Create a pull request',
        parameters: {
          type: 'object',
          properties: { title: { type: 'string' } },
        },
      });
      expect(result[1]).toEqual({
        name: 'list_repos',
        description: 'List repositories',
        parameters: {},
      });
    });

    it('returns empty array when no tools registered', async () => {
      const config = createMockConfig({ tools: [] });
      const handler = createAgentProtocolHandler(config);

      const result = await handler.listTools();

      expect(result).toEqual([]);
    });
  });

  describe('searchTools', () => {
    it('returns matching tools sorted by relevance', async () => {
      const tools = [
        createToolMetadata('create_pr', 'Create a GitHub pull request'),
        createToolMetadata('list_prs', 'List pull requests'),
        createToolMetadata('calculator', 'Perform calculations'),
      ];

      const searchResults: SearchResult[] = [
        { toolId: 'test:create_pr', score: 0.9, matchType: 'bm25' },
        { toolId: 'test:list_prs', score: 0.7, matchType: 'bm25' },
      ];

      const config = createMockConfig({ tools, searchResults });
      const handler = createAgentProtocolHandler(config);

      const result = await handler.searchTools('pull request', 5);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('create_pr');
      expect(result[1].name).toBe('list_prs');
    });

    it('respects limit parameter', async () => {
      const config = createMockConfig({ tools: [] });
      const handler = createAgentProtocolHandler(config);

      await handler.searchTools('test query', 10);

      expect(config.searchIndex.search).toHaveBeenCalledWith('test query', {
        limit: 10,
      });
    });

    it('uses default limit of 5 when not specified', async () => {
      const config = createMockConfig({ tools: [] });
      const handler = createAgentProtocolHandler(config);

      // Call without limit parameter to test the default
      await handler.searchTools('test query');

      expect(config.searchIndex.search).toHaveBeenCalledWith('test query', {
        limit: 5,
      });
    });

    it('handles tools removed between search and metadata lookup', async () => {
      // Tool exists in search results but not in catalog (race condition)
      const searchResults: SearchResult[] = [
        { toolId: 'test:removed_tool', score: 0.9, matchType: 'bm25' },
      ];

      const config = createMockConfig({ tools: [], searchResults });
      const handler = createAgentProtocolHandler(config);

      const result = await handler.searchTools('removed', 5);

      // Should gracefully handle missing tool
      expect(result).toEqual([]);
    });
  });

  describe('executeTool', () => {
    it('executes tool and returns string output', async () => {
      const tools = [createToolMetadata('echo', 'Echo back the input')];
      const mockTool = createMockTool('echo', 'Hello, World!');

      const config = createMockConfig({
        tools,
        loadedTools: new Map([['test:echo', mockTool]]),
      });
      const handler = createAgentProtocolHandler(config);

      const result = await handler.executeTool('echo', { message: 'Hello' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe('Hello, World!');
        expect(result.data.tool_call_id).toMatch(/^call_[a-z0-9]+_[a-z0-9]+$/);
      }
    });

    it('serializes non-string output to JSON', async () => {
      const tools = [createToolMetadata('get_data', 'Get structured data')];
      const mockTool = createMockTool('get_data', { count: 42, items: ['a', 'b'] });

      const config = createMockConfig({
        tools,
        loadedTools: new Map([['test:get_data', mockTool]]),
      });
      const handler = createAgentProtocolHandler(config);

      const result = await handler.executeTool('get_data', {});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe('{"count":42,"items":["a","b"]}');
      }
    });

    it('returns error when tool not found', async () => {
      const config = createMockConfig({ tools: [] });
      const handler = createAgentProtocolHandler(config);

      const result = await handler.executeTool('nonexistent', {});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('TOOL_NOT_FOUND');
        expect(result.error.message).toBe('Tool not found: nonexistent');
      }
    });

    it('returns error when tool execution fails', async () => {
      const tools = [createToolMetadata('failing', 'A tool that fails')];
      const failingTool = createFailingTool('failing', 'Connection timeout');

      const config = createMockConfig({
        tools,
        loadedTools: new Map([['test:failing', failingTool]]),
      });
      const handler = createAgentProtocolHandler(config);

      const result = await handler.executeTool('failing', {});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EXECUTION_ERROR');
        expect(result.error.message).toBe('Connection timeout');
      }
    });

    it('passes arguments to tool correctly', async () => {
      const tools = [createToolMetadata('calc', 'Calculate something')];
      const mockTool = createMockTool('calc', 'result');

      const config = createMockConfig({
        tools,
        loadedTools: new Map([['test:calc', mockTool]]),
      });
      const handler = createAgentProtocolHandler(config);

      await handler.executeTool('calc', { a: 1, b: 2 });

      expect(mockTool.invoke).toHaveBeenCalledWith({ a: 1, b: 2 });
    });

    it('generates unique tool call IDs', async () => {
      const tools = [createToolMetadata('tool', 'A tool')];
      const mockTool = createMockTool('tool', 'result');

      const config = createMockConfig({
        tools,
        loadedTools: new Map([['test:tool', mockTool]]),
      });
      const handler = createAgentProtocolHandler(config);

      const result1 = await handler.executeTool('tool', {});
      const result2 = await handler.executeTool('tool', {});

      if (result1.success && result2.success) {
        expect(result1.data.tool_call_id).not.toBe(result2.data.tool_call_id);
      }
    });
  });
});
