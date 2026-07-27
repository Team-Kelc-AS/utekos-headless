# Skreddersy Original Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the user's browser annotations to the `/skreddersy-varmen/utekos-orginal` hero, empathy, product showcase, and modular-system sections without changing their layout, copy, assets, or interactions.

**Architecture:** Keep the work route-local and class-only. Reuse the already loaded Utekos and Google Sans font utilities, preserve the shared dark-brown `#2C2420` surface, and replace hard-coded orange and commerce-specific active colors with the existing semantic primary tokens.

**Tech Stack:** Next.js 16.2.9, React 19.2.7, Tailwind CSS 4.3.1, `next/font`, TypeScript 6.0.3.

## Global Constraints

- Preserve all unrelated working-tree changes and do not modify route copy, images, layout, motion, tracking attributes, or component behavior.
- Only the words `Skreddersy varmen` in the hero heading must use `font-google-sans font-bold tracking-tight`; the italic `Forleng de gode stundene` subtitle must retain its existing light weight and `tracking-[-0.01em]` instead of inheriting Google Sans Bold.
- The hero CTA `Finn din favoritt` must use `font-utekos-text-medium`.
- The empathy heading must use `font-utekos-text-medium`; both annotated empathy paragraphs must use `font-utekos-text`.
- Orange accents in the product showcase and modular-system eyebrow must use `text-primary dark:text-dark-primary`; icon circles must use matching semantic primary background and foreground utilities.
- The modular-system section must retain the same `bg-[#2C2420]` surface already shared with the hero fallback.
- The active mode control must use the route's primary semantic background and foreground utilities instead of commerce-specific primary utilities.
- The modular mode image frame must use `bg-night` instead of the hard-coded `bg-[#1F2421]` fallback.
- The product-showcase image must use the supplied `public/UtekosMikrofiberVert.webp` asset without changing its current container or responsive `object-cover` behavior.
- `Lettvekt møter kompromissløs varme.` and all four feature titles must use `font-utekos-text-medium`; the product introduction and all four feature descriptions must use `font-utekos-text`.
- Maintain WCAG 2.2 AA contrast and visible selected-state affordance; do not communicate selected state by color alone.
- Do not add dependencies, `useMemo`, `useCallback`, comments, new components, or global CSS.

---

### Task 1: Apply the annotated route typography and primary-color system

**Files:**
- Modify: `src/app/skreddersy-varmen/utekos-orginal/components/HeroSection.tsx`
- Modify: `src/app/skreddersy-varmen/utekos-orginal/components/ScrollToButton.tsx`
- Modify: `src/app/skreddersy-varmen/components/EmpathySection.tsx`
- Modify: `src/app/skreddersy-varmen/utekos-orginal/components/ProductShowcase.tsx`
- Modify: `src/app/skreddersy-varmen/utekos-orginal/components/ThreeInOneDemo.tsx`
- Add: `public/UtekosMikrofiberVert.webp`

**Interfaces:**
- Consumes: Existing Tailwind utilities backed by `--font-google-sans`, `--font-utekos-text`, `--font-utekos-text-medium`, `--primary`, and `--dark-primary`.
- Produces: The same component exports and DOM hierarchy with only the annotated typography and semantic color classes changed.

- [ ] **Step 1: Run the pre-change class contract and verify RED**

Run:

```bash
node - <<'NODE'
const fs = require('node:fs')
const checks = [
  ['src/app/skreddersy-varmen/utekos-orginal/components/HeroSection.tsx', "<span className='font-google-sans font-bold tracking-tight'>"],
  ['src/app/skreddersy-varmen/utekos-orginal/components/ScrollToButton.tsx', 'font-utekos-text-medium'],
  ['src/app/skreddersy-varmen/components/EmpathySection.tsx', "className='font-utekos-text relative max-w-136'"],
  ['src/app/skreddersy-varmen/utekos-orginal/components/ProductShowcase.tsx', "@public/UtekosMikrofiberVert.webp"],
  ['src/app/skreddersy-varmen/utekos-orginal/components/ProductShowcase.tsx', "font-utekos-text-medium mt-2 block"],
  ['src/app/skreddersy-varmen/utekos-orginal/components/ProductShowcase.tsx', "font-utekos-text max-w-xl"],
  ['src/app/skreddersy-varmen/utekos-orginal/components/ProductShowcase.tsx', "font-utekos-text-medium text-lg"],
  ['src/app/skreddersy-varmen/utekos-orginal/components/ProductShowcase.tsx', "font-utekos-text text-sm leading-snug"],
  ['src/app/skreddersy-varmen/utekos-orginal/components/ProductShowcase.tsx', 'text-primary dark:text-dark-primary'],
  ['src/app/skreddersy-varmen/utekos-orginal/components/ThreeInOneDemo.tsx', 'bg-primary text-primary-foreground shadow-lg dark:bg-dark-primary'],
  ['src/app/skreddersy-varmen/utekos-orginal/components/ThreeInOneDemo.tsx', 'bg-night shadow-2xl']
]
const missing = checks.filter(([file, expected]) => !fs.readFileSync(file, 'utf8').includes(expected))
if (missing.length === 0) process.exit(0)
console.error(missing.map(([file, expected]) => `${file}: missing ${expected}`).join('\n'))
process.exit(1)
NODE
```

