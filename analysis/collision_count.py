#!/usr/bin/env python3
"""Count how many same-length character multisets collide on a password's K.

The Infinite Trials encryption scheme maps each character to a partition
value and sums them: K = sum(partition(c) for c in password). That sum
throws away character order, so many different multisets of characters -
not just permutations of the same characters - land on the same K. This
script counts exactly how many, for a given password and the Version2
lookup table, to make that concrete rather than asserted.

Usage:
    python3 analysis/collision_count.py <password> [password ...]

For each password it prints the length, K, the total number of same-length
multisets summing to K (including the password's own), and therefore how
many *other* multisets an attacker could never distinguish from it.
"""

import argparse
import csv
import os
import sys
from operator import add


def load_lookup_table(path):
    table = {}
    with open(path, newline="") as f:
        reader = csv.reader(f)
        next(reader)  # header
        for row in reader:
            if not row:
                continue
            character, partition_value = row
            table[character] = int(partition_value)
    return table


def compute_k(password, table):
    try:
        return sum(table[c] for c in password)
    except KeyError as exc:
        raise ValueError(f"character {exc} is not in the lookup table") from exc


def count_multisets_with_sum(values, length, target):
    """Count non-decreasing sequences (multisets) of `length` values chosen
    with repetition from `values` that sum to exactly `target`.

    dp[s][r] holds the count of multisets of size s (drawn only from the
    values processed so far) summing to r - i.e. the DP is indexed by
    (character processed so far, slots used, residual sum), the same three
    axes a top-down memoised recursion over (char index, slots, residual)
    would use. It's built bottom-up instead: characters whose value alone
    exceeds the target are dropped first (the V2 table's values span
    1..1,501,309, so for realistic passwords most digit/uppercase
    characters are irrelevant to a given K), then each remaining character
    is folded into dp one at a time. Within one character's pass, s is
    iterated ascending so dp[s][r] can pull from dp[s-1][r-v] already
    updated by that same character earlier in the pass - the standard
    unbounded-coin-change trick - which is what allows a character to
    appear more than once in a multiset while still counting each distinct
    multiset exactly once overall.

    A top-down dict-memoised version of this was tried first and abandoned:
    with values ranging over six orders of magnitude, the achievable-range
    pruning is too loose to keep the visited (index, slots, residual) state
    count bounded, and it blew past several GB of memoised state without
    finishing for a single 10-character password.
    """
    relevant = [v for v in values if v <= target]

    dp = [[0] * (target + 1) for _ in range(length + 1)]
    dp[0][0] = 1

    for v in relevant:
        for s in range(1, length + 1):
            row_s = dp[s]
            row_prev = dp[s - 1]
            tail_len = target + 1 - v
            row_s[v:] = list(map(add, row_s[v:], row_prev[:tail_len]))

    return dp[length][target]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("passwords", nargs="+", help="passwords to analyse")
    parser.add_argument(
        "--lookup-table",
        default=os.path.join(
            os.path.dirname(__file__), "..", "Version2", "data", "lookup_table.csv"
        ),
        help="path to the V2 lookup_table.csv (default: Version2/data/lookup_table.csv)",
    )
    args = parser.parse_args()

    table = load_lookup_table(args.lookup_table)
    values = sorted(table.values())

    for password in args.passwords:
        try:
            k = compute_k(password, table)
        except ValueError as exc:
            print(f"{password!r}: {exc}", file=sys.stderr)
            continue

        total = count_multisets_with_sum(values, len(password), k)
        others = total - 1

        print(f"password:          {password!r}")
        print(f"length:            {len(password)}")
        print(f"K:                 {k}")
        print(f"multisets with K:  {total} (including the password's own)")
        print(f"indistinguishable other multisets: {others}")
        print()


if __name__ == "__main__":
    main()
