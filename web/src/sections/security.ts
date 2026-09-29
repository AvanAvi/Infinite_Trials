/**
 * Section 7: where the security actually comes from. A live Argon2id
 * derivation (hash-wasm, in the browser) run against Version3/kdf.py's
 * own reference measurement, plus the known limits and roadmap straight
 * from docs/THREAT_MODEL.md and docs/ROADMAP.md - nothing here is a
 * claim beyond what those documents already state.
 */

import { deriveKey } from '../core/kdf';
import { createSectionShell, type SectionShell } from './shell';

const DEFAULT_PASSPHRASE = 'correct horse battery staple';

// docs/THREAT_MODEL.md's "Known limitations" section, condensed to one
// line each. Order matches the source document.
const KNOWN_LIMITATIONS: { title: string; body: string }[] = [
  {
    title: 'Deterministic encryption',
    body: 'The same key encrypting the same password always produces the exact same ciphertext - no nonce or tweak anywhere in the pipeline.',
  },
  {
    title: 'Custom, unaudited Feistel construction',
    body: 'feistel.ts is tested (exhaustive bijection checks, round-trip tests) but not peer-reviewed. NIST SP 800-38G already specifies FF1/FF3-1 for this exact purpose; this project doesn’t use them.',
  },
  {
    title: 'Ciphertext length leaks password length',
    body: 'N is derived from the password length, so the ciphertext’s size and part count reveal roughly how long the password was.',
  },
  {
    title: 'No message authentication',
    body: 'There is no MAC on the ciphertext. Decrypting with the wrong key can silently produce a different, wrong password instead of erroring - see the wrong-key toggle above.',
  },
  {
    title: 'A hobby project’s reference implementation',
    body: 'No external cryptographic review. For real secrets, use an established, audited tool - age, libsodium, your platform’s keychain - not this.',
  },
];

// docs/ROADMAP.md, condensed.
const ROADMAP_PHASES: { phase: string; items: string[] }[] = [
  {
    phase: 'Phase 2 — closing the known limitations',
    items: [
      'A random per-message tweak, so encrypting the same password twice no longer produces the same ciphertext.',
      'Length hiding: pad every password to a fixed N instead of sizing N to the actual length.',
      'Swap the custom Feistel network for NIST FF1 (SP 800-38G), a published, analyzed construction.',
      'A C++/GMP port with benchmarks, once the design changes above are stable.',
    ],
  },
  {
    phase: 'Phase 3 — post-quantum review',
    items: [
      'Symmetric primitives are already in reasonable shape: Grover’s algorithm only halves a 256-bit key’s effective strength (to ~128-bit), still a comfortable margin. No changes needed here.',
      'If public-key key exchange is ever added, it should use ML-KEM (FIPS 203) rather than a classical KEM like RSA or ECDH, which Shor’s algorithm breaks outright.',
    ],
  },
];

