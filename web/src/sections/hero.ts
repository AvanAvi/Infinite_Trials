import { createSectionShell, type SectionShell } from './shell';

export function createHeroSection(): SectionShell {
  return createSectionShell({
    id: 'hero',
    eyebrow: 'Infinite Trials',
    heading: 'How many ways can a number break apart?',
    lead: 'A partition diagram of the number 8, regrouping through its different partitions - the question this whole project starts from.',
    idea: 'This whole project starts from one question: how many different ways can a number be broken into pieces?',
    stagePlaceholder: 'Ferrers diagram (live, Step 5)',
  });
}
