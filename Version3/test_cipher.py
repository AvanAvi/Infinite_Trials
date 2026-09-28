import os
import random
import unittest

from cipher import KEY_BYTES, decrypt, encrypt
from encoding import ALPHABET, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH


def _random_password(length, rng):
    return "".join(rng.choice(ALPHABET) for _ in range(length))


class RoundTripTest(unittest.TestCase):
    """1,000 random passwords across every valid length, same key."""

    @classmethod
    def setUpClass(cls):
        cls.rng = random.Random(20260928)
        cls.key = os.urandom(KEY_BYTES)
        # Spread evenly across every valid length so each length's
        # underlying partition table gets built once and reused, rather
        # than testing only a handful of lengths deeply.
        cls.passwords = [
            _random_password(
                cls.rng.randint(MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH), cls.rng
            )
            for _ in range(1000)
        ]

    def test_round_trip_1000_random_passwords(self):
        for password in self.passwords:
            ciphertext = encrypt(password, self.key)
            self.assertEqual(decrypt(ciphertext, self.key), password)

    def test_ciphertext_is_always_a_valid_partition(self):
        for password in self.passwords[:200]:
            ciphertext = encrypt(password, self.key)
            n_str, length_str, parts_str = ciphertext.split(":", 2)
            N = int(n_str)
            parts = [int(p) for p in parts_str.split("+")]

            self.assertEqual(sum(parts), N)
            self.assertTrue(all(p > 0 for p in parts))
            self.assertTrue(all(a >= b for a, b in zip(parts, parts[1:])))


class WrongKeyTest(unittest.TestCase):
    def test_wrong_key_never_returns_plaintext(self):
        rng = random.Random(1234)
        key = os.urandom(KEY_BYTES)
        wrong_key = os.urandom(KEY_BYTES)
        self.assertNotEqual(key, wrong_key)

        for _ in range(200):
            length = rng.randint(MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH)
            password = _random_password(length, rng)
            ciphertext = encrypt(password, key)

            try:
                result = decrypt(ciphertext, wrong_key)
            except ValueError:
                continue  # wrong key decrypted outside the valid range - fine
            self.assertNotEqual(result, password)


class EdgeCaseLengthTest(unittest.TestCase):
    def test_minimum_length(self):
        key = os.urandom(KEY_BYTES)
        for c in ("a", "Z", "0"):
            ciphertext = encrypt(c, key)
            self.assertEqual(decrypt(ciphertext, key), c)

    def test_maximum_length(self):
        key = os.urandom(KEY_BYTES)
        password = "A" * MAX_PASSWORD_LENGTH
        ciphertext = encrypt(password, key)
        self.assertEqual(decrypt(ciphertext, key), password)

        password2 = "aZ0" * (MAX_PASSWORD_LENGTH // 3) + "a" * (MAX_PASSWORD_LENGTH % 3)
        ciphertext2 = encrypt(password2, key)
        self.assertEqual(decrypt(ciphertext2, key), password2)

    def test_same_password_different_length_boundary(self):
        # "a" (length 1) and "aa" (length 2) must not collide despite
        # sharing value 0 - see encoding.py's docstring.
        key = os.urandom(KEY_BYTES)
        ct1 = encrypt("a", key)
        ct2 = encrypt("aa", key)
        self.assertNotEqual(ct1, ct2)
        self.assertEqual(decrypt(ct1, key), "a")
        self.assertEqual(decrypt(ct2, key), "aa")


class DeterminismTest(unittest.TestCase):
    def test_same_input_same_key_same_output(self):
        key = os.urandom(KEY_BYTES)
        ct1 = encrypt("password12", key)
        ct2 = encrypt("password12", key)
        self.assertEqual(ct1, ct2)

    def test_different_keys_different_ciphertext(self):
        key1 = os.urandom(KEY_BYTES)
        key2 = os.urandom(KEY_BYTES)
        self.assertNotEqual(encrypt("password12", key1), encrypt("password12", key2))


class InvalidInputTest(unittest.TestCase):
    def test_rejects_wrong_key_length(self):
        with self.assertRaises(ValueError):
            encrypt("password", b"too short")
        with self.assertRaises(ValueError):
            decrypt("1:1:1", b"too short")

    def test_rejects_malformed_ciphertext(self):
        key = os.urandom(KEY_BYTES)
        with self.assertRaises(ValueError):
            decrypt("not a ciphertext", key)
        with self.assertRaises(ValueError):
            decrypt("1:1", key)


if __name__ == "__main__":
    unittest.main()
