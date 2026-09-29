import { animate, stagger } from 'animejs';

import { decodePassword, encodePassword, MAX_PASSWORD_LENGTH } from '../core/encoding';
import { decryptDomainTraced, encryptDomainTraced, type FeistelTrace } from '../core/feistel';
import { minN, partitionsCount } from '../core/partitions';
import { rank, unrank } from '../core/rank';
import { prefersReducedMotion } from '../motion/reducedMotion';
import { createFerrersDiagram, type FerrersDiagramHandle } from '../viz/ferrersDiagram';
import { createSectionShell, type SectionShell } from './shell';

const KEY_BYTES = 32;
const DEFAULT_PASSWORD = 'hi';
const SPEEDS = [
  { label: 'Slow', ms: 2200 },
  { label: 'Normal', ms: 1200 },
  { label: 'Fast', ms: 500 },
];

function randomKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(KEY_BYTES));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fmt(n: bigint): string {
  return n.toLocaleString('en-US');
}

interface Stage {
  title: string;
  body: HTMLElement;
}

function stageEl(title: string): { stage: HTMLElement; body: HTMLElement } {
  const stage = document.createElement('div');
  stage.className = 'pipeline-stage';
  const titleEl = document.createElement('p');
  titleEl.className = 'pipeline-stage__title';
  titleEl.textContent = title;
  const body = document.createElement('div');
  body.className = 'pipeline-stage__body';
  stage.append(titleEl, body);
  return { stage, body };
}

function feistelTable(trace: FeistelTrace): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'feistel-table-wrap';
  const table = document.createElement('table');
  table.className = 'feistel-table';

  const thead = document.createElement('thead');
  thead.innerHTML = '';
  const headRow = document.createElement('tr');
  for (const label of ['Round', 'L', 'R']) {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.append(th);
  }
  thead.append(headRow);

  const tbody = document.createElement('tbody');
  for (const state of trace.rounds) {
    const row = document.createElement('tr');
    const roundCell = document.createElement('td');
    roundCell.textContent = state.round === 0 ? 'split' : String(state.round);
    const lCell = document.createElement('td');
    lCell.className = 'num';
    lCell.textContent = state.L.toString();
    const rCell = document.createElement('td');
    rCell.className = 'num';
    rCell.textContent = state.R.toString();
    row.append(roundCell, lCell, rCell);
    tbody.append(row);
  }

  table.append(thead, tbody);
  wrap.append(table);
  return wrap;
}

