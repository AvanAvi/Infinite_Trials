"""Keyed format-preserving encryption over integer partitions.

Pipeline (encrypt):
  1. encoding.encode_password: password -> (value, length)
  2. partition_rank.min_N(62**length): smallest N whose partitions can
     hold every possible value for that length
  3. feistel.encrypt_domain: keyed permutation of value within [0, p(N))
  4. partition_rank.unrank: permuted value -> a partition of N - that
     partition is the ciphertext

decrypt() reverses every step exactly. The key is 256 bits (32 bytes);
see kdf.py for deriving one from a passphrase instead of generating one
directly.

Ciphertext format: "N:length:part1+part2+...". length is stored
explicitly rather than reconstructed from N, because N is derived from
length via min_N() but isn't guaranteed to determine it uniquely in
reverse (a large jump in p(N) between consecutive N could in principle
make two different lengths share the same minimal N) - length is cheap
to store and removes that fragility entirely. This does mean ciphertext
size reveals approximately how long the password was, since N grows
with length; see docs/THREAT_MODEL.md.

This scheme has no message authentication: decrypting with the wrong
key does not raise on its own merits, it simply produces a different
(wrong) password, or occasionally a value outside any real password's
range for that length, which does raise. Don't mistake "decrypt didn't
raise" for "this was the right key".
"""

from encoding import decode_password, encode_password
from feistel import decrypt_domain, encrypt_domain
from partition_rank import min_N, partitions_count, rank, unrank

KEY_BYTES = 32  # 256 bits


def _check_key(key):
    if not isinstance(key, (bytes, bytearray)) or len(key) != KEY_BYTES:
        raise ValueError(f"key must be {KEY_BYTES} bytes (256 bits), got {type(key).__name__}")


def encrypt(password, key):
    """Encrypt password with a 256-bit key. Returns the ciphertext string."""
    _check_key(key)
    value, length = encode_password(password)

    N = min_N(62 ** length)
    domain_size = partitions_count(N)

    permuted = encrypt_domain(value, key, domain_size)
    parts = unrank(permuted, N)

    return f"{N}:{length}:{'+'.join(str(p) for p in parts)}"


def decrypt(ciphertext, key):
    """Decrypt a ciphertext string produced by encrypt(). Raises ValueError
    if the ciphertext is malformed, or if the recovered value falls
    outside the range any password of the stored length could produce
    (which a wrong key or corrupted ciphertext can cause, though not
    always - see module docstring)."""
    _check_key(key)

    try:
        n_str, length_str, parts_str = ciphertext.split(":", 2)
        N = int(n_str)
        length = int(length_str)
        parts = [int(p) for p in parts_str.split("+")] if parts_str else []
    except (ValueError, AttributeError) as exc:
        raise ValueError(f"malformed ciphertext: {ciphertext!r}") from exc

    domain_size = partitions_count(N)
    permuted = rank(parts, N)
    value = decrypt_domain(permuted, key, domain_size)

    return decode_password(value, length)
