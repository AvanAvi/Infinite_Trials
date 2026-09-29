import { animate, stagger } from 'animejs';

import { CONSTANT_C, v1Encrypt } from '../core/v1';
import { prefersReducedMotion } from '../motion/reducedMotion';
import { setDemoPassword } from '../state/demoPassword';
import { createNumberReveal } from '../viz/numberReveal';
import { createSectionShell, type SectionShell } from './shell';

const DEFAULT_PASSWORD = 'hello';
const DEBOUNCE_MS = 150;

export function createV1DemoSection(): SectionShell {
  const shell = createSectionShell({
    id: 'v1-demo',
    eyebrow: 'V1 in action',
    heading: 'Encrypting is just adding up big numbers',
    lead: 'Type a demo string and watch each character fly out to its own partition value, collapse into a running total K, then add the public constant C to produce Z.',
    idea: 'Nothing about addition can be undone without more information than the sum alone gives you.',
    accent: 'warm',
    demoWarning: true,
    stagePlaceholder: '',
  });

  shell.stage.classList.add('stage--live');
  shell.stage.textContent = '';

  const controlRow = document.createElement('div');
  controlRow.className = 'control-row';

  const label = document.createElement('label');
  label.setAttribute('for', 'v1-input');
  label.textContent = 'password =';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'v1-input';
  input.value = DEFAULT_PASSWORD;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-describedby', 'v1-error');

  controlRow.append(label, input);

  const stepsRow = document.createElement('div');
  stepsRow.className = 'v1-steps';
  stepsRow.setAttribute('aria-label', 'Each character mapped to its partition value');

  const statRow = document.createElement('div');
  statRow.className = 'stat-row';

  function makeStat(labelText: string): { stat: HTMLElement; valueEl: HTMLElement } {
    const stat = document.createElement('div');
    stat.className = 'stat';
    const statLabel = document.createElement('span');
    statLabel.className = 'stat__label';
    statLabel.textContent = labelText;
    const valueEl = document.createElement('span');
    valueEl.className = 'stat__value';
    stat.append(statLabel, valueEl);
    return { stat, valueEl };
  }

  const kStat = makeStat('K (sum)');
  const cStat = makeStat('+ C');
  const zStat = makeStat('Z (encrypted)');
  cStat.valueEl.textContent = CONSTANT_C.toString();
  cStat.valueEl.classList.add('num');

  statRow.append(kStat.stat, cStat.stat, zStat.stat);

  const errorEl = document.createElement('p');
  errorEl.className = 'v1-error';
  errorEl.id = 'v1-error';
  errorEl.setAttribute('role', 'alert');
  errorEl.setAttribute('aria-live', 'polite');

  shell.stage.append(controlRow, stepsRow, statRow, errorEl);

  // Guards the Z-reveal setTimeout below: if the visitor keeps typing before
  // it fires, a stale timeout from an earlier render() could otherwise
  // overwrite a newer, already-settled result.
  let pendingZRevealId: ReturnType<typeof setTimeout> | null = null;

  function clearStage(): void {
    stepsRow.replaceChildren();
    kStat.valueEl.replaceChildren();
    zStat.valueEl.replaceChildren();
  }

  function render(password: string): void {
    errorEl.textContent = '';
    if (pendingZRevealId !== null) {
      clearTimeout(pendingZRevealId);
      pendingZRevealId = null;
    }

    let result;
    try {
      result = v1Encrypt(password);
    } catch (err) {
      clearStage();
      errorEl.textContent =
        err instanceof Error
          ? `${err.message} (only a-z, A-Z, 0-9 are in the V1/V2 table).`
          : 'Invalid input.';
      return;
    }

    if (result.steps.length === 0) {
      clearStage();
      return;
    }

    setDemoPassword(password);

    stepsRow.replaceChildren();
    const cards = result.steps.map(({ char, partitionValue }) => {
      const card = document.createElement('div');
      card.className = 'v1-step';
      const charEl = document.createElement('span');
      charEl.className = 'v1-step__char';
      charEl.textContent = char;
      const valueEl = document.createElement('span');
      valueEl.className = 'v1-step__value num';
      valueEl.textContent = partitionValue.toString();
      card.append(charEl, valueEl);
      stepsRow.append(card);
      return card;
    });

    if (!prefersReducedMotion()) {
      animate(cards, {
        opacity: [0, 1],
        translateY: [10, 0],
        scale: [0.85, 1],
        duration: 320,
        delay: stagger(35),
        ease: 'outQuad',
      });
    }

    kStat.valueEl.replaceChildren();
    createNumberReveal(kStat.valueEl, result.k.toString());

    zStat.valueEl.replaceChildren();
    const revealDelay = prefersReducedMotion() ? 0 : 60 * cards.length + 150;
    if (revealDelay > 0) {
      pendingZRevealId = setTimeout(() => {
        pendingZRevealId = null;
        createNumberReveal(zStat.valueEl, result.z.toString());
      }, revealDelay);
    } else {
      createNumberReveal(zStat.valueEl, result.z.toString());
    }
  }

  let debounceId: ReturnType<typeof setTimeout> | null = null;
  input.addEventListener('input', () => {
    if (debounceId !== null) clearTimeout(debounceId);
    debounceId = setTimeout(() => render(input.value), DEBOUNCE_MS);
  });

  render(DEFAULT_PASSWORD);

  return shell;
}
