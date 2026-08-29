# Design QA: `/skreddersy-varmen` large reveal and follow-up choreography

## Comparison target

- Source visual truth:
  `/Users/kristofferohnstadhjelmeland/klarna-solution.MOV`
- Source captures: `/tmp/klarna_frames.7WCpVA/quarter_02.25.jpg`,
  `/tmp/klarna_frames.7WCpVA/quarter_03.25.jpg`, and
  `/tmp/klarna_frames.7WCpVA/quarter_04.50.jpg`
- Implementation: `http://localhost:3100/skreddersy-varmen`
- Implementation captures: `/tmp/utekos-klarna-qa-start.png`,
  `/tmp/utekos-klarna-qa-mid.png`, and
  `/tmp/utekos-klarna-qa-end.png`
- Combined full-view evidence: `/tmp/klarna-vs-utekos-states.png`
- State: start, intermediate, and complete diagonal image reveal
  before mode 01

### Follow-up target: 2026-08-29 desktop corrections

- Source visual truth:
  `/var/folders/h1/mmr263ts7lg7l0vnyl9m97z00000gn/T/TemporaryItems/NSIRD_screencaptureui_3U6g3I/Screenshot 2026-08-29 at 07.43.53.png`
  plus the user's three explicit interaction corrections.
- Implementation captures:
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-20260829/curtain-closed-1920x1243@2x.png`,
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-20260829/curtain-half-1920x1243@2x.png`,
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-20260829/curtain-open-1920x1243@2x.png`,
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-20260829/friheten-entering-final-1920x1243@2x.png`,
  and
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-20260829/friheten-settled-final-accessible-1920x1243@2x.png`.
- Combined full-view evidence:
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-20260829/friheten-source-vs-implementation-final-accessible.png`
  (source on the left, final implementation on the right).
- State: closed, half-open, and open hero curtain; half-entered
  and completely settled `Friheten til å velge` surface.

### Follow-up target: 2026-08-29 controlled scroll pacing

- Source visual truth:
  `/Users/kristofferohnstadhjelmeland/klarna-solution.MOV`, using
  `/tmp/klarna_frames.7WCpVA/quarter_02.25.jpg`,
  `/tmp/klarna_frames.7WCpVA/quarter_03.25.jpg`, and
  `/tmp/klarna_frames.7WCpVA/quarter_04.50.jpg` as progressive
  reveal states.
- Implementation captures:
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-scroll-tuning/image-reveal-early-1440x900.png`,
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-scroll-tuning/image-reveal-one-viewport-1440x900.png`,
  and
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-scroll-tuning/image-reveal-complete-1440x900.png`.
- Full-width introduction captures:
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-scroll-tuning/friheten-early-1440x900.png`,
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-scroll-tuning/friheten-one-viewport-1440x900.png`,
  and
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-scroll-tuning/friheten-complete-1440x900.png`.
- Combined full-view evidence:
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-scroll-tuning/klarna-vs-utekos-controlled-scroll.png`
  (Klarna on the left, Utekos on the right; early, one-viewport,
  and complete states from top to bottom).
- State: motion begins after `0.2` viewport of scroll, remains
  incomplete after one full viewport, and settles only at the
  calculated animation endpoint.

### Follow-up target: 2026-08-29 mobile pacing and hero header

- Source visual truth: the user's direct 390 x 844 mobile review,
  the pre-change implementation captures in
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/mobile-scroll-audit-before/`,
  and Klarna's progressive scroll principle from
  `/Users/kristofferohnstadhjelmeland/klarna-solution.MOV`.
