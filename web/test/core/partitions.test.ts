import { describe, expect, it } from 'vitest';

import { partitionsCount, q } from '../../src/core/partitions';
import pValues from '../vectors/p_values.json';
import qValues from '../vectors/q_values.json';

describe('partitionsCount matches Python p(n) exactly', () => {
  for (const { n, p } of pValues.cases) {
    it(`p(${n}) = ${p}`, () => {
      expect(partitionsCount(n)).toBe(BigInt(p));
    });
  }
});

describe('q(n, m) matches Python exactly', () => {
  for (const { n, m, q: expected } of qValues.cases) {
    it(`q(${n}, ${m}) = ${expected}`, () => {
      expect(q(n, m)).toBe(BigInt(expected));
    });
  }
});
