import { createSectionShell, type SectionShell } from './shell';

export function createV1DemoSection(): SectionShell {
  return createSectionShell({
    id: 'v1-demo',
    eyebrow: 'V1 in action',
    heading: 'Encrypting is just adding up big numbers',
    lead: 'Type a demo string and watch each character fly out to its own partition value, collapse into a running total K, then add the public constant C to produce Z.',
    idea: 'Nothing about addition can be undone without more information than the sum alone gives you.',
    accent: 'warm',
    demoWarning: true,
    stagePlaceholder: 'Character -> partition value -> K -> Z pipeline (live, Step 5)',
  });
}
