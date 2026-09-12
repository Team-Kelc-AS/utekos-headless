# Product cache ownership — step 3

## Scope

Full Shopify product records used by `/skreddersy-varmen`,
product pages, product metadata, Comfyrobe, Mikrofiber, NBCC and
the public product API. The featured-products batch shares the
same recovery store. Product presentation, size mappings, Proxy
assignment and client variant selection are unchanged.

Product cards, related-product lists and collection queries are
different projections with their existing cache policies; they do
not wrap the single-product read.

## Before

The landing resolver used React request deduplication, followed
by a remote commerce-model cache, a remote product cache and a
manual one-hour Runtime Cache. The manual cache could satisfy a
Next.js revalidation with an older record. Several other product
consumers also wrapped `getProduct` in an additional cache. The
product API added independently timed browser/CDN caching.

## Current contract

| Responsibility                            | Owner                                              | Policy                                                                                            |
| ----------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Request deduplication on the landing page | React `cache` in `resolveSkreddersyVarmenCommerce` | Current render/request only                                                                       |
| Shared single-product cache               | `getProduct`, `use cache: remote`                  | `products`: client stale 300 s, server revalidate 900 s, expire 3,600 s                           |
| Shared featured-products query            | `getFeaturedProducts`, `use cache: remote`         | Same product profile; one aliased Shopify query, no nested product cache                          |
| Shopify transport                         | Storefront gateway                                 | Explicit `cache: 'no-store'`; existing 8 s deadline                                               |
| Recovery snapshot                         | `shopifyProductRuntimeCache`                       | Validated successful records only; retained up to 24 h; read only after a transient fetch failure |
| Recovery/error result in Next             | Product cache boundary                             | Client stale 300 s, server revalidate 30 s, expire 300 s                                          |
| Public product API response               | `/api/products/[handle]`                           | `Cache-Control: no-store`; reads the shared server product cache                                  |

Revalidation is demand-driven: the next request after
`revalidate` triggers refresh. `expire` requires regeneration
rather than continuing to serve the expired entry. The client
router and the prerendered page shell remain framework-managed
caches; they are not additional application-owned product stores.

Commerce conversion and page-specific product wrappers no longer
declare their own cache lifetimes. React request deduplication is
retained; it is not a persistent cache and does not extend data
age.

## Failure and invalidation behavior

- A healthy cache miss always fetches Shopify, validates the
  result and updates the recovery snapshot. It never reads a
  manual fresh product cache or reads the fallback before the
  fetch.
- Timeout, network failure, throttling and retryable HTTP
  failures can use the last valid snapshot. Authentication/query
  errors and invalid product payloads remain errors.
- Snapshot validation includes structure, requested handle and
  timestamp. Future timestamps and expired snapshots are
  rejected. The final 300 seconds of the 24-hour retention window
  are reserved for the short Next recovery entry. Reusing a
  fallback never refreshes its original timestamp or retention.
- If no valid snapshot exists, the landing resolver returns
  `null`: informational content remains and the purchase area
  explains its temporary unavailability. No invented price or
  stock is shown.
- Expected backend failures are serialized as results inside the
  private Next cache boundary. The public product getter throws
  the application error outside that boundary, where the landing
  resolver can handle it. This avoids storing an errored RSC
  stream that can otherwise make prerendering return HTTP 500
  despite a caller catch. `unstable_rethrow` preserves Next's
  internal prerender cancellation.
- Recovery values still revalidate after 30 seconds, but `expire`
  and `stale` remain at 300 seconds. Next 16.3.1 excludes
  shorter-lived entries from prerenders/the App Shell. Keeping
  these thresholds prevents an outage from removing the landing
  hero from its static shell. A browser may retain a prefetched
  recovery state for up to five minutes; reload or server
  navigation can obtain newer data.
- Both A/B purchase areas retain their Suspense boundary when
  commerce is unavailable. Only the content inside that boundary
  changes, so React can resume the prerendered tree without a
  structural mismatch.
