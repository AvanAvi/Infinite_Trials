import random
import unittest

from partition_rank import min_N, partitions_count, q, rank, unrank


def _all_partitions(n, max_part=None):
    """Independent reference generator: every partition of n, descending
    order, parts <= max_part. Not used by partition_rank.py itself, so it
    serves as an oracle rather than testing the module against itself.
    """
    if max_part is None:
        max_part = n
    if n == 0:
        yield ()
        return
    for first in range(min(n, max_part), 0, -1):
        for rest in _all_partitions(n - first, first):
            yield (first,) + rest


class QTableTest(unittest.TestCase):
    def test_known_small_values(self):
        # Partitions of 4 with parts <= m, hand-counted:
        #   m=1: 1+1+1+1                                  -> 1
        #   m=2: 2+2, 2+1+1, 1+1+1+1                       -> 3
        #   m=3: 3+1, 2+2, 2+1+1, 1+1+1+1                  -> 4
        #   m=4: 4, 3+1, 2+2, 2+1+1, 1+1+1+1                -> 5
        self.assertEqual(q(4, 1), 1)
        self.assertEqual(q(4, 2), 3)
        self.assertEqual(q(4, 3), 4)
        self.assertEqual(q(4, 4), 5)

    def test_q_n_n_matches_p_n(self):
        for n in range(15):
            self.assertEqual(q(n, n), partitions_count(n))

    def test_zero_partitions(self):
        self.assertEqual(q(0, 0), 1)
        self.assertEqual(q(0, 5), 1)
        self.assertEqual(q(5, 0), 0)


class ExhaustiveSmallNTest(unittest.TestCase):
    """Every rank round-trips and every partition of N appears exactly
    once, for every N up to 30 - checked against an independently written
    partition generator, not against this module's own logic."""

    def test_bijection_for_all_n_up_to_30(self):
        for N in range(31):
            with self.subTest(N=N):
                reference = set(_all_partitions(N))
                total = partitions_count(N)
                self.assertEqual(total, len(reference))

                seen = set()
                for r in range(total):
                    partition = tuple(unrank(r, N))
                    self.assertEqual(sum(partition), N)
                    self.assertTrue(
                        all(a >= b for a, b in zip(partition, partition[1:])),
                        f"{partition} is not non-increasing",
                    )
                    self.assertNotIn(partition, seen, f"rank {r} duplicates {partition}")
                    seen.add(partition)
                    self.assertEqual(rank(partition, N), r)

                self.assertEqual(seen, reference)


class RandomLargeNTest(unittest.TestCase):
    """Round-trip on random ranks at N ~ 850, where exhaustive checking
    is infeasible (p(850) has dozens of digits)."""

    def test_random_round_trip(self):
        random.seed(20260928)
        N = 850
        total = partitions_count(N)

        for _ in range(200):
            r = random.randrange(total)
            partition = unrank(r, N)
            self.assertEqual(sum(partition), N)
            self.assertTrue(all(a >= b for a, b in zip(partition, partition[1:])))
            self.assertEqual(rank(partition, N), r)

    def test_boundary_ranks(self):
        N = 850
        total = partitions_count(N)
        for r in (0, 1, total - 2, total - 1):
            partition = unrank(r, N)
            self.assertEqual(rank(partition, N), r)


class MinNTest(unittest.TestCase):
    def test_known_values(self):
        # p(0)=1, p(1)=1, p(2)=2, p(3)=3, p(4)=5
        self.assertEqual(min_N(1), 0)
        self.assertEqual(min_N(2), 2)
        self.assertEqual(min_N(3), 3)
        self.assertEqual(min_N(4), 4)  # p(3)=3 < 4 <= p(4)=5
        self.assertEqual(min_N(5), 4)

    def test_result_is_tight(self):
        for space in (1, 5, 100, 10_000, 10**6):
            n = min_N(space)
            self.assertGreaterEqual(partitions_count(n), space)
            if n > 0:
                self.assertLess(partitions_count(n - 1), space)


class InvalidInputTest(unittest.TestCase):
    def test_unrank_rejects_out_of_range(self):
        with self.assertRaises(ValueError):
            unrank(-1, 10)
        with self.assertRaises(ValueError):
            unrank(partitions_count(10), 10)

    def test_rank_rejects_wrong_sum(self):
        with self.assertRaises(ValueError):
            rank([1, 2, 3], 10)

    def test_rank_rejects_non_positive_parts(self):
        with self.assertRaises(ValueError):
            rank([4, 0], 4)


if __name__ == "__main__":
    unittest.main()