- Implementation captures:
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/mobile-scroll-audit-after/01-hero-transparent-header.png`,
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/mobile-scroll-audit-after/03-recognition-one-viewport.png`,
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/mobile-scroll-audit-after/06-answer-one-viewport.png`,
  and
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/mobile-scroll-audit-after/09-mode-vertical-one-viewport.png`.
- Combined full-view evidence:
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/mobile-scroll-audit-after/comparison-header.png`,
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/mobile-scroll-audit-after/comparison-answer.png`,
  and
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/mobile-scroll-audit-after/comparison-mode.png`
  (before on the left, after on the right).
- State: transparent icon/cart/menu header in the Hero; header
  completely clear of the story; early, one-viewport, and
  complete states for mobile text, answer, vertical mode, and
  horizontal mode arrivals.

### Follow-up target: 2026-08-29 desktop purchase sticky onset

- Source visual truth:
  `/var/folders/h1/mmr263ts7lg7l0vnyl9m97z00000gn/T/TemporaryItems/NSIRD_screencaptureui_zsPHv2/Screenshot 2026-08-29 at 08.36.47.png`.
- Implementation captures:
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/purchase-sticky-qa/implementation-entry-1920x1243.png`
  and
  `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/purchase-sticky-qa/implementation-held-after-scroll-1920x1243.png`.
- Target viewport: 1920 x 1243 CSS pixels.
- State: the left product gallery locks at 90 px from the
  viewport top as both columns reach that line; subsequent page
  scroll moves the right purchase details while the gallery
  remains at the same top coordinate.

## Normalization

- Source captures: 960 x 557 pixels.
- Implementation captures: 1920 x 1114 pixels at a 1920 x 1114
  CSS viewport and device pixel ratio 1.
- Density normalization: implementation captures were displayed
  at 50% in the combined comparison, producing the same 960 x 557
  comparison panel as the source.
- The combined sheet places the source and implementation beside
  one another for each of the three matching reveal states.
- Browser chrome and brand-specific header content differ
  intentionally; the compared product-design target is the reveal
  window geometry, scroll-linked progression, corner handoff, and
  surrounding layout rhythm.
- Follow-up source and implementation captures are both 3840 x
  2486 pixels for a 1920 x 1243 CSS viewport at device pixel
  ratio 2. The combined follow-up sheet downsamples each side to
  1920 x 1243 pixels without changing crop or aspect ratio.
- Controlled-pacing source frames are 960 x 557 pixels.
  Implementation captures are 1440 x 900 pixels at a 1440 x 900
  CSS viewport and device pixel ratio 1. For the combined pacing
  sheet, implementation captures use a centered crop and are
  resized to 960 x 557 so both columns have identical pixel
  dimensions; the comparison judges scroll-linked growth and
  handoff rather than brand-specific crop or copy.
- Mobile before/after captures use the same 390 x 844 CSS
  viewport at device pixel ratio 1. Each combined sheet preserves
  both crops at equal size, so the comparison exposes only the
  changed header occupancy and scroll-linked progression.

## Findings

No unaddressed implementation findings remain. The explicit
`primary` eyebrow color choice is documented below.

- Typography: Utekos keeps its established display and interface
  typefaces instead of copying Klarna's brand type. Scale,
  weight, wrapping, and text hierarchy remain balanced beside the
  4:5 frame at the normalized viewport.
- Spacing and layout: the large media chain is 89vw, matching the
  reference's approximately 5.5vw outer margin. Each frame is
  4:5, keeps a fixed final size, and hands off to the next frame
  with a measured 0 px horizontal and vertical corner delta.
- Colors and tokens: the implementation intentionally uses the
  existing `evening`, `jungle`, `cloud-dancer`, and `primary`
  tokens. Covered frame quadrants now use the surrounding
  `evening` surface so the unrevealed region disappears cleanly,
  as in the reference.
- Image quality and asset fidelity: all visuals are real project
  assets. No placeholder, CSS drawing, inline SVG substitute,
  zoom animation, blur, or opacity reveal is used. The
  full-length and parkas crops retain the whole garment
  vertically.
- Copy and content: the existing Utekos narrative copy and order
  are preserved. The visual reference informs motion and geometry
  only.
- Responsiveness: 767/768 breakpoint isolation, 834 x 1112, 1024
  x 768, 1440 x 900, short-height fallback, reduced motion,
  Chromium, and WebKit were checked.
- Accessibility and behavior: one `main`, one H1, a transparent
  Hero header that exits before the story imagery, no horizontal
  overflow, semantic image alt text, one empathy impression
  sentinel, and static reduced-motion/short-height fallbacks
  remain intact.
