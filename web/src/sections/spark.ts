import { createSectionShell, type SectionShell } from './shell';

export function createSparkSection(): SectionShell {
  return createSectionShell({
    id: 'spark',
    eyebrow: 'The spark',
    heading: 'Ramanujan, p(n), and a “why not?”',
    lead: 'The genesis of this algorithm came from watching "The Man Who Knew Infinity" while taking a cryptography class - wondering about the intersection of partition theory and practical cryptography, thinking simply "why not?" Drag the slider to watch p(n) grow.',
    idea: 'This number grows unbelievably fast - that felt like raw material for a cipher.',
    stagePlaceholder: 'p(n) slider + growth curve vs. Hardy-Ramanujan asymptotic (live, Step 5)',
  });
}
