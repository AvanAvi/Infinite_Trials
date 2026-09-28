/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
    // Building the q(n, m) table for N ~ 3000+ (the largest cipher.ts
    // test case) legitimately takes several seconds on first build -
    // cached afterward, but the default 5s timeout isn't enough for that
    // first call.
    testTimeout: 20000,
  },
});
