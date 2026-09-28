import time
import unittest

from kdf import KEY_BYTES, SALT_BYTES, derive_key, generate_salt


class DeriveKeyTest(unittest.TestCase):
    def test_same_passphrase_and_salt_is_deterministic(self):
        salt = generate_salt()
        key1, salt1 = derive_key("correct horse battery staple", salt)
        key2, salt2 = derive_key("correct horse battery staple", salt)
        self.assertEqual(key1, key2)
        self.assertEqual(salt1, salt2)
        self.assertEqual(len(key1), KEY_BYTES)

    def test_different_salt_gives_different_key(self):
        salt_a = b"\x00" * SALT_BYTES
        salt_b = b"\x01" * SALT_BYTES
        key_a, _ = derive_key("same passphrase", salt_a)
        key_b, _ = derive_key("same passphrase", salt_b)
        self.assertNotEqual(key_a, key_b)

    def test_different_passphrase_gives_different_key(self):
        salt = generate_salt()
        key_a, _ = derive_key("passphrase one", salt)
        key_b, _ = derive_key("passphrase two", salt)
        self.assertNotEqual(key_a, key_b)

    def test_omitted_salt_is_generated_and_returned(self):
        key, salt = derive_key("some passphrase")
        self.assertEqual(len(salt), SALT_BYTES)
        # Reusing the returned salt must reproduce the same key.
        key_again, salt_again = derive_key("some passphrase", salt)
        self.assertEqual(key, key_again)
        self.assertEqual(salt, salt_again)

    def test_derivation_takes_a_meaningful_fraction_of_a_second(self):
        # Loose bounds to avoid flaking across hardware: confirms this
        # isn't an accidentally-fast (i.e. insecure) KDF call, without
        # pinning to the specific ~0.7s measured during tuning.
        start = time.time()
        derive_key("timing check passphrase")
        elapsed = time.time() - start
        self.assertGreater(elapsed, 0.1)
        self.assertLess(elapsed, 10.0)


class InvalidInputTest(unittest.TestCase):
    def test_rejects_empty_passphrase(self):
        with self.assertRaises(ValueError):
            derive_key("")

    def test_rejects_wrong_salt_length(self):
        with self.assertRaises(ValueError):
            derive_key("passphrase", b"too short")


if __name__ == "__main__":
    unittest.main()
