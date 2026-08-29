# Design QA: `/skreddersy-varmen` large reveal and follow-up choreography

## Comparison target

- Source visual truth: `/Users/kristofferohnstadhjelmeland/klarna-solution.MOV`
- Source captures: `/tmp/klarna_frames.7WCpVA/quarter_02.25.jpg`, `/tmp/klarna_frames.7WCpVA/quarter_03.25.jpg`, and `/tmp/klarna_frames.7WCpVA/quarter_04.50.jpg`
- Implementation: `http://localhost:3100/skreddersy-varmen`
- Implementation captures: `/tmp/utekos-klarna-qa-start.png`, `/tmp/utekos-klarna-qa-mid.png`, and `/tmp/utekos-klarna-qa-end.png`
- Combined full-view evidence: `/tmp/klarna-vs-utekos-states.png`
- State: start, intermediate, and complete diagonal image reveal before mode 01

### Follow-up target: 2026-08-29 desktop corrections

- Source visual truth: `/var/folders/h1/mmr263ts7lg7l0vnyl9m97z00000gn/T/TemporaryItems/NSIRD_screencaptureui_3U6g3I/Screenshot 2026-08-29 at 07.43.53.png` plus the user's three explicit interaction corrections.
- Implementation captures: `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-20260829/curtain-closed-1920x1243@2x.png`, `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-20260829/curtain-half-1920x1243@2x.png`, `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-20260829/curtain-open-1920x1243@2x.png`, `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-20260829/friheten-entering-final-1920x1243@2x.png`, and `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-20260829/friheten-settled-final-accessible-1920x1243@2x.png`.
- Combined full-view evidence: `/Users/kristofferohnstadhjelmeland/Documents/Codex/2026-08-29/for/work/design-qa-20260829/friheten-source-vs-implementation-final-accessible.png` (source on the left, final implementation on the right).
- State: closed, half-open, and open hero curtain; half-entered and completely settled `Friheten til å velge` surface.

## Normalization

- Source captures: 960 x 557 pixels.
- Implementation captures: 1920 x 1114 pixels at a 1920 x 1114 CSS viewport and device pixel ratio 1.
- Density normalization: implementation captures were displayed at 50% in the combined comparison, producing the same 960 x 557 comparison panel as the source.
- The combined sheet places the source and implementation beside one another for each of the three matching reveal states.
- Browser chrome and brand-specific header content differ intentionally; the compared product-design target is the reveal window geometry, scroll-linked progression, corner handoff, and surrounding layout rhythm.
- Follow-up source and implementation captures are both 3840 x 2486 pixels for a 1920 x 1243 CSS viewport at device pixel ratio 2. The combined follow-up sheet downsamples each side to 1920 x 1243 pixels without changing crop or aspect ratio.

## Findings

No actionable P0, P1, or P2 findings remain.

- Typography: Utekos keeps its established display and interface typefaces instead of copying Klarna's brand type. Scale, weight, wrapping, and text hierarchy remain balanced beside the 4:5 frame at the normalized viewport.
- Spacing and layout: the large media chain is 89vw, matching the reference's approximately 5.5vw outer margin. Each frame is 4:5, keeps a fixed final size, and hands off to the next frame with a measured 0 px horizontal and vertical corner delta.
- Colors and tokens: the implementation intentionally uses the existing `evening`, `jungle`, `cloud-dancer`, and `primary` tokens. Covered frame quadrants now use the surrounding `evening` surface so the unrevealed region disappears cleanly, as in the reference.
- Image quality and asset fidelity: all visuals are real project assets. No placeholder, CSS drawing, inline SVG substitute, zoom animation, blur, or opacity reveal is used. The full-length and parkas crops retain the whole garment vertically.
- Copy and content: the existing Utekos narrative copy and order are preserved. The visual reference informs motion and geometry only.
- Responsiveness: 767/768 breakpoint isolation, 834 x 1112, 1024 x 768, 1440 x 900, short-height fallback, reduced motion, Chromium, and WebKit were checked.
- Accessibility and behavior: one `main`, one H1, fixed header, no horizontal overflow, semantic image alt text, one empathy impression sentinel, and static reduced-motion/short-height fallbacks remain intact.
- Follow-up composition: the first post-hero headline remains stationary behind the moving hero; the next right-hand scene begins as the curtain finishes. The large narrative, answer, resolution, introduction, and mode tracks were shortened so motion starts within the first meaningful scroll interval.
- `Friheten til å velge`: the settled introduction is a full-width `jungle` surface with a 1280 px content measure at the 1920 px viewport. The 50/50 `jungle`/`evening` split starts only in the following mode stage.
- Contrast: the large introduction's 12 px orange eyebrow uses the existing `primary-hover` token and measures 5.70:1 against `jungle`; the heading and lead measure 15.64:1. Both exceed WCAG 2.2 AA requirements for their text sizes.

