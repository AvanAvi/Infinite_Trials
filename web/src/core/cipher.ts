/**
 * Keyed format-preserving encryption over integer partitions - a BigInt
 * port of Version3/cipher.py. See that module's docstring for the
 * ciphertext format rationale (length stored explicitly) and the
 * no-message-authentication caveat.
 */

import { decodePassword, encodePassword } from './encoding';
import { decryptDomain, encryptDomain } from './feistel';
import { minN, partitionsCount } from './partitions';
import { rank, unrank } from './rank';

export const KEY_BYTES = 32; // 256 bits

function checkKey(key: Uint8Array): void {
  if (!(key instanceof Uint8Array) || key.length !== KEY_BYTES) {
    throw new Error(`key must be ${KEY_BYTES} bytes (256 bits)`);
  }
}

/** Encrypt password with a 256-bit key. Returns the ciphertext string. */
export async function encrypt(password: string, key: Uint8Array): Promise<string> {
  checkKey(key);
  const { value, length } = encodePassword(password);

  const N = minN(62n ** BigInt(length));
  const domainSize = partitionsCount(N);

  const permuted = await encryptDomain(value, key, domainSize);
  const parts = unrank(permuted, N);

  return `${N}:${length}:${parts.join('+')}`;
}

/**
 * Decrypt a ciphertext string produced by encrypt(). Throws if the
 * ciphertext is malformed, or if the recovered value falls outside the
 * range any password of the stored length could produce (which a wrong
 * key or corrupted ciphertext can cause, though not always).
 */
export async function decrypt(ciphertext: string, key: Uint8Array): Promise<string> {
  checkKey(key);

  const segments = ciphertext.split(':');
  if (segments.length !== 3) {
    throw new Error(`malformed ciphertext: ${JSON.stringify(ciphertext)}`);
  }
  const [nStr, lengthStr, partsStr] = segments as [string, string, string];

  const N = Number(nStr);
  const length = Number(lengthStr);
  if (!Number.isInteger(N) || !Number.isInteger(length)) {
    throw new Error(`malformed ciphertext: ${JSON.stringify(ciphertext)}`);
  }
  const parts = partsStr.length > 0 ? partsStr.split('+').map(Number) : [];
  if (parts.some((p) => !Number.isInteger(p))) {
    throw new Error(`malformed ciphertext: ${JSON.stringify(ciphertext)}`);
  }

  const domainSize = partitionsCount(N);
  const permuted = rank(parts, N);
  const value = await decryptDomain(permuted, key, domainSize);

  return decodePassword(value, length);
}
