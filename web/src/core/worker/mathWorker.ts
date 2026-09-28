/**
 * Runs the heavy partition-table math off the main thread. Building
 * q(n, m) for N ~ 850 is O(n^2) BigInt operations (~723,000 cells) -
 * fast in absolute terms, but enough to visibly stall an animation if
 * run inline. This worker imports the exact same core modules the
 * synchronous, directly-unit-tested API uses (see
 * web/test/core/*.test.ts, which cross-validate those modules against
 * Python) - it doesn't reimplement anything, it just runs it elsewhere,
 * so its caches (partitions.ts/rank.ts's module-level Maps) live in the
 * worker's own memory and persist across calls for the page's lifetime.
 */

import * as Comlink from 'comlink';

import { minN, partitionsCount, pSequence } from '../partitions';
import { rank, unrank } from '../rank';

const mathApi = {
  minN,
  partitionsCount,
  pSequence,
  unrank,
  rank,
};

export type MathApi = typeof mathApi;

Comlink.expose(mathApi);