## Focused region evidence

The reveal frame itself fills most of each normalized comparison panel, so a separate crop was not needed. Focused programmatic checks verified the 4:5 ratio, unchanged frame dimensions across scroll states, transform-only cover layers, no frame `clip-path`, full opacity, exact corner contact, and continued visibility of the preceding frame during the next reveal.

For the follow-up, a separate crop was not needed because the defect was the full-screen region proportion itself. The combined full-view sheet clearly exposes the old empty 50% column and the final full-width surface. Focused runtime checks measured a 1920 px settled surface at `left: 0`, a 1280 px content measure, no background gradient on the introduction, and the exact 50% split on the following stage.

## Comparison history

### Iteration 1

- Earlier finding: [P1] The unrevealed right and lower quadrants used `jungle`, leaving a large colored L-shaped block that was absent from the Klarna reference.
- Fix: changed both large media rows and both transform cover layers to the surrounding `evening` surface while retaining the framed image treatment.
- Post-fix evidence: `/tmp/klarna-vs-utekos-states.png` shows the covered area disappearing into the section background at start and intermediate states, while the frame and image reveal together.

### Iteration 2

- No P0, P1, or P2 visual differences remained in the motion/geometry target.
- The normalized start, intermediate, and complete states align in outer margin, fixed 4:5 size, rectangular growth direction, and contact handoff.

### Iteration 3

- Earlier findings: [P1] The first large empathy headline arrived in normal flow instead of being revealed beneath the hero; [P1] several large scroll tracks held static for too long before the next right-hand surface moved; [P1] `Friheten til å velge` inherited the mode-stage 50/50 split and left half the viewport empty.
- Fixes: restored the large hero lift with the large empathy headline pinned beneath it; compressed the large narrative, answer, resolution, introduction, and mode tracks; moved the introduction onto its own solid full-width `jungle` surface with a diagonal right-side entry; retained the 50/50 split only for modes 01–03.
- Post-fix evidence: the three curtain captures show the headline staying fixed while the hero uncovers it; `friheten-entering-final-1920x1243@2x.png` shows the diagonal entry; `friheten-source-vs-implementation-final-accessible.png` shows the old half-width result beside the final full-width result.

### Iteration 4

- Earlier finding: [P2] At a fractional 1920 x 1243 scroll endpoint, the introduction could retain a subpixel horizontal translation and leave a hairline seam.
- Fix: completed the scroll-linked introduction animation at 98% of the contain interval, leaving the final 2% as a fully settled hold.
- Post-fix evidence: the final runtime measurement is exactly `left: 0`, `top: 0`, `width: 1920`, with a zero transform and a closed rectangular clip path.

### Iteration 5

- Earlier finding: [P1] The 12 px `primary` eyebrow measured 2.99:1 against the new full-width `jungle` surface, below the WCAG 2.2 AA 4.5:1 requirement for small text.
- Fix: used the established `primary-hover` brand token for the large introduction eyebrow only; mobile styling remains unchanged.
- Post-fix evidence: Chromium and WebKit both measure 5.70:1 in the route regression test, and `friheten-source-vs-implementation-final-accessible.png` is the final visual comparison.

## Primary interactions and runtime checks

- Scrolled through the first and second large image reveals at start, intermediate, and complete positions.
- Verified that the first image remains visible while the second image begins.
- Verified the large `Friheten til å velge` side entrance and the three mode-scene transitions.
- Verified fixed header behavior and absence of horizontal overflow.
- Verified the hero curtain at closed, half-open, and open scroll positions and confirmed the underlying headline keeps the same viewport position.
- Checked the final local browser pass: no page exceptions. Local-only requests for Vercel Insights and Klarna onsite messaging report the expected 404/CORS failures on `localhost`; neither belongs to this visual change or affects the verified route choreography.

## Follow-up polish

- P3: the deliberate double frame adds more depth than the unframed Klarna source. This is retained because it is an explicit Utekos requirement and is consistent with the mode-image treatment.

## Implementation checklist

- [x] Match reference reveal proportions and diagonal progression.
- [x] Keep fixed 4:5 frame geometry without image scaling.
- [x] Preserve exact corner contact and previous-image visibility.
- [x] Use real Utekos assets and brand tokens.
- [x] Verify responsive, reduced-motion, short-height, Chromium, and WebKit behavior.
- [x] Reveal the first large empathy headline beneath the hero curtain.
- [x] Start large right-hand transitions without long dead-scroll intervals.
- [x] Keep `Friheten til å velge` full width before the 50/50 mode stage.
- [x] Resolve all P0/P1/P2 findings.

final result: passed
