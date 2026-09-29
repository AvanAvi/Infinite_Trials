/**
 * V1/V2's scheme: sum each character's partition value, add the public
 * constant C. Ported for the showcase's "V1 in action" section (Step 5)
 * - this is deliberately NOT the keyed, reversible V3 scheme; it exists
 * to demonstrate why V1 fails, matching docs/ANALYSIS.md and
 * Algorithm_Philosophy.txt.
 *
 * lookupTable.json is generated directly from Version2/data/lookup_table.csv
 * (see Version3/export_test_vectors.py's sibling generation step) rather
 * than transcribed by hand, so it can't drift from the real V2 table.
 */

import lookupTableEntries from './data/lookupTable.json';

export const CONSTANT_C = 426609638937n;

const LOOKUP_TABLE = new Map<string, bigint>(
  (lookupTableEntries as [string, string][]).map(([char, value]) => [char, BigInt(value)])
);

export function getPartitionValue(char: string): bigint {
  const value = LOOKUP_TABLE.get(char);
  if (value === undefined) {
    throw new Error(`character ${JSON.stringify(char)} is not in the V1/V2 lookup table`);
  }
  return value;
}

export interface V1EncryptionStep {
  char: string;
  partitionValue: bigint;
}

export interface V1EncryptionResult {
  steps: V1EncryptionStep[];
  k: bigint;
  z: bigint;
}

/** Encrypt a password the V1/V2 way: sum partition values, add C. */
export function v1Encrypt(password: string): V1EncryptionResult {
  const steps: V1EncryptionStep[] = [];
  let k = 0n;
  for (const char of password) {
    const partitionValue = getPartitionValue(char);
    steps.push({ char, partitionValue });
    k += partitionValue;
  }
  return { steps, k, z: k + CONSTANT_C };
}

/**
 * The password's characters sorted by ascending partition value - the same
 * order findMultisets (src/core/backtracking.ts) emits each multiset in, so
 * the two can be compared as plain strings. Not alphabetical: 'A' sorts
 * after 'z' and digits sort last, because that's how their values rank.
 */
export function canonicalMultiset(password: string): string {
  return Array.from(password)
    .map((char) => ({ char, value: getPartitionValue(char) }))
    .sort((a, b) => (a.value < b.value ? -1 : a.value > b.value ? 1 : 0))
    .map(({ char }) => char)
    .join('');
}

export function lookupTableSize(): number {
  return LOOKUP_TABLE.size;
}

/** Every partition value in the table, one per character (order-independent use only). */
export function allPartitionValues(): bigint[] {
  return Array.from(LOOKUP_TABLE.values());
}
