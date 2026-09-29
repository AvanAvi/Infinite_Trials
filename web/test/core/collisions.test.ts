import { describe, expect, it } from 'vitest';

import { countCollisions } from '../../src/core/collisions';
import collisionsVectors from '../vectors/collisions.json';

describe('countCollisions matches Python exactly (short inputs)', () => {
  // password12's target K (~982,000) is deliberately excluded here - see
  // collisions.ts's docstring: that's the documented docs/ANALYSIS.md
  // figure the "crack" section shows as text, not a live browser
  // computation. This suite only covers what the demo actually computes.
  for (const { password, k, total } of collisionsVectors.cases) {
    if (password === 'password12') continue;

    it(`countCollisions(${JSON.stringify(password)})`, () => {
      const result = countCollisions(password);
      expect(result.k).toBe(BigInt(k));
      expect(result.total).toBe(BigInt(total));
    });
  }
});

describe('the documented password12 figure matches docs/ANALYSIS.md', () => {
  it('total is 166166 (including its own multiset), others is 166165', () => {
    const vector = collisionsVectors.cases.find((c) => c.password === 'password12');
    expect(vector).toBeDefined();
    expect(vector!.total).toBe(166166);
    expect(vector!.total - 1).toBe(166165);
  });
});
