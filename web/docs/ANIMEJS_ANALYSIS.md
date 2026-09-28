# animejs.com analysis

Captured via Playwright (system Chrome, since Playwright's own bundled
Chromium doesn't support this machine's macOS 12) at a 1440x900 viewport:
74 screenshots at fixed scroll positions plus five 8-frame sequences
through the more complex transitions, saved to `web/docs/reference/`
(gitignored, not committed - see the ground rules in the task). Anime.js
version confirmed as **4.5.0** (latest on npm as of this analysis), via
both the docs page and `registry.npmjs.org/animejs/latest`. All code
snippets quoted below are copied directly from the demo panels visible
on the live site, so they're the real v4 named-export API
(`animate`, `createTimeline`, `createScope`, `stagger`, `createDrawable`,
`createMotionPath`, `onScroll`), not v3's `anime({...})` default export.

## 1. Page structure and scroll pacing

Total scrollable height: **21,142px** at 1440x900. The page is built almost
entirely from **scroll-jacked pinned sections**: a `section-container` (or
plain `section`) holds a `fixed-section` child that gets `position:
sticky`/`fixed`-style pinning while a series of sibling `.section-spacer`
divs (each exactly 900px tall) provide the scroll distance the pin lasts
for. Content inside the pinned section animates in response to scroll
progress through that spacer run, not in response to time.

Section-by-section, in scroll order:

| Range (px) | Section | Pin length | Pattern |
|---|---|---|---|
| 0-2700 | Hero ("All-in-one animation engine") | 2700px (3 spacers) | Pinned; circular HUD gauge with a waveform morphs into an exploded 3D lens illustration as you scroll, background crossfades dark-to-slightly-lighter |
| 2700-6300 | "The complete animator's toolbox" | 3600px (4 spacers) | Pinned; background flips to a light cream (`section-light`); the exploded lens illustration continues, module name labels (`waapi`, `timeline`, `stagger`, `svg`, `spring`, `animation`, `timer`, `easings`, `draggable`, `scroll`, `scope`) draw in via leader lines as the camera/parts settle |
| 6300-13500 | 8 feature cards, 900px each | 900px per card, no extra spacer | Each: heading + copy on the left, a shared circular HUD "device" visual on the right with a live, real code snippet in a terminal-style panel, and a bottom-right horizontal tick-mark scrubber showing progress through *that specific card's* 900px |
| 13500-18000 | "A lightweight and modular API" | 3600px (4 spacers) | Pinned; a segmented "Bundle size: 27.13 KB" bar chart builds up, one colored segment per module, each tied to a legend dot in the same hue used for that module throughout the whole site |
| 18000-18900 | "Our sponsors" | none | Static, no scroll-jacking |
| 18900-21142 | "Start animating" (footer CTA) | none | Static; docs link grid (3 columns x 4 rows), then standard footer (sponsors ad, site links, socials, email signup, copyright) |

