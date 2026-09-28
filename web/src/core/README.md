# core

Step 4 fills this directory with the TypeScript port of the Python math:
`q(n, m)`/`p(n)` via the pentagonal recurrence, rank/unrank, base-62
encoding, the Feistel permutation (WebCrypto HMAC-SHA256), the V1 lookup
and sum, and a short-input collision counter - all using `BigInt`, and
all cross-validated against JSON test vectors exported from the Python
implementation in `Version3/`.
