import { describe, expect, it } from 'vitest';

describe('scaffold smoke test', () => {
  it('mounts the page into #app with all narrative sections and a footer', async () => {
    document.body.innerHTML = '<div id="app"></div>';
    await import('../src/main');

    const app = document.querySelector('#app');
    expect(app).not.toBeNull();

    const sectionIds = [
      'hero',
      'spark',
      'v1-demo',
      'crack',
      'v2-search',
      'v3-pipeline',
      'security',
    ];
    for (const id of sectionIds) {
      expect(document.getElementById(id), `#${id} should be mounted`).not.toBeNull();
    }

    expect(document.querySelector('footer.site-footer')).not.toBeNull();
    expect(document.querySelector('a.skip-link')).not.toBeNull();
  });

  it('every section heading has non-empty real text, not a TODO placeholder', () => {
    const headings = document.querySelectorAll('.section__heading');
    expect(headings.length).toBeGreaterThan(0);
    for (const heading of headings) {
      const text = heading.textContent?.trim() ?? '';
      expect(text.length).toBeGreaterThan(0);
      expect(text.toLowerCase()).not.toContain('todo');
      expect(text.toLowerCase()).not.toContain('lorem ipsum');
    }
  });
});
