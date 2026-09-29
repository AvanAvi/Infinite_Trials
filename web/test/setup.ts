/**
 * jsdom (the Vitest test environment) doesn't implement window.matchMedia
 * at all - not "always false", genuinely undefined. Every section that
 * checks prefers-reduced-motion via src/motion/reducedMotion.ts needs
 * this to exist for any test that mounts the page. Defaults to "no
 * preference" (matches: false); individual tests can override via
 * `vi.stubGlobal` if they need to test the reduced-motion branch itself.
 */

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
