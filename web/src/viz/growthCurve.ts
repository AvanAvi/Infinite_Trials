/**
 * log(p(k)) plotted against the Hardy-Ramanujan asymptotic
 * p(n) ~ (1/(4n*sqrt(3))) * e^(pi*sqrt(2n/3)), for k = 1..maxN. Plotted
 * in log space (natural log) since p(n) grows too fast for a linear
 * axis to show both ends of even a small range like 1..60 - and the
 * asymptotic's log form is computed directly (-ln(4*sqrt(3)) - ln(n) +
 * pi*sqrt(2n/3)) rather than via a literal e^(...) that would overflow
 * a double well before n = 60.
 */

import { pSequence } from '../core/partitions';

const SVG_NS = 'http://www.w3.org/2000/svg';
const WIDTH = 420;
const HEIGHT = 220;
const MARGIN = { top: 12, right: 12, bottom: 12, left: 12 };

function asymptoticLog(n: number): number {
  if (n <= 0) return 0;
  return -Math.log(4 * Math.sqrt(3)) - Math.log(n) + Math.PI * Math.sqrt((2 * n) / 3);
}

export interface GrowthCurveHandle {
  element: SVGSVGElement;
  setHighlightN(n: number): void;
}

export function createGrowthCurve(container: HTMLElement, maxN: number): GrowthCurveHandle {
  const pValues = pSequence(maxN);

  const actualLog: number[] = [];
  const asymptotic: number[] = [];
  for (let k = 1; k <= maxN; k++) {
    actualLog.push(Math.log(Number(pValues[k]!)));
    asymptotic.push(asymptoticLog(k));
  }

  const allValues = [...actualLog, ...asymptotic];
  const minY = Math.min(...allValues);
  const maxY = Math.max(...allValues);

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  function xFor(k: number): number {
    return MARGIN.left + ((k - 1) / Math.max(maxN - 1, 1)) * plotWidth;
  }

  function yFor(value: number): number {
    const t = (value - minY) / Math.max(maxY - minY, 1e-9);
    return MARGIN.top + (1 - t) * plotHeight;
  }

  function pathFor(values: number[]): string {
    return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i + 1)} ${yFor(v)}`).join(' ');
  }

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('growth-curve');
  svg.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
  svg.setAttribute('width', String(WIDTH));
  svg.setAttribute('height', String(HEIGHT));
  svg.setAttribute('role', 'img');
  svg.setAttribute(
    'aria-label',
    `Growth of p(n) from n=1 to n=${maxN}, compared with the Hardy-Ramanujan asymptotic approximation`
  );

  const asymptoticPath = document.createElementNS(SVG_NS, 'path');
  asymptoticPath.setAttribute('class', 'growth-curve__asymptotic');
  asymptoticPath.setAttribute('d', pathFor(asymptotic));

  const actualPath = document.createElementNS(SVG_NS, 'path');
  actualPath.setAttribute('class', 'growth-curve__actual');
  actualPath.setAttribute('d', pathFor(actualLog));

  const highlight = document.createElementNS(SVG_NS, 'circle');
  highlight.setAttribute('r', '4');
  highlight.setAttribute('class', 'growth-curve__highlight');

  svg.append(asymptoticPath, actualPath, highlight);
  container.appendChild(svg);

  function setHighlightN(n: number): void {
    const clamped = Math.min(Math.max(n, 1), maxN);
    highlight.setAttribute('cx', String(xFor(clamped)));
    highlight.setAttribute('cy', String(yFor(actualLog[clamped - 1]!)));
  }

  setHighlightN(1);

  return { element: svg, setHighlightN };
}