Expected: exit `1` with missing desired-class diagnostics because the annotations have not been implemented yet.

- [ ] **Step 2: Apply the minimal class-only implementation**

In `HeroSection.tsx`, apply Google Sans Bold only to the first line and preserve the subtitle's existing typography:

```tsx
<h1 className='mb-4 text-center text-4xl leading-[0.95] tracking-[-0.01em] text-balance text-foreground drop-shadow-xl md:mb-6 md:text-7xl'>
  <span className='font-google-sans font-bold tracking-tight'>
    Skreddersy varmen
  </span>{' '}
  <br className='hidden md:block' />
  <span className='mt-2 block text-2xl leading-[0.95] font-light tracking-[-0.01em] text-foreground italic opacity-90 md:text-6xl'>
    Forleng de gode stundene
  </span>
</h1>
```

In `ScrollToButton.tsx`, replace `font-medium` with `font-utekos-text-medium` and preserve all other button classes.

In `EmpathySection.tsx`, replace the empathy heading's `font-google-sans font-sans ... font-bold` utilities with `font-utekos-text-medium`, keeping its size, line-height, tracking, and colors unchanged. Add `font-utekos-text` to the two annotated paragraph class lists:

```tsx
className='font-utekos-text relative max-w-136'
```

```tsx
className='font-utekos-text dark:text-dark-background mt-6 max-w-136 text-background'
```

In `ProductShowcase.tsx`, replace the hard-coded orange heading and icon colors with semantic primary utilities:

```tsx
<h2 className='font-serif text-4xl leading-tight text-primary dark:text-dark-primary md:text-5xl'>
```

```tsx
<div className='mt-1 rounded-full bg-primary/10 p-2 text-primary dark:bg-dark-primary/10 dark:text-dark-primary'>
```

Apply the requested Utekos families to the subtitle, introduction, and shared feature renderer so all four items are covered:

```tsx
<span className='font-utekos-text-medium mt-2 block text-2xl text-[#F4F1EA] md:text-3xl'>
```

```tsx
<p className='font-utekos-text max-w-xl text-lg leading-relaxed font-light text-[#F4F1EA]/80'>
```

```tsx
<h3 className='font-utekos-text-medium text-lg text-[#F4F1EA]'>
```

```tsx
<p className='font-utekos-text text-sm leading-snug text-[#F4F1EA]/60'>
```

Replace the product-showcase image import with the supplied public asset while preserving the existing `<Image>` props:

```tsx
import ProductMain from '@public/UtekosMikrofiberVert.webp'
```

In `ThreeInOneDemo.tsx`, retain `bg-[#2C2420]`, replace the eyebrow's hard-coded orange with `text-primary dark:text-dark-primary`, and replace the active-mode branch with:

```tsx
'scale-100 bg-primary text-primary-foreground shadow-lg dark:bg-dark-primary dark:text-dark-primary-foreground'
```

Replace the mode image frame's `bg-[#1F2421]` with `bg-night`, preserving every other frame class and image prop.

- [ ] **Step 3: Re-run the class contract and verify GREEN**

Run:

Re-run the exact Node class-contract command from Step 1.

Expected: exit `0` with no diagnostics. Also run `rg -n "bg-\\[#2C2420\\]" src/app/skreddersy-varmen/utekos-orginal/components/ThreeInOneDemo.tsx`; it must find the retained brown section surface.

- [ ] **Step 4: Run targeted lint and full type verification**

Run:

```bash
pnpm exec eslint \
  src/app/skreddersy-varmen/utekos-orginal/components/HeroSection.tsx \
  src/app/skreddersy-varmen/utekos-orginal/components/ScrollToButton.tsx \
  src/app/skreddersy-varmen/components/EmpathySection.tsx \
  src/app/skreddersy-varmen/utekos-orginal/components/ProductShowcase.tsx \
  src/app/skreddersy-varmen/utekos-orginal/components/ThreeInOneDemo.tsx
pnpm exec next typegen
pnpm exec tsc --noEmit
```

Expected: all commands exit `0` with no diagnostics.

- [ ] **Step 5: Commit the scoped implementation**

```bash
git add \
  src/app/skreddersy-varmen/utekos-orginal/components/HeroSection.tsx \
  src/app/skreddersy-varmen/utekos-orginal/components/ScrollToButton.tsx \
  src/app/skreddersy-varmen/components/EmpathySection.tsx \
  src/app/skreddersy-varmen/utekos-orginal/components/ProductShowcase.tsx \
  src/app/skreddersy-varmen/utekos-orginal/components/ThreeInOneDemo.tsx \
  public/UtekosMikrofiberVert.webp \
  docs/superpowers/plans/2026-07-27-skreddersy-original-visual-polish.md
git commit -m "style: polish skreddersy original typography"
```

Expected: one scoped commit containing only the five component changes and this implementation plan.
