/**
 * Mastra Adapter Tests
 *
 * Tests the MastraAdapter for correct tool conversion and search behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MastraAdapter, createMastraAdapter } from './mastra.js';
import type { ToolCatalog, ToolLoader, SearchIndex, ToolMetadata, SearchResult } from '../types.js';
import type { AdapterConfig } from './types.js';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockMetadata(overrides: Partial<ToolMetadata> = {}): ToolMetadata {
  return {
    id: 'test:tool',
    name: 'tool',
    description: 'A test tool',
    source: 'local',
    sourceId: 'test',
    ...overrides,
  };
}

function createMockCatalog(tools: ToolMetadata[]): ToolCatalog {
  const toolMap = new Map(tools.map((t) => [t.id, t]));

  return {
    getMetadata: (id: string) => toolMap.get(id) ?? null,
    getAllMetadata: () => [...tools],
    register: vi.fn(),
    unregister: vi.fn(),
    getSource: vi.fn().mockReturnValue(null),
    onToolsChanged: {
      subscribe: vi.fn().mockReturnValue(() => {}),
      on: vi.fn().mockReturnValue(() => {}),
      emit: vi.fn(),
      subscriberCount: vi.fn().mockReturnValue(0),
      clear: vi.fn(),
    },
  };
}

function createMockLoader(): ToolLoader {
  return {
    load: vi.fn().mockResolvedValue({
      invoke: vi.fn().mockResolvedValue({ result: 'success' }),
    }),
    warmup: vi.fn(),
    evict: vi.fn(),
    clear: vi.fn(),
  };
}

function createMockSearchIndex(results: SearchResult[] = []): SearchIndex {
  return {
    index: vi.fn(),
    search: vi.fn().mockResolvedValue(results),
    reindex: vi.fn(),
  };
}

function createTestConfig(
  tools: ToolMetadata[] = [],
  searchResults: SearchResult[] = []
): AdapterConfig & { loader: ToolLoader & { load: ReturnType<typeof vi.fn> } } {
  return {
    catalog: createMockCatalog(tools),
    loader: createMockLoader() as ToolLoader & { load: ReturnType<typeof vi.fn> },
    searchIndex: createMockSearchIndex(searchResults),
  };
}

// =============================================================================
// MastraAdapter Tests
// =============================================================================

describe('MastraAdapter', () => {
  describe('toFrameworkTool', () => {
    it('creates a tool with id (not name)', () => {
      const metadata = createMockMetadata({
        id: 'github:create_pr',
        name: 'create_pr',
        description: 'Creates a pull request',
      });
      const config = createTestConfig([metadata]);
      const adapter = new MastraAdapter(config);

      const tool = adapter.toFrameworkTool(metadata);

      // Mastra uses 'id' only, NOT 'name'
      expect(tool.id).toBe('github:create_pr');
      expect(tool.description).toBe('Creates a pull request');
      expect((tool as Record<string, unknown>).name).toBeUndefined();
    });

    it('execute receives inputData directly (not destructured)', async () => {
      const metadata = createMockMetadata({ id: 'test:echo' });
      const config = createTestConfig([metadata]);
      const adapter = new MastraAdapter(config);

      const tool = adapter.toFrameworkTool(metadata);
      const input = { message: 'hello' };

      await tool.execute(input);

      // Verify loader.load was called with correct tool id
      expect(config.loader.load).toHaveBeenCalledWith('test:echo');
    });

    it('includes inputSchema for validation', () => {
      const metadata = createMockMetadata({
        parameters: {
          type: 'object',
          properties: { query: { type: 'string' } },
        },
      });
      const config = createTestConfig([metadata]);
      const adapter = new MastraAdapter(config);

      const tool = adapter.toFrameworkTool(metadata);

      expect(tool.inputSchema).toBeDefined();
      // Schema should parse successfully
      expect(() => tool.inputSchema.parse({})).not.toThrow();
    });
  });

  describe('getTools', () => {
    it('returns tools converted to Mastra format', async () => {
      const tools = [
        createMockMetadata({ id: 'github:create_pr', description: 'Create PR' }),
        createMockMetadata({ id: 'slack:send_message', description: 'Send Slack' }),
      ];
      const config = createTestConfig(tools);
      const adapter = new MastraAdapter(config);

      const result = await adapter.getTools(['github:create_pr', 'slack:send_message']);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('github:create_pr');
      expect(result[1].id).toBe('slack:send_message');
    });

    it('skips tools not found in catalog', async () => {
      const tools = [createMockMetadata({ id: 'github:create_pr' })];
      const config = createTestConfig(tools);
      const adapter = new MastraAdapter(config);

      const result = await adapter.getTools(['github:create_pr', 'nonexistent:tool']);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('github:create_pr');
    });

    it('returns empty array when no tools found', async () => {
      const config = createTestConfig([]);
      const adapter = new MastraAdapter(config);

      const result = await adapter.getTools(['nonexistent:tool']);

      expect(result).toEqual([]);
    });
  });

  describe('getToolsAsRecord', () => {
    it('returns tools as Record with name keys', async () => {
      const tools = [
        createMockMetadata({ id: 'github:create_pr' }),
        createMockMetadata({ id: 'slack:send_message' }),
      ];
      const config = createTestConfig(tools);
      const adapter = new MastraAdapter(config);

      const result = await adapter.getToolsAsRecord(['github:create_pr', 'slack:send_message']);

      expect(Object.keys(result).sort()).toEqual(['create_pr', 'send_message']);
      expect(result.create_pr.id).toBe('github:create_pr');
      expect(result.send_message.id).toBe('slack:send_message');
    });

    it('extracts tool name from ID with colon separator', async () => {
      const tools = [createMockMetadata({ id: 'namespace:subns:toolname' })];
      const config = createTestConfig(tools);
      const adapter = new MastraAdapter(config);

      const result = await adapter.getToolsAsRecord(['namespace:subns:toolname']);

      // Uses last segment after colon
      expect(Object.keys(result)).toEqual(['toolname']);
    });

    it('uses full ID when no namespace separator', async () => {
      const tools = [createMockMetadata({ id: 'simple-tool' })];
      const config = createTestConfig(tools);
      const adapter = new MastraAdapter(config);

      const result = await adapter.getToolsAsRecord(['simple-tool']);

      expect(Object.keys(result)).toEqual(['simple-tool']);
    });

    it('skips missing tools without throwing', async () => {
      const tools = [createMockMetadata({ id: 'github:exists' })];
      const config = createTestConfig(tools);
      const adapter = new MastraAdapter(config);

      const result = await adapter.getToolsAsRecord(['github:exists', 'github:missing']);

      expect(Object.keys(result)).toEqual(['exists']);
    });
  });

  describe('createSearchTool', () => {
    it('creates a search tool with correct id', () => {
      const config = createTestConfig();
      const adapter = new MastraAdapter(config);

      const searchTool = adapter.createSearchTool();

      expect(searchTool.id).toBe('bigtool-search-tools');
      expect(searchTool.description).toContain('Search for available tools');
    });

    it('uses default options when none provided', async () => {
      const searchResults: SearchResult[] = [
        { toolId: 'github:create_pr', score: 0.9, matchType: 'bm25' },
      ];
      const tools = [createMockMetadata({ id: 'github:create_pr', description: 'Create PR' })];
      const config = createTestConfig(tools, searchResults);
      const adapter = new MastraAdapter(config);

      const searchTool = adapter.createSearchTool();
      const results = await searchTool.execute({ query: 'github' });

      expect(config.searchIndex.search).toHaveBeenCalledWith('github', {
        limit: 5,
        threshold: 0,
        categories: undefined,
      });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('github:create_pr');
    });

    it('applies custom search options', async () => {
      const config = createTestConfig();
      const adapter = new MastraAdapter(config);

      const searchTool = adapter.createSearchTool({
        limit: 10,
        threshold: 0.5,
        categories: ['github'],
      });

      await searchTool.execute({ query: 'test' });

      expect(config.searchIndex.search).toHaveBeenCalledWith('test', {
        limit: 10,
        threshold: 0.5,
        categories: ['github'],
      });
    });

    it('returns tool metadata in search results', async () => {
      const searchResults: SearchResult[] = [
        { toolId: 'github:create_pr', score: 0.95, matchType: 'bm25' },
        { toolId: 'github:list_repos', score: 0.82, matchType: 'bm25' },
      ];
      const tools = [
        createMockMetadata({ id: 'github:create_pr', description: 'Create a PR' }),
        createMockMetadata({ id: 'github:list_repos', description: 'List repos' }),
      ];
      const config = createTestConfig(tools, searchResults);
      const adapter = new MastraAdapter(config);

      const searchTool = adapter.createSearchTool();
      const results = await searchTool.execute({ query: 'github' });

      expect(results).toEqual([
        { id: 'github:create_pr', description: 'Create a PR', score: 0.95 },
        { id: 'github:list_repos', description: 'List repos', score: 0.82 },
      ]);
    });

    it('handles missing tool metadata gracefully', async () => {
      const searchResults: SearchResult[] = [
        { toolId: 'missing:tool', score: 0.9, matchType: 'bm25' },
      ];
      const config = createTestConfig([], searchResults);
      const adapter = new MastraAdapter(config);

      const searchTool = adapter.createSearchTool();
      const results = await searchTool.execute({ query: 'anything' });

      // Returns result with empty description when metadata not found
      expect(results).toEqual([{ id: 'missing:tool', description: '', score: 0.9 }]);
    });

    it('includes output schema for type safety', () => {
      const config = createTestConfig();
      const adapter = new MastraAdapter(config);

      const searchTool = adapter.createSearchTool();

      expect(searchTool.outputSchema).toBeDefined();
    });
  });

  describe('tool execution', () => {
    it('loads and invokes underlying tool implementation', async () => {
      const metadata = createMockMetadata({ id: 'test:calculator' });
      const config = createTestConfig([metadata]);
      const mockInvoke = vi.fn().mockResolvedValue({ sum: 42 });
      (config.loader.load as ReturnType<typeof vi.fn>).mockResolvedValue({
        invoke: mockInvoke,
      });
      const adapter = new MastraAdapter(config);

      const tool = adapter.toFrameworkTool(metadata);
      const result = await tool.execute({ a: 20, b: 22 });

      expect(config.loader.load).toHaveBeenCalledWith('test:calculator');
      expect(mockInvoke).toHaveBeenCalledWith({ a: 20, b: 22 });
      expect(result).toEqual({ sum: 42 });
    });

    it('propagates errors from tool execution', async () => {
      const metadata = createMockMetadata({ id: 'test:failing' });
      const config = createTestConfig([metadata]);
      (config.loader.load as ReturnType<typeof vi.fn>).mockResolvedValue({
        invoke: vi.fn().mockRejectedValue(new Error('Tool failed')),
      });
      const adapter = new MastraAdapter(config);

      const tool = adapter.toFrameworkTool(metadata);

      await expect(tool.execute({})).rejects.toThrow('Tool failed');
    });
  });
});

describe('createMastraAdapter', () => {
  it('creates a configured MastraAdapter instance', () => {
    const config = createTestConfig();
    const adapter = createMastraAdapter(config);

    expect(adapter).toBeInstanceOf(MastraAdapter);
  });

  it('adapter methods work correctly', async () => {
    const tools = [createMockMetadata({ id: 'test:tool' })];
    const config = createTestConfig(tools);
    const adapter = createMastraAdapter(config);

    const result = await adapter.getTools(['test:tool']);

    expect(result).toHaveLength(1);
  });
});
