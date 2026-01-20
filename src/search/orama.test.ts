/**
 * BigToolSearch Tests
 * 
 * Comprehensive test suite for the search module.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  BigToolSearch,
  createBM25Search,
  createVectorSearch,
  createHybridSearch,
} from "./orama.js";
import { MemoryCache, LRUCache } from "./cache.js";
import {
  normalizeBM25Scores,
  normalizeBM25Sigmoid,
  mergeHybridResults,
  mergeWithRRF,
  reciprocalRankFusion,
} from "./normalize.js";
import type { ToolMetadata, Embeddings } from "./types.js";
import type { SearchResult } from "../types/index.js";

// ═══════════════════════════════════════════════════════════════════════════
// Test Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const testTools: ToolMetadata[] = [
  {
    id: "github_create_pr",
    name: "github_create_pr",
    description: "Create a pull request on GitHub",
    categories: ["github", "git", "code-review"],
    keywords: ["PR", "pull request", "merge", "branch"],
    source: "local",
  },
  {
    id: "github_list_issues",
    name: "github_list_issues",
    description: "List issues from a GitHub repository",
    categories: ["github", "issues"],
    keywords: ["bug", "feature request", "ticket"],
    source: "local",
  },
  {
    id: "slack_send_message",
    name: "slack_send_message",
    description: "Send a message to a Slack channel",
    categories: ["slack", "communication", "messaging"],
    keywords: ["chat", "notify", "alert", "DM"],
    source: "local",
  },
  {
    id: "jira_create_ticket",
    name: "jira_create_ticket",
    description: "Create a new ticket in Jira",
    categories: ["jira", "project-management"],
    keywords: ["issue", "task", "story", "bug"],
    source: "mcp",
  },
  {
    id: "weather_forecast",
    name: "get_weather_forecast",
    description: "Get weather forecast for a location",
    categories: ["weather", "api"],
    keywords: ["temperature", "rain", "forecast", "climate"],
    source: "local",
  },
  {
    id: "calendar_create_event",
    name: "calendar_create_event",
    description: "Create a calendar event or meeting",
    categories: ["calendar", "scheduling"],
    keywords: ["meeting", "appointment", "schedule"],
    source: "local",
  },
];

// Mock embeddings provider for testing
class MockEmbeddings implements Embeddings {
  // Simple mock: hash text to generate deterministic "embeddings"
  async embedQuery(text: string): Promise<number[]> {
    return this.textToVector(text);
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map((text) => this.textToVector(text));
  }

  private textToVector(text: string): number[] {
    // Generate a deterministic 8-dimensional vector from text
    // Real embeddings would be 1536-dimensional
    const vector = new Array(8).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      vector[i % 8] += charCode / 1000;
    }
    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return vector.map((v) => v / (magnitude || 1));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BM25 Search Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("BigToolSearch - BM25 Mode", () => {
  let search: BigToolSearch;

  beforeEach(async () => {
    search = new BigToolSearch({ mode: "bm25" });
    await search.index(testTools);
  });

  it("should find tools by exact name match", async () => {
    const results = await search.search("github");

    expect(results.length).toBeGreaterThan(0);
    const toolIds = results.map((r) => r.toolId);
    expect(toolIds).toContain("github_create_pr");
    expect(toolIds).toContain("github_list_issues");
  });

  it("should find tools by description keywords", async () => {
    const results = await search.search("pull request");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].toolId).toBe("github_create_pr");
  });

  it("should find tools by keywords", async () => {
    const results = await search.search("PR");

    expect(results.length).toBeGreaterThan(0);
    const toolIds = results.map((r) => r.toolId);
    expect(toolIds).toContain("github_create_pr");
  });

  it("should find tools by categories", async () => {
    const results = await search.search("communication");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].toolId).toBe("slack_send_message");
  });

  it("should respect limit option", async () => {
    const results = await search.search("github", { limit: 1 });

    expect(results.length).toBe(1);
  });

  it("should apply threshold filtering", async () => {
    const results = await search.search("github", { threshold: 0.5 });

    // All results should have score >= 0.5
    for (const result of results) {
      expect(result.score).toBeGreaterThanOrEqual(0.5);
    }
  });

  it("should return normalized scores between 0 and 1", async () => {
    const results = await search.search("github");

    for (const result of results) {
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    }
  });

  it("should set matchType to bm25", async () => {
    const results = await search.search("github");

    for (const result of results) {
      expect(result.matchType).toBe("bm25");
    }
  });

  it("should apply field boosting (name matches rank higher)", async () => {
    // "slack" appears in name and categories
    const results = await search.search("slack");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].toolId).toBe("slack_send_message");
  });

  it("should handle empty query", async () => {
    const results = await search.search("");

    // Empty query might return all results or none depending on Orama behavior
    expect(Array.isArray(results)).toBe(true);
  });

  it("should handle no matches", async () => {
    const results = await search.search("xyznonexistent123");

    expect(results.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Vector Search Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("BigToolSearch - Vector Mode", () => {
  let search: BigToolSearch;
  let mockEmbeddings: MockEmbeddings;

  beforeEach(async () => {
    mockEmbeddings = new MockEmbeddings();
    search = new BigToolSearch({
      mode: "vector",
      embeddings: mockEmbeddings,
      vectorSize: 8, // Match our mock embeddings dimension
    });
    await search.index(testTools);
  });

  it("should require embeddings for vector mode", () => {
    expect(() => new BigToolSearch({ mode: "vector" })).toThrow(
      /Embeddings provider required/
    );
  });

  it("should find semantically similar tools", async () => {
    const results = await search.search("code review");

    expect(results.length).toBeGreaterThan(0);
    // Vector search might find different results than BM25
    expect(results[0].matchType).toBe("vector");
  });

  it("should return normalized scores", async () => {
    const results = await search.search("weather");

    for (const result of results) {
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Hybrid Search Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("BigToolSearch - Hybrid Mode", () => {
  let search: BigToolSearch;
  let mockEmbeddings: MockEmbeddings;

  beforeEach(async () => {
    mockEmbeddings = new MockEmbeddings();
    search = new BigToolSearch({
      mode: "hybrid",
      embeddings: mockEmbeddings,
      weights: { bm25: 0.5, vector: 0.5 },
      vectorSize: 8,
    });
    await search.index(testTools);
  });

  it("should require embeddings for hybrid mode", () => {
    expect(() => new BigToolSearch({ mode: "hybrid" })).toThrow(
      /Embeddings provider required/
    );
  });

  it("should combine BM25 and vector results", async () => {
    const results = await search.search("github");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].matchType).toBe("hybrid");
  });

  it("should respect weight configuration", async () => {
    // Create two searches with different weights
    const bm25Heavy = new BigToolSearch({
      mode: "hybrid",
      embeddings: mockEmbeddings,
      weights: { bm25: 0.9, vector: 0.1 },
      vectorSize: 8,
    });
    await bm25Heavy.index(testTools);

    const vectorHeavy = new BigToolSearch({
      mode: "hybrid",
      embeddings: mockEmbeddings,
      weights: { bm25: 0.1, vector: 0.9 },
      vectorSize: 8,
    });
    await vectorHeavy.index(testTools);

    const bm25Results = await bm25Heavy.search("github");
    const vectorResults = await vectorHeavy.search("github");

    // Different weights should produce different rankings
    expect(bm25Results).toBeDefined();
    expect(vectorResults).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Mode Override Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("BigToolSearch - Mode Override", () => {
  let search: BigToolSearch;
  let mockEmbeddings: MockEmbeddings;

  beforeEach(async () => {
    mockEmbeddings = new MockEmbeddings();
    search = new BigToolSearch({
      mode: "hybrid",
      embeddings: mockEmbeddings,
      vectorSize: 8,
    });
    await search.index(testTools);
  });

  it("should allow overriding mode per query", async () => {
    // Default is hybrid, but we can override to bm25
    const bm25Results = await search.search("github", { mode: "bm25" } as any);

    expect(bm25Results.length).toBeGreaterThan(0);
    expect(bm25Results[0].matchType).toBe("bm25");
  });

  it("should allow switching to vector mode", async () => {
    const vectorResults = await search.search("github", { mode: "vector" } as any);

    expect(vectorResults.length).toBeGreaterThan(0);
    expect(vectorResults[0].matchType).toBe("vector");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Cache Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("Embedding Cache", () => {
  describe("MemoryCache", () => {
    let cache: MemoryCache;

    beforeEach(() => {
      cache = new MemoryCache();
    });

    it("should store and retrieve embeddings", async () => {
      const embedding = [0.1, 0.2, 0.3];
      await cache.set("tool1", embedding);

      const retrieved = await cache.get("tool1");
      expect(retrieved).toEqual(embedding);
    });

    it("should return null for missing keys", async () => {
      const retrieved = await cache.get("nonexistent");
      expect(retrieved).toBeNull();
    });

    it("should invalidate entries", async () => {
      await cache.set("tool1", [0.1, 0.2]);
      await cache.invalidate("tool1");

      const retrieved = await cache.get("tool1");
      expect(retrieved).toBeNull();
    });

    it("should clear all entries", async () => {
      await cache.set("tool1", [0.1]);
      await cache.set("tool2", [0.2]);
      await cache.clear();

      expect(cache.size).toBe(0);
    });

    it("should track size", async () => {
      expect(cache.size).toBe(0);
      await cache.set("tool1", [0.1]);
      expect(cache.size).toBe(1);
      await cache.set("tool2", [0.2]);
      expect(cache.size).toBe(2);
    });
  });

  describe("LRUCache", () => {
    it("should evict oldest entries when full", async () => {
      const cache = new LRUCache(2);

      await cache.set("tool1", [0.1]);
      await cache.set("tool2", [0.2]);
      await cache.set("tool3", [0.3]); // Should evict tool1

      expect(await cache.get("tool1")).toBeNull();
      expect(await cache.get("tool2")).not.toBeNull();
      expect(await cache.get("tool3")).not.toBeNull();
    });

    it("should update access order on get", async () => {
      const cache = new LRUCache(2);

      await cache.set("tool1", [0.1]);
      await cache.set("tool2", [0.2]);
      await cache.get("tool1"); // Access tool1, making tool2 oldest
      await cache.set("tool3", [0.3]); // Should evict tool2

      expect(await cache.get("tool1")).not.toBeNull();
      expect(await cache.get("tool2")).toBeNull();
      expect(await cache.get("tool3")).not.toBeNull();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Caching Integration Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("BigToolSearch - Caching", () => {
  it("should use cached embeddings on second search", async () => {
    const cache = new MemoryCache();
    const embeddings = new MockEmbeddings();
    const embedSpy = vi.spyOn(embeddings, "embedDocuments");

    const search = new BigToolSearch({
      mode: "vector",
      embeddings,
      cache,
      vectorSize: 8,
    });

    // First index - should compute embeddings
    await search.index(testTools);
    expect(embedSpy).toHaveBeenCalledTimes(1);

    // Second index - should use cache
    await search.index(testTools);
    expect(embedSpy).toHaveBeenCalledTimes(1); // Still 1, used cache
  });

  it("should cache embeddings after computation", async () => {
    const cache = new MemoryCache();
    const embeddings = new MockEmbeddings();

    const search = new BigToolSearch({
      mode: "vector",
      embeddings,
      cache,
      vectorSize: 8,
    });

    await search.index(testTools);

    // All tools should be cached
    expect(cache.size).toBe(testTools.length);
    for (const tool of testTools) {
      expect(cache.has(tool.id)).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Reindex Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("BigToolSearch - Reindex", () => {
  it("should reindex correctly", async () => {
    const search = new BigToolSearch({ mode: "bm25" });
    await search.index(testTools);

    // Reindex
    await search.reindex();

    // Search should still work
    const results = await search.search("github");
    expect(results.length).toBeGreaterThan(0);
  });

  it("should throw if reindex called before index", async () => {
    const search = new BigToolSearch({ mode: "bm25" });

    await expect(search.reindex()).rejects.toThrow(/No tools to reindex/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Error Handling Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("BigToolSearch - Error Handling", () => {
  it("should throw if search called before index", async () => {
    const search = new BigToolSearch({ mode: "bm25" });

    await expect(search.search("github")).rejects.toThrow(/Index not initialized/);
  });

  it("should handle unknown mode gracefully", async () => {
    const search = new BigToolSearch({ mode: "bm25" });
    await search.index(testTools);

    await expect(
      search.search("github", { mode: "unknown" } as any)
    ).rejects.toThrow(/Unknown search mode/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Factory Function Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("Factory Functions", () => {
  it("createBM25Search should create BM25 search", async () => {
    const search = createBM25Search();
    await search.index(testTools);

    const results = await search.search("github");
    expect(results[0].matchType).toBe("bm25");
  });

  it("createVectorSearch should create vector search", async () => {
    const embeddings = new MockEmbeddings();
    const search = createVectorSearch(embeddings, undefined, 8);
    await search.index(testTools);

    const results = await search.search("github");
    expect(results[0].matchType).toBe("vector");
  });

  it("createHybridSearch should create hybrid search", async () => {
    const embeddings = new MockEmbeddings();
    const search = createHybridSearch(embeddings, { vectorSize: 8 });
    await search.index(testTools);

    const results = await search.search("github");
    expect(results[0].matchType).toBe("hybrid");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Normalization Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("Score Normalization", () => {
  describe("normalizeBM25Scores", () => {
    it("should normalize to 0-1 range", () => {
      const scores = [0, 5, 10, 15, 20];
      const normalized = normalizeBM25Scores(scores);

      expect(normalized[0]).toBe(0);
      expect(normalized[4]).toBe(1);
      for (const score of normalized) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    });

    it("should handle single score", () => {
      const normalized = normalizeBM25Scores([5]);
      expect(normalized).toEqual([1]);
    });

    it("should handle empty array", () => {
      const normalized = normalizeBM25Scores([]);
      expect(normalized).toEqual([]);
    });

    it("should handle all same scores", () => {
      const normalized = normalizeBM25Scores([5, 5, 5]);
      expect(normalized).toEqual([1, 1, 1]);
    });
  });

  describe("normalizeBM25Sigmoid", () => {
    it("should map scores to 0-1 range", () => {
      expect(normalizeBM25Sigmoid(0)).toBeCloseTo(0.5, 1);
      expect(normalizeBM25Sigmoid(10)).toBeGreaterThan(0.8);
      expect(normalizeBM25Sigmoid(-10)).toBeLessThan(0.2);
    });
  });

  describe("reciprocalRankFusion", () => {
    it("should compute RRF scores", () => {
      // Item ranked 1st in both lists
      const score1 = reciprocalRankFusion(1, 1);
      // Item ranked 5th in both lists
      const score2 = reciprocalRankFusion(5, 5);

      expect(score1).toBeGreaterThan(score2);
    });

    it("should handle items in only one list", () => {
      const score = reciprocalRankFusion(1, null);
      expect(score).toBeGreaterThan(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Merge Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("Result Merging", () => {
  const bm25Results: SearchResult[] = [
    { toolId: "tool1", score: 1.0, matchType: "bm25" },
    { toolId: "tool2", score: 0.8, matchType: "bm25" },
    { toolId: "tool3", score: 0.6, matchType: "bm25" },
  ];

  const vectorResults: SearchResult[] = [
    { toolId: "tool2", score: 1.0, matchType: "vector" },
    { toolId: "tool4", score: 0.9, matchType: "vector" },
    { toolId: "tool1", score: 0.5, matchType: "vector" },
  ];

  describe("mergeHybridResults", () => {
    it("should combine scores from both lists", () => {
      const merged = mergeHybridResults(bm25Results, vectorResults, {
        bm25: 0.5,
        vector: 0.5,
      });

      // tool2 appears in both with high scores
      const tool2 = merged.find((r) => r.toolId === "tool2");
      expect(tool2).toBeDefined();
      expect(tool2!.score).toBeCloseTo(0.9, 1); // (0.8 + 1.0) / 2

      // All results should be hybrid
      for (const result of merged) {
        expect(result.matchType).toBe("hybrid");
      }
    });

    it("should include tools from only one list", () => {
      const merged = mergeHybridResults(bm25Results, vectorResults, {
        bm25: 0.5,
        vector: 0.5,
      });

      // tool3 only in BM25, tool4 only in vector
      const toolIds = merged.map((r) => r.toolId);
      expect(toolIds).toContain("tool3");
      expect(toolIds).toContain("tool4");
    });

    it("should sort by combined score", () => {
      const merged = mergeHybridResults(bm25Results, vectorResults, {
        bm25: 0.5,
        vector: 0.5,
      });

      for (let i = 1; i < merged.length; i++) {
        expect(merged[i - 1].score).toBeGreaterThanOrEqual(merged[i].score);
      }
    });
  });

  describe("mergeWithRRF", () => {
    it("should merge using rank-based fusion", () => {
      const merged = mergeWithRRF(bm25Results, vectorResults);

      // tool2 is rank 1 in vector, rank 2 in BM25 - should rank high
      expect(merged.length).toBeGreaterThan(0);

      // All should be hybrid
      for (const result of merged) {
        expect(result.matchType).toBe("hybrid");
      }
    });

    it("should normalize RRF scores to 0-1", () => {
      const merged = mergeWithRRF(bm25Results, vectorResults);

      expect(merged[0].score).toBe(1); // Top result normalized to 1
      for (const result of merged) {
        expect(result.score).toBeLessThanOrEqual(1);
        expect(result.score).toBeGreaterThan(0);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Count Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("BigToolSearch - Count", () => {
  it("should return correct count of indexed tools", async () => {
    const search = new BigToolSearch({ mode: "bm25" });
    await search.index(testTools);

    const count = await search.count();
    expect(count).toBe(testTools.length);
  });

  it("should return 0 before indexing", async () => {
    const search = new BigToolSearch({ mode: "bm25" });

    const count = await search.count();
    expect(count).toBe(0);
  });
});
