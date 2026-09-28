import { createSectionShell, type SectionShell } from './shell';

export function createCrackSection(): SectionShell {
  return createSectionShell({
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
    stagePlaceholder:
      'Collision explosion: colliding multisets for a demo string, and the documented password12 count (live, Step 5)',
  });
}
