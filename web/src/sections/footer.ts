/**
 * Site footer. Deliberately not built on the narrative section shell,
 * and deliberately minimal - see STORYBOARD.md's motion budget note: a
 * page that just spent seven sections proving things with real
 * computation shouldn't end on a flourish, it should end on links the
 * visitor can click to keep checking.
 */

const REPO_URL = 'https://github.com/AvanAvi/Infinite_Trials';

const links: { label: string; href: string }[] = [
  { label: 'Repository', href: REPO_URL },
  { label: 'Collision analysis', href: `${REPO_URL}/blob/main/docs/ANALYSIS.md` },
  { label: 'Threat model', href: `${REPO_URL}/blob/main/docs/THREAT_MODEL.md` },
  { label: 'Roadmap', href: `${REPO_URL}/blob/main/docs/ROADMAP.md` },
  { label: 'This showcase’s own source', href: `${REPO_URL}/tree/main/web` },
];

export function createFooterSection(): HTMLElement {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.setAttribute('aria-label', 'Site footer');

  const inner = document.createElement('div');
  inner.className = 'section__inner';

  const note = document.createElement('p');
  note.className = 'section__lead';
  note.textContent =
    'This showcase is fully static and open - every claim on this page traces back to the repository below.';

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Project links');
  const list = document.createElement('ul');
  list.className = 'site-footer__links';
  list.style.listStyle = 'none';
  list.style.padding = '0';

  for (const link of links) {
    const item = document.createElement('li');
    const anchor = document.createElement('a');
    anchor.href = link.href;
    anchor.textContent = link.label;
    anchor.rel = 'noopener';
    item.append(anchor);
    list.append(item);
  }
  nav.append(list);

  // Placeholder slot for a portfolio link - left empty pending Step 8.
  const portfolioSlot = document.createElement('p');
  portfolioSlot.dataset['slot'] = 'portfolio-link';
  portfolioSlot.className = 'visually-hidden';
  portfolioSlot.textContent = 'Portfolio link placeholder';

  inner.append(note, nav, portfolioSlot);
  footer.append(inner);

  return footer;
}
