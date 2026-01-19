/**
 * Tests for Inngest AgentKit adapter.
 *
 * These tests verify the adapter correctly converts bigtool-ts tools
 * to Inngest format and handles edge cases appropriately.
 */

import { describe, it, expect, vi } from 'vitest';
import type { StructuredTool } from '@langchain/core/tools';
import type { ToolMetadata, ToolCatalog, ToolLoader, SearchIndex, SearchResult } from '../types.js';
import { createInngestAdapter, InngestAdapter, type InngestToolOptions } from './inngest.js';

// ═══════════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════════

function createMockMetadata(overrides: Partial<ToolMetadata> = {}): ToolMetadata {
  return {
    id: 'test:mock_tool',
    name: 'mock_tool',
    description: 'A mock tool for testing',
    source: 'local',
    sourceId: 'test',
    ...overrides,
  };
}

function createMockCatalog(tools: ToolMetadata[] = []): ToolCatalog {
  const toolMap = new Map(tools.map((t) => [t.id, t]));

  return {
    getMetadata: (id: string) => toolMap.get(id) ?? null,
    getAllMetadata: () => [...toolMap.values()],
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
}

function createMockLoader(): ToolLoader {
  const mockTool = {
    invoke: vi.fn().mockResolvedValue({ result: 'success' }),
  } as unknown as StructuredTool;

  return {
    load: vi.fn().mockResolvedValue(mockTool),
    warmup: vi.fn(),
    evict: vi.fn(),
    clear: vi.fn(),
  };
}

function createMockSearchIndex(results: SearchResult[] = []): SearchIndex {
  return {
    search: vi.fn().mockResolvedValue(results),
    index: vi.fn(),
    reindex: vi.fn(),
  };
}

function createMockToolOptions(overrides: Partial<InngestToolOptions> = {}): InngestToolOptions {
  return {
    agent: {},
    network: undefined,
    step: undefined,
    ...overrides,
  };
}

function createMockStep() {
  return {
    run: vi.fn().mockImplementation((_name: string, fn: () => unknown) => fn()),
    waitForEvent: vi.fn(),
  };
}

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

describe('InngestAdapter', () => {
  describe('createInngestAdapter factory', () => {
    it('creates an InngestAdapter instance', () => {
      const adapter = createInngestAdapter({
        catalog: createMockCatalog(),
        loader: createMockLoader(),
        searchIndex: createMockSearchIndex(),
      });

      expect(adapter).toBeInstanceOf(InngestAdapter);
    });
  });

  describe('toFrameworkTool', () => {
    it('converts metadata to Inngest tool format', () => {
      const metadata = createMockMetadata({
        name: 'create_pr',
        description: 'Creates a pull request',
      });
      const adapter = createInngestAdapter({
        catalog: createMockCatalog([metadata]),
        loader: createMockLoader(),
        searchIndex: createMockSearchIndex(),
      });

      const tool = adapter.toFrameworkTool(metadata);

      expect(tool.name).toBe('create_pr');
      expect(tool.description).toBe('Creates a pull request');
      expect(typeof tool.handler).toBe('function');
    });

    it('tool handler calls loader and invokes tool', async () => {
      const mockLoader = createMockLoader();
      const metadata = createMockMetadata();
      const adapter = createInngestAdapter({
        catalog: createMockCatalog([metadata]),
        loader: mockLoader,
        searchIndex: createMockSearchIndex(),
      });

      const tool = adapter.toFrameworkTool(metadata);
      const result = await tool.handler({ arg: 'value' }, createMockToolOptions());

      expect(mockLoader.load).toHaveBeenCalledWith('test:mock_tool');
      expect(result).toEqual({ result: 'success' });
    });

    it('wraps execution in step.run when step context is available', async () => {
      const mockStep = createMockStep();
      const metadata = createMockMetadata({ name: 'durable_tool' });
      const adapter = createInngestAdapter({
        catalog: createMockCatalog([metadata]),
        loader: createMockLoader(),
        searchIndex: createMockSearchIndex(),
      });

      const tool = adapter.toFrameworkTool(metadata);
      await tool.handler({}, createMockToolOptions({ step: mockStep }));

      expect(mockStep.run).toHaveBeenCalledWith(
        'bigtool:durable_tool',
        expect.any(Function)
      );
    });

    it('executes directly without step.run when step is not available', async () => {
      const mockLoader = createMockLoader();
      const metadata = createMockMetadata();
      const adapter = createInngestAdapter({
        catalog: createMockCatalog([metadata]),
        loader: mockLoader,
        searchIndex: createMockSearchIndex(),
      });

      const tool = adapter.toFrameworkTool(metadata);
      await tool.handler({}, createMockToolOptions({ step: undefined }));

      // Should still work, just without durability
      expect(mockLoader.load).toHaveBeenCalled();
    });
  });

  describe('getTools', () => {
    it('returns tools for valid IDs', async () => {
      const tools = [
        createMockMetadata({ id: 'github:create_pr', name: 'create_pr' }),
        createMockMetadata({ id: 'slack:send', name: 'send_message' }),
      ];
      const adapter = createInngestAdapter({
        catalog: createMockCatalog(tools),
        loader: createMockLoader(),
        searchIndex: createMockSearchIndex(),
      });

      const result = await adapter.getTools(['github:create_pr', 'slack:send']);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('create_pr');
      expect(result[1].name).toBe('send_message');
    });

    it('silently skips tools not found in catalog', async () => {
      const tools = [createMockMetadata({ id: 'github:create_pr', name: 'create_pr' })];
      const adapter = createInngestAdapter({
        catalog: createMockCatalog(tools),
        loader: createMockLoader(),
        searchIndex: createMockSearchIndex(),
      });

      const result = await adapter.getTools(['github:create_pr', 'nonexistent:tool']);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('create_pr');
    });

    it('returns empty array when no tools match', async () => {
      const adapter = createInngestAdapter({
        catalog: createMockCatalog([]),
        loader: createMockLoader(),
        searchIndex: createMockSearchIndex(),
      });

      const result = await adapter.getTools(['nonexistent:tool']);

      expect(result).toEqual([]);
    });
  });

  describe('getAllTools', () => {
    it('returns all tools from catalog', async () => {
      const tools = [
        createMockMetadata({ id: 'tool1', name: 'tool_one' }),
        createMockMetadata({ id: 'tool2', name: 'tool_two' }),
        createMockMetadata({ id: 'tool3', name: 'tool_three' }),
      ];
      const adapter = createInngestAdapter({
        catalog: createMockCatalog(tools),
        loader: createMockLoader(),
        searchIndex: createMockSearchIndex(),
      });

      const result = await adapter.getAllTools();

      expect(result).toHaveLength(3);
    });
  });

  describe('getToolsByCategory', () => {
    it('filters tools by category', async () => {
      const tools = [
        createMockMetadata({ id: 'github:pr', name: 'create_pr', categories: ['github', 'git'] }),
        createMockMetadata({ id: 'slack:msg', name: 'send', categories: ['slack', 'chat'] }),
        createMockMetadata({ id: 'github:issue', name: 'issue', categories: ['github'] }),
      ];
      const adapter = createInngestAdapter({
        catalog: createMockCatalog(tools),
        loader: createMockLoader(),
        searchIndex: createMockSearchIndex(),
      });

      const result = await adapter.getToolsByCategory(['github']);

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.name).sort()).toEqual(['create_pr', 'issue']);
    });

    it('matches tools with any of the provided categories', async () => {
      const tools = [
        createMockMetadata({ id: 'tool1', name: 'tool1', categories: ['cat-a'] }),
        createMockMetadata({ id: 'tool2', name: 'tool2', categories: ['cat-b'] }),
        createMockMetadata({ id: 'tool3', name: 'tool3', categories: ['cat-c'] }),
      ];
      const adapter = createInngestAdapter({
        catalog: createMockCatalog(tools),
        loader: createMockLoader(),
        searchIndex: createMockSearchIndex(),
      });

      const result = await adapter.getToolsByCategory(['cat-a', 'cat-c']);

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.name).sort()).toEqual(['tool1', 'tool3']);
    });

    it('returns empty array when no categories match', async () => {
      const tools = [
        createMockMetadata({ id: 'tool1', name: 'tool1', categories: ['cat-a'] }),
      ];
      const adapter = createInngestAdapter({
        catalog: createMockCatalog(tools),
        loader: createMockLoader(),
        searchIndex: createMockSearchIndex(),
      });

      const result = await adapter.getToolsByCategory(['nonexistent']);

      expect(result).toEqual([]);
    });
  });

  describe('createSearchTool', () => {
    it('creates a tool with correct name and description', () => {
      const adapter = createInngestAdapter({
        catalog: createMockCatalog(),
        loader: createMockLoader(),
        searchIndex: createMockSearchIndex(),
      });

      const tool = adapter.createSearchTool();

      expect(tool.name).toBe('search_tools');
      expect(tool.description).toContain('Search for available tools');
    });

    it('searches index and returns formatted results', async () => {
      const metadata = createMockMetadata({ id: 'github:pr', name: 'create_pr' });
      const searchResults: SearchResult[] = [
        { toolId: 'github:pr', score: 0.95, matchType: 'bm25' },
      ];
      const adapter = createInngestAdapter({
        catalog: createMockCatalog([metadata]),
        loader: createMockLoader(),
        searchIndex: createMockSearchIndex(searchResults),
      });

      const tool = adapter.createSearchTool();
      const result = await tool.handler(
        { query: 'create pull request' },
        createMockToolOptions()
      );

      expect(result).toEqual([
        { name: 'create_pr', description: 'A mock tool for testing', score: 0.95 },
      ]);
    });

    it('applies search options (limit, threshold, categories)', async () => {
      const mockSearchIndex = createMockSearchIndex([]);
      const adapter = createInngestAdapter({
        catalog: createMockCatalog(),
        loader: createMockLoader(),
        searchIndex: mockSearchIndex,
      });

      const tool = adapter.createSearchTool({
        limit: 10,
        threshold: 0.5,
        categories: ['github'],
      });
      await tool.handler({ query: 'test' }, createMockToolOptions());

      expect(mockSearchIndex.search).toHaveBeenCalledWith('test', {
        limit: 10,
        threshold: 0.5,
        categories: ['github'],
      });
    });

    it('uses step.run for durable execution when available', async () => {
      const mockStep = createMockStep();
      const adapter = createInngestAdapter({
        catalog: createMockCatalog(),
        loader: createMockLoader(),
        searchIndex: createMockSearchIndex([]),
      });

      const tool = adapter.createSearchTool();
      await tool.handler({ query: 'test' }, createMockToolOptions({ step: mockStep }));

      expect(mockStep.run).toHaveBeenCalledWith('bigtool:search_tools', expect.any(Function));
    });

    it('handles missing metadata gracefully', async () => {
      // Search returns a result but metadata is not in catalog
      const searchResults: SearchResult[] = [
        { toolId: 'missing:tool', score: 0.8, matchType: 'bm25' },
      ];
      const adapter = createInngestAdapter({
        catalog: createMockCatalog([]), // Empty catalog
        loader: createMockLoader(),
        searchIndex: createMockSearchIndex(searchResults),
      });

      const tool = adapter.createSearchTool();
      const result = await tool.handler({ query: 'test' }, createMockToolOptions());

      // Should fall back to toolId as name and empty description
      expect(result).toEqual([{ name: 'missing:tool', description: '', score: 0.8 }]);
    });
  });

  describe('createCallToolTool', () => {
    it('creates a tool with correct name and description', () => {
      const adapter = createInngestAdapter({
        catalog: createMockCatalog(),
        loader: createMockLoader(),
        searchIndex: createMockSearchIndex(),
      });

      const tool = adapter.createCallToolTool();

      expect(tool.name).toBe('call_tool');
      expect(tool.description).toContain('Call a tool by name');
    });

    it('loads and invokes tool by name', async () => {
      const metadata = createMockMetadata({ id: 'github:pr', name: 'create_pr' });
      const mockLoader = createMockLoader();
      const adapter = createInngestAdapter({
        catalog: createMockCatalog([metadata]),
        loader: mockLoader,
        searchIndex: createMockSearchIndex(),
      });

      const tool = adapter.createCallToolTool();
      await tool.handler(
        { toolName: 'create_pr', arguments: { title: 'My PR' } },
        createMockToolOptions()
      );

      expect(mockLoader.load).toHaveBeenCalledWith('github:pr');
    });

    it('throws error when tool name not found', async () => {
      const adapter = createInngestAdapter({
        catalog: createMockCatalog([]),
        loader: createMockLoader(),
        searchIndex: createMockSearchIndex(),
      });

      const tool = adapter.createCallToolTool();

      await expect(
        tool.handler({ toolName: 'nonexistent', arguments: {} }, createMockToolOptions())
      ).rejects.toThrow('Tool not found: nonexistent');
    });

    it('uses step.run with tool name for durable execution', async () => {
      const mockStep = createMockStep();
      const metadata = createMockMetadata({ id: 'test:tool', name: 'my_tool' });
      const adapter = createInngestAdapter({
        catalog: createMockCatalog([metadata]),
        loader: createMockLoader(),
        searchIndex: createMockSearchIndex(),
      });

      const tool = adapter.createCallToolTool();
      await tool.handler(
        { toolName: 'my_tool', arguments: {} },
        createMockToolOptions({ step: mockStep })
      );

      expect(mockStep.run).toHaveBeenCalledWith('bigtool:call:my_tool', expect.any(Function));
    });

    it('passes arguments correctly to the invoked tool', async () => {
      const metadata = createMockMetadata({ id: 'test:calc', name: 'calculator' });
      const mockTool = { invoke: vi.fn().mockResolvedValue(42) };
      const mockLoader = {
        load: vi.fn().mockResolvedValue(mockTool),
        warmup: vi.fn(),
        evict: vi.fn(),
        clear: vi.fn(),
      };
      const adapter = createInngestAdapter({
        catalog: createMockCatalog([metadata]),
        loader: mockLoader,
        searchIndex: createMockSearchIndex(),
      });

      const tool = adapter.createCallToolTool();
      await tool.handler(
        { toolName: 'calculator', arguments: { a: 1, b: 2, op: 'add' } },
        createMockToolOptions()
      );

      expect(mockTool.invoke).toHaveBeenCalledWith({ a: 1, b: 2, op: 'add' });
    });
  });
});
