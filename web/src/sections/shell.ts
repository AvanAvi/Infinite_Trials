/**
 * Shared shell for the 8 narrative sections. Step 3 scope: real headings
 * and copy, placeholder "stage" for the interactive/animated content each
 * section gets in Steps 5-6. The stage element is returned so later work
 * can mount into it without rebuilding the surrounding chrome.
 */

export interface SectionShellOptions {
  id: string;
  eyebrow: string;
  heading: string;
  lead: string;
  idea: string;
  /** Ties the section's accent color to the V1 (warm) or V3 (cool) path. */
  accent?: 'warm' | 'cool';
  /** Show the "this is demo data, don't type a real password" notice. */
  demoWarning?: boolean;
  /** A direct quote from project history, shown with its source. */
  quote?: { text: string; source: string };
  stagePlaceholder: string;
}

export interface SectionShell {
  element: HTMLElement;
  stage: HTMLElement;
}

export function createSectionShell(options: SectionShellOptions): SectionShell {
  const section = document.createElement('section');
  section.id = options.id;
  section.className = 'section';
  if (options.accent === 'warm') section.classList.add('section--v1');
  if (options.accent === 'cool') section.classList.add('section--v3');

  section.setAttribute('aria-labelledby', `${options.id}-heading`);

  const inner = document.createElement('div');
  inner.className = 'section__inner';

  const text = document.createElement('div');
  text.className = 'section__text';

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

  const idea = document.createElement('p');
  idea.className = 'section__idea';
  idea.textContent = options.idea;

  text.append(eyebrow, heading, lead);

  if (options.quote) {
    const quote = document.createElement('blockquote');
    quote.className = 'section__quote';
    const quoteText = document.createElement('p');
    quoteText.textContent = `"${options.quote.text}"`;
    const cite = document.createElement('cite');
    cite.textContent = options.quote.source;
    quote.append(quoteText, cite);
    text.append(quote);
  }

  if (options.demoWarning) {
    const warning = document.createElement('p');
    warning.className = 'demo-warning';
    warning.setAttribute('role', 'note');
    warning.textContent = 'Demo data only - please don’t type a real password.';
    text.append(warning);
  }

  text.append(idea);

  const stage = document.createElement('div');
  stage.className = 'section__stage';
  stage.textContent = options.stagePlaceholder;

  inner.append(text, stage);
  section.append(inner);

  return { element: section, stage };
}
