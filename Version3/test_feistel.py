import os
import random
import unittest

from feistel import MIN_ROUNDS, decrypt_domain, encrypt_domain


class ExhaustiveBijectionTest(unittest.TestCase):
    """The permutation must be a true bijection on the domain - every
    input produces a distinct output covering the whole domain exactly,
    and decrypt is the exact inverse for every one of them."""

    def test_bijection_on_small_non_power_of_two_domain(self):
        key = b"\x01" * 32
        domain_size = 997  # prime, not a power of two: exercises cycle walking

        outputs = set()
        for x in range(domain_size):
            y = encrypt_domain(x, key, domain_size)
            self.assertTrue(0 <= y < domain_size)
            self.assertNotIn(y, outputs, f"x={x} collided with an earlier output")
            outputs.add(y)
            self.assertEqual(decrypt_domain(y, key, domain_size), x)

        self.assertEqual(outputs, set(range(domain_size)))

    def test_bijection_on_power_of_two_domain(self):
        key = b"\x02" * 32
        domain_size = 1024  # exact power of two: no cycle walking needed

        outputs = set()
        for x in range(domain_size):
            y = encrypt_domain(x, key, domain_size)
            outputs.add(y)
            self.assertEqual(decrypt_domain(y, key, domain_size), x)

        self.assertEqual(outputs, set(range(domain_size)))


class RoundTripTest(unittest.TestCase):
    def test_random_round_trip_large_domain(self):
        random.seed(20260928)
        key = os.urandom(32)
        domain_size = 10 ** 30 + 7

        for _ in range(500):
            x = random.randrange(domain_size)
            y = encrypt_domain(x, key, domain_size)
            self.assertTrue(0 <= y < domain_size)
            self.assertEqual(decrypt_domain(y, key, domain_size), x)

    def test_different_keys_give_different_permutations(self):
        domain_size = 997
        x = 42
        y1 = encrypt_domain(x, b"\x00" * 32, domain_size)
        y2 = encrypt_domain(x, b"\xff" * 32, domain_size)
        self.assertNotEqual(y1, y2)


class InvalidInputTest(unittest.TestCase):
    def test_rejects_x_out_of_domain(self):
        with self.assertRaises(ValueError):
            encrypt_domain(100, b"\x00" * 32, 100)
        with self.assertRaises(ValueError):
            encrypt_domain(-1, b"\x00" * 32, 100)

    def test_rejects_too_few_rounds(self):
        with self.assertRaises(ValueError):
            encrypt_domain(0, b"\x00" * 32, 100, rounds=MIN_ROUNDS - 1)
        with self.assertRaises(ValueError):
            decrypt_domain(0, b"\x00" * 32, 100, rounds=MIN_ROUNDS - 1)

    def test_accepts_minimum_rounds(self):
        y = encrypt_domain(5, b"\x00" * 32, 100, rounds=MIN_ROUNDS)
        self.assertEqual(decrypt_domain(y, b"\x00" * 32, 100, rounds=MIN_ROUNDS), 5)


if __name__ == "__main__":
    unittest.main()
