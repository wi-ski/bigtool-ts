/**
 * Tests for the Vercel AI SDK adapter.
 *
 * These tests verify behavior, not implementation details.
 * We test the public contract: inputs and outputs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { VercelAIAdapter, createVercelAdapter } from './vercel-ai.js';
import type { AdapterConfig } from './types.js';
import type {
  ToolMetadata,
  ToolCatalog,
  ToolLoader,
  SearchIndex,
  SearchResult,
} from '../types.js';

// ═══════════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════════

function createMockTool(name: string) {
  return new DynamicStructuredTool({
    name,
    description: `Mock ${name} tool`,
    schema: z.object({ input: z.string() }),
    func: async ({ input }) => `Result: ${input}`,
  });
}

function createMockMetadata(id: string, name: string): ToolMetadata {
  return {
    id,
    name,
    description: `Description for ${name}`,
    parameters: {
      type: 'object',
      properties: {
        input: { type: 'string' },
      },
      required: ['input'],
    },
    source: 'local',
    sourceId: 'test',
  };
}

function createMockCatalog(metadataMap: Map<string, ToolMetadata>): ToolCatalog {
  return {
    getMetadata: (id: string) => metadataMap.get(id) ?? null,
    getAllMetadata: () => Array.from(metadataMap.values()),
    getSource: () => null,
    register: vi.fn(),
    unregister: vi.fn(),
    onToolsChanged: {
      subscribe: vi.fn(() => vi.fn()),
      on: vi.fn(() => vi.fn()),
      emit: vi.fn(),
      subscriberCount: () => 0,
      clear: vi.fn(),
    },
  };
}

function createMockLoader(toolMap: Map<string, ReturnType<typeof createMockTool>>): ToolLoader {
  return {
    load: async (id: string) => {
      const tool = toolMap.get(id);
      if (!tool) {
        throw new Error(`Tool not found: ${id}`);
      }
      return tool;
    },
    warmup: vi.fn(),
    evict: vi.fn(),
    clear: vi.fn(),
  };
}

function createMockSearchIndex(results: SearchResult[]): SearchIndex {
  return {
    index: vi.fn(),
    search: vi.fn().mockResolvedValue(results),
    reindex: vi.fn(),
  };
}

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

describe('VercelAIAdapter', () => {
  let adapter: VercelAIAdapter;
  let metadataMap: Map<string, ToolMetadata>;
  let toolMap: Map<string, ReturnType<typeof createMockTool>>;
  let searchResults: SearchResult[];

  beforeEach(() => {
    metadataMap = new Map([
      ['local:create_pr', createMockMetadata('local:create_pr', 'create_pr')],
      ['local:send_message', createMockMetadata('local:send_message', 'send_message')],
    ]);

    toolMap = new Map([
      ['local:create_pr', createMockTool('create_pr')],
      ['local:send_message', createMockTool('send_message')],
    ]);

    searchResults = [
      { toolId: 'local:create_pr', score: 0.9, matchType: 'bm25' },
      { toolId: 'local:send_message', score: 0.7, matchType: 'bm25' },
    ];

    const config: AdapterConfig = {
      catalog: createMockCatalog(metadataMap),
      loader: createMockLoader(toolMap),
      searchIndex: createMockSearchIndex(searchResults),
    };

    adapter = new VercelAIAdapter(config);
  });

  describe('toFrameworkTool', () => {
    it('converts metadata to Vercel AI tool format', () => {
      const metadata = createMockMetadata('local:test', 'test_tool');

      const tool = adapter.toFrameworkTool(metadata);

      expect(tool.description).toBe('Description for test_tool');
      expect(tool.inputSchema).toEqual({
        type: 'object',
        properties: { input: { type: 'string' } },
        required: ['input'],
      });
      expect(tool.execute).toBeDefined();
    });

    it('handles metadata without parameters', () => {
      const metadata: ToolMetadata = {
        id: 'local:no_params',
        name: 'no_params',
        description: 'Tool without parameters',
        source: 'local',
        sourceId: 'test',
      };

      const tool = adapter.toFrameworkTool(metadata);

      expect(tool.inputSchema).toEqual({ type: 'object', properties: {} });
    });

    it('executes the underlying tool when called', async () => {
      const metadata = metadataMap.get('local:create_pr')!;
      const tool = adapter.toFrameworkTool(metadata);

      const result = await tool.execute!(
        { input: 'test input' },
        { toolCallId: '123' }
      );

      expect(result).toBe('Result: test input');
    });

    it('respects abort signal before loading', async () => {
      const metadata = metadataMap.get('local:create_pr')!;
      const tool = adapter.toFrameworkTool(metadata);

      const abortController = new AbortController();
      abortController.abort();

      await expect(
        tool.execute!(
          { input: 'test' },
          { toolCallId: '123', abortSignal: abortController.signal }
        )
      ).rejects.toThrow();
    });
  });

  describe('getTools', () => {
    it('returns tools for valid IDs', async () => {
      const tools = await adapter.getTools(['local:create_pr', 'local:send_message']);

      expect(tools).toHaveLength(2);
      expect(tools[0].description).toBe('Description for create_pr');
      expect(tools[1].description).toBe('Description for send_message');
    });

    it('skips missing tool IDs silently', async () => {
      const tools = await adapter.getTools([
        'local:create_pr',
        'local:nonexistent',
        'local:send_message',
      ]);

      expect(tools).toHaveLength(2);
    });

    it('returns empty array for empty input', async () => {
      const tools = await adapter.getTools([]);

      expect(tools).toEqual([]);
    });

    it('returns empty array when all IDs are invalid', async () => {
      const tools = await adapter.getTools(['invalid:one', 'invalid:two']);

      expect(tools).toEqual([]);
    });
  });

  describe('getToolsAsRecord', () => {
    it('returns tools keyed by name', async () => {
      const tools = await adapter.getToolsAsRecord([
        'local:create_pr',
        'local:send_message',
      ]);

      expect(Object.keys(tools)).toEqual(['create_pr', 'send_message']);
      expect(tools['create_pr'].description).toBe('Description for create_pr');
      expect(tools['send_message'].description).toBe('Description for send_message');
    });

    it('skips missing tool IDs silently', async () => {
      const tools = await adapter.getToolsAsRecord([
        'local:create_pr',
        'local:nonexistent',
      ]);

      expect(Object.keys(tools)).toEqual(['create_pr']);
    });

    it('returns empty record for empty input', async () => {
      const tools = await adapter.getToolsAsRecord([]);

      expect(tools).toEqual({});
    });
  });

  describe('createSearchTool', () => {
    it('creates a tool with search capability', async () => {
      const searchTool = adapter.createSearchTool();

      expect(searchTool.description).toContain('Search for available tools');
      expect(searchTool.inputSchema).toBeDefined();
      expect(searchTool.outputSchema).toBeDefined();
      expect(searchTool.execute).toBeDefined();
    });

    it('returns search results with metadata', async () => {
      const searchTool = adapter.createSearchTool();

      const results = await searchTool.execute!(
        { query: 'github' },
        { toolCallId: '123' }
      );

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        name: 'create_pr',
        description: 'Description for create_pr',
        score: 0.9,
      });
    });

    it('passes options to search index', async () => {
      const config: AdapterConfig = {
        catalog: createMockCatalog(metadataMap),
        loader: createMockLoader(toolMap),
        searchIndex: createMockSearchIndex(searchResults),
      };
      const customAdapter = new VercelAIAdapter(config);
      const searchMock = config.searchIndex.search as ReturnType<typeof vi.fn>;

      const searchTool = customAdapter.createSearchTool({
        limit: 10,
        threshold: 0.5,
        categories: ['github'],
      });

      await searchTool.execute!({ query: 'test' }, { toolCallId: '123' });

      expect(searchMock).toHaveBeenCalledWith('test', {
        limit: 10,
        threshold: 0.5,
        categories: ['github'],
      });
    });

    it('uses default options when not specified', async () => {
      const config: AdapterConfig = {
        catalog: createMockCatalog(metadataMap),
        loader: createMockLoader(toolMap),
        searchIndex: createMockSearchIndex(searchResults),
      };
      const customAdapter = new VercelAIAdapter(config);
      const searchMock = config.searchIndex.search as ReturnType<typeof vi.fn>;

      const searchTool = customAdapter.createSearchTool();

      await searchTool.execute!({ query: 'test' }, { toolCallId: '123' });

      expect(searchMock).toHaveBeenCalledWith('test', {
        limit: 5,
        threshold: 0,
        categories: undefined,
      });
    });

    it('handles missing metadata gracefully', async () => {
      const sparseMetadataMap = new Map([
        ['local:create_pr', createMockMetadata('local:create_pr', 'create_pr')],
      ]);
      const resultsWithMissing: SearchResult[] = [
        { toolId: 'local:create_pr', score: 0.9, matchType: 'bm25' },
        { toolId: 'local:unknown', score: 0.5, matchType: 'bm25' },
      ];

      const config: AdapterConfig = {
        catalog: createMockCatalog(sparseMetadataMap),
        loader: createMockLoader(toolMap),
        searchIndex: createMockSearchIndex(resultsWithMissing),
      };
      const customAdapter = new VercelAIAdapter(config);
      const searchTool = customAdapter.createSearchTool();

      const results = await searchTool.execute!(
        { query: 'test' },
        { toolCallId: '123' }
      );

      expect(results).toHaveLength(2);
      expect(results[1]).toEqual({
        name: 'local:unknown',
        description: '',
        score: 0.5,
      });
    });
  });
});

describe('createVercelAdapter', () => {
  it('returns a VercelAIAdapter instance', () => {
    const config: AdapterConfig = {
      catalog: createMockCatalog(new Map()),
      loader: createMockLoader(new Map()),
      searchIndex: createMockSearchIndex([]),
    };

    const adapter = createVercelAdapter(config);

    expect(adapter).toBeInstanceOf(VercelAIAdapter);
  });
});