export function createV3PipelineSection(): SectionShell {
  const shell = createSectionShell({
    id: 'v3-pipeline',
    eyebrow: 'V3 pipeline',
    heading: 'Text, integer, Feistel rounds, ciphertext partition',
    lead: 'Step through the real pipeline: base-62 encoding, 10+ Feistel rounds with cycle-walking, then unranking into the ciphertext partition. Decrypt runs it backward. A wrong-key toggle shows what actually happens.',
    idea: 'Reversing this needs the key - walking through every step live is what proves there’s no shortcut.',
    accent: 'cool',
    demoWarning: true,
    stagePlaceholder: '',
  });

  shell.stage.classList.add('stage--live');
  shell.stage.textContent = '';

  // --- controls ---
  const controls = document.createElement('div');
  controls.className = 'pipeline-controls';

  const modeRow = document.createElement('div');
  modeRow.className = 'pipeline-mode-row';
  modeRow.setAttribute('role', 'group');
  modeRow.setAttribute('aria-label', 'Direction');
  const encryptBtn = document.createElement('button');
  encryptBtn.type = 'button';
  encryptBtn.textContent = 'Encrypt';
  const decryptBtn = document.createElement('button');
  decryptBtn.type = 'button';
  decryptBtn.textContent = 'Decrypt';
  modeRow.append(encryptBtn, decryptBtn);

  const inputRow = document.createElement('div');
  inputRow.className = 'control-row';
  const inputLabel = document.createElement('label');
  inputLabel.setAttribute('for', 'v3-input');
  inputLabel.textContent = 'password =';
  const passwordInput = document.createElement('input');
  passwordInput.type = 'text';
  passwordInput.id = 'v3-input';
  passwordInput.value = DEFAULT_PASSWORD;
  passwordInput.autocomplete = 'off';
  passwordInput.spellcheck = false;
  passwordInput.maxLength = MAX_PASSWORD_LENGTH;
  inputRow.append(inputLabel, passwordInput);

  const ciphertextRow = document.createElement('div');
  ciphertextRow.className = 'control-row';
  const ciphertextLabel = document.createElement('label');
  ciphertextLabel.setAttribute('for', 'v3-ciphertext');
  ciphertextLabel.textContent = 'ciphertext =';
  const ciphertextInput = document.createElement('input');
  ciphertextInput.type = 'text';
  ciphertextInput.id = 'v3-ciphertext';
  ciphertextInput.readOnly = true;
  ciphertextRow.append(ciphertextLabel, ciphertextInput);

  const keyRow = document.createElement('div');
  keyRow.className = 'pipeline-key-row';
  const genKeyBtn = document.createElement('button');
  genKeyBtn.type = 'button';
  genKeyBtn.textContent = 'Generate new key';
  genKeyBtn.className = 'hero-diagram__next';
  const keyDisplay = document.createElement('span');
  keyDisplay.className = 'pipeline-key-value';
  keyRow.append(genKeyBtn, keyDisplay);

  const wrongKeyLabel = document.createElement('label');
  wrongKeyLabel.className = 'pipeline-toggle';
  const wrongKeyCheckbox = document.createElement('input');
  wrongKeyCheckbox.type = 'checkbox';
  wrongKeyLabel.append(wrongKeyCheckbox, document.createTextNode(' decrypt with the wrong key'));

  const playback = document.createElement('div');
  playback.className = 'pipeline-playback';
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.textContent = '◀ Step';
  const playPauseBtn = document.createElement('button');
  playPauseBtn.type = 'button';
  playPauseBtn.textContent = 'Play';
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.textContent = 'Step ▶';
  const speedSelect = document.createElement('select');
  speedSelect.setAttribute('aria-label', 'Playback speed');
  for (const { label, ms } of SPEEDS) {
    const opt = document.createElement('option');
    opt.value = String(ms);
    opt.textContent = label;
    if (ms === 1200) opt.selected = true;
    speedSelect.append(opt);
  }
  playback.append(prevBtn, playPauseBtn, nextBtn, speedSelect);

  const statusLine = document.createElement('p');
  statusLine.className = 'tree-stats';
  statusLine.setAttribute('aria-live', 'polite');

  controls.append(modeRow, inputRow, ciphertextRow, keyRow, wrongKeyLabel, playback, statusLine);

  const stagesContainer = document.createElement('div');
  stagesContainer.className = 'pipeline-stages';

  shell.stage.append(controls, stagesContainer);

  // --- state ---
  let mode: 'encrypt' | 'decrypt' = 'encrypt';
  let key = randomKey();
  let lastCiphertext = '';
  let stages: Stage[] = [];
  let currentIndex = 0;
  let playing = false;
  let playIntervalId: ReturnType<typeof setInterval> | null = null;
  let runGeneration = 0;
  let diagramHandle: FerrersDiagramHandle | null = null;

  function updateKeyDisplay(): void {
    keyDisplay.textContent = bytesToHex(key);
  }
  updateKeyDisplay();

  function setMode(next: 'encrypt' | 'decrypt'): void {
    mode = next;
    encryptBtn.setAttribute('aria-pressed', String(mode === 'encrypt'));
    decryptBtn.setAttribute('aria-pressed', String(mode === 'decrypt'));
    inputRow.style.display = mode === 'encrypt' ? '' : 'none';
    ciphertextRow.style.display = mode === 'decrypt' ? '' : 'none';
    wrongKeyLabel.style.display = mode === 'decrypt' ? '' : 'none';
    run();
  }

  function highlightStage(index: number): void {
    currentIndex = Math.max(0, Math.min(index, stages.length - 1));
    const cards = stagesContainer.querySelectorAll('.pipeline-stage');
    cards.forEach((card, i) =>
      card.classList.toggle('pipeline-stage--current', i === currentIndex)
    );
    const current = cards[currentIndex];
    if (current) current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function stopPlaying(): void {
    playing = false;
    playPauseBtn.textContent = 'Play';
    if (playIntervalId !== null) {
      clearInterval(playIntervalId);
      playIntervalId = null;
    }
  }

  function startPlaying(): void {
    if (stages.length === 0) return;
    playing = true;
    playPauseBtn.textContent = 'Pause';
    const speedMs = Number(speedSelect.value);
    playIntervalId = setInterval(() => {
      if (currentIndex >= stages.length - 1) {
        stopPlaying();
        return;
      }
      highlightStage(currentIndex + 1);
    }, speedMs);
  }

  function renderStages(newStages: Stage[]): void {
    stopPlaying();
    stages = newStages;
    stagesContainer.replaceChildren();
    const cards = stages.map((s) => {
      const { stage, body } = stageEl(s.title);
      body.append(s.body);
      stagesContainer.append(stage);
      return stage;
    });
    currentIndex = 0;
    if (cards.length > 0) cards[0]!.classList.add('pipeline-stage--current');

    if (!prefersReducedMotion()) {
      animate(cards, {
        opacity: [0, 1],
        translateY: [8, 0],
        duration: 260,
        delay: stagger(40),
        ease: 'outQuad',
      });
    }
  }

  async function runEncrypt(password: string, generation: number): Promise<void> {
    let encoded;
    try {
      encoded = encodePassword(password);
    } catch (err) {
      if (generation !== runGeneration) return;
      statusLine.textContent = err instanceof Error ? err.message : 'Invalid password.';
      renderStages([]);
      return;
    }

    const { value, length } = encoded;
    const N = minN(62n ** BigInt(length));
    const domainSize = partitionsCount(N);
    const trace = await encryptDomainTraced(value, key, domainSize);
    if (generation !== runGeneration) return; // a newer run superseded this one

    const parts = unrank(trace.result, N);
    const ciphertext = `${N}:${length}:${parts.join('+')}`;
    lastCiphertext = ciphertext;
    ciphertextInput.value = ciphertext;

    const newStages: Stage[] = [];

    const encodeBody = document.createElement('p');
    encodeBody.append(
      document.createTextNode(`"${password}" -> value `),
      spanNum(value.toString()),
      document.createTextNode(`, length ${length}`)
    );
    newStages.push({ title: '1. Encode (base-62)', body: encodeBody });

    const nBody = document.createElement('p');
    nBody.append(
      document.createTextNode(`min_N(62^${length}) = `),
      spanNum(String(N)),
      document.createTextNode(' -> p(N) = '),
      spanNum(fmt(domainSize))
    );
    newStages.push({ title: '2. Choose the partition domain', body: nBody });

    newStages.push({
      title: `3. Feistel rounds (${trace.rounds.length - 1} real rounds, ${trace.bitWidth}-bit halves)`,
      body: feistelTable(trace),
    });

    const walkBody = document.createElement('p');
    walkBody.textContent =
      trace.cycleWalks === 1
        ? 'Landed inside the domain on the first try - no cycle walking needed.'
        : `Walked ${trace.cycleWalks} times before landing inside the domain.`;
    newStages.push({ title: '4. Cycle walking', body: walkBody });

    const diagramWrap = document.createElement('div');
    diagramWrap.className = 'hero-diagram';
    diagramHandle?.destroy();
    diagramHandle = createFerrersDiagram(diagramWrap, parts, 'Ciphertext partition diagram');
    newStages.push({ title: '5. Unrank into a partition of N', body: diagramWrap });

    const ciphertextBody = document.createElement('p');
    ciphertextBody.className = 'num pipeline-key-value';
    ciphertextBody.textContent = ciphertext;
    newStages.push({ title: '6. Ciphertext', body: ciphertextBody });

    statusLine.textContent = `Encrypted "${password}" -> ${ciphertext.length} character ciphertext.`;
    renderStages(newStages);
  }

  async function runDecrypt(ciphertext: string, generation: number): Promise<void> {
    const segments = ciphertext.split(':');
    if (segments.length !== 3) {
      statusLine.textContent = 'No ciphertext yet - encrypt a password first.';
      renderStages([]);
      return;
    }
    const [nStr, lengthStr, partsStr] = segments as [string, string, string];
    const N = Number(nStr);
    const length = Number(lengthStr);
    const parts = partsStr.length > 0 ? partsStr.split('+').map(Number) : [];

    const usedKey = wrongKeyCheckbox.checked ? randomKey() : key;
    const domainSize = partitionsCount(N);
    const permuted = rank(parts, N);
    const trace = await decryptDomainTraced(permuted, usedKey, domainSize);
    if (generation !== runGeneration) return;

    const newStages: Stage[] = [];

    const diagramWrap = document.createElement('div');
    diagramWrap.className = 'hero-diagram';
    diagramHandle?.destroy();
    diagramHandle = createFerrersDiagram(diagramWrap, parts, 'Ciphertext partition diagram');
    newStages.push({ title: '1. Rank the ciphertext partition', body: diagramWrap });

    const walkBody = document.createElement('p');
    walkBody.textContent =
      trace.cycleWalks === 1
        ? 'Landed inside the domain on the first try.'
        : `Walked ${trace.cycleWalks} times before landing inside the domain.`;
    newStages.push({ title: '2. Cycle walking (reverse)', body: walkBody });

    newStages.push({
      title: `3. Feistel rounds in reverse (${trace.rounds.length - 1} rounds)`,
      body: feistelTable(trace),
    });

    const resultBody = document.createElement('p');
    let recoveredText: string;
    try {
      recoveredText = decodePassword(trace.result, length);
      resultBody.className = 'pipeline-success';
      resultBody.textContent = `Recovered: "${recoveredText}"`;
    } catch {
      resultBody.className = 'pipeline-error';
      resultBody.textContent =
        'This value does not decode to a valid password of this length - wrong key or corrupted ciphertext.';
      recoveredText = '';
    }
    newStages.push({ title: '4. Decode back to a password', body: resultBody });

    if (wrongKeyCheckbox.checked) {
      statusLine.textContent = recoveredText
        ? `Wrong key still produced a valid-looking password - just not the right one: "${recoveredText}".`
        : 'Wrong key: the result is not a valid password. This is real output, not staged.';
    } else {
      statusLine.textContent = `Decrypted with the correct key -> "${recoveredText}".`;
    }

    renderStages(newStages);
  }

  function spanNum(text: string): HTMLElement {
    const span = document.createElement('span');
    span.className = 'num';
    span.textContent = text;
    return span;
  }

  function run(): void {
    const generation = ++runGeneration;
    if (mode === 'encrypt') {
      void runEncrypt(passwordInput.value, generation);
    } else {
      void runDecrypt(lastCiphertext, generation);
    }
  }

  let debounceId: ReturnType<typeof setTimeout> | null = null;
  function scheduleRun(): void {
    if (debounceId !== null) clearTimeout(debounceId);
    debounceId = setTimeout(run, 150);
  }

  encryptBtn.addEventListener('click', () => setMode('encrypt'));
  decryptBtn.addEventListener('click', () => setMode('decrypt'));
  passwordInput.addEventListener('input', scheduleRun);
  wrongKeyCheckbox.addEventListener('change', run);
  genKeyBtn.addEventListener('click', () => {
    key = randomKey();
    updateKeyDisplay();
    run();
  });
  prevBtn.addEventListener('click', () => {
    stopPlaying();
    highlightStage(currentIndex - 1);
  });
  nextBtn.addEventListener('click', () => {
    stopPlaying();
    highlightStage(currentIndex + 1);
  });
  playPauseBtn.addEventListener('click', () => {
    if (playing) {
      stopPlaying();
    } else {
      startPlaying();
    }
  });

  setMode('encrypt');

  return shell;
}