- Follow-up composition: the first post-hero headline remains
  stationary behind the moving hero; the next right-hand scene
  begins as the curtain finishes. The large narrative, answer,
  resolution, introduction, and mode animations now begin near
  the start of expanded tracks, combining immediate feedback with
  a longer controlled takeover.
- `Friheten til å velge`: the settled introduction is a
  full-width `jungle` surface with a 1280 px content measure at
  the 1920 px viewport. The 50/50 `jungle`/`evening` split starts
  only in the following mode stage.
- Explicit color override: `Adaptiv funksjonalitet` now uses the
  established `primary` token on mobile, iPad, and desktop. This
  replaces the earlier large-screen `primary-hover` accessibility
  adjustment at the user's direction; the exact token match is
  covered by the route regression test.
- Controlled pacing: each large incoming surface starts within
  `0.2` viewport of its active interval but spans approximately
  `1.2–1.4` viewport heights before settling. All large takeover
  movement is linear against scroll, preventing a mid-range
  acceleration burst. The image frame is visibly present in the
  early capture, remains partially covered after one viewport,
  and hands off diagonally only after the first frame is fully
  revealed. This matches the reference's progressive growth
  without reintroducing an initial dead-scroll zone.
- Mobile pacing and header: the recognition, bonfire copy,
  bonfire media, answer panel, closing copy, and both mode
  arrivals now use longer linear intervals. Each starts within
  the first `0.2` viewport of its active range and remains
  incomplete after one full viewport. The Hero keeps the Utekos
  icon, cart, and menu directly over the image without a colored
  surface; the complete header then exits with the Hero and no
  longer obscures story or mode imagery.

## Focused region evidence

The reveal frame itself fills most of each normalized comparison
panel, so a separate crop was not needed. Focused programmatic
checks verified the 4:5 ratio, unchanged frame dimensions across
scroll states, transform-only cover layers, no frame `clip-path`,
full opacity, exact corner contact, and continued visibility of
the preceding frame during the next reveal.

For the follow-up, a separate crop was not needed because the
defect was the full-screen region proportion itself. The combined
full-view sheet clearly exposes the old empty 50% column and the
final full-width surface. Focused runtime checks measured a 1920
px settled surface at `left: 0`, a 1280 px content measure, no
background gradient on the introduction, and the exact 50% split
on the following stage.

## Comparison history

### Iteration 1

- Earlier finding: [P1] The unrevealed right and lower quadrants
  used `jungle`, leaving a large colored L-shaped block that was
  absent from the Klarna reference.
- Fix: changed both large media rows and both transform cover
  layers to the surrounding `evening` surface while retaining the
  framed image treatment.
- Post-fix evidence: `/tmp/klarna-vs-utekos-states.png` shows the
  covered area disappearing into the section background at start
  and intermediate states, while the frame and image reveal
  together.

### Iteration 2

- No P0, P1, or P2 visual differences remained in the
  motion/geometry target.
- The normalized start, intermediate, and complete states align
  in outer margin, fixed 4:5 size, rectangular growth direction,
  and contact handoff.

### Iteration 3

- Earlier findings: [P1] The first large empathy headline arrived
  in normal flow instead of being revealed beneath the hero; [P1]
  several large scroll tracks held static for too long before the
  next right-hand surface moved; [P1] `Friheten til å velge`
  inherited the mode-stage 50/50 split and left half the viewport
  empty.
- Fixes: restored the large hero lift with the large empathy
  headline pinned beneath it; compressed the large narrative,
  answer, resolution, introduction, and mode tracks; moved the
  introduction onto its own solid full-width `jungle` surface
  with a diagonal right-side entry; retained the 50/50 split only
  for modes 01–03.
- Post-fix evidence: the three curtain captures show the headline
  staying fixed while the hero uncovers it;
  `friheten-entering-final-1920x1243@2x.png` shows the diagonal
  entry; `friheten-source-vs-implementation-final-accessible.png`
  shows the old half-width result beside the final full-width
  result.

