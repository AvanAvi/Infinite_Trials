/**
 * A Ferrers/Young diagram: a partition of N rendered as rows of dots,
 * one row per part, most parts first (matching the canonical order
 * Version3/partition_rank.py and src/core/rank.ts both use). Reused
 * across the hero, spark, and (Step 6) V3 pipeline sections - one
 * component, several data sources, per the lesson step 1 drew from
 * animejs.com reusing a single shared visual across its 8 feature cards.
 *
 * Because every partition of the same N has exactly N dots total, only
 * their (row, column) position changes between partitions - dots are
 * paired old-index-to-new-index in reading order (top-to-bottom,
 * left-to-right) and FLIP-repositioned, not cross-faded, so the
 * regrouping itself stays legible.
 */

import { animate, stagger } from 'animejs';

import { prefersReducedMotion } from '../motion/reducedMotion';

const DOT_RADIUS = 9;
const DOT_GAP = 30;
const PADDING = DOT_RADIUS + 4;
const SVG_NS = 'http://www.w3.org/2000/svg';

export interface FerrersDiagramHandle {
  element: SVGSVGElement;
  setPartition(partition: number[]): void;
  destroy(): void;
}

function layoutPositions(partition: number[]): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  partition.forEach((count, row) => {
    for (let col = 0; col < count; col++) {
      positions.push({ x: PADDING + col * DOT_GAP, y: PADDING + row * DOT_GAP });
    }
  });
  return positions;
}

export function createFerrersDiagram(
  container: HTMLElement,
  initial: number[],
  label: string
): FerrersDiagramHandle {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
  svg.classList.add('ferrers-diagram');
  container.appendChild(svg);

  let dots: SVGCircleElement[] = [];

  function updateViewBox(partition: number[]): void {
    const maxCols = Math.max(...partition, 1);
    const rows = Math.max(partition.length, 1);
    const width = PADDING * 2 + (maxCols - 1) * DOT_GAP;
    const height = PADDING * 2 + (rows - 1) * DOT_GAP;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    // An explicit intrinsic size is required: with only a viewBox, a
    // browser falls back to stretching the SVG to its container's width
    // (a default CSS size, not the viewBox's own aspect ratio), which
    // blew tiny 7px dots up into a single giant circle filling the stage.
    // CSS below then scales this down responsively while preserving
    // the correct aspect ratio.
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
  }

  function render(partition: number[], animated: boolean): void {
    const positions = layoutPositions(partition);
    updateViewBox(partition);

    while (dots.length < positions.length) {
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('r', String(DOT_RADIUS));
      circle.classList.add('ferrers-dot');
      svg.appendChild(circle);
      dots.push(circle);
    }
    while (dots.length > positions.length) {
      dots.pop()?.remove();
    }

    const shouldAnimate = animated && !prefersReducedMotion();

    dots.forEach((dot, i) => {
      const pos = positions[i]!;
      if (shouldAnimate) {
        animate(dot, {
          cx: pos.x,
          cy: pos.y,
          duration: 450,
          delay: stagger(6),
          ease: 'inOutQuad',
        });
      } else {
        dot.setAttribute('cx', String(pos.x));
        dot.setAttribute('cy', String(pos.y));
      }
    });
  }

  render(initial, false);

  return {
    element: svg,
    setPartition(partition: number[]) {
      render(partition, true);
    },
    destroy() {
      svg.remove();
      dots = [];
    },
  };
}
