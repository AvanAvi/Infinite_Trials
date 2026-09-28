import { describe, expect, it } from 'vitest';

import { decrypt, encrypt } from '../../src/core/cipher';
import cipherVectors from '../vectors/cipher.json';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

const key = hexToBytes(cipherVectors.key_hex);

describe('encrypt matches Python exactly (fixed key)', () => {
  for (const { password, ciphertext } of cipherVectors.cases) {
    it(`encrypt(${JSON.stringify(password)}, key) = ${ciphertext}`, async () => {
      expect(await encrypt(password, key)).toBe(ciphertext);
    });
  }
});

describe('decrypt is the exact inverse (fixed key)', () => {
  for (const { password, ciphertext } of cipherVectors.cases) {
    it(`decrypt(${JSON.stringify(ciphertext)}, key) = ${JSON.stringify(password)}`, async () => {
      expect(await decrypt(ciphertext, key)).toBe(password);
    });
  }
});
