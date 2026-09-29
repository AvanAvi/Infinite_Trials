/**
 * Builds the actual search tree the V2 backtracking algorithm walks, in
 * both its buggy (pre-fix) and fixed forms, for the "V2 search" section's
 * live visualization. Not a copy of src/core/backtracking.ts's
 * findMultisets - that returns only final results; this preserves the
 * tree shape (including dead ends and prunes) so the visitor can see
 * what the search actually explored.
 *
 * Fixed: ascending sort, multisets only (startIdx-restricted, matching
 * backtracking.ts). Buggy: descending sort, permutations (no startIdx
 * restriction - the original bug enumerated ordered strings, not
 * multisets), break on first overshoot - which, sorted descending, is
 * unsound: the very first (largest) candidate at any node typically
 * overshoots immediately for a small target, so the buggy tree often
 * has almost no children at all. That's not a simplification for the
 * demo - it's the real bug from fix/v2-correctness, reproduced exactly.
 */

import type { CharValue } from './backtracking';

export type PruneReason = 'overshoot' | 'bounds' | null;

export interface SearchTreeNode {
  char: string | null;
  value: bigint | null;
  sum: bigint;
  depth: number;
  isResult: boolean;
  prunedReason: PruneReason;
  children: SearchTreeNode[];
}

const ROOT: Omit<SearchTreeNode, 'children'> = {
  char: null,
  value: null,
  sum: 0n,
  depth: 0,
  isResult: false,
  prunedReason: null,
};

export function buildFixedSearchTree(
  chars: CharValue[],
  targetSum: bigint,
  length: number
): SearchTreeNode {
  const sorted = [...chars].sort((a, b) => (a.value < b.value ? -1 : a.value > b.value ? 1 : 0));
  const minVal = sorted[0]?.value ?? 0n;
  const maxVal = sorted[sorted.length - 1]?.value ?? 0n;

  function isViable(sum: bigint, remaining: number): boolean {
    if (remaining === 0) return sum === targetSum;
    const r = BigInt(remaining);
    const need = targetSum - sum;
    return need <= maxVal * r && need >= minVal * r;
  }

  function build(startIdx: number, sum: bigint, depth: number): SearchTreeNode[] {
    if (depth === length) return [];
    const remaining = length - depth;
    if (!isViable(sum, remaining)) return [];

    const children: SearchTreeNode[] = [];
    for (let idx = startIdx; idx < sorted.length; idx++) {
      const entry = sorted[idx]!;
      const newSum = sum + entry.value;
      if (newSum > targetSum) break; // sound: ascending order, every later candidate overshoots too

      const newDepth = depth + 1;
      const viable = isViable(newSum, remaining - 1);
      const node: SearchTreeNode = {
        char: entry.char,
        value: entry.value,
        sum: newSum,
        depth: newDepth,
        isResult: newDepth === length && newSum === targetSum,
        prunedReason: !viable && newDepth < length ? 'bounds' : null,
        children: viable ? build(idx, newSum, newDepth) : [],
      };
      children.push(node);
    }
    return children;
  }

  return { ...ROOT, children: build(0, 0n, 0) };
}

export function buildBuggySearchTree(
  chars: CharValue[],
  targetSum: bigint,
  length: number
): SearchTreeNode {
  // The original bug: descending sort, over the FULL character list at
  // every level (no startIdx restriction), so this enumerates ordered
  // strings, not multisets.
  const sorted = [...chars].sort((a, b) => (a.value > b.value ? -1 : a.value < b.value ? 1 : 0));

  function build(sum: bigint, depth: number): SearchTreeNode[] {
    if (depth === length) return [];

    const children: SearchTreeNode[] = [];
    for (const entry of sorted) {
      const newSum = sum + entry.value;
      if (newSum > targetSum) {
        // The actual bug: descending order means this break discards every
        // remaining (smaller) candidate too, even ones that would fit.
        break;
      }
      const newDepth = depth + 1;
      const node: SearchTreeNode = {
        char: entry.char,
        value: entry.value,
        sum: newSum,
        depth: newDepth,
        isResult: newDepth === length && newSum === targetSum,
        prunedReason: null,
        children: build(newSum, newDepth),
      };
      children.push(node);
    }
    return children;
  }

  return { ...ROOT, children: build(0n, 0) };
}

/** Total node count, for guarding against rendering an oversized tree. */
export function countNodes(node: SearchTreeNode): number {
  let count = 1;
  for (const child of node.children) count += countNodes(child);
  return count;
}
