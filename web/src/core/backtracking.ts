/**
 * Enumerate character multisets of a given length summing to a target -
 * a TypeScript port of the FIXED algorithm from
 * Version2/src/backtracking_strategy.cpp (see fix/v2-correctness's
 * "enumerate multisets ascending instead of pruning them away"): sort
 * candidates ascending, offer only characters from a startIdx onward so
 * each multiset is produced exactly once in canonical non-decreasing
 * order, and break on the first overshoot (sound only because ascending
 * order guarantees every later, larger candidate overshoots too).
 *
 * Used by the "crack" section (Step 5) to show real colliding strings
 * for a short demo password, and by the "V2 search" section (Step 6) to
 * visualize this exact search live - including, there, the original
 * descending-sort-plus-break bug this module deliberately doesn't have.
 */

export interface CharValue {
  char: string;
  value: bigint;
}

/**
 * Find up to maxResults distinct character multisets of exactly `length`
 * characters (drawn from `chars`, repetition allowed) summing to
 * `targetSum`. Results are in canonical ascending order, as strings.
 */
export function findMultisets(
  chars: CharValue[],
  targetSum: bigint,
  length: number,
  maxResults: number
): string[] {
  const sorted = [...chars].sort((a, b) => (a.value < b.value ? -1 : a.value > b.value ? 1 : 0));
  const minVal = sorted[0]?.value ?? 0n;
  const maxVal = sorted[sorted.length - 1]?.value ?? 0n;

  const results: string[] = [];
  const current: string[] = [];

  function isViable(currentSum: bigint, remainingPositions: number): boolean {
    if (remainingPositions === 0) return currentSum === targetSum;
    const remaining = BigInt(remainingPositions);
    const sumNeeded = targetSum - currentSum;
    return sumNeeded <= maxVal * remaining && sumNeeded >= minVal * remaining;
  }

  // Returns false once maxResults is reached, to unwind the recursion.
  function backtrack(startIdx: number, currentSum: bigint): boolean {
    if (current.length === length) {
      if (currentSum === targetSum) {
        results.push(current.join(''));
        if (results.length >= maxResults) return false;
      }
      return true;
    }

    const remainingPositions = length - current.length;
    if (!isViable(currentSum, remainingPositions)) return true;

    for (let idx = startIdx; idx < sorted.length; idx++) {
      const entry = sorted[idx]!;
      const newSum = currentSum + entry.value;
      if (newSum > targetSum) break; // ascending: every later candidate overshoots too

      current.push(entry.char);
      const shouldContinue = backtrack(idx, newSum);
      current.pop();
      if (!shouldContinue) return false;
    }
    return true;
  }

  backtrack(0, 0n);
  return results;
}
