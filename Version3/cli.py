#!/usr/bin/env python3
"""CLI for Version3's keyed format-preserving encryption over partitions.

Subcommands:
  keygen   generate a random 256-bit key, or derive one from a passphrase
  encrypt  encrypt a password with a key or passphrase
  decrypt  decrypt a ciphertext with a key or passphrase

Key material: --key takes a 64-character hex string (32 bytes / 256
bits). --passphrase prompts for a hidden passphrase and derives the key
via Argon2id (kdf.py, ~0.5-1s per derivation). Encrypting or generating
a key from a passphrase without an existing --salt generates a fresh
one and prints it to stderr - save it, since the exact same salt must
be supplied via --salt to reproduce that key later for decrypt.
"""

import argparse
import getpass
import os
import sys

from cipher import KEY_BYTES, decrypt as cipher_decrypt, encrypt as cipher_encrypt
from kdf import SALT_BYTES, derive_key


def _resolve_key(args):
    if args.key:
        try:
            key = bytes.fromhex(args.key)
        except ValueError as exc:
            raise ValueError("--key must be a valid hex string") from exc
        if len(key) != KEY_BYTES:
            raise ValueError(f"--key must be {KEY_BYTES * 2} hex characters ({KEY_BYTES} bytes)")
        return key

    if args.passphrase:
        passphrase = getpass.getpass("Passphrase: ")
        salt = bytes.fromhex(args.salt) if args.salt else None
        key, salt = derive_key(passphrase, salt)
        if args.salt is None:
            print(
                f"salt (save this - required to reproduce this key): {salt.hex()}",
                file=sys.stderr,
            )
        return key

    raise ValueError("either --key or --passphrase is required")


def cmd_keygen(args):
    if args.passphrase:
        passphrase = getpass.getpass("Passphrase: ")
        key, salt = derive_key(passphrase)
        print(f"key:  {key.hex()}")
        print(f"salt: {salt.hex()}")
    else:
        key = os.urandom(KEY_BYTES)
        print(f"key: {key.hex()}")


def cmd_encrypt(args):
    key = _resolve_key(args)
    password = args.password if args.password is not None else input("Password to encrypt: ")
    print(cipher_encrypt(password, key))


def cmd_decrypt(args):
    key = _resolve_key(args)
    ciphertext = args.ciphertext if args.ciphertext is not None else input("Ciphertext: ")
    print(cipher_decrypt(ciphertext, key))


def build_parser():
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    p_keygen = subparsers.add_parser("keygen", help="generate a key")
    p_keygen.add_argument(
        "--passphrase",
        action="store_true",
        help="derive the key from a passphrase (Argon2id) instead of generating randomly",
    )
    p_keygen.set_defaults(func=cmd_keygen)

    p_encrypt = subparsers.add_parser("encrypt", help="encrypt a password")
    p_encrypt.add_argument("password", nargs="?", help="password to encrypt (prompted if omitted)")
    p_encrypt.add_argument("--key", help=f"{KEY_BYTES * 2}-character hex key")
    p_encrypt.add_argument(
        "--passphrase", action="store_true", help="derive the key from a passphrase instead of --key"
    )
    p_encrypt.add_argument(
        "--salt",
        help=f"{SALT_BYTES * 2}-character hex salt (with --passphrase; generated and printed if omitted)",
    )
    p_encrypt.set_defaults(func=cmd_encrypt)

    p_decrypt = subparsers.add_parser("decrypt", help="decrypt a ciphertext")
    p_decrypt.add_argument("ciphertext", nargs="?", help="ciphertext to decrypt (prompted if omitted)")
    p_decrypt.add_argument("--key", help=f"{KEY_BYTES * 2}-character hex key")
    p_decrypt.add_argument(
        "--passphrase", action="store_true", help="derive the key from a passphrase instead of --key"
    )
    p_decrypt.add_argument(
        "--salt", help=f"{SALT_BYTES * 2}-character hex salt (required with --passphrase)"
    )
    p_decrypt.set_defaults(func=cmd_decrypt)

    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "decrypt" and args.passphrase and not args.salt:
        parser.error("decrypt --passphrase requires --salt (the same salt used to encrypt)")

    try:
        args.func(args)
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
