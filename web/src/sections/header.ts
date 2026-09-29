export function createHeader(): HTMLElement {
  const header = document.createElement('header');
  header.className = 'site-header';

  const wordmark = document.createElement('a');
  wordmark.className = 'wordmark';
  wordmark.href = '#hero';
  wordmark.textContent = 'Infinite Trials';

  header.append(wordmark);
  return header;
}

export function createSkipLink(): HTMLAnchorElement {
  const link = document.createElement('a');
  link.className = 'skip-link';
  link.href = '#main-content';
  link.textContent = 'Skip to main content';
  return link;
}