### Iteration 4

- Earlier finding: [P2] At a fractional 1920 x 1243 scroll
  endpoint, the introduction could retain a subpixel horizontal
  translation and leave a hairline seam.
- Fix: completed the scroll-linked introduction animation at 98%
  of the contain interval, leaving the final 2% as a fully
  settled hold.
- Post-fix evidence: the final runtime measurement is exactly
  `left: 0`, `top: 0`, `width: 1920`, with a zero transform and a
  closed rectangular clip path.

### Iteration 5

- Earlier finding: [P1] The 12 px `primary` eyebrow measured
  2.99:1 against the new full-width `jungle` surface, below the
  WCAG 2.2 AA 4.5:1 requirement for small text.
- Fix: used the established `primary-hover` brand token for the
  large introduction eyebrow only; mobile styling remains
  unchanged.
- Post-fix evidence: Chromium and WebKit both measure 5.70:1 in
  the route regression test, and
  `friheten-source-vs-implementation-final-accessible.png` is the
  final visual comparison.

### Iteration 6

- Earlier finding: [P1] The large-screen surfaces responded
  promptly, but several takeover intervals were only `16–78svh`;
  a strong wheel or trackpad gesture could therefore make the
  next surface appear to shoot fully into place.
- Fix: retained near-immediate onset while extending the actual
  motion intervals. Large text takeovers now span `120svh`, the
  answer and both mode takeovers span about `120svh`,
  `Friheten til å velge` spans about `141svh`, and each diagonal
  image cover continues through `exit 30%`. The two large mode
  transitions now use linear scroll mapping instead of the
  earlier acceleration curves. Reduced-motion,
  unsupported-timeline, and short-height paths remain static.
- Post-fix evidence: `klarna-vs-utekos-controlled-scroll.png`
  shows progressive image growth at three equivalent states. The
  three `friheten-*.png` captures show a visible right edge after
  `0.2` viewport, a still-incomplete full-width surface after one
  viewport, and exact settlement at the range endpoint. The route
  regression test verifies the same onset, intermediate, and
  endpoint geometry for the answer, both mode transitions, both
  images, and the introduction.

### Iteration 7

- Earlier findings: [P1] Several mobile text, answer, and mode
  takeovers completed within roughly 400–600 px, so a single
  strong gesture could make the next full-screen surface snap
  into place; [P1] the fixed dark route header remained over the
  story and obscured the upper part of image scenes.
- Fix: expanded the mobile text and answer tracks, lengthened
  each affected animation range, and changed both mobile mode
  takeovers to a linear scroll mapping. The route header is now
  transparent over the Hero, contains only the established
  icon/cart/menu controls, and is tied to the Hero track so it
  exits before story imagery.
- Post-fix evidence: `comparison-answer.png` and
  `comparison-mode.png` show the same early scroll distance
  producing a controlled partial arrival instead of a settled
  scene. `comparison-header.png` shows the former dark overlay
  beside the final unobstructed story. Programmatic checks verify
  that each takeover is still incomplete after one viewport and
  exact at its endpoint.

### Iteration 8

- Requested correction: the `Adaptiv funksjonalitet` eyebrow
  should use the brand's exact `primary` color at every
  breakpoint.
- Fix: removed the large-screen `primary-hover` override so the
  shared `primary` token now governs mobile, iPad, and desktop.
- Post-fix evidence: the route regression test compares the
  eyebrow's computed color directly with a computed
  `var(--primary)` probe.

### Iteration 9

- Earlier finding: [P1] the desktop product gallery used
  `top: 0`, so it continued moving for another header-height
  after reaching the composed moment shown in the reference
  capture.
- Fix: aligned the sticky inset with the established desktop
  header measures: 80 px from `lg` and 90 px from `xl`, without
  changing the 900-1023 px or mobile layouts.
- Post-fix evidence: at 1920 x 1243, both columns first meet at
  90 px; after another 300 px of page movement, the gallery is
  still at 90 px while the details column has moved above the
  viewport.

### Iteration 10

