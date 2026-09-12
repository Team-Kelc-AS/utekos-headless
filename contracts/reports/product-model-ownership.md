# Product and size model ownership — step 4

## Contract

`src/lib/products/productModelSchema.ts` owns the product and
variant fields. TypeScript types are inferred from these Zod
schemas. Narrow purchase, cart, card and Shopify transport types
reuse the shared fields; Shopify connections and transport-only
metafields remain at the API boundary. Public option keys have
one small shared schema, so client presentation code does not
import the complete product validator.

`buildProductModel` is the single public product builder.
Purchase UI, variant selection, analytics inputs and ProductGroup
JSON-LD consume the same flat variant fields: Shopify ID,
barcode, SKU, money and availability. JSON-LD derives its GTIN
field from the barcode at the output boundary. Shopify remains
authoritative for price, inventory and commerce identifiers.

`productPresentationDefinitions` owns public product names,
content and option mappings. Each product has one public handle.
Canonical paths and group URLs are derived from that handle;
option order comes directly from the options array. Independent
handle aliases and a second ordering array have been removed.

`src/lib/products/techDownSizes.ts` owns Liten, Middels, Stor and
Større, including visibility, historical input aliases, EU codes,
height guidance and measurements. Liten remains hidden. All nine
measurement rows and 27 public measurement values are derived
from this definition. Landing advice, the public guide, the
product guide, FAQ/FAQ JSON-LD, NBCC and assistant knowledge
reuse these values. Other product families keep their own sizes.

## Removed work

- The nested commerce object and duplicate public/product/variant
  names.
- `buildPresentedProductPurchaseModel`, which built and merged
  two models.
- `toPurchaseVariantFromPublicCommerce`, previously called during
  landing renders.
- The separate TechDown fetch/size-validation wrapper; size
  validation now runs once at the public model boundary.
- Separate TechDown size cards, measurement records, landing
  guidance and the unused duplicate product constants table.
- Repeated searches through the option definitions merely to
  recover their ordering or labels.

Public product pages build one model and pass its selected
variant directly to the purchase presentation. Shopify's original
selected options are kept only for its live adjacency query,
which can use different input labels.

## Payload and compatibility

The same builder includes optional gallery profiles only when
requested by the product page. Landing and JSON-LD callers omit
these unused details; this does not introduce another model,
cache or adapter. A regression test checks that purchase fields
and JSON-LD are identical with and without profiles. Live
TechDown data measured 4,691 bytes of JSON without profiles and
9,000 bytes with them. This is a payload comparison, not a
page-load benchmark or a comparison against the previous release.

Local inspection caught gallery images with `altText: null`,
although the old transport type claimed this was a string. The
existing purchase mapper now normalizes missing alt text to an
empty string before validation, preserving the gallery's existing
fallback behavior. This case has its own regression test. The
final build is checked for product-validation and JSON-LD
omission errors as well as its exit status.

The full ESLint run also exposed an existing synchronous state
update in `DeferredKlarnaOnSiteMessaging`. Its immediate-load
cases now schedule a cancelable animation-frame callback. The
intersection threshold and `lazyOnload` strategy remain intact.
This is an isolated correction for the required lint gate.

## Preserved steps 1–3

File hashes were compared with the snapshot at the start of step
4: Proxy, server A/B assignment, `getProduct`,
`getFeaturedProducts`, recovery cache and catalog invalidation
are unchanged. The stable MDX Suspense tree is unchanged. The
landing resolver retains React request deduplication and the
approved error handling; only its model import/call changes.

Native history replacement remains the landing variant-selection
mechanism. Variant IDs, readable links, legacy size aliases,
attribution parameters, hash and quantity handling are preserved.
No product cache is added by the model builder. All five live
product API reads returned `no-store`.

## Verification

Local verification on 2026-09-12: Node 24.17.0, pnpm 11.24.0,
Next.js 16.3.1, React 19.2.8 and TypeScript 6.0.3.

| Check                             | Result                                                                                              |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| Production build                  | All 170 routes; no product Zod errors or JSON-LD failure/omission events                            |
| TypeScript                        | `tsc --noEmit` passes                                                                               |
| Full ESLint                       | Zero errors; three pre-existing warnings outside the changed model code                             |
| Existing server/cache/Proxy tests | 64 pass, including the original 21 Proxy/experiment tests                                           |
| Product API tests                 | 4 pass                                                                                              |
| Landing/model/tracking tests      | 48 pass, including the previous 38 and 10 new model regressions                                     |
| Other model/guide/assistant tests | 24 pass                                                                                             |
| Guide/knowledge contract tests    | 3 pass                                                                                              |
| PDP metadata/JSON-LD/option tests | 19 pass                                                                                             |
| Total                             | 162 pass; zero failed, skipped or cancelled. All previous 106 are included                          |
| Prerender inspection              | Public/current/legacy retain hero, eager image, canonical URL and correct assignment                |
| Actual product data               | All five families validate with and without gallery profiles; sizes and API cache headers preserved |

Browser inspection used the local production build: public and
current landing, legacy at 390 px, TechDown PDP, Comfyrobe PDP
and the public size guide. Current and legacy variant changes
generated zero document/RSC requests and retained
attribution/hash. Reload and back navigation preserved the
selected variant. ProductGroup JSON-LD showed the same three
public TechDown sizes and prices as the purchase UI. The public
measurement table retained all 27 values and proper column/row
headers. Product views had no console errors during inspection.

The Next test server must use `localhost` consistently for its
configured hostname and URL. Binding it to `127.0.0.1` while Next
normalizes rewrite URLs to `localhost` makes its internal A/B
rewrite look external and can cause a local redirect loop. The
inspection server uses `-H localhost`; application Proxy code was
not changed to accommodate this test setup.

Tests run directly with tsx, without delegated agents. Server
tests use
`NODE_OPTIONS='--conditions=react-server --import=./scripts/next/register-server-test.mjs'`.
Client tests omit `--conditions=react-server`. Bracket-path tests
and the guide knowledge test run directly/through `require` to
avoid Node/tsx glob and static-image loader differences.
Execution logs are in `/tmp/utekos-step4-model-check`.

Temporary test cookies were expired, viewport overrides and
network filters were reset, and the local test server was
stopped.

No deployment, provider setting change or step 5 implementation
is included.

## Official documentation checked

- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components),
  including installed 16.3.1 documentation about serialized
  props.
- [TypeScript indexed access types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html),
  checked through Context7.
- [Zod schema inference and parsing](https://zod.dev/basics) and
  [Zod 4](https://zod.dev/v4), checked through Context7.
- [Shopify Storefront ProductVariant 2026-07](https://shopify.dev/docs/api/storefront/2026-07/objects/ProductVariant)
  and
  [product query](https://shopify.dev/docs/api/storefront/2026-07/queries/product),
  checked through Shopify MCP.
- [Google product variant structured data](https://developers.google.com/search/docs/appearance/structured-data/product-variants),
  checked through Context7.
- [MDN Intl.ListFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat)
  and
  [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame),
  checked through MDN MCP.
