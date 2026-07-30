# PDP server-first baseline (KRI-6)

Baseline date: 2026-07-28

Reviewed against `origin/main`: 2026-07-30

Historisk runtime-baseline commit:
`9a6452c46683a5017499c115534b9b568246b1c5`

Gjeldende statisk guardrail-seed:
`cb44ec3dae284d73947bf2c569666addbc3dc2cc` (PR #88, produksjon)

Entry route: `src/app/produkter/[handle]/page.tsx`

This is the locked guardrail for the PDP server-first work
package (KRI-5). Runtime measurements remain anchored to the
historical pre-refactor commit. The static source-graph snapshot
is seeded from the production PPR commit so unrelated, reviewed
cart-security modules do not make the guardrail fail before the
PDP work starts. KRI-7 through KRI-10 must still remove all six
PDP hard-gate violations. No production code is changed by this
baseline.

## Måleverktøy

`pnpm pdp:baseline` walks the real module graph from the product
route entry with `ts-morph` and classifies every reachable source
module as server or client using a conservative model of the
React Server Components boundary:

- A `'use client'` module and everything it imports is client
  code.
- A `'use server'` module is not bundled into the client; the
  client only receives an action reference.
- Type-only imports are excluded, because they never reach the
  browser.

Commands:

| Command                    | Purpose                                       |
| -------------------------- | --------------------------------------------- |
| `pnpm pdp:baseline`        | Print the current boundary report             |
| `pnpm pdp:baseline --json` | Machine-readable report incl. import chains   |
| `pnpm pdp:baseline:write`  | Re-lock `scripts/pdp/baseline.json`           |
| `pnpm pdp:baseline:check`  | Fail if the boundary or hard gates regress    |
| `pnpm pdp:baseline:test`   | Unit tests for the analyzer itself (14 tests) |

`pnpm pdp:baseline:check` exits non-zero when client bytes grow,
the client module count grows, a new `'use client'` boundary
entry point appears, or a new hard-gate violation is introduced.
This was verified by injecting a `ShopifyProvider` import into
`ProductPageView.tsx`: the check failed with exit code 1 and
reported the new `global-shopify-provider` violation, then passed
again after revert.

## Baseline-tall

| Målepunkt                                         | Historisk KRI-6 | Gjeldende guardrail |
| ------------------------------------------------- | --------------- | ------------------- |
| Server modules reachable from the route           | 62              | 64                  |
| Client modules reachable from the route           | 203             | 206                 |
| Client source bytes (uncompressed, pre-bundling)  | 484.6 kB        | 487.5 kB            |
| Server → client boundary entry points             | 2               | 2                   |
| Distinct third-party packages on the client graph | 27              | 27                  |
| Hard-gate violations                              | 6               | 6                   |

Forskjellen på tre klientmoduler og 2,9 KiB skyldes utelukkende
PR #88s validering av Shopify cart-ID-er og feilgrense:

- `src/lib/cart/parseShopifyCartId.ts`
- `src/lib/cart/shopifyPublicCartIdSchema.ts`
- `src/lib/errors/ShopifyApiError.ts`

Dette er ikke PDP-refaktorering. Boundary entry points,
tredjepartssettet og de seks kjente PDP-bruddene er uendret.

Boundary entry points today:

- `src/app/produkter/[handle]/components/ProductPageController.tsx`
- `src/components/frontpage/IntersportSection/NewProductInStoreNotice.tsx`

The five largest client modules:

| Bytes   | Module                                                      |
| ------- | ----------------------------------------------------------- |
| 30.5 kB | `src/db/data/products/product-page-content.ts`              |
| 12.7 kB | `src/components/ProductCard/ProductCard.tsx`                |
| 12.6 kB | `src/app/produkter/[handle]/components/ProductPageView.tsx` |
| 10.7 kB | `src/components/product-waitlist/SoldOutWaitlistDialog.tsx` |
| 9.7 kB  | `src/components/jsx/SizeSelector.tsx`                       |

`client source bytes` counts source, not the emitted bundle. It
is a stable, environment-independent proxy for the size of the
hydrated subtree, and it is the number `--check` guards. It is
**not** a substitute for the route-JS measurement required by
KRI-6; see _Blokkert verifikasjon_.

## Hard-gate-brudd ved baseline

Each violation maps to the sub-issue that is expected to remove
it.

| Gate                       | Location                                                                    | Owner         |
| -------------------------- | --------------------------------------------------------------------------- | ------------- |
| `dehydrated-product-query` | `AsyncProductContent.tsx:3`                                                 | KRI-7         |
| `product-query-client`     | `AsyncProductContent.tsx:7`                                                 | KRI-7         |
| `client-product-refetch`   | `useProductPageData.ts:3`                                                   | KRI-7         |
| `server-action-as-queryfn` | `productOptions.ts:8` (`getProductAction`)                                  | KRI-7         |
| `server-action-as-queryfn` | `productOptions.ts:20` (`getProductsAction`)                                | KRI-7         |
| `full-product-into-client` | `ProductPageController.tsx:12` (`initialRelatedProducts: ShopifyProduct[]`) | KRI-8 / KRI-9 |

All six must read 0 before KRI-11 can close.

Note on `productOptions.ts`: a repo search at this commit finds
exactly two callers of `productOptions(handle)` —
`AsyncProductContent.tsx:80` and `useProductPageData.ts:20`, both
on the PDP — and **no** caller of `allProductsOptions`. Both
query factories are therefore removable by KRI-7 rather than
needing to be preserved for another surface, but `pnpm knip`
should confirm this before deletion.

## Observerte duplikater i dataeierskap

Measured by reading the graph, these are the concrete
duplications the refactor should collapse:

1. The product is fetched server-side by
   `getCachedProductPageData` and seeded into the TanStack cache
   as the **raw** product, while `useProductPageData` re-derives
   the display product client-side and can refetch it through the
   `getProductAction` Server Action.
2. Metafield reshaping and the `utekos-techdown` size filtering
   run both in `AsyncProductContent` and again in
   `useProductPageData`.
3. `ProductJsonLd` and `ProductBreadcrumbJsonLd` each call
   `getProduct` independently of `getCachedProductPageData`, on a
   different cache profile (`cacheLife('max')` vs
   `cacheLife('products')`).
4. `fetchProductOptions` uses `cache: 'no-store'`, so every PDP
   request hits the Storefront API for the option graph. This is
   the KRI-10 target.
5. `src/db/data/products/product-page-content.ts` — 30.5 kB of
   purely static product copy — is shipped to the browser solely
   because `ProductPageView` is a Client Component. This is the
   single clearest KRI-9 win.

## Budsjett

Hard targets, enforced by `pnpm pdp:baseline:check` where static
analysis can see them:

- 0 authoritative product refetches in the browser after mount
- 0 dehydrated TanStack product queries on the PDP
- 0 Server Actions used as a TanStack `queryFn` on the PDP
- 0 full product objects crossing into the purchase island
- no new global Shopify/product/cart provider
- no increase in client module count or client source bytes

Steering targets, which require runtime measurement:

- at least 20 % lower route-specific client JavaScript
- at least 50 % less serialized product/hydration data
- at least 20 % less scripting/hydration time in lab
- no CLS regression; no more than +5 % on LCP or TBT

## Runtime verification status

The historical browser/runtime baseline remains locked to its
recorded commit and production deployment. On 2026-07-30 the
static analyzer was rerun on production commit `cb44ec3`: all 14
analyzer tests passed, 206 client modules and the same six
hard-gate violations were found, and the source-graph snapshot
was re-seeded at 499,221 bytes. `pnpm pdp:baseline:check` passes
against that production seed.

The current environment can render the PDP with Storefront
credentials and a browser. Runtime measurements are handled by
`scripts/perf/measure-pdp-baseline.mjs`; this source-graph
analyzer must not be presented as emitted bundle size, network
cost, or runtime proof. Storefront API call counts and
per-function cache HIT/MISS/STALE still require server-side
instrumentation on a controlled Preview deployment.

## Rekkefølge

KRI-12 is implemented and production-verified through PR #88: PPR
resume decompression, cart identity/cookie ownership and the
Server Action boundary are hardened. PR #74 must therefore not be
merged separately. The remaining server-first sequence is KRI-7 →
KRI-8 → KRI-9 → KRI-10, then KRI-11 for combined verification and
controlled rollout.

## Rollback

This baseline adds only `scripts/pdp/` and this document; nothing
is wired into `prebuild`, `build` or CI, so no runtime behaviour
changes. Reverting the commit removes the guardrail and nothing
else.