- Earlier finding: [P1] the answer heading and all three answer
  moments occupied too little physical scroll distance. One
  strong gesture advanced the mobile timeline by 33 percent and
  the large timeline by 36 percent, enough to skip the intended
  reading sequence.
- Fix: expanded the mobile answer track to 800 svh and the large
  answer track to 700 svh. The heading now settles before the
  first moment, while every answer moment receives more than one
  viewport between completion points. Movement begins promptly
  with no multi-scroll dead interval.
- Post-fix evidence: at 390 x 844 and 1440 x 900, the heading is
  fully settled with all three moments hidden. A full viewport
  from the strictest test position completes the active moment,
  leaves the next only partial, and keeps the final moment fully
  hidden. Chromium and WebKit pass the same computed-state
  assertions.

### Iteration 11

- Earlier finding: [P1] a fixed 58 percent mobile image row could
  become much taller than its 4:5 image on unusually tall, narrow
  screens. On short narrow screens, the image then shrank while
  the frame kept the full available width.
- Fix: changed the animated mobile image row to an intrinsic
  track capped at 58 svh, and tied both the image and outer frame
  to the same height-aware 4:5 width calculation.
- Post-fix evidence: the image, inner frame, and outer frame stay
  flush at 390 x 1102, 390 x 844, 320 x 568, and 240 x 422, with
  `object-fit: cover` and no horizontal overflow. Chromium and
  WebKit pass the dedicated narrow-screen regression.

### Iteration 12

- Earlier finding: [P1] the intro logo finished at 3950 ms, but
  the hero did not begin until 4700 ms. This left a 750 ms empty
  jungle-colored hold after the logo exit. The technology heading
  also reached 108 px at a 1280 px viewport and overpowered the
  material comparison.
- Fix: started the hero and jungle fade at the exact logo end,
  while keeping the header onset after the logo. Reduced the
  technology heading scale from a 108 px maximum to 84 px, with a
  45.6 px mobile minimum and responsive interpolation between.
- Post-fix evidence: the logo exit now flows directly into the
  hero reveal, and the heading measures 45.6 px at 390 x 844,
  62.55 px at 834 x 1112, and 84 px at 1280 x 900 without
  horizontal overflow.

### Iteration 13

- Earlier finding: [P1] the material result heading
  `Bevarer spenst og loft` reached 53.6 px at a 1280 px viewport.
  As a nested result inside the instrument, it competed with the
  section heading instead of supporting it.
- Fix: reduced the result scale independently from the main
  technology heading, preserving its weight and compact line
  height while giving it a restrained responsive range.
- Post-fix evidence: the result heading measures 24 px at 390 x
  844, 27.105 px at 834 x 1112, and 41.6 px at 1280 x 900. It
  remains readable, visually subordinate, and free of horizontal
  overflow at every checked size.

### Iteration 14

- Earlier finding: [P1] both large empathy images followed their
  own view timelines. The second image could therefore begin
  revealing while the first image still had a visible cover,
  breaking the intended diagonal handoff.
- Fix: scoped the first image timeline across the shared media
  chain. The first reveal now ends at `exit 30%`, and the second
  begins at that exact same progress point before continuing to
  `exit 100%`.
- Post-fix evidence: immediately before the handoff, the first
  cover is still moving and the second remains fully covered. At
  the shared boundary, the first is completely revealed while the
  second has not started. Immediately afterwards, only the second
  cover moves, with the first image still visible and the frame
  corners still in exact contact. At 1920 x 1243, the measured
  cover scales were `0.034 / 1` before, `0 / 0.9999` at the
  boundary, and `0 / 0.7858` after; corner offsets remained
  `0 / 0` px throughout.

### Iteration 15

- Earlier finding: [P2] the large answer sequence preserved the
  requested one-by-one staging, but each sentence occupied 108
  percent of a viewport and the completion points were 120
  percent of a viewport apart. Desktop therefore felt slightly
  overextended between moments.
- Fix: reduced only the large question-and-answer track from 700
  svh to 650 svh. The animation ranges and their ordering remain
  unchanged, and the 800 svh mobile track is untouched.
