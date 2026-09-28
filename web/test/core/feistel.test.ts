import { describe, expect, it } from 'vitest';

import { decryptDomain, encryptDomain } from '../../src/core/feistel';
import feistelVectors from '../vectors/feistel.json';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

const key = hexToBytes(feistelVectors.key_hex);

describe('encryptDomain matches Python exactly (fixed key)', () => {
  for (const { domain_size, x, y } of feistelVectors.cases) {
    it(`encryptDomain(${x}, key, ${domain_size}) = ${y}`, async () => {
      const result = await encryptDomain(BigInt(x), key, BigInt(domain_size));
      expect(result).toBe(BigInt(y));
    });
  }
});

describe('decryptDomain is the exact inverse (fixed key)', () => {
  for (const { domain_size, x, y } of feistelVectors.cases) {
    it(`decryptDomain(${y}, key, ${domain_size}) = ${x}`, async () => {
      const result = await decryptDomain(BigInt(y), key, BigInt(domain_size));
      expect(result).toBe(BigInt(x));
    });
  }
});
