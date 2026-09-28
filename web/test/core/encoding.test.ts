import { describe, expect, it } from 'vitest';

import { decodePassword, encodePassword } from '../../src/core/encoding';
import encodingVectors from '../vectors/encoding.json';

describe('encodePassword matches Python exactly', () => {
  for (const { password, value, length } of encodingVectors.cases) {
    it(`encodePassword(${JSON.stringify(password)})`, () => {
      const result = encodePassword(password);
      expect(result.value).toBe(BigInt(value));
      expect(result.length).toBe(length);
    });
  }
});

describe('decodePassword is the exact inverse', () => {
  for (const { password, value, length } of encodingVectors.cases) {
    it(`decodePassword(${value}, ${length}) = ${JSON.stringify(password)}`, () => {
      expect(decodePassword(BigInt(value), length)).toBe(password);
    });
  }
});
