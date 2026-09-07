# Extractable components

## UtekosHeader
- Source: `src/components/header/Header.tsx`
- Category: layout
- Description: Top bar with white Utekos wordmark (desktop), icon (mobile), search, customer service, basket and menu.
- Extractable props: homeHref (string, default https://utekos.no/)
- Hardcoded: Exact public brand image URLs after upload, Lucide icon names, labels, colors, spacing, breakpoint visibility.

## UtekosBreadcrumbBar
- Source: `src/components/navigation/UtekosBreadcrumbBar.tsx`
- Category: layout
- Description: Breadcrumb between header and help page.
- Extractable props: homeHref (string, default https://utekos.no/)
- Hardcoded: Forsiden / Størrelsesguide labels, chevron, transparent surface.

## UtekosFooter
- Source: `src/components/footer/components/Footer.tsx`
- Category: layout
- Description: Four navigation columns, newsletter block, payment methods and copyright.
- Extractable props: none
- Hardcoded: Source menu labels/URLs, support contact and legal address, real payment logo asset.

## Button / Card / Table / Badge
- Source: `src/components/ui/`
- Category: basic
- Description: Existing reusable primitives; inline them in drafts rather than extracting.
- Extractable props: none
- Hardcoded: All source styles and typography.
