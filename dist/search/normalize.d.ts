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
/**
 * Normalize BM25 scores to 0-1 range.
 *
 * Uses min-max normalization within the result set.
 * If all scores are the same, returns 1.0 for all.
 *
 * @param scores - Array of raw BM25 scores
 * @returns Array of normalized scores (0-1)
 */
export declare function normalizeBM25Scores(scores: number[]): number[];
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
export declare function normalizeBM25Sigmoid(score: number, k?: number): number;
/**
 * Normalize cosine similarity from [-1, 1] to [0, 1]
 *
 * @param similarity - Cosine similarity value (-1 to 1)
 * @returns Normalized score (0-1)
 */
export declare function normalizeCosineSimilarity(similarity: number): number;
/**
 * Orama already returns vector scores in 0-1 range (distance-based).
 * This function clamps to ensure valid range.
 *
 * @param score - Orama vector search score
 * @returns Clamped score (0-1)
 */
export declare function normalizeOramaVectorScore(score: number): number;
/**
 * Combine BM25 and vector scores using weighted average.
 *
 * @param bm25Score - Normalized BM25 score (0-1)
 * @param vectorScore - Normalized vector score (0-1)
 * @param weights - Weight configuration
 * @returns Combined score (0-1)
 */
export declare function combineScores(bm25Score: number, vectorScore: number, weights: {
    bm25: number;
    vector: number;
}): number;
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
export declare function reciprocalRankFusion(bm25Rank: number | null, vectorRank: number | null, k?: number): number;
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
export declare function mergeHybridResults(bm25Results: SearchResult[], vectorResults: SearchResult[], weights: {
    bm25: number;
    vector: number;
}): SearchResult[];
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
export declare function mergeWithRRF(bm25Results: SearchResult[], vectorResults: SearchResult[], k?: number): SearchResult[];
//# sourceMappingURL=normalize.d.ts.map