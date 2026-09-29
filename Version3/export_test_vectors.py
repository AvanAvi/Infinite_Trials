#!/usr/bin/env python3
"""Export JSON test vectors from the Python implementation for the
TypeScript port in web/src/core/ to cross-validate against.

Every vector here is produced by calling the actual Python modules
(partition_rank, encoding, feistel, cipher, kdf) directly - nothing is
hand-computed or copied from docs. Run this script whenever the Python
implementation changes in a way that could affect these values; the
Vitest suite in web/test/ must reproduce every one of them exactly.

Usage:
    python3 Version3/export_test_vectors.py

Writes JSON files to web/test/vectors/. Big integers are serialized as
decimal strings (JSON has no native bigint), which is exactly what
JavaScript's BigInt constructor accepts directly: BigInt("12345").
"""

import json
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "analysis"))

from cipher import KEY_BYTES, decrypt as cipher_decrypt, encrypt as cipher_encrypt
from encoding import ALPHABET, encode_password
from feistel import encrypt_domain
from kdf import derive_key
from partition_rank import partitions_count, unrank
from collision_count import (
    compute_k,
    count_multisets_with_sum,
    load_lookup_table,
)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "web", "test", "vectors")

# Fixed, hardcoded keys/salts so every export run is byte-identical -
# reproducibility matters more here than secrecy (these are test fixtures,
# never used for anything real).
FIXED_KEY = bytes(range(KEY_BYTES))  # 00 01 02 ... 1f
FIXED_KEY_HEX = FIXED_KEY.hex()
FIXED_SALT = bytes(range(16))
FIXED_SALT_HEX = FIXED_SALT.hex()


def write_json(name, data):
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, name)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
    print(f"wrote {path}")


def export_p_values():
    ns = list(range(0, 31)) + [50, 100, 200, 850]
    data = {"cases": [{"n": n, "p": str(partitions_count(n))} for n in ns]}
    write_json("p_values.json", data)


def export_q_values():
    # Hand-verifiable small cases (matches Version3/test_partition_rank.py)
    # plus a broader spot-check grid.
    cases = []
    for n in range(0, 11):
        for m in range(0, 11):
            cases.append({"n": n, "m": m})

    from partition_rank import q

    data = {
        "cases": [{"n": c["n"], "m": c["m"], "q": str(q(c["n"], c["m"]))} for c in cases]
    }
    write_json("q_values.json", data)


def export_rank_unrank():
    exhaustive = []
    for n in range(0, 16):
        total = partitions_count(n)
        entries = [{"r": str(r), "parts": unrank(r, n)} for r in range(total)]
        exhaustive.append({"N": n, "entries": entries})

    rng = random.Random(20260928)
    sampled = []
    for n in (30, 100, 850):
        total = partitions_count(n)
        # random.sample(range(total), ...) overflows C ssize_t once total
        # has dozens of digits (p(850) does) - randrange handles arbitrary
        # precision fine, so collect unique ranks with it instead.
        count = min(25, total)
        seen = set()
        while len(seen) < count:
            seen.add(rng.randrange(total))
        ranks = sorted(seen)
        entries = [{"r": str(r), "parts": unrank(r, n)} for r in ranks]
        sampled.append({"N": n, "entries": entries})

    write_json(
        "rank_unrank.json",
        {"exhaustive": exhaustive, "sampled": sampled},
    )


def export_encoding():
    known = ["a", "b", "ab", "ba", "aa", ALPHABET[0] * 5, ALPHABET[-1] * 5]
    rng = random.Random(20260928)
    random_cases = []
    for length in range(1, 33):
        for _ in range(3):
            password = "".join(rng.choice(ALPHABET) for _ in range(length))
            random_cases.append(password)

    cases = []
    for password in known + random_cases:
        value, length = encode_password(password)
        cases.append({"password": password, "value": str(value), "length": length})

    write_json("encoding.json", {"cases": cases})


def export_feistel():
    domain_sizes = [2, 5, 16, 17, 100, 997, 1024, 50000]
    rng = random.Random(20260928)
    cases = []
    for domain_size in domain_sizes:
        sample_count = min(10, domain_size)
        xs = sorted(rng.sample(range(domain_size), sample_count))
        for x in xs:
            y = encrypt_domain(x, FIXED_KEY, domain_size)
            cases.append({"domain_size": domain_size, "x": x, "y": y})

    write_json("feistel.json", {"key_hex": FIXED_KEY_HEX, "cases": cases})


def export_cipher():
    passwords = ["a", "ab", "cab", "face", "password12", "Zz09" * 8]
    cases = []
    for password in passwords:
        ciphertext = cipher_encrypt(password, FIXED_KEY)
        # Round-trip check at export time too - fail loudly if Python's own
        # pipeline doesn't agree with itself before anything gets exported.
        assert cipher_decrypt(ciphertext, FIXED_KEY) == password
        cases.append({"password": password, "ciphertext": ciphertext})

    write_json("cipher.json", {"key_hex": FIXED_KEY_HEX, "cases": cases})


def export_collisions():
    table_path = os.path.join(
        os.path.dirname(__file__), "..", "Version2", "data", "lookup_table.csv"
    )
    table = load_lookup_table(table_path)
    values = sorted(table.values())

    passwords = ["ab", "cab", "face", "password12"]
    cases = []
    for password in passwords:
        k = compute_k(password, table)
        total = count_multisets_with_sum(values, len(password), k)
        cases.append(
            {"password": password, "length": len(password), "k": k, "total": total}
        )

    write_json("collisions.json", {"cases": cases})


def export_argon2():
    key, salt = derive_key("test passphrase", FIXED_SALT)
    assert salt == FIXED_SALT
    write_json(
        "argon2.json",
        {
            "passphrase": "test passphrase",
            "salt_hex": FIXED_SALT_HEX,
            "key_hex": key.hex(),
        },
    )


def main():
    export_p_values()
    export_q_values()
    export_rank_unrank()
    export_encoding()
    export_feistel()
    export_cipher()
    export_collisions()
    export_argon2()


if __name__ == "__main__":
    main()
