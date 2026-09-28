import io
import unittest
from contextlib import redirect_stderr, redirect_stdout
from unittest.mock import patch

import cli


def _run(argv):
    out, err = io.StringIO(), io.StringIO()
    with redirect_stdout(out), redirect_stderr(err):
        exit_code = cli.main(argv)
    return exit_code, out.getvalue(), err.getvalue()


class KeygenTest(unittest.TestCase):
    def test_random_keygen_prints_valid_hex_key(self):
        code, out, _ = _run(["keygen"])
        self.assertEqual(code, 0)
        key_hex = out.strip().removeprefix("key: ")
        self.assertEqual(len(key_hex), 64)
        bytes.fromhex(key_hex)  # doesn't raise

    @patch("cli.getpass.getpass", return_value="a passphrase")
    def test_passphrase_keygen_prints_key_and_salt(self, _mock_getpass):
        code, out, _ = _run(["keygen", "--passphrase"])
        self.assertEqual(code, 0)
        lines = out.strip().splitlines()
        key_hex = lines[0].removeprefix("key:  ")
        salt_hex = lines[1].removeprefix("salt: ")
        self.assertEqual(len(key_hex), 64)
        self.assertEqual(len(salt_hex), 32)


class EncryptDecryptWithKeyTest(unittest.TestCase):
    def test_round_trip(self):
        _, out, _ = _run(["keygen"])
        key_hex = out.strip().removeprefix("key: ")

        code, out, _ = _run(["encrypt", "--key", key_hex, "MyPassword123"])
        self.assertEqual(code, 0)
        ciphertext = out.strip()
        self.assertRegex(ciphertext, r"^\d+:\d+:\d+(\+\d+)*$")

        code, out, _ = _run(["decrypt", "--key", key_hex, ciphertext])
        self.assertEqual(code, 0)
        self.assertEqual(out.strip(), "MyPassword123")

    def test_rejects_malformed_key(self):
        code, _, err = _run(["encrypt", "--key", "not hex", "password"])
        self.assertEqual(code, 1)
        self.assertIn("Error", err)

    def test_rejects_wrong_length_key(self):
        code, _, err = _run(["encrypt", "--key", "ab" * 10, "password"])
        self.assertEqual(code, 1)
        self.assertIn("Error", err)


class EncryptDecryptWithPassphraseTest(unittest.TestCase):
    @patch("cli.getpass.getpass", return_value="correct horse battery staple")
    def test_round_trip(self, _mock_getpass):
        code, out, err = _run(["encrypt", "--passphrase", "TestPass99"])
        self.assertEqual(code, 0)
        ciphertext = out.strip()
        self.assertIn("salt (save this", err)
        salt_hex = err.strip().rsplit(": ", 1)[1]
        self.assertEqual(len(salt_hex), 32)

        code, out, _ = _run(
            ["decrypt", "--passphrase", "--salt", salt_hex, ciphertext]
        )
        self.assertEqual(code, 0)
        self.assertEqual(out.strip(), "TestPass99")

    @patch("cli.getpass.getpass", return_value="correct horse battery staple")
    def test_wrong_passphrase_does_not_return_plaintext(self, mock_getpass):
        code, out, err = _run(["encrypt", "--passphrase", "TestPass99"])
        ciphertext = out.strip()
        salt_hex = err.strip().rsplit(": ", 1)[1]

        mock_getpass.return_value = "a totally different passphrase"
        code, out, _ = _run(["decrypt", "--passphrase", "--salt", salt_hex, ciphertext])
        if code == 0:
            self.assertNotEqual(out.strip(), "TestPass99")

    def test_decrypt_passphrase_without_salt_errors(self):
        with self.assertRaises(SystemExit):
            _run(["decrypt", "--passphrase", "somectiphertext"])


class PromptFallbackTest(unittest.TestCase):
    @patch("builtins.input", return_value="PromptedPassword")
    def test_encrypt_prompts_when_password_omitted(self, _mock_input):
        _, out, _ = _run(["keygen"])
        key_hex = out.strip().removeprefix("key: ")

        code, out, _ = _run(["encrypt", "--key", key_hex])
        self.assertEqual(code, 0)
        ciphertext = out.strip()

        code, out, _ = _run(["decrypt", "--key", key_hex, ciphertext])
        self.assertEqual(out.strip(), "PromptedPassword")


if __name__ == "__main__":
    unittest.main()