- An authoritative missing product removes its recovery snapshot.
  Updates invalidate Next product tags using `max` and preserve
  the recovery store. Deletes purge product/related recovery tags
  before notifying Next. The existing `seconds` deletion profile
  is retained because of the documented Next 16.3.1
  immediate-expiry regression already referenced in
  `revalidateProductCatalog`.
- The Runtime Cache namespace stays compatible with existing
  valid snapshots. Old `product:handle:*` entries are no longer
  read or written and expire under their old TTL.

## Documentation

- Installed official Next.js 16.3.1 docs in
  `node_modules/next/dist/docs`, checked against Context7 and
  Vercel MCP.
- [Next.js use cache: remote](https://nextjs.org/docs/app/api-reference/directives/use-cache-remote)
- [Next.js cacheLife](https://nextjs.org/docs/app/api-reference/functions/cacheLife)
- [Next.js prerendering thresholds](https://nextjs.org/docs/app/api-reference/functions/cacheLife#prerendering-behavior)
- [Next.js revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [Next.js expected errors](https://nextjs.org/docs/app/getting-started/error-handling)
- [Next.js unstable_rethrow](https://nextjs.org/docs/app/api-reference/functions/unstable_rethrow)
- [Vercel Runtime Cache](https://vercel.com/docs/runtime-cache)

## Local verification

Verified on 2026-09-12 with Node 24.17.0, pnpm 11.24.0 and the
installed Next.js 16.3.1 / React 19.2.8:

| Check                                                           | Result                                                                                                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Production build                                                | Passed, all 170 routes generated                                                                                                       |
| TypeScript `tsc --noEmit`                                       | Passed                                                                                                                                 |
| ESLint for changed TypeScript/JavaScript and `git diff --check` | Passed                                                                                                                                 |
| Server tests                                                    | 64 passed: 43 cache, gateway and resolver tests plus the 21 existing Proxy/experiment tests                                            |
| Product API tests                                               | 4 passed                                                                                                                               |
| Commerce, landing, fallback, LCP and tracking tests             | 38 passed                                                                                                                              |
| Total focused unit/contract tests                               | 106 passed, zero failed/skipped                                                                                                        |
| Prerender inspection                                            | Public, current and legacy routes retain hero heading/image, canonical and assignment before failure, after failure and after recovery |

The server tests run with
`NODE_OPTIONS='--conditions=react-server --import=./scripts/next/register-server-test.mjs'`
and `pnpm exec tsx --test`. The helper matches Next's server
navigation alias and provides static image imports for direct
Node tests. Client tests run without the `react-server`
condition. The four API tests run directly with
`pnpm exec tsx 'src/app/api/products/[handle]/handleProductGet.test.ts'`
under the server options, avoiding bracket-path glob
interpretation.

Runtime inspection used the production build on localhost, signed
local-only product update invalidations and an injected Shopify
transport timeout. No backend records were changed:

- Normal cache hits return the same product; two warm product API
  reads cause zero additional Shopify requests. Shopify transport
  and product API response cache settings are both `no-store`.
- A timeout with a valid reserve returns the product and logs the
  last-good recovery event. A cold failure without a reserve
  returns HTTP 502 from the API and HTTP 200 from the landing
  page, with readable informational content and the unavailable
  purchase state.
- Both A/B assignments and the consent-ineligible public route
  were tested twice during the cold failure. All preserved the
  heading, correct assignment and fallback without React resume
  errors.
- Restoring the backend refreshes product data and restores
  purchasing. Desktop/current and mobile/legacy variant selection
  retain the public URL, UTM parameters and hash, with zero
  document/RSC requests on selection. Reload and back navigation
  retain the selected size.
- Browser console errors were empty during the fallback and
  recovery checks. Test cookies, viewport overrides and temporary
  tabs were removed after inspection.

Vercel Runtime Cache uses its in-memory fallback locally. These
checks verify cache ownership, invalidation and failure behavior,
not measured latency or sharing across production regions.

No production deployment or provider configuration change is part
of this step.
