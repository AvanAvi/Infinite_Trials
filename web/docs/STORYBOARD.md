# Storyboard: Infinite Trials interactive showcase

Audience: someone who will never read the code - a recruiter, or an
engineer skimming a portfolio. They should leave understanding the idea,
the honest failure of V1, and how V3 actually works, without needing to
trust a single unverified claim - every number on the page traces back to
`docs/ANALYSIS.md`, `docs/THREAT_MODEL.md`, `docs/ROADMAP.md`, or live
computation in the browser.

This mostly follows the flow you sketched, with one structural change:
**section 4 now opens with a direct quote from the 2019 architecture
draft** (`ARCHITECTURE_DRAFT_1.pdf`), which claims *"There exists only one
possible combination of numbers through which we get the above result for
'Z'"* and calls reversing it *"next to impossible... the kernel is
arranged in a unique pattern."* That's the founder's own words, in the
founder's own repo, and it's the exact claim the collision analysis
disproves. Leading with it - your own past claim, then the real math -
is a stronger, more honest version of "I found my own scheme was broken"
than describing the flaw in the abstract. Section 8 also gets a specific
addition: a one-line pointer that the whole showcase's own source is
`web/`, so a technical visitor can go verify the verifying.

## Section-by-section

### 1. Hero

**Sees:** The project name, a one-line subtitle, and a Ferrers/Young
diagram of dots - a small number (8) rendered as rows of dots, one row
per part - that continuously regroups through different partitions of 8
(8; 7+1; 6+2; 5+3; 4+4; 5+2+1; 4+3+1; ...), looping idly.

**Interaction:** None required - it's ambient, running before any input.
Scrolling begins the narrative; a tap/click on the diagram advances it to
the next partition manually, previewing the interaction pattern used
throughout (so section 2's slider doesn't feel like the first thing
asking for input).

**Anime.js technique:** Each dot is a real DOM/SVG element with an (x, y)
position computed from the current partition's row/column layout. On
each partition change, `animate()` retargets every dot's `x`/`y` to its
new position with `stagger()` (small delay per dot, ordered by
row-then-column) and `ease: 'inOutQuad'` - a FLIP-style reposition, not a
cross-fade, so the *regrouping* itself is legible (a dot visibly moves
from row 3 to row 1, not disappears-and-reappears). This is the direct,
non-decorative descendant of the grid-stagger technique catalogued from
animejs.com's "Advanced staggering" card, applied to real partition data
instead of a placeholder shape.

**Single idea to leave with:** *This whole project starts from one
question: how many different ways can a number be broken into pieces?*

### 2. The spark

**Sees:** The real personal note from `Algorithm_Philosophy.txt`, kept
verbatim - watching *The Man Who Knew Infinity* during a cryptography
class, "why not?" - next to Ramanujan and Hardy's names and the
partition function p(n). A slider for n (range roughly 1-60, small enough
that the Ferrers diagram stays legible and p(n) stays a readable number
of digits). Dragging it updates, live: the Ferrers diagram from section 1
(now driven by the slider instead of looping on its own), a monospace
p(n) counter, and a growth curve with the real Hardy-Ramanujan asymptotic
`p(n) ~ (1/(4n√3))e^(π√(2n/3))` plotted alongside the true p(n) values, so
the visitor can see the approximation is close but not exact.

**Interaction:** Drag the slider (or arrow keys once focused, for
keyboard users) - every visual updates within a frame, no debounce delay
that would make the diagram feel laggy relative to the hand.

**Anime.js technique:** The Ferrers diagram reuses section 1's FLIP
reposition. The p(n) counter uses a digit-roll: each digit position
independently animates through intermediate values on its way to the new
one (`animate()` on a `textContent`-driving numeric property, or
per-digit transform if going for an odometer look) - legible motion that
still communicates "this number is changing fast," which section 4 needs
its audience primed for. The growth curve is an SVG path revealed via
`draw` (`createDrawable`), scrubbing forward/backward as the slider moves
- an input-driven analogue of animejs.com's `onScroll({ sync: true })`
scroll-synced line drawing, catalogued in step 1, retargeted to slider
input instead of scroll position.

**Single idea to leave with:** *This number grows unbelievably fast -
that felt like raw material for a cipher.*

### 3. V1 in action

