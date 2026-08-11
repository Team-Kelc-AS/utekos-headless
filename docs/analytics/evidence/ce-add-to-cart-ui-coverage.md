# Evidence — AddToCart UI call-site coverage

**Date:** 2026-07-22  
**Start SHA:** `184086af7b5378522b59c40ac262ddd6898198fd`  
**Runtime tip SHA:** `a9c7b7b3cfdd425ba0a91f2bead1a8e7aa53196c`  
**Task:** SAFE — AddToCart UI call-site coverage (not CE-\*)  
**Conclusion:** `ATC_UI_CALL_SITE_COVERAGE_CLOSED_AND_LIVE_VERIFIED`

## Goal

Every UI that successfully adds a Shopify line to the cart reports
canonical `add_to_cart` exactly once after mutation success.

## Architecture

Shared helper
`src/lib/analytics/addProductLineAndReportAddToCart.ts` awaits
`addLines`, resolves `cartId`, then calls
`reportCanonicalAddToCart`. React wrapper:
`src/hooks/useCanonicalAddToCart.ts`.

Analytics remains call-site only (not in the XState cart machine)
to avoid double-firing paths that already report.

## Closed gaps (previously fire-and-forget `ADD_LINES`)

| Surface | File | Now reports via |
| --- | --- | --- |
| Product card quick-buy | `src/components/ProductCard/ProductCard.tsx` | `useCanonicalAddToCart` |
| Gaveguide grid | `src/app/gaveguide/components/ProductGridCard.tsx` | `useCanonicalAddToCart` |
| Empty-cart recommendation | `src/components/cart/EmptyCart/RecommendedItem.tsx` | `useCanonicalAddToCart` |
| Cart upsell | `src/components/cart/UpsellItem.tsx` | `useCanonicalAddToCart` |
| NBCC product cards | `src/app/nbcc/components/NbccProductCardActions.tsx` | `useCanonicalAddToCart` + full `ShopifyProduct` from parent |
| Mikrofiber purchase | `src/hooks/useMicrofiberLogic.ts` | `useCanonicalAddToCart` + server-fetched `utekos-mikrofiber` |

## Already-correct paths (unchanged)

- `src/hooks/useAddToCartAction.ts`
- `src/hooks/usePurchaseLogic.ts`
- `src/app/skreddersy-varmen/components/useLandingPurchaseLogic..tsx`

## Grep gate (2026-07-22)

UI `type: 'ADD_LINES'` outside mutation plumbing: **zero**.

Remaining `ADD_LINES` only in:

- `src/lib/state/createCartMutationMachine.ts`
- `src/hooks/useCartMutations.ts`

## Production deploy

| Field | Value |
| --- | --- |
| Deployment | `dpl_BD7FMaeaoiLzdDLiwhXY6yB3rHDz` |
| State | `READY` |
| Git SHA | `a9c7b7b3cfdd425ba0a91f2bead1a8e7aa53196c` |
| Aliases | `utekos.no`, `www.utekos.no`, `feed.utekos.no` |
| Inspector | https://vercel.com/utekos-marketing-group/utekos-headless/BD7FMaeaoiLzdDLiwhXY6yB3rHDz |

No Supabase migration required.

## Live verification — ProductCard path

Smoke:
`scripts/tracking/verify-productcard-add-to-cart-coverage.mjs`
against `https://utekos.no/` clicking
`[data-track=ProductCardFooterAddToCartClick]`.

| Check | Result |
| --- | --- |
| Shared UUID | `7f1a2c03-22b0-47b4-b42a-31d4021f6a18` |
| dataLayer `add_to_cart` | present |
| POST `/api/events/add-to-cart` | same UUID |
| Meta Pixel `/tr` AddToCart | same UUID |
| OpenBridge AddToCart | same UUID |
| Ledger `marketing.event_ledger` | accepted `add_to_cart` |
| Product | Utekos TechDown™ / `utekos-techdown` |

Provider outbox at accept time:

| Provider | Status | Note |
| --- | --- | --- |
| `meta` | `pending` | cron drain |
| `google` | `pending` | cron drain |
| `microsoft_uet` | `skipped_unqualified` | `missing_msclkid` (expected; smoke used fbclid only) |

Browser Meta Pixel + OpenBridge shared-ID proof is the coverage gate
for this SAFE task. Full three-provider CAPI accept was already proven
on the PDP `ModalAddToCart` path.

## Verification performed

- Unit tests:
  `pnpm exec tsx --test src/lib/analytics/addProductLineAndReportAddToCart.test.ts`
  → 3 pass
- Inventory grep for `ADD_LINES` and `reportCanonicalAddToCart`
- Production deploy READY on tip SHA
- Live ProductCard smoke `ok: true`
- Ledger row for smoke UUID

## Commits

1. `feat(analytics): add shared ATC report after cart line mutation`
2. `feat(analytics): add useCanonicalAddToCart hook`
3. `fix(analytics): report add_to_cart from product card and cart suggestion CTAs`
4. `fix(analytics): report add_to_cart from NBCC product cards`
5. `fix(analytics): report add_to_cart from mikrofiber purchase with real Shopify product`
6. `docs(analytics): record AddToCart UI coverage fix` (+ tip SHA note)
