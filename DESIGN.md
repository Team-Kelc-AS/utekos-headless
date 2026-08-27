---
name: Utekos Brand and Editorial System
colors:
  primary: '#b44701'
  secondary: '#00453e'
  surface: '#012622'
  on-surface: '#f0eee9'
  error: '#ffb4ab'
typography:
  display:
    fontFamily: Google Sans Flex
    fontWeight: 590
  body-md:
    fontFamily: Utekos Text
    fontSize: 16px
    fontWeight: 400
rounded:
  md: 12px
  editorial: 24px
design:
  variance: 7
  motion: 4
  density: 3
---

# Utekos design system

## Brand direction

Utekos is calm, warm and practical. The interface should feel
premium without becoming precious, and outdoors-oriented without
borrowing the visual language of technical expedition brands.
Product truth, strong photography and generous editorial rhythm
lead the experience.

## Color

- Primary orange (`#b44701`) is reserved for the most important
  action, numbering and small points of emphasis.
- Jungle (`#00453e`) and Night (`#012622`) form one continuous
  dark surface family.
- Cloud Dancer (`#f0eee9`) is the primary text and light-surface
  color.
- Do not introduce extra accent colors, gradients that look
  synthetic, or purple AI styling.
- Use the current CSS tokens in `src/globals.css`. Hex values
  here communicate brand intent and do not replace the runtime
  tokens.

## Typography

- Display: Google Sans Flex, weight 590 to 650, compact
  line-height and restrained negative tracking.
- Body: Utekos Text for natural long-form reading.
- Labels: Utekos Text Medium. Use sentence case and normal
  tracking unless a compact number or data label needs
  separation.
- Headings should be short, concrete and balanced. Body copy
  should stay within 45 to 65 characters per line.

## Layout and shape

- Use asymmetric editorial grids for product storytelling. Avoid
  repeated rows of equal cards.
- Keep one continuous page background and create hierarchy with
  spacing, image scale and subtle tonal shifts.
- Editorial media uses a consistent 24 to 28px outer radius with
  a narrow dark bezel.
- Buttons may use a full pill shape. Content containers and
  callouts should not.
- Mobile layouts collapse to one clear reading order with no
  horizontal overflow.

## Motion

- Motion intensity is 4 of 10: purposeful, calm and infrequent.
- Prefer CSS opacity and transform transitions. Use scroll-linked
  CSS only as progressive enhancement.
- Respect `prefers-reduced-motion` and keep all content readable
  without animation.
- Client components are reserved for interaction that cannot be
  expressed with server-rendered HTML and CSS.

## Images

- Product imagery must be authentic Utekos source material from
  the repository or another explicitly approved source.
- Never synthesize or alter the TechDown garment with generative
  AI.
- Preserve useful alt text, intrinsic proportions and responsive
  `sizes` values.
- Generated design references may define composition only. They
  must use placeholders or non-product material studies until
  authentic product pixels are inserted.

## MDX content system

- MDX owns editorial hierarchy, links and prose. Route-local
  server components own complex layout and image contracts.
- Global primitives in `mdx-components.tsx` provide headings,
  paragraphs, links, lists, blockquotes, responsive tables,
  actions, callouts, columns and figures.
- Use `MdxAction` for a deliberate next step, `MdxCallout` for
  verified supporting information, `MdxColumns` for short
  parallel content and `MdxFigure` for a standalone documented
  image.
- The global register must remain neutral enough for
  `/handlehjelp/storrelsesguide`, `/personvern`, `/inspirasjon`
  and `/magasinet`. Brand-specific layouts belong beside their
  route.
- MDX content remains a Server Component by default. Add a client
  boundary only around the smallest interactive component.

## Accessibility and quality

- Preserve one page-level `h1`, then follow a logical heading
  hierarchy.
- Every meaningful image needs accurate alt text; decorative
  images use an empty alt value.
- Interactive controls need visible keyboard focus and at least a
  44px hit target.
- Body text targets WCAG AA contrast. Do not place text over busy
  photography without a tested surface.
- Avoid emojis as interface symbols, ornamental scroll cues, fake
  testimonials and unsupported product claims.
