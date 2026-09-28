import { createSectionShell, type SectionShell } from './shell';

export function createSecuritySection(): SectionShell {
  return createSectionShell({
    id: 'security',
    eyebrow: 'Where security comes from',
    heading: 'The key and HMAC-SHA256 - not partition theory',
    lead: 'Argon2id costs roughly 0.7 seconds per guess - watch a real derivation run. Known limits, honestly stated: deterministic encryption, a custom and unaudited Feistel construction, and a ciphertext length that leaks roughly the password length.',
    idea: 'This is honest about what it does and doesn’t cover - the security claim is narrow and specific, not "trust the math."',
    accent: 'cool',
    stagePlaceholder:
      'Argon2id live timer + known-limits checklist + roadmap phases (live, Step 6)',
  });
}
