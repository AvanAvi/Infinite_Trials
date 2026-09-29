/**
 * Bijective rank/unrank between [0, p(N)) and the partitions of N - a
 * direct BigInt port of Version3/partition_rank.py's iterative
 * _unrank_bounded/_rank_bounded. See that module's docstring for the
 * canonical-order explanation; this file only ports the mechanism.
 */

import { getQTable, partitionsCount } from './partitions';

/** Return the r-th partition of N (0 <= r < p(N)), non-increasing parts. */
export function unrank(r: bigint, N: number): number[] {
  if (N < 0) throw new Error('N must be non-negative');
  const total = partitionsCount(N);
  if (r < 0n || r >= total) {
    throw new Error(`rank ${r} out of range [0, ${total}) for N=${N}`);
  }
  if (N === 0) return [];

  const table = getQTable(N);
  const parts: number[] = [];
  let n = N;
  let m = N;
  let remaining = r;

  while (n > 0) {
    const withoutM = m > 0 ? table[n]![m - 1]! : 0n;
    if (remaining < withoutM) {
      m -= 1;
    } else {
      parts.push(m);
      remaining -= withoutM;
      n -= m;
    }
  }
  return parts;
}

/** Inverse of unrank(): given a partition of N (any order), return its rank. */
export function rank(partition: number[], N: number): bigint {
  if (N < 0) throw new Error('N must be non-negative');
  const parts = [...partition].sort((a, b) => b - a);
  if (parts.some((p) => p <= 0)) {
    throw new Error('partition parts must be positive integers');
  }
  const sum = parts.reduce((acc, p) => acc + p, 0);
  if (sum !== N) {
    throw new Error(`parts sum to ${sum}, expected ${N}`);
  }
  if (N === 0) return 0n;

  const table = getQTable(N);
  let result = 0n;
  let idx = 0;
  let n = N;
  let m = N;

  while (n > 0) {
    const current = idx < parts.length ? parts[idx]! : 0;
    if (current < m) {
      m -= 1;
    } else if (current > m) {
      throw new Error(`part ${current} exceeds bound ${m}`);
    } else {
      const withoutM = m > 0 ? table[n]![m - 1]! : 0n;
      result += withoutM;
      n -= m;
      idx += 1;
    }
  }
  return result;
}