function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function createSecuritySection(): SectionShell {
  const shell = createSectionShell({
    id: 'security',
    eyebrow: 'Where security comes from',
    heading: 'The key and HMAC-SHA256 - not partition theory',
    lead: 'Argon2id costs roughly 0.7 seconds per guess in native Python - run it live here in the browser and see how it compares. Known limits, honestly stated below: deterministic encryption, a custom and unaudited Feistel construction, and a ciphertext length that leaks roughly the password length.',
    idea: 'This is honest about what it does and doesn’t cover - the security claim is narrow and specific, not "trust the math."',
    accent: 'cool',
    demoWarning: true,
    stagePlaceholder: '',
  });

  shell.stage.classList.add('stage--live');
  shell.stage.textContent = '';

  // --- Live Argon2id derivation -----------------------------------
  const kdfBlock = document.createElement('div');
  kdfBlock.className = 'security-kdf';

  const controlRow = document.createElement('div');
  controlRow.className = 'control-row';

  const label = document.createElement('label');
  label.htmlFor = 'security-passphrase';
  label.textContent = 'passphrase =';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'security-passphrase';
  input.value = DEFAULT_PASSPHRASE;
  input.autocomplete = 'off';
  input.spellcheck = false;

  const deriveButton = document.createElement('button');
  deriveButton.type = 'button';
  deriveButton.textContent = 'Derive key (Argon2id)';

  controlRow.append(label, input, deriveButton);

  const status = document.createElement('p');
  status.className = 'tree-stats';
  status.setAttribute('aria-live', 'polite');
  status.textContent =
    'Argon2id, time_cost=3, memory_cost=256 MiB, parallelism=2 - the same parameters as kdf.py. Expect roughly a second.';

  const statRow = document.createElement('div');
  statRow.className = 'stat-row';
  statRow.hidden = true;

  function makeStat(labelText: string): { wrap: HTMLElement; value: HTMLElement } {
    const wrap = document.createElement('div');
    wrap.className = 'stat';
    const l = document.createElement('span');
    l.className = 'stat__label';
    l.textContent = labelText;
    const v = document.createElement('span');
    v.className = 'stat__value';
    wrap.append(l, v);
    return { wrap, value: v };
  }

  const browserStat = makeStat('Measured just now, this browser (WASM Argon2id)');
  const nativeStat = makeStat('Measured natively, Python (kdf.py docstring)');
  nativeStat.value.textContent = '~0.7s';
  const keyStat = makeStat('Derived key (first 16 bytes of 32)');
  const saltStat = makeStat('Salt (fresh, random per derivation)');

  statRow.append(browserStat.wrap, nativeStat.wrap, keyStat.wrap, saltStat.wrap);

  kdfBlock.append(controlRow, status, statRow);

  let running = false;
  deriveButton.addEventListener('click', () => {
    void runDerivation();
  });

  async function runDerivation(): Promise<void> {
    if (running) return;
    const passphrase = input.value;
    if (!passphrase) {
      status.textContent = 'Type a passphrase first.';
      return;
    }
    running = true;
    deriveButton.disabled = true;
    input.disabled = true;
    statRow.hidden = true;
    status.textContent =
      'Deriving... this takes about a second, by design - that cost is the point.';

    try {
      const { key, salt, elapsedMs } = await deriveKey(passphrase);
      browserStat.value.textContent = formatMs(elapsedMs);
      keyStat.value.textContent = `${bytesToHex(key.slice(0, 16))}…`;
      saltStat.value.textContent = bytesToHex(salt);
      statRow.hidden = false;
      status.textContent = `Derived a 256-bit key from "${passphrase}" in ${formatMs(elapsedMs)} in this browser.`;
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : String(error);
    } finally {
      running = false;
      deriveButton.disabled = false;
      input.disabled = false;
    }
  }

  // --- Known limitations checklist ---------------------------------
  const limitsHeading = document.createElement('h3');
  limitsHeading.className = 'security-subheading';
  limitsHeading.textContent = 'Known limitations';

  const limitsList = document.createElement('ul');
  limitsList.className = 'limits-list';
  for (const { title, body } of KNOWN_LIMITATIONS) {
    const item = document.createElement('li');
    item.className = 'limits-item';
    const t = document.createElement('span');
    t.className = 'limits-item__title';
    t.textContent = title;
    const b = document.createElement('span');
    b.className = 'limits-item__body';
    b.textContent = body;
    item.append(t, b);
    limitsList.append(item);
  }

  // --- Roadmap -------------------------------------------------------
  const roadmapHeading = document.createElement('h3');
  roadmapHeading.className = 'security-subheading';
  roadmapHeading.textContent = 'Roadmap';

  const roadmap = document.createElement('div');
  roadmap.className = 'roadmap';
  for (const { phase, items } of ROADMAP_PHASES) {
    const block = document.createElement('div');
    block.className = 'roadmap-phase';
    const phaseTitle = document.createElement('p');
    phaseTitle.className = 'roadmap-phase__title';
    phaseTitle.textContent = phase;
    const list = document.createElement('ul');
    list.className = 'roadmap-phase__list';
    for (const line of items) {
      const li = document.createElement('li');
      li.textContent = line;
      list.append(li);
    }
    block.append(phaseTitle, list);
    roadmap.append(block);
  }

  shell.stage.append(kdfBlock, limitsHeading, limitsList, roadmapHeading, roadmap);

  return shell;
}
