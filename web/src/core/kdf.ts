/**
 * Argon2id key derivation - a port of Version3/kdf.py using hash-wasm
 * (a maintained WASM Argon2id implementation) instead of argon2-cffi,
 * with identical parameters (time_cost=3, memory_cost=256MiB,
 * parallelism=2, hash_len=32, Argon2id) so the two are directly
 * comparable.
 *
 * WASM Argon2id typically runs somewhat slower than native for the same
 * parameters, so the in-browser derivation may land noticeably above
 * kdf.py's measured ~0.7s - see the "security" section, which shows both
 * measured numbers side by side rather than picking one to display. The
 * KDF cost, not the partition math, is where "hard to reverse without
 * the key" actually comes from in this scheme; see kdf.py's docstring.
 */

import { argon2id } from 'hash-wasm';

export const SALT_BYTES = 16;
export const KEY_BYTES = 32; // 256 bits

// Must match Version3/kdf.py's TIME_COST / MEMORY_COST_KIB / PARALLELISM exactly.
export const TIME_COST = 3;
export const MEMORY_COST_KIB = 262144; // 256 MiB
export const PARALLELISM = 2;

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_BYTES));
}

export interface DerivedKey {
  key: Uint8Array;
  salt: Uint8Array;
  /** Wall-clock time the derivation itself took, in milliseconds. */
  elapsedMs: number;
}

/**
 * Derive a 256-bit key from a passphrase via Argon2id.
 *
 * If salt is omitted, a fresh random one is generated and returned - the
 * caller must store it to reproduce this exact key on a later call (e.g.
 * for decrypt), matching kdf.py's derive_key.
 */
export async function deriveKey(passphrase: string, salt?: Uint8Array): Promise<DerivedKey> {
  if (!passphrase) {
    throw new Error('passphrase must not be empty');
  }
  const actualSalt = salt ?? generateSalt();
  if (actualSalt.length !== SALT_BYTES) {
    throw new Error(`salt must be ${SALT_BYTES} bytes, got ${actualSalt.length}`);
  }

  const start = performance.now();
  const key = await argon2id({
    password: passphrase,
    salt: actualSalt,
    iterations: TIME_COST,
    parallelism: PARALLELISM,
    memorySize: MEMORY_COST_KIB,
    hashLength: KEY_BYTES,
    outputType: 'binary',
  });
  const elapsedMs = performance.now() - start;

  return { key, salt: actualSalt, elapsedMs };
}
