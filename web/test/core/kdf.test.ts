import { describe, expect, it } from 'vitest';

import { deriveKey } from '../../src/core/kdf';
import argon2Vector from '../vectors/argon2.json';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

describe('deriveKey (hash-wasm Argon2id) matches Python argon2-cffi exactly', () => {
  it(`deriveKey(${JSON.stringify(argon2Vector.passphrase)}, fixed salt) matches kdf.py`, async () => {
    const salt = hexToBytes(argon2Vector.salt_hex);
    const result = await deriveKey(argon2Vector.passphrase, salt);

    expect(bytesToHex(result.key)).toBe(argon2Vector.key_hex);
    expect(bytesToHex(result.salt)).toBe(argon2Vector.salt_hex);

    // Not a correctness assertion - just visible evidence in test
    // output of what this same set of parameters costs in WASM vs.
    // the ~0.7s kdf.py was tuned to on the reference machine.
    console.log(`hash-wasm Argon2id derivation took ${result.elapsedMs.toFixed(0)}ms`);
  }, 30000);
});
