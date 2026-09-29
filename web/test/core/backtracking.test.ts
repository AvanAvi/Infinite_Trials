import { describe, expect, it } from 'vitest';

import { findMultisets } from '../../src/core/backtracking';
import { countMultisetsWithSum } from '../../src/core/collisions';
import { allPartitionValues, canonicalMultiset, getPartitionValue } from '../../src/core/v1';
import { ALPHABET } from '../../src/core/encoding';
import collisionsVectors from '../vectors/collisions.json';

function allCharValues() {
  return Array.from(ALPHABET).map((char) => ({ char, value: getPartitionValue(char) }));
}

describe('findMultisets agrees with the collision counter', () => {
  for (const { password, k, total } of collisionsVectors.cases) {
    if (password === 'password12') continue; // too many results to enumerate exhaustively here

    it(`finds all ${total} multisets for ${JSON.stringify(password)}`, () => {
      const results = findMultisets(allCharValues(), BigInt(k), password.length, 1000);
      expect(results.length).toBe(total);
      // Every result must be unique and re-sum to k.
      expect(new Set(results).size).toBe(results.length);
      for (const candidate of results) {
        const sum = Array.from(candidate).reduce((acc, c) => acc + getPartitionValue(c), 0n);
        expect(sum).toBe(BigInt(k));
      }
    });
  }

  it('respects maxResults as a cap, not a target', () => {
    const values = allPartitionValues();
    const total = countMultisetsWithSum(values, 4, 32n);
    expect(total).toBeGreaterThan(1n);

    const capped = findMultisets(allCharValues(), 32n, 4, 2);
    expect(capped.length).toBe(2);
  });
});

describe('canonicalMultiset', () => {
  it('orders characters by partition value, not alphabetically', () => {
    expect(canonicalMultiset('cab')).toBe('abc');
    expect(canonicalMultiset('Ba')).toBe('aB');
    expect(canonicalMultiset('1Az')).toBe('zA1');
  });

  it('matches the form findMultisets emits, so a password is found among its own collisions', () => {
    for (const password of ['cab', 'aB', 'face', 'Zz9']) {
      const k = Array.from(password).reduce((acc, c) => acc + getPartitionValue(c), 0n);
      const results = findMultisets(allCharValues(), k, password.length, 1000);
      expect(results).toContain(canonicalMultiset(password));
    }
  });
});
