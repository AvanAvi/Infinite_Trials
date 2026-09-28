"""Bijective rank/unrank between [0, p(N)) and the partitions of N.

A partition of N is a non-increasing sequence of positive integers summing
to N, e.g. the partitions of 4 are (4,), (3,1), (2,2), (2,1,1), (1,1,1,1).
This module assigns each one a distinct integer "rank" in [0, p(N)) and
back, so a partition can stand in for an integer in that range - the
building block Step 7's keyed permutation unranks its output into.

## q(n, m): partitions of n using parts <= m

q(n, m) is the number of partitions of n into parts each at most m. It has
a two-way recurrence: a partition of n with parts <= m either uses no part
equal to m at all (there are q(n, m-1) of those), or uses at least one part
equal to m, in which case peeling one off leaves a partition of n-m still
using parts <= m (there are q(n-m, m) of those):

    q(n, m) = q(n, m-1) + q(n-m, m)      for m >= 1
    q(0, m) = 1                          (the empty partition)
    q(n, 0) = 0                          for n > 0

p(N), the total number of partitions of N, is q(N, N) (a part can never
exceed the number being partitioned).

## Canonical order

unrank/rank use exactly that two-way split as the ordering, applied
recursively with a shrinking bound m:

  - Partitions of n with parts <= m that DON'T use m at all come first,
    occupying ranks [0, q(n, m-1)), ordered the same way *those* partitions
    would be ranked with bound m-1 (recurse on (n, m-1) with the same rank).
  - Partitions that use AT LEAST one m come after, occupying ranks
    [q(n, m-1), q(n, m)): peel off one m, and rank/unrank the remainder as
    a partition of n-m still bounded by m (rank shifted down by q(n, m-1)).

unrank(r, N) is unrank_bounded(r, N, N); rank(partition, N) is its exact
inverse. The result is always in non-increasing order by construction.
"""

_TABLE_CACHE = {}


def _build_q_table(n_max):
    """Q[n][m] = q(n, m) for 0 <= n <= n_max, 0 <= m <= n_max."""
    Q = [[0] * (n_max + 1) for _ in range(n_max + 1)]
    for m in range(n_max + 1):
        Q[0][m] = 1
    for m in range(1, n_max + 1):
        for n in range(1, n_max + 1):
            Q[n][m] = Q[n][m - 1] + (Q[n - m][m] if n >= m else 0)
    return Q


def q_table(n_max):
    """Cached q(n, m) table for 0 <= n, m <= n_max."""
    if n_max not in _TABLE_CACHE:
        _TABLE_CACHE[n_max] = _build_q_table(n_max)
    return _TABLE_CACHE[n_max]


def q(n, m):
    """Number of partitions of n into parts each at most m."""
    if n < 0:
        return 0
    if m <= 0:
        return 1 if n == 0 else 0
    return q_table(max(n, m))[n][m]


def partitions_count(N):
    """p(N): the total number of partitions of N."""
    if N < 0:
        raise ValueError("N must be non-negative")
    if N == 0:
        return 1
    return q(N, N)


def _unrank_bounded(r, n, m, table):
    # Iterative, not recursive: at N ~ 850 the "doesn't use m" branch alone
    # can chain m down from N to 0, well past Python's default recursion
    # limit. Both recursive calls in the original formulation are in tail
    # position, so this loop is a direct, behavior-preserving rewrite.
    parts = []
    while n > 0:
        without_m = table[n][m - 1] if m > 0 else 0
        if r < without_m:
            m -= 1
        else:
            parts.append(m)
            r -= without_m
            n -= m
    return parts


def unrank(r, N):
    """Return the r-th partition of N (0 <= r < p(N)) in canonical order,
    as a list of parts in non-increasing order."""
    if N < 0:
        raise ValueError("N must be non-negative")
    total = partitions_count(N)
    if not (0 <= r < total):
        raise ValueError(f"rank {r} out of range [0, {total}) for N={N}")
    if N == 0:
        return []
    table = q_table(N)
    return _unrank_bounded(r, N, N, table)


def _rank_bounded(parts, n, m, table):
    # Iterative counterpart of _unrank_bounded, same recursion-depth reason.
    result = 0
    idx = 0
    while n > 0:
        current = parts[idx] if idx < len(parts) else 0
        if current < m:
            m -= 1
        elif current > m:
            raise ValueError(f"part {current} exceeds bound {m}")
        else:
            without_m = table[n][m - 1] if m > 0 else 0
            result += without_m
            n -= m
            idx += 1
    return result


def rank(partition, N):
    """Inverse of unrank(): given a partition of N (any order, positive
    integers summing to N), return its rank in [0, p(N))."""
    if N < 0:
        raise ValueError("N must be non-negative")
    parts = sorted(partition, reverse=True)
    if any(p <= 0 for p in parts):
        raise ValueError("partition parts must be positive integers")
    if sum(parts) != N:
        raise ValueError(f"parts sum to {sum(parts)}, expected {N}")
    if N == 0:
        return 0
    table = q_table(N)
    return _rank_bounded(parts, N, N, table)


def _p_sequence(n_max):
    """p(0..n_max) via Euler's pentagonal number recurrence - O(n^1.5),
    much cheaper than building the full q(n, m) table when all we need
    is the 1-D total-partition-count sequence for min_N's search."""
    p = [0] * (n_max + 1)
    p[0] = 1
    for i in range(1, n_max + 1):
        total = 0
        k = 1
        while True:
            g1 = k * (3 * k - 1) // 2
            g2 = k * (3 * k + 1) // 2
            if g1 > i and g2 > i:
                break
            sign = 1 if k % 2 else -1
            if g1 <= i:
                total += sign * p[i - g1]
            if g2 <= i:
                total += sign * p[i - g2]
            k += 1
        p[i] = total
    return p


def min_N(space):
    """Smallest N such that p(N) >= space."""
    if space <= 1:
        return 0

    n_max = 16
    p = _p_sequence(n_max)
    while p[n_max] < space:
        n_max *= 2
        p = _p_sequence(n_max)

    lo, hi = 0, n_max
    while lo < hi:
        mid = (lo + hi) // 2
        if p[mid] >= space:
            hi = mid
        else:
            lo = mid + 1
    return lo
