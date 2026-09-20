# Proxy and Meta event context

Assessment and local implementation: 2026-09-20. The operator has explicitly
authorized implementation and deployment. This pre-release report records local
evidence, not completed deployment or provider finality. No GTM, Shopify, database
or provider-configuration mutation is included.

## Implemented

`ensureCanonicalMetaBrowserIds` previously called Parameter Builder only when
`fbp` or `fbc` was missing. A different `fbclid` in the observed page URL could
therefore coexist with an old `fbc` when both cookies already existed.

The function now also invokes the existing `processRequestFromContext` adapter
when the observed URL click differs from the existing `fbc` click. Document URL
retains priority over API request URL. The existing marketing-consent guard,
canonical event identity, provider dispatch ownership and persistence path are
unchanged. A persisted click alone does not trigger this new refresh condition.

Tests establish that a new URL click updates `fbc`, preserves an existing
Parameter Builder `fbp`, preserves case, and reaches storage input, response
`Set-Cookie` and normalized Meta payload consistently. Repeating the same click
with complete cookies leaves cookie values and timestamps unchanged and emits
no cookie writes. Denied marketing still returns no Meta identifiers/cookies.

The helper is now also used by `captureProxyMetaCookies` before document routing.
`acceptCanonicalPageView` retains its existing use of the same helper. This is
not an audit of every event acceptance path.

Repeated `fbclid` query keys now use the first value consistently with existing
canonical/browser `URLSearchParams.get` readers. The Parameter Builder adapter
previously selected the last value via `Object.fromEntries`. Two regressions
failed before this correction and now cover identical capture and no repeat
cookie writes. Redirects still preserve all original repeated query values.

## Field ownership

| Field | Source and treatment | Current inspected owner |
| --- | --- | --- |
| `fbclid` | Observed URL click; preserve case. Input to `fbc`, not a replacement for it. | `ensureCanonicalMetaBrowserIds`, `processMetaParameterContext` |
| `_fbc`, `_fbp` | Incoming first-party cookies; CAPI keys are `fbc`, `fbp`, without underscores and without hashing. Use Parameter Builder for generation/refresh. | Proxy capture, parameter-context API, PageView accept, `buildMetaUserData` |
| `client_ip_address` | Actual browser request IP, not the server IP or a browser JSON assertion. Do not hash. | `ipAddress(request)` in the PageView API; canonical normalization replaces payload IP |
| `client_user_agent` | Browser request `User-Agent`, not a made-up device description. Do not hash. | PageView API request context; normalization replaces payload UA |
| `fb_login_id` | Actual Meta app-scoped Facebook Login identity. Never derive from click IDs or browser IDs. | Existing encrypted identity-cookie enrichment and `buildMetaUserData` |
| `content_type`, `contents`, `content_ids` | Real event-specific catalog variant IDs, quantities and prices. `product` for the inspected variant mapping. | `mapCanonicalViewItemToMeta` and commerce event owners, not Proxy guesses from a pathname |
| `event_name` | Canonical action mapped to the provider name, e.g. `page_view` → `PageView`. | Existing Meta mappers |
| `event_time` | Actual event occurrence; convert canonical time to Unix seconds for CAPI. Do not replace with Proxy/dispatch time. | Existing Meta mappers |
| `event_id` | Same event identity across browser/server for deduplication. Not the per-request edge correlation ID. | Canonical event producer, preserved by acceptance and mapping |
| `event_source_url`, `referrer_url`, `action_source` | Actual event page/referrer and website origin. | `buildMetaRequestContext`, existing mapper `website` setting |
| `external_id`, customer match fields | Existing consistent first-party identity and customer-provided data, with documented normalization/hashing. | `buildMetaUserData`; no new identity minted in Proxy |
| `value`, `currency` | Authoritative commerce amounts and currency, not inferred from the landing path. | Existing commerce event mappings |

These are code-level ownership findings, not proof of live provider receipt,
matching, attribution or purchase coverage.

## Proxy capture and field boundary

Current `continueDocumentRequest` forwards request headers internally through
`NextResponse.next({ request: { headers } })`. A regression test using actual
`NextRequest` objects verifies that cookies and UA survive this boundary on `/`,
`/produkter` and `/skreddersy-varmen`, without corresponding public response
headers or a redirect. Existing complete Meta cookies are not rewritten. This
test is not a production browser trace.

Existing cookies therefore do not need to be copied into URL parameters or
duplicated in custom public headers. New cookie capture on eligible GET document
requests now creates missing `_fbp` and creates/refreshes `_fbc` when an actual
URL `fbclid` is available. Organic visits do not manufacture a click ID.

