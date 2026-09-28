import { createSectionShell, type SectionShell } from './shell';

export function createV2SearchSection(): SectionShell {
  return createSectionShell({
    id: 'v2-search',
    eyebrow: 'V2 search',
    heading: 'A logic bug, not a slow search',
    lead: 'A live backtracking tree for a short demo input. Toggle between the original buggy pruning and the fix to see whole valid branches get discarded, or survive.',
    idea: 'The old code didn’t just run slow - it silently threw away correct answers.',
    stagePlaceholder: 'Backtracking tree, buggy vs. fixed toggle (live, Step 6)',
  });
}
