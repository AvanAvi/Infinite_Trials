# Roadmap

Version 3, as it stands after this PR, is a correctly-tested but
first-pass construction. This is what would need to change to close the
gaps `docs/THREAT_MODEL.md` documents, and what comes after that.

## Phase 2: closing the known limitations

**A random per-message tweak.** Add a public, random value (a nonce or
tweak, generated fresh per encryption and stored alongside the
ciphertext, the same way an IV travels with a ciphertext in most
encryption schemes) into the Feistel round function's HMAC input
alongside the round number and current half. This breaks the current
determinism - encrypting the same password twice under the same key
would produce different ciphertexts - which directly closes the pattern-
leakage limitation in the threat model. The tweak is public (like an IV),
not secret; it doesn't need Argon2id or key-derivation treatment, just
storage next to the ciphertext.

**Length hiding by padding to a fixed N.** Right now `cipher.py` picks
`N = min_N(62**length)`, so N (and therefore ciphertext size) grows with
the actual password length - the limitation `docs/THREAT_MODEL.md`
documents. Fixing this means always using `N_max = min_N(62**32)`
(`MAX_PASSWORD_LENGTH` from `encoding.py`) regardless of actual length,
and extending `encoding.py`'s scheme so a value can encode "this password
is length L out of up to 32" *within* the integer itself, rather than as
a separate stored field - for example, a reserved 63rd terminator symbol
marking the end of the real password within a fixed 32-slot encoding, so
the value read back unambiguously reconstructs both the length and the
content without needing length stored alongside it (which is currently
necessary specifically because N doesn't hide length - once N stops
varying by length, this becomes both necessary and sufficient). This
needs care to remain a true bijection over the padded space, not just an
injective encoding, so `Version3/test_partition_rank.py`-style exhaustive
checks would need to extend to it.

**Swap the custom Feistel for NIST FF1.** `feistel.py`'s balanced
Feistel network is untested-by-anyone-but-this-project, per the threat
model. NIST SP 800-38G's FF1 mode is a published, analyzed
format-preserving encryption construction built the same way (Feistel
network over an arbitrary-radix domain) - swapping to it, still combined
with the existing cycle-walking approach for the p(N) domain, would
replace "we tested this ourselves" with "this construction has published
cryptanalysis." The domain, the unranking into partitions, and everything
around the permutation stay the same; only `feistel.py`'s internals
change.

**A C++/GMP port with benchmarks.** Version 3 is Python by design (Step 1
of this project's plan: correctness first, in a language where
arbitrary-precision integers and quick iteration don't fight each other).
Once Phase 2's design changes land and are stable, port the pipeline to
C++ using GMP - consistent with Version 2's existing build (`Version2/CMakeLists.txt`,
already wired for GMP, GoogleTest, and CI) - and benchmark it against
this Python reference, the same way `Version2/test/benchmark.cpp`
benchmarks the decryption strategies today.

## Phase 3: post-quantum review

**Symmetric primitives are already in reasonable shape.** Version 3 uses
only symmetric cryptography - HMAC-SHA256 in the Feistel round function,
Argon2id for passphrase derivation - and no public-key cryptography
anywhere. Grover's algorithm gives a quantum attacker a quadratic (not
exponential) speedup against symmetric key search: brute-forcing an
n-bit key costs O(2^n) classically and O(2^(n/2)) with Grover. A 256-bit
key (`cipher.KEY_BYTES`) therefore keeps about 128-bit security against a
quantum attacker - still a comfortable margin by current standards, and
the reason NIST's post-quantum guidance treats sufficiently long
symmetric keys as already adequate, unlike public-key schemes. **No
changes are needed here for Version 3 as designed**, precisely because it
never adopted public-key cryptography in the first place.

**If a public-key component is ever added, that changes.** The likely
place one would show up is key exchange - e.g. letting two parties agree
on the 256-bit key over an insecure channel without a pre-shared secret.
Classical key-exchange schemes (RSA, ECDH) are broken outright by Shor's
algorithm on a sufficiently large quantum computer, not just weakened
quadratically the way symmetric primitives are. If key exchange is ever
added, it should use ML-KEM (FIPS 203, standardized from Kyber) - a
lattice-based mechanism designed specifically to resist Shor's algorithm
- rather than a classical KEM. Nothing in this repo currently does key
exchange, so this is a constraint on *future* additions, not a gap in
what exists today.
