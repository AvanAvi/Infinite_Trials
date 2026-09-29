/**
 * Shares the V1 demo section's current input with the crack section, so
 * "the same Z from the last section explodes" (per STORYBOARD.md) is
 * literally the same value, not a second independent input. v1Demo.ts
 * writes here on every successfully-encrypted render; crack.ts reads the
 * current value on its own mount (sections are created in DOM order, so
 * v1Demo's initial render has already run by then) and subscribes for
 * later changes.
 */

type Listener = (password: string) => void;

let currentPassword = '';
const listeners = new Set<Listener>();

export function setDemoPassword(password: string): void {
  currentPassword = password;
  for (const listener of listeners) {
    listener(password);
  }
}

export function getDemoPassword(): string {
  return currentPassword;
}

/** Returns an unsubscribe function. */
export function onDemoPasswordChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
