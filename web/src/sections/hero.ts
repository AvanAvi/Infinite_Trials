import { partitionsCount } from '../core/partitions';
import { unrank as unrankPartition } from '../core/rank';
import { prefersReducedMotion } from '../motion/reducedMotion';
import { createFerrersDiagram } from '../viz/ferrersDiagram';
import { createSectionShell, type SectionShell } from './shell';

const N = 8;
const CYCLE_MS = 2200;

function formatPartition(partition: number[]): string {
  return `${N} = ${partition.join(' + ')}`;
}

export function createHeroSection(): SectionShell {
  const shell = createSectionShell({
    id: 'hero',
    eyebrow: 'Infinite Trials',
    heading: 'How many ways can a number break apart?',
    lead: 'A partition diagram of the number 8, regrouping through its different partitions - the question this whole project starts from.',
    idea: 'This whole project starts from one question: how many different ways can a number be broken into pieces?',
    stagePlaceholder: '',
  });

  shell.stage.classList.add('stage--hero');
  shell.stage.textContent = '';

  const wrap = document.createElement('div');
  wrap.className = 'hero-diagram';

  const total = partitionsCount(N);
  const totalNum = Number(total);

  let rank = 0;
  const initialPartition = unrankPartition(BigInt(rank), N);

  const diagram = createFerrersDiagram(wrap, initialPartition, `Partition diagram of ${N}`);

  const caption = document.createElement('p');
  caption.className = 'hero-diagram__caption num';
  caption.setAttribute('aria-live', 'polite');
  caption.textContent = formatPartition(initialPartition);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'hero-diagram__next';
  button.textContent = 'Show next partition';

  const counter = document.createElement('p');
  counter.className = 'hero-diagram__counter';
  counter.textContent = `1 of ${totalNum} partitions of ${N}`;

  wrap.append(diagram.element, caption);
  shell.stage.append(wrap, button, counter);

  function showRank(nextRank: number): void {
    rank = ((nextRank % totalNum) + totalNum) % totalNum;
    const partition = unrankPartition(BigInt(rank), N);
    diagram.setPartition(partition);
    caption.textContent = formatPartition(partition);
    counter.textContent = `${rank + 1} of ${totalNum} partitions of ${N}`;
  }

  let intervalId: ReturnType<typeof setInterval> | null = null;

  function stopAutoCycle(): void {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function startAutoCycle(): void {
    if (prefersReducedMotion()) return; // ambient auto-advance is itself a motion preference, not just the transition
    stopAutoCycle();
    intervalId = setInterval(() => showRank(rank + 1), CYCLE_MS);
  }

  button.addEventListener('click', () => {
    stopAutoCycle(); // first interaction hands control to the visitor permanently
    showRank(rank + 1);
  });

  startAutoCycle();

  return shell;
}