**Sees:** A text input, clearly labeled **"DEMO DATA - please don't type
a real password"**, pre-filled with a safe example. As the visitor types
(or edits the default), each character animates out to its own partition
value (drawn from the real V2 lookup table, ported to TypeScript in Step
4 - not invented numbers), the values collapse into a running total K,
and a final step adds the public constant C to produce Z. Every number
shown is computed live from what's actually typed.

**Interaction:** Type or edit the demo string; the pipeline replays for
the current text on every change (debounced lightly so mid-keystroke
states don't spam animations).

**Anime.js technique:** A `createTimeline()` per keystroke-settled state:
`.add()` staggers each character flying from the input to its partition
value label, `.add()` again to collapse those values into the K total
(digit-roll, as in section 2), `.add()` a final step sliding C in from
the side and merging into Z. Named timeline positions
(`.add(..., '<')` / labeled offsets, per the "Runs like clockwork"
technique catalogued in step 1) keep the sequence readable rather than a
single blurred motion.

**Single idea to leave with:** *Encrypting here is just adding up big
numbers - nothing about addition can be undone without more information
than the sum alone gives you.*

### 4. The crack

**Sees:** First, the direct 2019 quote, styled distinctly (a "draft"
treatment - maybe a scanned-document texture or simply an explicit
"ARCHITECTURE DRAFT, 2019" label so it reads as a historical artifact,
not a current claim): *"There exists only one possible combination of
numbers through which we get the above result for 'Z'."* Then the same
Z from section 3 visibly "explodes" outward into a swarm of other
strings that all produce it - for short demo inputs, these are *real*,
computed live in-browser by the ported collision counter (Step 4's "small
multiset collision counter for short inputs"); for the documented
realistic case, the actual measured numbers from `docs/ANALYSIS.md` are
shown as text, not invented: `"password12"` (10 characters) shares its K
with **166,165** other, completely unrelated 10-character multisets.

**Interaction:** For short demo strings (typed or a couple of provided
examples like `"face"`, which `docs/ANALYSIS.md` documents as having 5
other collisions), the visitor can step through a few of the actual
colliding multisets the live counter finds. For `"password12"`, 166,165
is too many to enumerate or animate individually - shown as a large,
precise number with a *sampled* visual swarm (a representative subset
exploding outward), not a claim that all 166,165 are rendered.

**Anime.js technique:** An "explode" burst - each colliding string
scale/translates outward from Z's position with `stagger()` delay and
`random()`-jittered end positions and rotation, directly descended from
the "Enhanced transforms" random-transform technique catalogued in step
1. Here the randomness is honest: it represents genuine ambiguity (these
are really different, really valid candidates), not decoration. A
closing beat pulls the camera back or fades in a label showing they all
funnel back to the same Z, reinforcing the "many-to-one" idea visually.

**Single idea to leave with:** *My own 2019 draft claimed this was
unique. It wasn't - I measured it, and it's off by 166,165.*

### 5. V2 search

**Sees:** A small, live backtracking tree for a short demo input (built
from the real, fixed backtracking algorithm ported to TypeScript, not a
staged illustration). A toggle switches between "buggy" and "fixed"
behavior, replaying the same input through each: in "buggy" mode,
branches that the original descending-sort-plus-`break` logic
incorrectly discarded visibly get cut off and fade, even where they led
to valid answers; in "fixed" mode, the same branches survive and the
tree finds the complete, correct result set.

**Interaction:** Toggle buggy/fixed; optionally step through tree
construction node-by-node rather than watching it resolve all at once.

**Anime.js technique:** Tree nodes reveal via staggered scale+opacity as
the search visits them (a tree-shaped variant of the grid-stagger
technique). Branches killed by the bug shrink and fade out via a
timeline `.add()` keyed to the moment the original `break` would have
fired - not just visually similar to pruning, but triggered by the real
bug condition evaluated on real data.

**Single idea to leave with:** *The old code didn't just run slow - it
silently threw away correct answers. The fix is a real logic
correction, not a performance tweak.*

### 6. V3 pipeline (centerpiece)

**Sees:** A step-by-step explorable pipeline, staying on screen with
persistent controls rather than scrolling away: text -> base-62 integer
(with length shown as its own labeled value, per `encoding.py`'s
explicit-length design) -> Feistel rounds, rendered as two blocks (sized
to the *actual* half-bit-width for the current domain, not a fixed
illustration) that visibly swap and XOR-mix each round, all 10+ real
rounds steppable individually -> cycle-walking, shown honestly as
"walked N times" using the real count for whatever key/input combination
is active, most of the time 1 -> unrank into the ciphertext partition,
rendered as a Ferrers diagram (a direct visual callback to sections 1-2,
now representing ciphertext instead of a teaching example). A play/pause
control runs the whole thing at an adjustable speed; step forward/back
moves one stage at a time. Decrypt runs the identical pipeline
backward from the ciphertext. A wrong-key toggle re-runs decryption with
a different key and shows the real result: sometimes a different,
wrong-looking password, sometimes an explicit "this doesn't decode to a
valid password of this length" error - both are real, documented
behaviors from `cipher.py`'s decrypt(), not staged for effect.

**Interaction:** Step forward/back, play/pause, speed slider, password
input (demo-labeled, same warning as section 3), a "generate key" button
plus a wrong-key toggle.

**Anime.js technique:** One `createTimeline()` for the whole pipeline
with a named/labeled position per stage, so step controls are literally
`timeline.seek(label)` calls rather than re-triggering separate
animations - this is what makes scrubbing and reverse-for-decrypt
possible without re-deriving state. Feistel rounds use the swap+mix
pattern from section 4's "Enhanced transforms"-style transform blending,
now literally showing two halves exchanging via `x`/rotation swaps keyed
to the real per-round HMAC output (color/pattern shifts driven by actual
output bytes, not a random decorative value). The final unrank stage
reuses the Ferrers diagram FLIP animation from sections 1-2 verbatim -
the deliberate visual rhyme that ties the whole page together, the same
lesson step 1 drew from animejs.com reusing one shared "device" visual
across its 8 feature cards.

**Single idea to leave with:** *Reversing this needs the key. Walking
through every step live, with nothing hidden, is what proves there's no
shortcut around that.*

### 7. Where security actually comes from

**Sees:** A plain statement, pulled directly from `docs/THREAT_MODEL.md`:
security rests on the 256-bit key and HMAC-SHA256, not the partition
math. A real-duration bar or timer shows Argon2id's actual measured cost
(~0.7s, the number `kdf.py` was tuned to) - ideally run live in-browser
via the WASM port (see the trade-off note in Step 4) so the visitor
watches a real derivation take a real fraction of a second, not an
animated approximation of one. A checklist of the documented known
limitations (deterministic encryption/no nonce yet, custom and unaudited
Feistel construction, ciphertext length leak) reveals one at a time.
Below that, the roadmap phases from `docs/ROADMAP.md` - including the
post-quantum note: a 256-bit key keeps roughly 128-bit security against
Grover's algorithm, so nothing changes there unless a public-key
component (e.g. key exchange) is ever added, which would need ML-KEM
rather than a classical KEM.

**Interaction:** A button to actually run the Argon2id derivation
in-browser and watch it take real time (rather than only reading a
static number) - the strongest way to make "the slowness is the point"
land experientially instead of as a claim.

**Anime.js technique:** Staggered fade/slide-in per checklist item as it
scrolls into view (the same restrained reveal pattern animejs.com uses
for its own feature-card bullet lists). The Argon2id timer is a
straightforward duration-driven progress fill - deliberately *not*
sped up or slowed down for dramatic effect, since the real duration is
the entire point being made.

**Single idea to leave with:** *This is honest about what it does and
doesn't cover - the security claim is narrow and specific, not "trust
the math."*

### 8. Footer

**Sees:** Links to the GitHub repo and each doc (`docs/ANALYSIS.md`,
`docs/THREAT_MODEL.md`, `docs/ROADMAP.md`), a note that this showcase's
own source lives in `web/` of the same repo (so a technical visitor can
verify the verifying), and a placeholder slot for a portfolio link, left
empty pending your decision in Step 8.

**Interaction:** Standard links; no animation gating access to them.

**Anime.js technique:** Minimal, deliberately - a simple fade-in on
scroll-into-view, matching the finding from step 1 that animejs.com
spends zero animation budget on its own static footer. A page that's
just spent seven sections proving things with real computation shouldn't
end on a flourish; it should end on links the visitor can click to keep
checking.

**Motion budget note (from step 1's pacing finding):** the two sections
carrying the heaviest single claim - section 4 (the crack) and section 6
(the V3 pipeline) - get the most generous interaction budget and screen
time, mirroring how animejs.com spent its longest pins on its two "big
idea" sections rather than spreading motion evenly. Sections 3, 5, and 7
stay terser and get to the point faster, the way animejs.com's 8 feature
cards do.

## Design tokens

Two themes, both built to the brief (deep ink/navy base, warm accent for
the broken V1 path, cool accent for the keyed V3 path, restrained
neutral scale), each with light and dark variants. All contrast ratios
below are computed via the real WCAG relative-luminance formula, not
estimated.

### Theme A: "Ink & Ember"

Warmer, more editorial - a near-black ink base with an ember-orange V1
accent and a teal-cyan V3 accent.

**Dark (primary):**

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0B0E14` | Page background |
| `--surface` | `#131722` | Cards, panels |
| `--text` | `#EDEFF4` | Primary text (16.79:1 on `--bg`, AAA) |
| `--text-muted` | `#9AA3B2` | Secondary text (7.59:1 on `--bg`, AAA) |
| `--accent-warm` (V1) | `#FF6B4A` | Broken-path accent (6.86:1 on `--bg`, AA; 6.35:1 on `--surface`, AA) |
| `--accent-cool` (V3) | `#4FD1C5` | Keyed-path accent (10.36:1 on `--bg`, AAA; 9.60:1 on `--surface`, AAA) |

**Light:**

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#F7F8FA` | Page background |
| `--surface` | `#FFFFFF` | Cards, panels |
| `--text` | `#12151C` | Primary text (17.19:1 on `--bg`, AAA) |
| `--text-muted` | `#545B6B` | Secondary text (6.40:1 on `--bg`, AA) |
| `--accent-warm` (V1) | `#C24422` | Broken-path accent (4.77:1 on `--bg`, AA) |
| `--accent-cool` (V3) | `#0B756D` | Keyed-path accent (5.23:1 on `--bg`, AA) |

### Theme B: "Slate & Signal"

Cooler, more dashboard/engineering-coded - a deep slate-navy base, a
punchier signal-orange V1 accent, a crisp signal-blue V3 accent. Every
dark-mode pair clears AAA, the strongest option of the two if headline
accessibility numbers matter to how this reads to a technical visitor.

**Dark (primary):**

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0D1321` | Page background |
| `--surface` | `#161D2E` | Cards, panels |
| `--text` | `#EEF1F6` | Primary text (16.38:1 on `--bg`, AAA) |
| `--text-muted` | `#9BA5BD` | Secondary text (7.52:1 on `--bg`, AAA) |
| `--accent-warm` (V1) | `#FF8552` | Broken-path accent (7.71:1 on `--bg`, AAA) |
| `--accent-cool` (V3) | `#5FA8FF` | Keyed-path accent (7.54:1 on `--bg`, AAA) |

**Light:**

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#F5F7FB` | Page background |
| `--surface` | `#FFFFFF` | Cards, panels |
| `--text` | `#0E1320` | Primary text (17.29:1 on `--bg`, AAA) |
| `--text-muted` | `#4E5872` | Secondary text (6.61:1 on `--bg`, AA) |
| `--accent-warm` (V1) | `#B8461D` | Broken-path accent (4.98:1 on `--bg`, AA) |
| `--accent-cool` (V3) | `#1D5FC7` | Keyed-path accent (5.57:1 on `--bg`, AA) |

Both themes reserve the warm accent *exclusively* for V1/broken-path
content (sections 3-4) and the cool accent *exclusively* for V3/keyed
content (section 6), so the color itself becomes a wayfinding signal -
the same lesson step 1 drew from animejs.com's per-module color
consistency, applied to this project's own two-path narrative instead of
a module list.

**Recommendation:** Theme B, if forced to pick one - the all-AAA dark
mode is a genuinely stronger accessibility story to be able to state
plainly, and "dashboard/signal" reads well for a project whose centerpiece
(section 6) is literally a live instrument panel for a cipher pipeline.
But this is a stylistic call and either is implementation-ready as
specified.

## Typography

**Headings:** Space Grotesk - geometric, technical, distinctive
character (the alternate "S" and "G" read well at large display sizes),
open license (Google Fonts, OFL), and visually distinct from
animejs.com's DIN/Helvetica Neue system so the page doesn't read as a
reskin.

**Body:** Inter - highly legible at small sizes, huge range of weights,
the de facto workhorse for technical content; pairs cleanly with Space
Grotesk without competing for attention.

**Numbers and code:** IBM Plex Mono - real tabular figures (so digit-roll
counters in sections 2, 3, and 4 don't jitter in width as digits change),
distinct enough from Inter to clearly mark "this is a computed value or
code," and covers the Feistel round hex output and ciphertext strings in
section 6 without looking like an afterthought monospace fallback.

All three ship as self-hosted `woff2` files (downloaded once, bundled
under `web/public/fonts/`) rather than linked from Google's CDN at
runtime - avoids a render-blocking third-party request and keeps the
Lighthouse performance target achievable without fighting a
font-loading waterfall.

## Tech stack

**Agreeing with your preference:** Vite + TypeScript + Anime.js, with
heavy maths in a Web Worker. Vite's dev server and static build output
fit "fully static, no backend" directly; TypeScript's type-checking is
worth having across the BigInt-heavy port in Step 4, where a silent
`number`/`BigInt` mixing bug would be easy to introduce and hard to spot
visually. Anime.js v4's named exports (confirmed in step 1) tree-shake
cleanly under Vite, so importing only `animate`, `createTimeline`, and
`stagger` (not the whole library) keeps the bundle lean.

**What I'd add, and why:**

- **No UI framework (React/Vue/Svelte).** This isn't a typical app with
  routing or complex shared state - it's eight sections, each owning its
  own local interaction state (a slider value, a typed string, a
  play/pause flag). Vanilla TypeScript modules per section keep the
  bundle smaller than shipping a framework runtime for content that
  doesn't need one, which matters directly for the Lighthouse performance
  target and Step 7's "lazy-load sections below the fold."
- **No CSS framework (Tailwind etc.) on top of the required CSS custom
  properties.** The brief already mandates design tokens as CSS custom
  properties; a utility-class framework adds build complexity and a
  purge/safelist step for a page whose visual language is bespoke and
  animation-driven, not a grid of standard components. Hand-written CSS
  scoped per section, reading the custom properties, is simpler here and
  keeps generated CSS smaller.
- **Comlink for the Web Worker boundary.** Hand-rolled `postMessage`
  protocols for the q(n,m) table build (N ~ 850, ~4.7s in the Python
  reference) are easy to get subtly wrong (mismatched message shapes,
  forgotten error propagation). Comlink (MIT, ~1.6kb) turns the worker
  into something that's called like a normal async function, which
  matters more than usual here since Step 4 also needs the *result*
  cached and reused across sections 2, 4, and 6 without re-deriving it.
- **The Argon2id WASM derivation (section 7) should also run in that
  worker, not just the partition tables.** ~0.7s of blocking WASM
  computation on the main thread would freeze whatever animation is
  running elsewhere on the page at the same moment; moving it off-thread
  is a small addition to the same worker boundary, not a separate piece
  of infrastructure.
- **Vitest**, not a separately-chosen test runner - it's already the
  natural fit for a Vite project and is what Step 4's cross-validation
  against the Python test vectors needs to run in.
- **Code-split per section via dynamic `import()`**, decided now rather
  than retrofitted in Step 7. Baking the section boundary into the
  module structure from the Step 3 scaffold (one entry module per
  section, lazy-imported as it scrolls near viewport) means "lazy-load
  sections below the fold" is a property of the architecture, not a
  last-minute optimization pass that has to rewire how sections talk to
  each other.
- **Reuse Playwright for the Step 7 cross-browser pass.** It's already
  in place from step 1's research (working around this machine's macOS
  12 via `channel: 'chrome'` for the Chromium leg); Firefox and WebKit
  channels don't have that same OS-support problem, so the same script
  shape extends directly to the three-browser QA pass without
  introducing a second tool.

**Argon2id in the browser - the trade-off to decide:** `hash-wasm`'s
Argon2id is a maintained WASM port and can genuinely match `kdf.py`'s
parameters (time_cost=3, memory_cost=256MiB, parallelism=2), but WASM
Argon2id typically runs somewhat slower than native for the same
parameters - the in-browser derivation could land noticeably above the
~0.7s Python figure rather than matching it, which would be true and
worth stating on the page ("your browser took Xs; the reference CLI
took ~0.7s") rather than smoothed over. The alternative is skipping
passphrases in the demo entirely and only offering generated keys,
which sidesteps the mismatch but drops the KDF-cost story - arguably
section 7's second-strongest point ("the slowness is the point, watch it
happen") - down to a static claim instead of something the visitor
experiences. **My recommendation: keep the passphrase demo, run it in
the worker, and show the actual measured in-browser time next to the
documented Python figure rather than picking one number to display** -
it's more honest, and "the same idea, measured twice, with two different
real numbers" is a stronger demonstration than a single suspiciously
round figure would be.
