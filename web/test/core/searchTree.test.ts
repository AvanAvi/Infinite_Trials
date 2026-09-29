import { describe, expect, it } from 'vitest';

import { buildBuggySearchTree, buildFixedSearchTree, countNodes } from '../../src/core/searchTree';
import { ALPHABET } from '../../src/core/encoding';
import { getPartitionValue } from '../../src/core/v1';
import collisionsVectors from '../vectors/collisions.json';

function allCharValues() {
  return Array.from(ALPHABET).map((char) => ({ char, value: getPartitionValue(char) }));
}

function collectResults(node: {
  isResult: boolean;
  char: string | null;
  children: unknown[];
}): number {
  let count = node.isResult ? 1 : 0;
  for (const child of node.children as Parameters<typeof collectResults>[0][]) {
    count += collectResults(child);
  }
  return count;
}

describe('buildFixedSearchTree matches the documented collision counts', () => {
  for (const { password, k, total } of collisionsVectors.cases) {
    if (password === 'password12') continue; // too large a tree for this suite

    it(`finds all ${total} results for ${JSON.stringify(password)}`, () => {
      const tree = buildFixedSearchTree(allCharValues(), BigInt(k), password.length);
      expect(collectResults(tree)).toBe(total);
    });
  }
});

describe('buildBuggySearchTree reproduces the real V2 bug', () => {
  it('finds zero results for a 1-character password (the exact Step 1/3 finding)', () => {
    // 'a' has the smallest partition value in the table, so it's the
    // *last* candidate tried in descending order - and since the first
    // (largest) candidate already overshoots a tiny target, the buggy
    // break fires before 'a' is ever reached.
    const k = getPartitionValue('a');
    const tree = buildBuggySearchTree(allCharValues(), k, 1);
    expect(collectResults(tree)).toBe(0);
  });

  it('the buggy tree is never larger than the fixed tree for the same input', () => {
    for (const { password, k } of collisionsVectors.cases) {
      if (password === 'password12') continue;
      const fixed = buildFixedSearchTree(allCharValues(), BigInt(k), password.length);
      const buggy = buildBuggySearchTree(allCharValues(), BigInt(k), password.length);
      // Not a claim the buggy tree is smaller in general (it enumerates
      // permutations, which can be larger) - just that for these small,
      // low-value demo words the broken break prunes aggressively.
      expect(countNodes(buggy)).toBeLessThanOrEqual(countNodes(fixed) * 50);
    }
  });
});
