import { animate, stagger } from 'animejs';

import { ALPHABET } from '../core/encoding';
import {
  buildBuggySearchTree,
  buildFixedSearchTree,
  countNodes,
  type SearchTreeNode,
} from '../core/searchTree';
import { getPartitionValue, v1Encrypt } from '../core/v1';
import { prefersReducedMotion } from '../motion/reducedMotion';
import { createSectionShell, type SectionShell } from './shell';

const PRESETS = ['ab', 'cab', 'face'] as const;
type Mode = 'fixed' | 'buggy';

let charValuesCache: { char: string; value: bigint }[] | null = null;
function charValues() {
  if (!charValuesCache) {
    charValuesCache = Array.from(ALPHABET).map((char) => ({
      char,
      value: getPartitionValue(char),
    }));
  }
  return charValuesCache;
}

function renderNode(node: SearchTreeNode): HTMLLIElement {
  const li = document.createElement('li');

  const label = document.createElement('span');
  label.className = 'tree-node';
  if (node.isResult) label.classList.add('tree-node--result');
  if (node.prunedReason) label.classList.add('tree-node--pruned');

  if (node.char !== null) {
    label.textContent = `${node.char} (${node.value}) -> ${node.sum}`;
    if (node.isResult) label.textContent += ' ✓';
    if (node.prunedReason === 'bounds') label.textContent += ' [pruned]';
  } else {
    label.textContent = 'start';
  }

  li.append(label);

  if (node.children.length > 0) {
    const ul = document.createElement('ul');
    for (const child of node.children) {
      ul.append(renderNode(child));
    }
    li.append(ul);
  }

  return li;
}

export function createV2SearchSection(): SectionShell {
  const shell = createSectionShell({
    id: 'v2-search',
    eyebrow: 'V2 search',
    heading: 'A logic bug, not a slow search',
    lead: 'A live backtracking tree for a short demo input. Toggle between the original buggy pruning and the fix to see whole valid branches get discarded, or survive.',
    idea: 'The old code didn’t just run slow - it silently threw away correct answers.',
    stagePlaceholder: '',
  });

  shell.stage.classList.add('stage--live');
  shell.stage.textContent = '';

  const controls = document.createElement('div');
  controls.className = 'tree-controls';

  const presetRow = document.createElement('div');
  presetRow.className = 'tree-preset-row';
  presetRow.setAttribute('role', 'group');
  presetRow.setAttribute('aria-label', 'Demo password');

  const modeRow = document.createElement('div');
  modeRow.className = 'tree-mode-row';
  modeRow.setAttribute('role', 'group');
  modeRow.setAttribute('aria-label', 'Search algorithm');

  const stats = document.createElement('p');
  stats.className = 'tree-stats';
  stats.setAttribute('aria-live', 'polite');

  const treeView = document.createElement('div');
  treeView.className = 'tree-view';

  controls.append(presetRow, modeRow, stats);
  shell.stage.append(controls, treeView);

  let currentPreset: (typeof PRESETS)[number] = 'cab';
  let currentMode: Mode = 'buggy';

  function render(): void {
    const k = v1Encrypt(currentPreset).k;
    const tree =
      currentMode === 'fixed'
        ? buildFixedSearchTree(charValues(), k, currentPreset.length)
        : buildBuggySearchTree(charValues(), k, currentPreset.length);

    const nodeCount = countNodes(tree) - 1; // exclude the synthetic root
    let resultCount = 0;
    (function count(n: SearchTreeNode) {
      if (n.isResult) resultCount++;
      for (const c of n.children) count(c);
    })(tree);

    stats.textContent = `"${currentPreset}" (K=${k}), ${currentMode} search: ${nodeCount} nodes explored, ${resultCount} result${resultCount === 1 ? '' : 's'} found.`;

    treeView.replaceChildren();

    if (tree.children.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'tree-empty';
      empty.textContent =
        currentMode === 'buggy'
          ? 'Nothing explored at all: the largest character overshoots immediately, and the buggy break discards every smaller one right along with it.'
          : 'No candidates fit.';
      treeView.append(empty);
      return;
    }

    const rootUl = document.createElement('ul');
    for (const child of tree.children) {
      rootUl.append(renderNode(child));
    }
    treeView.append(rootUl);

    if (!prefersReducedMotion()) {
      const nodes = treeView.querySelectorAll('.tree-node');
      // Cap the total reveal time at ~600ms regardless of tree size, so a
      // 189-node tree ("face") doesn't take 3+ seconds to finish revealing.
      const perNodeDelay = Math.min(15, 600 / Math.max(nodes.length, 1));
      animate(nodes, {
        opacity: [0, 1],
        duration: 200,
        delay: stagger(perNodeDelay),
        ease: 'outQuad',
      });
    }
  }

  for (const preset of PRESETS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = preset;
    button.setAttribute('aria-pressed', String(preset === currentPreset));
    button.addEventListener('click', () => {
      currentPreset = preset;
      for (const el of presetRow.querySelectorAll('button')) {
        el.setAttribute('aria-pressed', String(el === button));
      }
      render();
    });
    presetRow.append(button);
  }

  const modes: { key: Mode; label: string }[] = [
    { key: 'buggy', label: 'Buggy (original)' },
    { key: 'fixed', label: 'Fixed' },
  ];
  for (const { key, label } of modes) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.setAttribute('aria-pressed', String(key === currentMode));
    button.addEventListener('click', () => {
      currentMode = key;
      for (const el of modeRow.querySelectorAll('button')) {
        el.setAttribute('aria-pressed', String(el === button));
      }
      render();
    });
    modeRow.append(button);
  }

  render();

  return shell;
}
