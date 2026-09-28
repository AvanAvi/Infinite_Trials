"""Argon2id key derivation from a passphrase.

Parameters are tuned so a single derivation takes roughly 0.5-1 second on
typical hardware (measured ~0.7s here) - deliberately slow, since that
cost, not the partition-based cipher, is what makes brute-forcing a weak
passphrase expensive. This is where "hard to reverse without the key"
actually comes from in this scheme: decrypting with the *right* key is
fast (see feistel.py), but deriving that key from a guessed passphrase
costs a fraction of a second per guess.

A random salt is generated per derivation unless one is supplied. The
same salt must be reused to reproduce the same key later (e.g. on
decrypt), so it has to be stored alongside whatever it's protecting -
it is not itself a secret, it just needs to not be silently regenerated.
"""

import os

from argon2.low_level import Type, hash_secret_raw

SALT_BYTES = 16
KEY_BYTES = 32  # 256 bits

# Tuned empirically (see commit message) to land in the ~0.5-1s range.
TIME_COST = 3
MEMORY_COST_KIB = 262144  # 256 MiB
PARALLELISM = 2


def generate_salt():
    return os.urandom(SALT_BYTES)


def derive_key(passphrase, salt=None):
    """Derive a 256-bit key from a passphrase via Argon2id.

    Returns (key, salt). If salt is omitted, a fresh random one is
    generated and returned - the caller must store it to reproduce this
    exact key on a later call (e.g. for decrypt).
    """
    if not passphrase:
        raise ValueError("passphrase must not be empty")

    if salt is None:
        salt = generate_salt()
    elif len(salt) != SALT_BYTES:
        raise ValueError(f"salt must be {SALT_BYTES} bytes, got {len(salt)}")

    key = hash_secret_raw(
        secret=passphrase.encode("utf-8"),
        salt=salt,
        time_cost=TIME_COST,
        memory_cost=MEMORY_COST_KIB,
        parallelism=PARALLELISM,
        hash_len=KEY_BYTES,
        type=Type.ID,
    )
    return key, salt
