/**
 * Animated display for a changing number (p(n), K, Z - values that can
 * grow to dozens of digits). Renders the value as one <span> per
 * character and staggers their reveal left-to-right, rather than a true
 * per-position digit roll: growing numbers change digit *count*, not
 * just digit values (e.g. p(n) gaining a digit as n crosses a power-of-
 * ten boundary), so there's no stable position to roll old-digit into
 * new-digit at. A staggered cascade still reads as "this number just
 * changed, fast" without pretending a positional correspondence exists
 * where the math doesn't have one.
 */

import { animate, stagger } from 'animejs';

import { prefersReducedMotion } from '../motion/reducedMotion';

export interface NumberRevealHandle {
  element: HTMLElement;
  setValue(text: string): void;
}

export function createNumberReveal(container: HTMLElement, initial: string): NumberRevealHandle {
  const wrapper = document.createElement('span');
  wrapper.className = 'num-reveal num';
  container.appendChild(wrapper);

  function renderChars(text: string): HTMLSpanElement[] {
    wrapper.replaceChildren();
    return Array.from(text).map((char) => {
      const span = document.createElement('span');
      span.className = 'num-reveal__char';
      span.textContent = char;
      wrapper.appendChild(span);
      return span;
    });
  }

  function setValue(text: string): void {
    const chars = renderChars(text);
    if (prefersReducedMotion()) {
      return;
    }
    animate(chars, {
      opacity: [0, 1],
      translateY: [6, 0],
      duration: 260,
      delay: stagger(18),
      ease: 'outQuad',
    });
  }

  renderChars(initial);

  return { element: wrapper, setValue };
}