Pacing observation: the two "big idea" sections (hero, toolbox) get by far
the most scroll distance (2700px and 3600px) for what is visually a single
continuous illustration morph - slow, deliberate, cinematic. The 8 feature
cards are much terser at a flat 900px each - enough for one clear
before/after state change, then it's on to the next. The lightweight/API
section gets another long 3600px pin for the bundle-size build-up. Static
sections (sponsors, footer) get zero animation budget at all. The rhythm
reads as: **slow open, brisk middle, unanimated close** - motion budget
is spent on the two ideas the page most wants remembered (what it is,
proof it's small), not spread evenly.

## 2. Animation technique catalogue -> Anime.js v4 API

Every one of these is taken from a code panel actually shown on the page,
next to its live visual:

| Technique | Code shown | What it looks like |
|---|---|---|
| Simple looped property animation | `animate('.square', { rotate: 90, loop: true, ease: 'inOutExpo' })` | A single rounded square rotates in place, "Intuitive API" card |
| Randomized per-instance transform | `animate('.shape', { x: random(-100,100), y: random(-100,100), rotate: random(-180,180), duration: random(500,1000), composition: 'blend' })` | A diamond jitters to random positions/rotations each cycle, "Enhanced transforms" card; `composition: 'blend'` layers new tweens on top of in-flight ones instead of overriding them |
| Grid stagger with radial origin | `createTimeline().add('.dot', { scale: stagger([1.1, .75], options) }, stagger(200, options))` with `options = { grid: [13, 13], from: 'center' }` | A 13x13 dot grid scales outward from the center in a rippling wave, "Advanced staggering" card - `stagger()` used *twice*: once to vary the scale target per dot, once to vary each dot's start delay |
| SVG line drawing synced to scroll | `animate(createDrawable('path'), { draw: ['0 1', '0 1', '1 1'], delay: stagger(40), ease: 'inOut(3)', autoplay: onScroll({ sync: true }) })` | A winding circuit-board-style path draws itself stroke-first as you scroll past the section - `onScroll({ sync: true })` ties animation progress directly to scroll position rather than to time |
| SVG shape morphing | `animate('.circuit-a', { d: morphTo('.circuit-b') })` | A grid of dots morphs into a winding line path, same "SVG toolset" card |
| Motion path follow | `animate('.car', { ...createMotionPath('.circuit') })` | (documented alongside the above, not directly captured animating) an element follows an arbitrary SVG path's geometry |
| Draggable with spring physics | Label copy only: "Drag, snap, flick and throw HTML elements with the fully-featured Draggable API" | A large circle in a dashed containment ring, "Springs and draggable" card - attempted a synthetic drag via Playwright's mouse API and it did not visibly displace the element, most likely because the real Draggable implementation listens for pointer events in a way synthetic `mouse.move` steps didn't trigger; this is a gap in this analysis, not a claim the feature doesn't work |
| Timeline sequencing with relative offsets | `createTimeline().add('.tick', { y: '-=6', duration: 50 }, stagger(10)).add('.ticker', { rotate: 360, duration: 1920 }, '<')` | A clock hand sweeps while tick marks pulse, "Runs like clockwork" card - the `'<'` position parameter starts the second `.add()` at the same time the *previous* one started, not after it finished |
| Responsive re-triggering via media query scope | `createScope({ mediaQueries: { portrait: '(orientation: portrait)' } }).add(({ matches }) => { const isPortrait = matches.portrait; createTimeline().add('.circle', { y: isPortrait ? 0 : [-50,50,-50], x: isPortrait ? [-50,50,-50] : 0 }, stagger(100)) })` | Circles orbit horizontally or vertically depending on viewport orientation, "Responsive animations" card - `createScope` re-runs the callback automatically when the media query match state changes |
| Exploded/assembled 3D illustration | Not shown as code (likely a bespoke WebGL/CSS 3D build, not a stock Anime.js demo) | The camera-lens-like illustration's parts separate along their axis and reassemble as you scroll through the hero and toolbox sections - the most complex single visual on the page |
| Segmented bar build-up | Not shown as code | Bundle-size bar fills segment by segment, "lightweight and modular API" section |

## 3. What makes it feel polished

- **One idea per pinned section.** Even the long 2700-3600px pins are
  ultimately telling a single visual story (this illustration explodes;
  this bar fills up) rather than cramming multiple beats into one pin.
  The 8 feature cards go further: exactly one code snippet, one visual
  change, one three-line bullet list, nothing competing for attention.
- **A shared visual "device" across all 8 feature cards.** The circular
  HUD gauge (arc segments, tick marks, dot grid) is the *same component*
  in every card - only its center content and accent color change. That
  repetition is what makes the page feel like one coherent system rather
  than eight unrelated demos stitched together.
- **Color as identity, not decoration.** Each module (Timer, Animation,
  Timeline, Animatable, Draggable, Scroll, Scope, SVG, Spring, WAAPI,
  Stagger) has one consistent accent hue used everywhere it appears: the
  feature card heading, the HUD gauge ring, the bundle-size chart
  segment, and the footer link's bullet dot. A visitor learns the color
  vocabulary once and it pays off three more times later on the page.
- **Real, runnable code next to every visual**, not paraphrased copy.
  Seeing `stagger([1.1, .75], { grid: [13, 13], from: 'center' })` next
  to the dot grid it produces teaches the API *and* proves the demo is
  the real library, not a canned animation.
- **Restraint in duration and easing.** Nothing observed ran long -
  individual tweens read as a few hundred milliseconds to roughly two
  seconds (`duration: 1920` on the clock hand is the longest single value
  spotted in any snippet). Eases favor `inOutExpo`/`inOutQuad`-style
  curves: quick starts, a soft landing, no bounce-heavy or exaggerated
  overshoot on any of the captured content.
- **Consistent monospace, small-caps-style labels** (`GETTING STARTED`,
  `SYNCHRONISE ANIMATIONS`) for anything technical or navigational,
  contrasted against a larger, friendlier sans headline face - a
  deliberate two-register typographic system (display vs. technical),
  even though both ultimately fall back to the same DIN/Helvetica Neue
  stack.

## 4. What would work badly for a technical explainer

- **Scroll-jacked pinning this long is a real readability risk.** A
  visitor who wants to *read*, not watch, has to scroll through 900-3600px
  of animation before the next piece of text appears, with no way to skip
  ahead except scrolling faster (which typically just skips animation
  frames, not content). For animejs.com this is fine - the visual *is*
  the point. For an explainer about a cryptographic scheme, where the
  reader needs to absorb an actual claim (e.g. "this sum collides"), the
  pin must never delay that claim's text from appearing, and skipping
  ahead (or `prefers-reduced-motion`) must jump straight to the readable
  end state - not just fast-forward through motion.
- **The 8 feature cards deliberately show one visual idea each** and
  accept that the visual doesn't fully explain the underlying mechanism
  on its own - the prose and code panel carry that weight. A technical
  explainer for this project can't be as elliptical: "the sum is
  order-blind" needs the animation to *demonstrate* the order-blindness
  (e.g. characters flying into the same total regardless of typed order),
  not just gesture at a related shape.
- **No section here needs to prove a specific number is real.** Every
  number on animejs.com (bundle size, module count) is small and
  self-evidently true from the code shown. This project's page has to
  show genuinely large, verified numbers (166,165 collisions; a specific
  Feistel round count) accurately - motion that summarizes or rounds a
  number for visual neatness would misrepresent `docs/ANALYSIS.md`'s
  actual findings.
- **The unsuccessful synthetic drag test is a reminder that
  interaction-driven sections (typing a password, stepping through
  Feistel rounds, dragging a slider) need real event-driven testing**,
  not just visual QA - a demo that looks right in a screenshot but
  doesn't actually respond to input is worse than no demo at all for an
  explainer whose entire credibility rests on "this is really running the
  code."
- **Nothing on animejs.com is testing `prefers-reduced-motion`
  behavior in an observable way** (no captured screenshot differs based
  on that media query), so it offers no pattern to copy for how content
  should look with motion off - that has to be designed from scratch
  for this project, per the ground rules (same content, instant state
  changes).
