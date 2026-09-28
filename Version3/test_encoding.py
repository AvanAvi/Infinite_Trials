import random
import string
import unittest

from encoding import (
    ALPHABET,
    MAX_PASSWORD_LENGTH,
    MIN_PASSWORD_LENGTH,
    decode_password,
    encode_password,
)


class EncodingRoundTripTest(unittest.TestCase):
    def test_known_small_values(self):
        # 'a' is digit 0, 'b' is digit 1.
        self.assertEqual(encode_password("a"), (0, 1))
        self.assertEqual(encode_password("b"), (1, 1))
        # "ab" = 0*62 + 1 = 1
        self.assertEqual(encode_password("ab"), (1, 2))
        # "ba" = 1*62 + 0 = 62
        self.assertEqual(encode_password("ba"), (62, 2))

    def test_decode_inverts_encode(self):
        self.assertEqual(decode_password(0, 1), "a")
        self.assertEqual(decode_password(1, 2), "ab")
        self.assertEqual(decode_password(62, 2), "ba")

    def test_leading_zero_digit_is_not_lost(self):
        # "a" and "aa" both have value 0, but different lengths - length
        # is what disambiguates them, not any padding convention.
        self.assertEqual(encode_password("a"), (0, 1))
        self.assertEqual(encode_password("aa"), (0, 2))
        self.assertEqual(decode_password(0, 1), "a")
        self.assertEqual(decode_password(0, 2), "aa")

    def test_random_round_trip_all_lengths(self):
        random.seed(20260928)
        for length in range(MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH + 1):
            for _ in range(20):
                password = "".join(random.choice(ALPHABET) for _ in range(length))
                value, decoded_length = encode_password(password)
                self.assertEqual(decoded_length, length)
                self.assertEqual(decode_password(value, decoded_length), password)

    def test_value_range_matches_length(self):
        for length in range(1, 6):
            max_value = 62 ** length
            self.assertEqual(encode_password(ALPHABET[0] * length), (0, length))
            self.assertEqual(
                encode_password(ALPHABET[-1] * length), (max_value - 1, length)
            )


class InvalidInputTest(unittest.TestCase):
    def test_rejects_too_short(self):
        with self.assertRaises(ValueError):
            encode_password("")

    def test_rejects_too_long(self):
        with self.assertRaises(ValueError):
            encode_password("a" * (MAX_PASSWORD_LENGTH + 1))

    def test_rejects_unknown_character(self):
        with self.assertRaises(ValueError):
            encode_password("abc!")

    def test_decode_rejects_bad_length(self):
        with self.assertRaises(ValueError):
            decode_password(0, 0)
        with self.assertRaises(ValueError):
            decode_password(0, MAX_PASSWORD_LENGTH + 1)

    def test_decode_rejects_value_out_of_range(self):
        with self.assertRaises(ValueError):
            decode_password(62, 1)  # only 0..61 valid for length 1
        with self.assertRaises(ValueError):
            decode_password(-1, 1)


if __name__ == "__main__":
    unittest.main()
