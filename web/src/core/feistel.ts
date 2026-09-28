/**
 * Keyed permutation on [0, domainSize) via a balanced Feistel network
 * with an HMAC-SHA256 round function, plus cycle walking - a BigInt port
 * of Version3/feistel.py using WebCrypto (crypto.subtle) for HMAC-SHA256
 * instead of Python's hmac/hashlib. See that module's docstring for why
 * bit_width is even and why cycle walking recovers the exact original
 * input on decrypt.
 *
 * WebCrypto's sign() is async, so every function here is async - each
 * Feistel round is one HMAC call, and a permutation is `rounds` awaits
 * per cycle-walk iteration (typically 1, rarely more).
 */

export const MIN_ROUNDS = 10;
export const DEFAULT_ROUNDS = 10;

function bitLength(n: bigint): number {
  if (n <= 0n) return 0;
  let bits = 0;
  let v = n;
  while (v > 0n) {
    bits++;
    v >>= 1n;
  }
  return bits;
}

function evenBitWidth(domainSize: bigint): number {
  if (domainSize <= 1n) return 2;
  let bitWidth = bitLength(domainSize - 1n); // smallest b with 2**b >= domainSize
  if (bitWidth % 2 !== 0) bitWidth += 1;
  return Math.max(bitWidth, 2);
}

async function importHmacKey(keyBytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    keyBytes as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

function bigintToBytes(value: bigint, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  let v = value;
  for (let i = length - 1; i >= 0; i--) {
    bytes[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return bytes;
}

function bytesToBigint(bytes: Uint8Array): bigint {
  let result = 0n;
  for (const byte of bytes) {
    result = (result << 8n) | BigInt(byte);
  }
  return result;
}

/** F(round, value): halfBytes bytes of HMAC-SHA256 output, keyed by `key`. */
async function roundFunction(
  cryptoKey: CryptoKey,
  roundNum: number,
  halfBytes: number,
  value: bigint
): Promise<bigint> {
  const msg = new Uint8Array(4 + halfBytes);
  new DataView(msg.buffer).setUint32(0, roundNum, false);
  msg.set(bigintToBytes(value, halfBytes), 4);

  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, msg as BufferSource));
  return bytesToBigint(digest.slice(0, halfBytes));
}

async function feistelBlock(
  x: bigint,
  cryptoKey: CryptoKey,
  bitWidth: number,
  rounds: number,
  encrypting: boolean
): Promise<bigint> {
  const halfBits = bitWidth >> 1;
  const halfBytes = Math.ceil(halfBits / 8);
  const mask = (1n << BigInt(halfBits)) - 1n;

  let L = x >> BigInt(halfBits);
  let R = x & mask;

  for (let step = 0; step < rounds; step++) {
    const roundNum = encrypting ? step + 1 : rounds - step;
    if (encrypting) {
      // (L, R) -> (R, L XOR F(round, R))
      const fOut = (await roundFunction(cryptoKey, roundNum, halfBytes, R)) & mask;
      [L, R] = [R, L ^ fOut];
    } else {
      // Exact inverse of the forward round above.
      const fOut = (await roundFunction(cryptoKey, roundNum, halfBytes, L)) & mask;
      [L, R] = [R ^ fOut, L];
    }
  }

  return (L << BigInt(halfBits)) | R;
}

function checkParams(x: bigint, domainSize: bigint, rounds: number): void {
  if (x < 0n || x >= domainSize) {
    throw new Error(`${x} out of domain [0, ${domainSize})`);
  }
  if (rounds < MIN_ROUNDS) {
    throw new Error(`at least ${MIN_ROUNDS} rounds are required, got ${rounds}`);
  }
}

/** Keyed bijection x -> y on [0, domainSize). */
export async function encryptDomain(
  x: bigint,
  key: Uint8Array,
  domainSize: bigint,
  rounds = DEFAULT_ROUNDS
): Promise<bigint> {
  checkParams(x, domainSize, rounds);
  const cryptoKey = await importHmacKey(key);
  const bitWidth = evenBitWidth(domainSize);
  let y = x;
  do {
    y = await feistelBlock(y, cryptoKey, bitWidth, rounds, true);
  } while (y >= domainSize);
  return y;
}

/** Exact inverse of encryptDomain. */
export async function decryptDomain(
  y: bigint,
  key: Uint8Array,
  domainSize: bigint,
  rounds = DEFAULT_ROUNDS
): Promise<bigint> {
  checkParams(y, domainSize, rounds);
  const cryptoKey = await importHmacKey(key);
  const bitWidth = evenBitWidth(domainSize);
  let x = y;
  do {
    x = await feistelBlock(x, cryptoKey, bitWidth, rounds, false);
  } while (x >= domainSize);
  return x;
}
