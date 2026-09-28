"""Keyed permutation on [0, domain_size) via a balanced Feistel network
with an HMAC-SHA256 round function, plus cycle walking.

The permutation itself operates over [0, 2**bit_width), where bit_width
is the smallest EVEN integer with 2**bit_width >= domain_size - even so
the state splits into two exactly equal halves each round (a "balanced"
Feistel network; an unbounded/odd split would need extra bookkeeping to
keep the halves' sizes straight).

domain_size is usually not itself a power of two (it's p(N) for whatever
N the caller picked), so cycle walking is used to land back inside
[0, domain_size): starting from x, apply the full-domain permutation
repeatedly until the result falls inside the domain. This works because
the permutation is a bijection on [0, 2**bit_width) - the walk traces a
single, deterministic path, so decrypting retraces that exact path
backward and recovers the original x, not some other point the walk
passed through. Requiring bit_width even (rather than just the smallest
bit_width at all) can cost up to roughly 4x the domain in the worst case
instead of 2x, but that's the accepted price of having exactly equal
halves; with domain_size this close to 2**bit_width, the expected number
of cycle-walk steps stays small regardless.
"""

import hashlib
import hmac

MIN_ROUNDS = 10
DEFAULT_ROUNDS = 10


def _even_bit_width(domain_size):
    if domain_size <= 1:
        return 2
    bit_width = (domain_size - 1).bit_length()  # smallest b with 2**b >= domain_size
    if bit_width % 2 != 0:
        bit_width += 1
    return max(bit_width, 2)


def _round_function(key, round_num, half_bytes, value):
    """F(round, value): half_bytes bytes of HMAC-SHA256 output, keyed by `key`."""
    msg = round_num.to_bytes(4, "big") + value.to_bytes(half_bytes, "big")
    digest = hmac.new(key, msg, hashlib.sha256).digest()
    return int.from_bytes(digest[:half_bytes], "big")


def _feistel_block(x, key, bit_width, rounds, encrypting):
    half_bits = bit_width // 2
    half_bytes = (half_bits + 7) // 8
    mask = (1 << half_bits) - 1

    L = x >> half_bits
    R = x & mask

    round_order = range(1, rounds + 1) if encrypting else range(rounds, 0, -1)

    for round_num in round_order:
        if encrypting:
            # (L, R) -> (R, L XOR F(round, R))
            f_out = _round_function(key, round_num, half_bytes, R) & mask
            L, R = R, L ^ f_out
        else:
            # Exact inverse of the forward round above.
            f_out = _round_function(key, round_num, half_bytes, L) & mask
            L, R = R ^ f_out, L

    return (L << half_bits) | R


def _check_params(x, domain_size, rounds):
    if not (0 <= x < domain_size):
        raise ValueError(f"{x} out of domain [0, {domain_size})")
    if rounds < MIN_ROUNDS:
        raise ValueError(f"at least {MIN_ROUNDS} rounds are required, got {rounds}")


def encrypt_domain(x, key, domain_size, rounds=DEFAULT_ROUNDS):
    """Keyed bijection x -> y on [0, domain_size)."""
    _check_params(x, domain_size, rounds)
    bit_width = _even_bit_width(domain_size)
    y = x
    while True:
        y = _feistel_block(y, key, bit_width, rounds, encrypting=True)
        if y < domain_size:
            return y


def decrypt_domain(y, key, domain_size, rounds=DEFAULT_ROUNDS):
    """Exact inverse of encrypt_domain."""
    _check_params(y, domain_size, rounds)
    bit_width = _even_bit_width(domain_size)
    x = y
    while True:
        x = _feistel_block(x, key, bit_width, rounds, encrypting=False)
        if x < domain_size:
            return x
