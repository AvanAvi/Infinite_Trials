/**
 * Main-thread handle to mathWorker.ts. Lazy: the worker (and its module
 * graph, including the q(n, m) table cache) is only created on first
 * use, so importing this module has no cost for code paths that never
 * touch the large-N partition math. jsdom (used by the Vitest suite) has
 * no Worker implementation, which is fine - the worker only re-exports
 * already-unit-tested pure functions (see web/test/core/*.test.ts), so
 * there's nothing worker-specific left to verify beyond the wiring
 * itself, checked manually in a real browser.
 */

import * as Comlink from 'comlink';

import type { MathApi } from './mathWorker';

let client: Comlink.Remote<MathApi> | null = null;

export function getMathClient(): Comlink.Remote<MathApi> {
  if (!client) {
    const worker = new Worker(new URL('./mathWorker.ts', import.meta.url), {
      type: 'module',
    });
    client = Comlink.wrap<MathApi>(worker);
  }
  return client;
}
