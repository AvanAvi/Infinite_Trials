import { animate, random, stagger } from 'animejs';

import { findMultisets, type CharValue } from '../core/backtracking';
import { countMultisetsWithSum } from '../core/collisions';
import { ALPHABET } from '../core/encoding';
import { allPartitionValues, getPartitionValue, v1Encrypt } from '../core/v1';
import { prefersReducedMotion } from '../motion/reducedMotion';
import { getDemoPassword, onDemoPasswordChange } from '../state/demoPassword';
import { createSectionShell, type SectionShell } from './shell';

// Live computation stays fast (single-digit ms) only within these bounds -
// see the timing check in the Step 5 commit: password12's real case (K
// ~982,000, length 10) takes ~1.7s to sample even 30 results, which would
// visibly stall the page. Short demo inputs stay well under a few ms.
const MAX_LIVE_LENGTH = 6;
const MAX_LIVE_K = 100_000n;
const MAX_SAMPLES = 24;

// docs/ANALYSIS.md's worked example - verified again live in Section 3's
// own demo (typing "password12" there shows K=981954 exactly). The 16
// sample strings below are real output from src/core/backtracking.ts's
// findMultisets(charValues, 981954n, 10, 16) - precomputed here rather
// than recomputed on every page load, since that call alone takes ~1.7s.
// Reproduce with: npx vite-node - against src/core/backtracking.ts.
const DOCUMENTED_PASSWORD = 'password12';
const DOCUMENTED_K = 981954n;
const DOCUMENTED_TOTAL = 166166n;
const DOCUMENTED_SAMPLES = [
  'aaaaaaeVY2',
  'aaaaacdVY2',
  'aaaaacppH6',
  'aaaaagwwG6',
  'aaaaajqTZ2',
  'aaaaatEXY1',
  'aaaabdlrH6',
  'aaaabhlA12',
  'aaaabqqKX4',
  'aaaacgvwU5',
  'aaaacgzCD6',
  'aaaaciwAF6',
  'aaaacjoDE6',
  'aaaacqqBF6',
  'aaaactuDD6',
  'aaaadhrMZ3',
];

let charValuesCache: CharValue[] | null = null;
function charValues(): CharValue[] {
  if (!charValuesCache) {
    charValuesCache = Array.from(ALPHABET).map((char) => ({
      char,
      value: getPartitionValue(char),
    }));
  }
  return charValuesCache;
}

interface Explosion {
  origin: string;
  k: bigint;
  total: bigint;
  samples: string[];
  isLive: boolean;
}

function computeExplosion(password: string): Explosion | null {
  if (!password) return null;

  let k: bigint;
  try {
    k = v1Encrypt(password).k;
  } catch {
    return null;
  }

  if (password.length <= MAX_LIVE_LENGTH && k <= MAX_LIVE_K) {
    const total = countMultisetsWithSum(allPartitionValues(), password.length, k);
    const samples = findMultisets(charValues(), k, password.length, MAX_SAMPLES);
    return { origin: password, k, total, samples, isLive: true };
  }

  return {
    origin: DOCUMENTED_PASSWORD,
    k: DOCUMENTED_K,
    total: DOCUMENTED_TOTAL,
    samples: DOCUMENTED_SAMPLES,
    isLive: false,
  };
}

export function createCrackSection(): SectionShell {
  const shell = createSectionShell({
    id: 'crack',
    eyebrow: 'The crack',
    heading: 'My own 2019 draft claimed this was unique',
    lead: 'The same Z from the last section explodes into every other string that produces it - all real, computed live. A realistic 10-character password shares its Z with 166,165 completely unrelated others.',
    quote: {
      text: 'There exists only one possible combination of numbers through which we get the above result for ‘Z’.',
      source: 'ARCHITECTURE_DRAFT_1.pdf, 9/4/19',
    },
    idea: 'I measured it, and it’s off by 166,165.',
    accent: 'warm',
    stagePlaceholder: '',
  });

  shell.stage.classList.add('stage--live');
  shell.stage.textContent = '';

  const summary = document.createElement('p');
  summary.className = 'stat__value';
  summary.setAttribute('aria-live', 'polite');

  const note = document.createElement('p');
  note.className = 'crack-note';

  const swarm = document.createElement('div');
  swarm.className = 'collision-swarm';
  swarm.setAttribute('aria-label', 'Other strings that produce the same encrypted value');

  shell.stage.append(summary, note, swarm);

  function fmt(n: bigint): string {
    return n.toLocaleString('en-US');
  }

  function render(password: string): void {
    const explosion = computeExplosion(password);

    if (!explosion) {
      summary.textContent = 'Type a valid demo string above to see it explode.';
      note.textContent = '';
      swarm.replaceChildren();
      return;
    }

    const others = explosion.total - 1n;
    if (explosion.isLive) {
      summary.textContent = `"${explosion.origin}" (K=${fmt(explosion.k)}) shares its Z with ${fmt(others)} other ${explosion.origin.length}-character strings.`;
      note.textContent =
        explosion.samples.length < others
          ? `Showing ${explosion.samples.length} of them, found live in your browser.`
          : 'All of them, found live in your browser.';
    } else {
      summary.textContent = `"${explosion.origin}" (K=${fmt(explosion.k)}) shares its Z with ${fmt(others)} other 10-character strings - documented in docs/ANALYSIS.md.`;
      note.textContent = `Your current demo string is too long to search live here, so this shows the documented example instead - ${explosion.samples.length} of its real ${fmt(others)} collisions.`;
    }

    swarm.replaceChildren();
    const items = explosion.samples
      .filter((s) => s !== explosion.origin)
      .map((sample) => {
        const item = document.createElement('span');
        item.className = 'collision-swarm__item';
        item.textContent = sample;
        swarm.append(item);
        return item;
      });

    const originItem = document.createElement('span');
    originItem.className = 'collision-swarm__item collision-swarm__item--origin';
    originItem.textContent = [...explosion.origin].sort().join('');
    swarm.prepend(originItem);

    if (!prefersReducedMotion() && items.length > 0) {
      animate(items, {
        opacity: [0, 1],
        scale: [0.4, 1],
        translateX: () => random(-14, 14),
        translateY: () => random(-10, 10),
        rotate: () => random(-8, 8),
        duration: 420,
        delay: stagger(22),
        ease: 'outQuad',
      });
    }
  }

  const initial = getDemoPassword();
  render(initial);

  onDemoPasswordChange((password) => render(password));

  return shell;
}
