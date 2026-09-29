/**
 * Main-thread handle to mathWorker.ts. Lazy: the worker (and its module
 * graph, including the q(n, m) table cache) is only created on first
 * use, so importing this module has no cost for code paths that never
 * touch the large-N partition math.
 *
 * jsdom (used by the Vitest suite) has no Worker implementation, and
 * v3Pipeline.ts renders a working default example on mount - so the
 * "first use" moment happens during the smoke test's page mount, not
 * just on user interaction. Rather than special-case tests, fall back
 * to running the same pure functions synchronously, in-thread, wrapped
 * to match Comlink.Remote's Promise-returning shape - correct in both
 * environments, since mathWorker.ts re-exports those exact functions
 * unmodified (see its own docstring). Only the browser path (a real
 * Worker) gets the off-main-thread benefit; that's the one that matters
 * for avoiding jank, and it's what runs for an actual visitor.
 */

import * as Comlink from 'comlink';

import { minN, partitionsCount, pSequence } from '../partitions';
import { rank, unrank } from '../rank';
import type { MathApi } from './mathWorker';

let client: Comlink.Remote<MathApi> | null = null;

function inThreadFallback(): Comlink.Remote<MathApi> {
  const api = { minN, partitionsCount, pSequence, unrank, rank };
  return new Proxy(api, {
    get(target, prop: keyof typeof api) {
      const fn = target[prop];
      return (...args: Parameters<typeof fn>) =>
        Promise.resolve((fn as (...a: typeof args) => unknown)(...args));
    },
  }) as unknown as Comlink.Remote<MathApi>;
}

export function getMathClient(): Comlink.Remote<MathApi> {
  if (!client) {
    if (typeof Worker === 'undefined') {
      client = inThreadFallback();
    } else {
      const worker = new Worker(new URL('./mathWorker.ts', import.meta.url), {
        type: 'module',
      });
      client = Comlink.wrap<MathApi>(worker);
    }
  }
  return client;
}