- Post-fix evidence: each large answer moment now occupies 99
  percent of a viewport, with 110 percent between completion
  points. One full desktop viewport still cannot complete the
  following sentence, so the sequence remains distinctly staged
  while moving forward a little sooner.

## Primary interactions and runtime checks

- Scrolled through the first and second large image reveals at
  start, intermediate, and complete positions.
- Verified that the first image remains visible while the second
  image begins.
- Verified the large `Friheten til å velge` side entrance and the
  three mode-scene transitions.
- Verified fixed header behavior and absence of horizontal
  overflow.
- Verified the hero curtain at closed, half-open, and open scroll
  positions and confirmed the underlying headline keeps the same
  viewport position.
- Verified early, one-viewport, and settled states for both large
  image covers and the full-width `Friheten til å velge` surface
  at 1440 x 900.
- Verified early, one-viewport, and settled states for mobile
  recognition, answer, vertical mode, and horizontal mode
  arrivals at 390 x 844.
- Verified that the mobile Hero header is transparent with icon,
  cart, and menu present, then hidden and outside the image area
  after the Hero.
- Verified the 1920 x 1243 purchase entry state and continued
  right-column page scroll with the gallery held at 90 px.
- Verified a dedicated heading-only state and one-viewport
  answer-step separation at 390 x 844 and 1440 x 900.
- Verified exact 4:5 mobile image fill without frame gaps at 390
  x 1102, 320 x 568, and 240 x 422.
- Verified the logo exit, immediate hero crossfade, and settled
  hero as separate load-animation frames at 390 x 844.
- Verified the technology heading hierarchy at 390 x 844 and 1280
  x 900.
- Verified the nested material result heading hierarchy at 390 x
  844, 834 x 1112, and 1280 x 900.
- Verified the large-image handoff before, at, and after the
  shared timeline boundary, with no reveal overlap.
- Verified the slightly shorter large answer rhythm while keeping
  every sentence on its own scroll interval.
- Checked the final local browser pass: no page exceptions.
  Local-only requests for Vercel Insights and Klarna onsite
  messaging report the expected 404/CORS failures on `localhost`;
  neither belongs to this visual change or affects the verified
  route choreography.

## Follow-up polish

- P3: the deliberate double frame adds more depth than the
  unframed Klarna source. This is retained because it is an
  explicit Utekos requirement and is consistent with the
  mode-image treatment.

## Implementation checklist

- [x] Match reference reveal proportions and diagonal
      progression.
- [x] Keep fixed 4:5 frame geometry without image scaling.
- [x] Preserve exact corner contact and previous-image
      visibility.
- [x] Use real Utekos assets and brand tokens.
- [x] Verify responsive, reduced-motion, short-height, Chromium,
      and WebKit behavior.
- [x] Reveal the first large empathy headline beneath the hero
      curtain.
- [x] Start large right-hand transitions without long dead-scroll
      intervals.
- [x] Keep `Friheten til å velge` full width before the 50/50
      mode stage.
- [x] Start every large takeover promptly while requiring
      multiple ordinary scroll movements to settle.
- [x] Pace mobile text, answer, and mode takeovers without dead
      scroll or single-gesture settlement.
- [x] Keep the mobile Hero controls transparent and clear the
      complete header before story imagery.
- [x] Pin the desktop purchase gallery at the reference entry
      moment while purchase details continue through normal page
      scroll.
- [x] Give the answer heading and each of its three moments a
      separate, readable scroll interval on mobile and large
      screens.
- [x] Keep every mobile mode image flush with its 4:5 frame on
      unusually tall and short narrow screens.
- [x] Remove the empty green hold between logo exit and hero
      reveal.
- [x] Keep the technology heading prominent without dominating
      its material comparison.
- [x] Keep the material result heading subordinate to the main
      technology heading at mobile, iPad, and desktop sizes.
- [x] Complete the first large image reveal before the second
      image begins, without a dead interval between them.
- [x] Balance the large answer sequence so it remains one-by-one
      without feeling overextended between sentences.
- [x] Resolve all P0/P1/P2 findings.

final result: passed
