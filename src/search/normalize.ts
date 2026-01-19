/**
 * Score Normalization Utilities
 * 
 * Different search algorithms produce scores in different ranges:
 * - BM25: 0 to ~25+ (unbounded, depends on corpus)
 * - Cosine similarity: -1 to 1 (for vectors)
 * - Orama vector search: 0 to 1 (already normalized)
 * 
 * We normalize everything to 0-1 for consistent thresholding.
 */

import type { SearchResult } from '../types/index.js';
import type { SearchMode } from './types.js';

// ═══════════════════════════════════════════════════════════════════════════
// BM25 Score Normalization
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalize BM25 scores to 0-1 range.
 * 
 * Uses min-max normalization within the result set.
 * If all scores are the same, returns 1.0 for all.
 * 
 * @param scores - Array of raw BM25 scores
 * @returns Array of normalized scores (0-1)
 */
export function normalizeBM25Scores(scores: number[]): number[] {
  if (scores.length === 0) return [];
  if (scores.length === 1) return [1.0];

  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min;

  if (range === 0) {
    // All scores are the same
    return scores.map(() => 1.0);
  }

  return scores.map((score) => (score - min) / range);
}

/**
 * Normalize a single BM25 score using a sigmoid function.
 * This is useful when you don't have the full result set.
 * 
 * The sigmoid maps scores to (0, 1):
 * - Low scores (~0-2) map to ~0.0-0.5
 * - Medium scores (~2-10) map to ~0.5-0.9
 * - High scores (~10+) map to ~0.9-1.0
 * 
 * @param score - Raw BM25 score
 * @param k - Steepness parameter (default: 5)
 * @returns Normalized score (0-1)
 */
export function normalizeBM25Sigmoid(score: number, k: number = 5): number {
  // Sigmoid: 1 / (1 + e^(-x/k))
  // Shifted so that 0 input gives ~0.5 output
  return 1 / (1 + Math.exp(-score / k));
}

// ═══════════════════════════════════════════════════════════════════════════
// Vector Similarity Normalization
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalize cosine similarity from [-1, 1] to [0, 1]
 * 
 * @param similarity - Cosine similarity value (-1 to 1)
 * @returns Normalized score (0-1)
 */
export function normalizeCosineSimilarity(similarity: number): number {
  // Map [-1, 1] to [0, 1]
  return (similarity + 1) / 2;
}

/**
 * Orama already returns vector scores in 0-1 range (distance-based).
 * This function clamps to ensure valid range.
 * 
 * @param score - Orama vector search score
 * @returns Clamped score (0-1)
 */
export function normalizeOramaVectorScore(score: number): number {
  return Math.max(0, Math.min(1, score));
}

// ═══════════════════════════════════════════════════════════════════════════
// Hybrid Score Combination
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Combine BM25 and vector scores using weighted average.
 * 
 * @param bm25Score - Normalized BM25 score (0-1)
 * @param vectorScore - Normalized vector score (0-1)
 * @param weights - Weight configuration
 * @returns Combined score (0-1)
 */
export function combineScores(
  bm25Score: number,
  vectorScore: number,
  weights: { bm25: number; vector: number }
): number {
  const total = weights.bm25 + weights.vector;
  return (bm25Score * weights.bm25 + vectorScore * weights.vector) / total;
}

/**
 * Reciprocal Rank Fusion (RRF) for combining ranked lists.
 * 
 * RRF is a rank-based fusion method that doesn't require score normalization.
 * It's useful when BM25 and vector scores are not directly comparable.
 * 
 * Formula: score = sum(1 / (k + rank)) for each list the item appears in
 * 
 * @param bm25Rank - Rank in BM25 results (1-indexed, null if not present)
 * @param vectorRank - Rank in vector results (1-indexed, null if not present)
 * @param k - Smoothing constant (default: 60, standard value)
 * @returns RRF score (higher is better)
 */
export function reciprocalRankFusion(
  bm25Rank: number | null,
  vectorRank: number | null,
  k: number = 60
): number {
  let score = 0;
  if (bm25Rank !== null) {
    score += 1 / (k + bm25Rank);
  }
  if (vectorRank !== null) {
    score += 1 / (k + vectorRank);
  }
  return score;
}

// ═══════════════════════════════════════════════════════════════════════════
// Result Merging
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Merge BM25 and vector results using weighted combination.
 * 
 * Tools that appear in both result sets get combined scores.
 * Tools that appear in only one set get their score weighted by that mode's weight.
 * 
 * @param bm25Results - BM25 search results (normalized scores)
 * @param vectorResults - Vector search results (normalized scores)
 * @param weights - Weight configuration for combining
 * @returns Merged and re-ranked results
 */
export function mergeHybridResults(
  bm25Results: SearchResult[],
  vectorResults: SearchResult[],
  weights: { bm25: number; vector: number }
): SearchResult[] {
  const scoreMap = new Map<string, { bm25: number; vector: number }>();

  // Add BM25 scores
  for (const result of bm25Results) {
    scoreMap.set(result.toolId, {
      bm25: result.score,
      vector: 0,
    });
  }

  // Add/merge vector scores
  for (const result of vectorResults) {
    const existing = scoreMap.get(result.toolId);
    if (existing) {
      existing.vector = result.score;
    } else {
      scoreMap.set(result.toolId, {
        bm25: 0,
        vector: result.score,
      });
    }
  }

  // Combine scores and create results
  const results: SearchResult[] = [];
  for (const [toolId, scores] of scoreMap) {
    const combinedScore = combineScores(scores.bm25, scores.vector, weights);
    results.push({
      toolId,
      score: combinedScore,
      matchType: "hybrid",
    });
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Merge results using Reciprocal Rank Fusion.
 * 
 * This method is rank-based rather than score-based,
 * which can be more robust when score distributions differ significantly.
 * 
 * @param bm25Results - BM25 search results (order matters, not scores)
 * @param vectorResults - Vector search results (order matters, not scores)
 * @param k - RRF smoothing constant
 * @returns Merged and re-ranked results
 */
export function mergeWithRRF(
  bm25Results: SearchResult[],
  vectorResults: SearchResult[],
  k: number = 60
): SearchResult[] {
  // Create rank maps (1-indexed)
  const bm25Ranks = new Map<string, number>();
  bm25Results.forEach((r, i) => bm25Ranks.set(r.toolId, i + 1));

  const vectorRanks = new Map<string, number>();
  vectorResults.forEach((r, i) => vectorRanks.set(r.toolId, i + 1));

  // Get all unique tool IDs
  const allToolIds = new Set([
    ...bm25Results.map((r) => r.toolId),
    ...vectorResults.map((r) => r.toolId),
  ]);

  // Compute RRF scores
  const results: SearchResult[] = [];
  for (const toolId of allToolIds) {
    const bm25Rank = bm25Ranks.get(toolId) ?? null;
    const vectorRank = vectorRanks.get(toolId) ?? null;
    const score = reciprocalRankFusion(bm25Rank, vectorRank, k);

    results.push({
      toolId,
      score,
      matchType: "hybrid",
    });
  }

  // Sort by RRF score descending
  results.sort((a, b) => b.score - a.score);

  // Normalize RRF scores to 0-1 for consistent thresholding
  if (results.length > 0) {
    const maxScore = results[0].score;
    for (const result of results) {
      result.score = result.score / maxScore;
    }
  }

  return results;
}
