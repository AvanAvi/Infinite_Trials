/**
 * Multiset collision counter for SHORT inputs - a BigInt port of
 * analysis/collision_count.py's count_multisets_with_sum, for the "crack"
 * section's live demo. For realistic-length passwords (docs/ANALYSIS.md's
 * "password12" example) this DP's O(characters x length x K) cost makes
 * it impractical in the browser (K reaches ~982,000, and JS BigInt
 * arithmetic doesn't get CPython's C-level array tricks) - that
 * documented number is shown as text instead of recomputed live. This
 * module is only meant for the handful of short demo strings the section
 * actually lets a visitor type or pick.
 */

import { allPartitionValues, v1Encrypt } from './v1';

export interface CollisionResult {
  k: bigint;
  length: number;
  /** Total multisets of this length summing to k, including the input's own. */
  total: bigint;
}

/**
 * Count non-decreasing sequences (multisets) of `length` values chosen
 * with repetition from `values` (partition values, any order) that sum
 * to exactly `target`. Mirrors collision_count.py's dp[slots][residual]
 * structure directly - see that module's docstring for why it's built
 * this way instead of a top-down memoised recursion.
 */
export function countMultisetsWithSum(values: bigint[], length: number, target: bigint): bigint {
  const targetNum = Number(target);
  if (!Number.isSafeInteger(targetNum)) {
    throw new Error(
      `target ${target} is too large for the browser demo's collision counter - use the documented docs/ANALYSIS.md figure instead`
    );
  }

  const relevant = values.filter((v) => v <= target).map((v) => Number(v));

  const dp: bigint[][] = Array.from({ length: length + 1 }, () =>
    new Array<bigint>(targetNum + 1).fill(0n)
  );
  dp[0]![0] = 1n;

  for (const v of relevant) {
    for (let s = 1; s <= length; s++) {
      const rowS = dp[s]!;
      const rowPrev = dp[s - 1]!;
      for (let r = v; r <= targetNum; r++) {
        rowS[r] = rowS[r]! + rowPrev[r - v]!;
      }
    }
  }

  return dp[length]![targetNum]!;
}

/** Collision count for a short demo password, using the real V1/V2 table. */
export function countCollisions(password: string): CollisionResult {
  const { k } = v1Encrypt(password);
  const total = countMultisetsWithSum(allPartitionValues(), password.length, k);
  return { k, length: password.length, total };
}
