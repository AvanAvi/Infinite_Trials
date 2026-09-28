"""Fixed-alphabet base-62 encoding between passwords and integers.

Passwords use the same 62-character alphabet as Version1/Version2:
lowercase, then uppercase, then digits. A password is treated as the
digits of a base-62 number (first character most significant), giving a
value in [0, 62**length).

The value alone doesn't determine the password's length: 'a' is digit 0,
so a leading 'a' is indistinguishable from not being there at all once
it's folded into a single integer - "a" and "aa" would collide if you
tried to recover the length by padding to some fixed width, since both
decode to value 0 (just with a different, guessed, width). To keep
encoding lossless, length is carried alongside the value everywhere in
this module and downstream, rather than reconstructed from padding.
"""

import string

ALPHABET = string.ascii_lowercase + string.ascii_uppercase + string.digits  # 62 chars
assert len(ALPHABET) == 62

_CHAR_TO_DIGIT = {c: i for i, c in enumerate(ALPHABET)}

MIN_PASSWORD_LENGTH = 1
MAX_PASSWORD_LENGTH = 32


def _check_length(length):
    if not (MIN_PASSWORD_LENGTH <= length <= MAX_PASSWORD_LENGTH):
        raise ValueError(
            f"length must be between {MIN_PASSWORD_LENGTH} and {MAX_PASSWORD_LENGTH}, "
            f"got {length}"
        )


def encode_password(password):
    """Encode a password to (value, length).

    Both are required to decode unambiguously - see module docstring.
    """
    length = len(password)
    _check_length(length)

    value = 0
    for c in password:
        digit = _CHAR_TO_DIGIT.get(c)
        if digit is None:
            raise ValueError(f"character {c!r} is not in the base-62 alphabet")
        value = value * 62 + digit

    return value, length


def decode_password(value, length):
    """Inverse of encode_password: reconstruct the password from (value, length)."""
    _check_length(length)

    max_value = 62 ** length
    if not (0 <= value < max_value):
        raise ValueError(f"value {value} out of range [0, {max_value}) for length {length}")

    chars = []
    for _ in range(length):
        value, digit = divmod(value, 62)
        chars.append(ALPHABET[digit])

    return "".join(reversed(chars))
