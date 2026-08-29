# Design QA: `/skreddersy-varmen` large reveal

## Comparison target

- Source visual truth: `/Users/kristofferohnstadhjelmeland/klarna-solution.MOV`
- Source captures: `/tmp/klarna_frames.7WCpVA/quarter_02.25.jpg`, `/tmp/klarna_frames.7WCpVA/quarter_03.25.jpg`, and `/tmp/klarna_frames.7WCpVA/quarter_04.50.jpg`
- Implementation: `http://localhost:3100/skreddersy-varmen`
- Implementation captures: `/tmp/utekos-klarna-qa-start.png`, `/tmp/utekos-klarna-qa-mid.png`, and `/tmp/utekos-klarna-qa-end.png`
- Combined full-view evidence: `/tmp/klarna-vs-utekos-states.png`
- State: start, intermediate, and complete diagonal image reveal before mode 01

## Normalization

- Source captures: 960 x 557 pixels.
- Implementation captures: 1920 x 1114 pixels at a 1920 x 1114 CSS viewport and device pixel ratio 1.
- Density normalization: implementation captures were displayed at 50% in the combined comparison, producing the same 960 x 557 comparison panel as the source.
- The combined sheet places the source and implementation beside one another for each of the three matching reveal states.
- Browser chrome and brand-specific header content differ intentionally; the compared product-design target is the reveal window geometry, scroll-linked progression, corner handoff, and surrounding layout rhythm.

## Findings

No actionable P0, P1, or P2 findings remain.

- Typography: Utekos keeps its established display and interface typefaces instead of copying Klarna's brand type. Scale, weight, wrapping, and text hierarchy remain balanced beside the 4:5 frame at the normalized viewport.
- Spacing and layout: the large media chain is 89vw, matching the reference's approximately 5.5vw outer margin. Each frame is 4:5, keeps a fixed final size, and hands off to the next frame with a measured 0 px horizontal and vertical corner delta.
- Colors and tokens: the implementation intentionally uses the existing `evening`, `jungle`, `cloud-dancer`, and `primary` tokens. Covered frame quadrants now use the surrounding `evening` surface so the unrevealed region disappears cleanly, as in the reference.
- Image quality and asset fidelity: all visuals are real project assets. No placeholder, CSS drawing, inline SVG substitute, zoom animation, blur, or opacity reveal is used. The full-length and parkas crops retain the whole garment vertically.
- Copy and content: the existing Utekos narrative copy and order are preserved. The visual reference informs motion and geometry only.
- Responsiveness: 767/768 breakpoint isolation, 834 x 1112, 1024 x 768, 1440 x 900, short-height fallback, reduced motion, Chromium, and WebKit were checked.
- Accessibility and behavior: one `main`, one H1, fixed header, no horizontal overflow, semantic image alt text, one empathy impression sentinel, and static reduced-motion/short-height fallbacks remain intact.

## Focused region evidence

The reveal frame itself fills most of each normalized comparison panel, so a separate crop was not needed. Focused programmatic checks verified the 4:5 ratio, unchanged frame dimensions across scroll states, transform-only cover layers, no frame `clip-path`, full opacity, exact corner contact, and continued visibility of the preceding frame during the next reveal.

## Comparison history

### Iteration 1

- Earlier finding: [P1] The unrevealed right and lower quadrants used `jungle`, leaving a large colored L-shaped block that was absent from the Klarna reference.
- Fix: changed both large media rows and both transform cover layers to the surrounding `evening` surface while retaining the framed image treatment.
- Post-fix evidence: `/tmp/klarna-vs-utekos-states.png` shows the covered area disappearing into the section background at start and intermediate states, while the frame and image reveal together.

### Iteration 2

- No P0, P1, or P2 visual differences remained in the motion/geometry target.
- The normalized start, intermediate, and complete states align in outer margin, fixed 4:5 size, rectangular growth direction, and contact handoff.

## Primary interactions and runtime checks

- Scrolled through the first and second large image reveals at start, intermediate, and complete positions.
- Verified that the first image remains visible while the second image begins.
- Verified the large `Friheten til å velge` side entrance and the three mode-scene transitions.
- Verified fixed header behavior and absence of horizontal overflow.
- Checked browser console errors after the final visual pass: none.

## Follow-up polish

- P3: the deliberate double frame adds more depth than the unframed Klarna source. This is retained because it is an explicit Utekos requirement and is consistent with the mode-image treatment.

## Implementation checklist

- [x] Match reference reveal proportions and diagonal progression.
- [x] Keep fixed 4:5 frame geometry without image scaling.
- [x] Preserve exact corner contact and previous-image visibility.
- [x] Use real Utekos assets and brand tokens.
- [x] Verify responsive, reduced-motion, short-height, Chromium, and WebKit behavior.
- [x] Resolve all P0/P1/P2 findings.

final result: passed