Validated new values are written to `request.cookies` before forwarding and to
`response.cookies` for browser persistence, including all three Proxy redirects.
Cookies use path `/`, `SameSite=Lax`, HTTPS `Secure`, SDK-provided lifetime up to
90 days, and domain `utekos.no` on that domain/subdomains; other hosts remain
host-only. They are browser-readable for the existing tracking integration.
Responses that write these cookies receive `private, no-store, max-age=0`.

API, tracking gateway, operator/control, infrastructure, feed, static asset,
RSC, prefetch, non-GET and verified synthetic requests do not create these cookies.
Oversized inputs are rejected before mutation; unexpected capture errors log a
constant diagnostic without raw IDs or URLs and preserve navigation. No SDK
client-IP capture is requested, so this path does not add an IP-address cookie.

UTM/click/campaign query values remain available through the URL and the separate
26-name redirect policy. Existing cookies, UA and other request headers continue
upstream internally. This change does not create a duplicate universal context
cookie, append identifiers to every internal link, or manufacture event-specific
content, event IDs/times, Facebook Login IDs or customer identity in Proxy.

The current `resolveTrackingAuthorization.ts` returns constant grants and does
not consult Cookiebot. The local Canonical Event service explicitly declares
`operator_policy` and `cookiebot_state: not_used_for_tracking_authorization`.
The operator explicitly directed that this existing all-granted authorization
policy remain unchanged and that GTM/Shopify configuration be handled separately.
Proxy uses that existing resolver; no consent defaults or loader configuration
were changed. This report is not a legal-compliance determination.

The local service behind `canonical_event_context` was invoked for `page_view`.
It returned `live_evidence: not_queried`; no authenticated production WebMCP
invocation or provider verification is claimed.

## Official documentation checked

Retrieved via Meta Social Technologies MCP and Context7, with complete official
Markdown fetched directly where the Meta MCP returned excerpts only:

- [Meta fbp/fbc](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/fbp-and-fbc)
- [Meta customer information parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters)
- [Meta server event parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/server-event)
- [Meta standard/custom parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/custom-data)
- [Meta external ID](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/external-id)
- [Official Parameter Builder Node README](https://github.com/facebook/capi-param-builder/blob/main/nodejs/README.md)
- [Next.js Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [NextResponse](https://nextjs.org/docs/app/api-reference/functions/next-response)
- [MDN Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [MDN URLSearchParams.get](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/get)

The requested Next.js document set was read previously in this thread; the
installed Next.js 16.3.1 Proxy guide and NextResponse reference were also checked.
No cache, URL-normalization, runtime, root-layout or framework setting changed.

## Verification

- New-click regressions failed before the fix (2 failures), then passed.
- 108 targeted tests passed, including Proxy/header/cookie behavior, redirect policy,
  Parameter Builder, canonical acceptance, HTTP handler, Meta mapping, trusted
  IP/UA normalization and Facebook Login enrichment.
- `next typegen`, `tsc --noEmit`, `typecheck:edge-functions`, targeted ESLint and
  `git diff --check` passed. An initial missing test-only TypeScript narrowing
  was corrected before final typecheck and build.
- `pnpm build` passed. Local region/cache and slow Shopify catalog-read warnings
  were observed; no measured performance improvement is claimed.
- A subsequent build stopped on a Shopify `getProduct` 8-second timeout; the
  controlled retry completed successfully. No timeouts or build checks were
  disabled, and no upstream configuration was changed.
- Foreground local production server: the new cookie HTTP smoke passed initial
  capture, isolated browser IDs, repeat preservation, new/same clicks, all three
  redirects, prefetch exclusion and non-exposure of internal headers. Six redirect
  attribution HTTP scenarios also passed, now including Meta-cookie persistence.
- Local gateway smoke returned loader 404 with the localhost forwarded host;
  the same build passed with `Host: utekos.no` (loader/health 200, health no-store).
  The existing production gateway also passed. Gateway implementation is unchanged.
- Local browser rendered the product list, stored `_fbp`, and reported no
  error/warning console entries at inspection. This is not provider verification.
- HTTP probes do not execute browser JavaScript or submit canonical events.
  Canonical storage is stubbed in unit/integration tests.

Production verification follows the authorized release: require exact Git/Vercel
SHA and READY/aliases, run `verify-proxy-meta-cookies.mjs https://utekos.no
--production`, gateway smoke, browser checks and relevant runtime logs. Provider
receipt, finality, matching and attribution must not be inferred from these checks.
