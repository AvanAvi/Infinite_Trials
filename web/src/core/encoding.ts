/**
 * Fixed-alphabet base-62 encoding between passwords and integers - a
 * direct BigInt port of Version3/encoding.py. See that module's
 * docstring for why length travels alongside the value instead of being
 * reconstructed from padding.
 */

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const CHAR_TO_DIGIT = new Map<string, number>(Array.from(ALPHABET).map((c, i) => [c, i]));

export const MIN_PASSWORD_LENGTH = 1;
export const MAX_PASSWORD_LENGTH = 32;

function checkLength(length: number): void {
  if (length < MIN_PASSWORD_LENGTH || length > MAX_PASSWORD_LENGTH) {
    throw new Error(
      `length must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH}, got ${length}`
    );
  }
}

export interface EncodedPassword {
  value: bigint;
  length: number;
}

/** Encode a password to (value, length). Both are needed to decode unambiguously. */
export function encodePassword(password: string): EncodedPassword {
  const chars = Array.from(password);
  const length = chars.length;
  checkLength(length);

  let value = 0n;
  for (const c of chars) {
    const digit = CHAR_TO_DIGIT.get(c);
    if (digit === undefined) {
      throw new Error(`character ${JSON.stringify(c)} is not in the base-62 alphabet`);
    }
    value = value * 62n + BigInt(digit);
  }
  return { value, length };
}

/** Inverse of encodePassword: reconstruct the password from (value, length). */
export function decodePassword(value: bigint, length: number): string {
  checkLength(length);

  const maxValue = 62n ** BigInt(length);
  if (value < 0n || value >= maxValue) {
    throw new Error(`value ${value} out of range [0, ${maxValue}) for length ${length}`);
  }

  const chars: string[] = [];
  let v = value;
  for (let i = 0; i < length; i++) {
    const digit = Number(v % 62n);
    v = v / 62n;
    chars.push(ALPHABET[digit]!);
  }
  return chars.reverse().join('');
}
