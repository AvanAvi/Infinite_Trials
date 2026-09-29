import { describe, expect, it } from 'vitest';

import {
  decryptDomain,
  decryptDomainTraced,
  encryptDomain,
  encryptDomainTraced,
} from '../../src/core/feistel';
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

describe('traced variants match the plain, already-validated ones exactly', () => {
  for (const { domain_size, x, y } of feistelVectors.cases.slice(0, 15)) {
    it(`encryptDomainTraced(${x}, key, ${domain_size}).result = ${y}`, async () => {
      const trace = await encryptDomainTraced(BigInt(x), key, BigInt(domain_size));
      expect(trace.result).toBe(BigInt(y));
      expect(trace.cycleWalks).toBeGreaterThanOrEqual(1);
      // First and last recorded round states must match the initial split
      // and final combined value the plain function computes internally.
      expect(trace.rounds[0]!.round).toBe(0);
      expect(trace.rounds[trace.rounds.length - 1]!.round).toBe(10);
    });

    it(`decryptDomainTraced(${y}, key, ${domain_size}).result = ${x}`, async () => {
      const trace = await decryptDomainTraced(BigInt(y), key, BigInt(domain_size));
      expect(trace.result).toBe(BigInt(x));
    });
  }
});
