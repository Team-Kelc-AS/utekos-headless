# Utekos sizing guide design system

# Utekos UI tokens

Next.js 16.3.1 / React 19.2 / Tailwind CSS v4 + CSS modules / Base UI with shadcn-style primitives. Existing App Router MDX uses @next/mdx with remark-gfm, rehype-slug, and autolink headings. No separate tailwind.config is present; Tailwind configuration is in src/globals.css.

Typography: Google Sans Flex (--font-sans) for headings, Utekos Text for body, Utekos Text Medium for labels. H1 30/48/60px, H2 36/48/60px in existing guide; body 18px with relaxed leading; refined guide uses 18px/1.65 body and max 65ch. No font substitution.

Colors (actual active CSS): background oklch(0.1645 0.0284 190.51), foreground oklch(0.985 0 0), jungle oklch(0.2383 0.042 184.99), night oklch(0.1959 0.0341 188), dark-teal oklch(0.3507 0.0622 183.77), primary oklch(0.537541 0.156162 44.0778), card oklch(0.2943 0.0502 194.77), card-foreground oklch(0.9493 0.007 88.64). Brand reference primary #b44701, secondary #00453e, surface #012622, warm white #f0eee9. The .dark block is below, preserve actual values when reproducing. Refined guide uses dark surfaces with light foreground; avoid light muted surfaces with white text.

Grid/spacing: page max 1280px (80rem), centred; 16px mobile / 32px tablet insets, 56px / 64px / 80px original section padding. Tailwind breakpoints sm 640px, md 768px, lg 1024px, xl 1280px. Guide radius 12px. Base --radius 0.625rem, xl 1.4×. Use border/tonal contrast, no decorative elevation. Responsive one column below 768px. Accessible controls minimum 44px; high-contrast focus. Native details/summary, semantic tables, reduced motion. Keep state static unless interaction requires motion.

Design intent: refine the current help page, not a new identity. Calm, legible, spacious but useful. Preserve real wordmark, logo, source images, product CTA, content order and stable anchors. Use page-scoped CSS, a left-aligned hero, clear labelled size guidance and tables. No new images or video. No arbitrary card walls, gradients, glows, or decorative looping motion. TechDown gets normal/regular fit language and current Middels/Stor/Større sizing. Details/summary FAQ belongs immediately after the TechDown measurements. Keep global header and footer as source; product carousel retains actual product behavior.

Accessibility overrides all aesthetic defaults: WCAG 2.2 AA, readable contrast, semantic headings/links/tables, visible keyboard focus, 44px controls and no page-wide horizontal overflow. Horizontal scrolling is allowed only inside the named measurement-table region.
