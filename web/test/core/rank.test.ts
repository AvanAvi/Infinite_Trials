import { describe, expect, it } from 'vitest';

import { rank, unrank } from '../../src/core/rank';
import rankUnrankVectors from '../vectors/rank_unrank.json';

describe('unrank matches Python exactly (exhaustive, N <= 15)', () => {
  for (const { N, entries } of rankUnrankVectors.exhaustive) {
    describe(`N = ${N}`, () => {
      for (const { r, parts } of entries) {
        it(`unrank(${r}, ${N})`, () => {
          expect(unrank(BigInt(r), N)).toEqual(parts);
        });
      }
    });
  }
});

describe('rank is the exact inverse of unrank (exhaustive, N <= 15)', () => {
  for (const { N, entries } of rankUnrankVectors.exhaustive) {
    describe(`N = ${N}`, () => {
      for (const { r, parts } of entries) {
        it(`rank(unrank(${r}, ${N}), ${N}) = ${r}`, () => {
          expect(rank(parts, N)).toBe(BigInt(r));
        });
      }
    });
  }
});

describe('unrank/rank match Python at large N (sampled, N up to 850)', () => {
  for (const { N, entries } of rankUnrankVectors.sampled) {
    describe(`N = ${N}`, () => {
      for (const { r, parts } of entries) {
        it(`unrank(${r}, ${N}) and its inverse`, () => {
          const rBig = BigInt(r);
          expect(unrank(rBig, N)).toEqual(parts);
          expect(rank(parts, N)).toBe(rBig);
        });
      }
    });
  }
});
