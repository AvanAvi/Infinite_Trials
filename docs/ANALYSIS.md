# Why this scheme can't be exactly decrypted

Infinite Trials maps each character to a partition value and sums them:
`K = sum(partition(c) for c in password)`, then `Z = K + C` for a public
constant C. Addition is commutative, so **K depends only on the multiset of
characters in the password, never their order** - `"face"` and `"aefc"`
encrypt to the same K. That alone means the scheme can't distinguish
anagrams. What `analysis/collision_count.py` measures is how much further
this goes: for a real password, how many *other*, completely unrelated
character multisets of the same length also produce the same K.

## How the count works

`count_multisets_with_sum` is a DP indexed by three axes - character
processed so far, slots used, residual sum remaining - matching how a
top-down memoised recursion over `(char index, slots, residual)` would be
structured. It's built bottom-up instead: a dict-memoised top-down version
was the first thing tried, and it was abandoned after it exceeded several
GB of memoised state without finishing for a single 10-character password.
The V2 lookup table's values span six orders of magnitude (`1` for `'a'` to
`1,501,309` for `'9'`), so the achievable-range pruning a memoised recursion
relies on is too loose to keep the visited state count bounded. The
bottom-up array version processes one character at a time and only tracks
`dp[slots][residual]`, so its cost is bounded by `O(characters × length ×
K)` regardless of how many distinct partial sums a naive memo would have
tried to cache.

## Results

Verified against an independent implementation: `BacktrackingStrategy`'s
decrypt results, filtered to the password's own length, found exactly the
same count as `collision_count.py` for `"face"` (6, including the
password's own multiset) - two separately-written pieces of code agreeing
is stronger evidence of correctness than either one alone.

| Password | Length | K | Same-length multisets sharing K | Other multisets |
|---|---|---|---|---|
| `"ab"` | 2 | 3 | 1 | 0 |
| `"cab"` | 3 | 8 | 1 | 0 |
| `"face"` | 4 | 32 | 6 | 5 |
| `"password12"` | 10 | 981954 | 166,166 | **166,165** |

Reproduce any row with:

```bash
python3 analysis/collision_count.py password12
```

Short, low-value passwords can have few or even zero same-length
collisions - `"ab"` and `"cab"` only use characters with small partition
values, and there's little room for a different combination to land on the
same small K. But V1 requires passwords of 10-32 characters, and at
realistic lengths the collision count explodes: `"password12"` (10
characters, using two digit characters with values above 450,000 each)
shares its K with **166,165 other 10-character multisets**. Given only Z,
there is no way to tell which of those 166,166 possibilities was the actual
password - the correct one carries no more evidence than any of the others.

This undercounts the true ambiguity. `password12`'s K is also reachable by
multisets of *other* lengths (V2's `PartitionEncryption` doesn't fix the
plaintext length either, searching 1-20 characters by default) -
`collision_count.py` restricts to same-length collisions only because that
subset alone is already large enough to make the point, and because
same-length is what a top-down recursion or the table above can compare
apples-to-apples.

## Why this is inherent, not a bug

This isn't something Step 3's backtracking and MITM fixes could address,
and no fix to those strategies could address it either. Summation is a
many-to-one function: there are astronomically more character multisets of
a given length than there are possible sums K can take, so pigeonhole
guarantees collisions, and the collision count only grows with password
length. Exact decryption - recovering *the* password rather than one of
tens or hundreds of thousands of equally-valid candidates - is not a
performance problem to optimize away. It would require the scheme to stop
being a sum in the first place.

## The constant C adds no secrecy

Z = K + C, and C (`426609638937`) is a fixed constant checked into this
public repository, same as the lookup table. Given Z, computing K = Z - C
is a public, instant, one-line operation - C is not a secret input, so it
contributes no cryptographic difficulty. Any security claim resting on "you
need to know C and the table" does not hold once both are public, which
they are here. See `docs/THREAT_MODEL.md` (Step 8) for how the *new*
partition-based scheme in `Version3/` avoids this by keying the transform
itself instead of adding a public offset.
