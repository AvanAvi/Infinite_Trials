/**
 * prefers-reduced-motion handling.
 *
 * The CSS layer (base.css) already collapses any plain CSS
 * animation/transition to ~0. This module is the equivalent net for
 * Anime.js-driven animation: every section built in Steps 5-6 must route
 * its animated state changes through `runOrSkip` (or check
 * `prefersReducedMotion()` directly) instead of calling `animate()` bare,
 * so a visitor with reduced motion set sees the exact same end state
 * instantly, not a shorter/faster version of the same animation.
 */

const QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion(): boolean {
  return window.matchMedia(QUERY).matches;
}

/**
 * Watch for the user changing their OS-level reduced-motion setting
 * while the page is open (rare, but free to support correctly).
 * Returns an unsubscribe function.
 */
export function onReducedMotionChange(callback: (reduced: boolean) => void): () => void {
  const mql = window.matchMedia(QUERY);
  const listener = (event: MediaQueryListEvent) => callback(event.matches);
  mql.addEventListener('change', listener);
  return () => mql.removeEventListener('change', listener);
}

/**
 * Run `animateFn` (an Anime.js call, or anything that animates toward
 * `endState`) when motion is allowed; otherwise apply `applyEndState`
 * immediately so the visitor lands on the same content with no motion.
 * Both branches must produce the same final DOM state.
 */
export function runOrSkip(animateFn: () => void, applyEndState: () => void): void {
  if (prefersReducedMotion()) {
    applyEndState();
  } else {
    animateFn();
  }
}
