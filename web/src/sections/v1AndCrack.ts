/**
 * V1 in action + the crack, combined into one section instead of two.
 *
 * These were built as separate sections in Step 5, but they're already
 * coupled through src/state/demoPassword.ts - the crack's explosion
 * always reflects whatever's currently in the V1 demo's input. Keeping
 * them as two full-width stacked sections meant seeing "cause" (typing a
 * password) and "effect" (it exploding into collisions) required
 * scrolling back and forth between them. Merging into one section with a
 * shared two-panel stage puts both live panels in view together.
 *
 * DOM order stays the full narrative first (both headings and copy, in
 * their original order), then both live panels - a screen reader user
 * gets the complete story before reaching the interactive demos, which
 * reads fine linearly. CSS Grid (not DOM reordering) is what places the
 * panels beside the text at wide viewports; narrow viewports get the same
 * DOM order with no grid override, which is already the right stacked
 * reading order.
 */

import { mountCrackExplosion } from './crack';
import { mountV1Pipeline } from './v1Demo';

export interface CombinedSection {
  element: HTMLElement;
}

function textBlock(options: {
  id: string;
  eyebrow: string;
  heading: string;
  lead: string;
  idea: string;
  quote?: { text: string; source: string };
  demoWarning?: boolean;
}): HTMLElement {
  const block = document.createElement('div');
  block.className = 'paired-text-block';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'section__eyebrow';
  eyebrow.textContent = options.eyebrow;

  const heading = document.createElement('h2');
  heading.className = 'section__heading';
  heading.id = `${options.id}-heading`;
  heading.textContent = options.heading;

  const lead = document.createElement('p');
  lead.className = 'section__lead';
  lead.textContent = options.lead;

  block.append(eyebrow, heading, lead);

  if (options.quote) {
    const quote = document.createElement('blockquote');
    quote.className = 'section__quote';
    const quoteText = document.createElement('p');
    quoteText.textContent = `"${options.quote.text}"`;
    const cite = document.createElement('cite');
    cite.textContent = options.quote.source;
    quote.append(quoteText, cite);
    block.append(quote);
  }

  if (options.demoWarning) {
    const warning = document.createElement('p');
    warning.className = 'demo-warning';
    warning.setAttribute('role', 'note');
    warning.textContent = 'Demo data only - please don’t type a real password.';
    block.append(warning);
  }

  const idea = document.createElement('p');
  idea.className = 'section__idea';
  idea.textContent = options.idea;
  block.append(idea);

  return block;
}

export function createV1AndCrackSection(): CombinedSection {
  const section = document.createElement('section');
  section.id = 'v1-and-crack';
  section.className = 'section section--v1';
  section.setAttribute('aria-label', 'V1 encryption in action, and why it collides');

  const inner = document.createElement('div');
  inner.className = 'section__inner paired-inner';

  const textColumn = document.createElement('div');
  textColumn.className = 'paired-text';

  const v1Text = textBlock({
    id: 'v1-demo',
    eyebrow: 'V1 in action',
    heading: 'Encrypting is just adding up big numbers',
    lead: 'Type a demo string and watch each character fly out to its own partition value, collapse into a running total K, then add the public constant C to produce Z.',
    idea: 'Nothing about addition can be undone without more information than the sum alone gives you.',
    demoWarning: true,
  });

  const crackText = textBlock({
    id: 'crack',
    eyebrow: 'The crack',
    heading: 'My own 2019 draft claimed this was unique',
    lead: 'The same Z from above explodes into every other string that produces it - all real, computed live, right next to the demo. A realistic 10-character password shares its Z with 166,165 other character combinations - before even counting reorderings of its own characters, which collide too.',
    quote: {
      text: 'There exists only one possible combination of numbers through which we get the above result for ‘Z’.',
      source: 'ARCHITECTURE_DRAFT_1.pdf, 9/4/19',
    },
    idea: 'I measured it, and it’s off by 166,165.',
  });

  textColumn.append(v1Text, crackText);

  const stageColumn = document.createElement('div');
  stageColumn.className = 'paired-stage';

  const v1Panel = document.createElement('div');
  v1Panel.className = 'section__stage stage--live paired-stage__panel';
  v1Panel.setAttribute('aria-labelledby', 'v1-demo-heading');

  const crackPanel = document.createElement('div');
  crackPanel.className = 'section__stage stage--live paired-stage__panel';
  crackPanel.setAttribute('aria-labelledby', 'crack-heading');

  stageColumn.append(v1Panel, crackPanel);

  inner.append(textColumn, stageColumn);
  section.append(inner);

  mountV1Pipeline(v1Panel);
  mountCrackExplosion(crackPanel);

  return { element: section };
}
