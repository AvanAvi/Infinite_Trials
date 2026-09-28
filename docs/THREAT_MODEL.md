# Threat model: Version 3

Version 1 and Version 2's scheme (sum partition values, add a public
constant) has no security to model - `docs/ANALYSIS.md` shows why: the
constant is public, the lookup table is public, and the sum collides
constantly regardless. Version 3 is a different construction, and this
document is about *it* specifically.

## Where the security actually comes from

**The key, and HMAC-SHA256 - not partition theory.** Partitions are the
*domain* the ciphertext lives in (Step 6's `partition_rank.py` gives a
bijection between integers and partitions of N), not the source of any
difficulty. Recovering a password from a Version 3 ciphertext without the
key means inverting a keyed Feistel permutation whose round function is
HMAC-SHA256 - the same problem as attacking any HMAC-SHA256-based
construction, full stop. If you could invert that without the key, the
partition math wouldn't have added anything, and if the partition
structure were somehow weak, HMAC-SHA256 wouldn't be why it stayed secure.
Don't read "built on partition numbers" as "protected by partition
numbers" - it isn't, by design.

## Assumptions

- The 256-bit key (`cipher.KEY_BYTES`) is either generated with a real CSPRNG (`os.urandom`, what `cli.py keygen` uses by default) or derived from a passphrase strong enough that Argon2id's ~0.7s-per-guess cost (`kdf.py`) doesn't make brute-forcing it practical. A weak, guessable passphrase is weak regardless of what derives a key from it - Argon2id makes guessing *slower*, not *impossible*.
- HMAC-SHA256 behaves as a pseudorandom function. This is a standard cryptographic assumption, not something this project has verified independently.
- The attacker sees ciphertexts (`N:length:part1+part2+...` strings) and does not have the key. An attacker who has the key doesn't need a threat model - they can just decrypt.

## Known limitations

**Encryption is deterministic - there is no tweak or nonce.** The same key
encrypting the same password always produces the exact same ciphertext
(`test_cipher.py::DeterminismTest` asserts this as *correct* current
behavior, not a bug). That means an attacker watching multiple ciphertexts
under one key can tell when the same password was encrypted twice, even
without knowing what it is - classic deterministic-encryption pattern
leakage. There is no per-message randomness anywhere in the pipeline.
Phase 2 of `docs/ROADMAP.md` adds one.

**The Feistel construction is custom and unaudited.** `feistel.py` is a
balanced Feistel network with an HMAC-SHA256 round function that this
project wrote and tested (exhaustive bijection checks, round-trip tests),
not a peer-reviewed or standardized format-preserving encryption mode.
Standard building blocks (HMAC-SHA256, Argon2id) went into it, but their
combination into this specific Feistel structure has not had any
independent cryptographic review. NIST SP 800-38G specifies FF1 and FF3-1
for exactly this purpose (format-preserving encryption via a Feistel
network over an arbitrary-radix domain, with published analysis); this
project doesn't use them. Treat this as a working, tested implementation
of a plausible construction, not a proven one.

**Ciphertext length leaks roughly the password length.** The ciphertext
format is `N:length:part1+part2+...`, and even setting aside that
`length` is stored explicitly (see `cipher.py`'s docstring for why), N
itself is derived from length via `min_N(62**length)` - N, and therefore
the number of `+`-separated parts and their rough magnitude, grows with
password length. An attacker who sees a ciphertext learns approximately
how long the password was, the same way ciphertext length alone leaks
plaintext length in most encryption schemes without explicit padding.
Phase 2 addresses this by padding every password to a fixed length before
encoding.

**No message authentication.** There is no MAC or authentication tag on
the ciphertext (distinct from HMAC-SHA256's use *inside* the Feistel round
function, which is not doing an authentication job). Decrypting with the
wrong key does not reliably raise an error - it can just as easily produce
a different, wrong password silently (see `cipher.py`'s `decrypt()`
docstring, and `test_cipher.py::WrongKeyTest`, which explicitly accepts
either outcome). There is no way, from the ciphertext alone, to confirm a
decryption used the right key.

**This is a hobby project's reference implementation, not an audited
security library.** It has not had external cryptographic review. If you
need to actually protect real secrets, use an established, audited tool
(age, libsodium, your platform's keychain) - not this.

## Out of scope

- An attacker who already has the key - there's nothing left to model.
- Side-channel attacks on this specific Python implementation (its integer
  and comparison operations are not written to be constant-time; Python
  itself doesn't make that an achievable guarantee in the first place).
- Post-quantum analysis - covered separately in `docs/ROADMAP.md` (Phase 3),
  since it's forward-looking rather than a property of what exists today.
