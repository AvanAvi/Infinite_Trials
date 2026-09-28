import { createSectionShell, type SectionShell } from './shell';

export function createV3PipelineSection(): SectionShell {
  return createSectionShell({
    id: 'v3-pipeline',
    eyebrow: 'V3 pipeline',
    heading: 'Text, integer, Feistel rounds, ciphertext partition',
    lead: 'Step through the real pipeline: base-62 encoding, 10+ Feistel rounds with cycle-walking, then unranking into the ciphertext partition. Decrypt runs it backward. A wrong-key toggle shows what actually happens.',
    idea: 'Reversing this needs the key - walking through every step live is what proves there’s no shortcut.',
    accent: 'cool',
    demoWarning: true,
    stagePlaceholder:
      'Step-through pipeline: encode -> permute -> cycle-walk -> unrank, with play/pause/speed controls (live, Step 6)',
  });
}
