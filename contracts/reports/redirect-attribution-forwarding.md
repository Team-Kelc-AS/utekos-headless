# Redirect attribution forwarding

Implementation date: 2026-09-20. Scope: the three storefront redirects in
`src/proxy.ts`. This is a query-name allow-list, not an event collector or a
claim of provider delivery.

## Contract

`src/lib/navigation/filterRedirectSearch.ts` validates decoded parameter names
against exact Zod enums, then copies each approved raw query segment supplied
to Proxy. The helper preserves case, percent encoding, order, duplicates and
empty values. Next.js can normalize URL encoding around Proxy (`%20` becomes
`+`, for example); the HTTP contract preserves decoded parameter values and
the order of values within repeated keys, not the incoming URL's raw bytes.
Unknown names are removed. Empty results produce no query marker. No values
are created, trimmed, truncated, logged, stored or sent to a provider here.
Downstream attribution/event validation still owns value validity. An allowed
name does not prove that its value is genuine or free of personal information.

| Group | Allowed names |
| --- | --- |
| UTM | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `utm_id` |
| Click identifiers | `dclid`, `epik`, `fbclid`, `gclid`, `gbraid`, `wbraid`, `msclkid`, `sc_click_id`, `ScCid`, `ttclid`, `twclid` |
| Existing campaign hierarchy | `campaign_id`, `campaign_name`, `adset_id`, `adset_name`, `ad_id`, `ad_name`, `hsa_cam`, `hsa_grp`, `hsa_ad` |

| Redirect | Additional functional names |
| --- | --- |
| NBCC referrer: `/` to `/nbcc` | None |
| `/magasinet/*` to `/magasinet/oppgradering` | None |
| `/skreddersy-varmen/layout[/…]` to `/skreddersy-varmen` | `variant`, `farge`, `storrelse`, `kjonn` |

The four landing selectors are consumed by
`resolveCommerceVariantFromSearchParams.ts` in both the server purchase section
and the client purchase logic. Normal requests, API/gateway routing, feed
rewrites, operator authentication and redirect statuses retain their existing
behavior. This does not filter all incoming site URLs or Next.js config redirects.

## Documentation checked

The following official sources were retrieved on 2026-09-20:

- [NextResponse redirect](https://nextjs.org/docs/app/api-reference/functions/next-response):
  modify the destination URL before calling `NextResponse.redirect`. Checked via
  Context7 and the installed Next.js 16.3.1 reference.
- [Zod validation](https://zod.dev/basics): `safeParse` returns a success/error
  result. Checked via Context7; names are validated without coercing values.
- [Google campaign URL parameters](https://support.google.com/analytics/answer/10917952):
  the UTM fields and case-sensitive campaign values. The Google documentation
  MCP required reauthentication, so the official page was opened directly.
- [Meta ClickID / fbc](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/fbp-and-fbc):
  `fbclid` comes from the page URL. Retrieved through Meta Social Technologies
  MCP. The query helper does not construct `fbc`; the accompanying Proxy capture
  now persists Meta cookies on the redirect response when needed.
- [Microsoft MSCLKID auto-tagging](https://learn.microsoft.com/advertising/bulk-service/account?view=bingads-13#msclkid-auto-tagging-enabled):
  `msclkid` is appended to the landing URL. Retrieved through Microsoft Learn
  MCP search and full-page fetch.
- [Snap Conversions API parameters](https://developers.snap.com/marketing-api/Conversions-API/Parameters):
  `sc_click_id` is sourced from the exact landing query parameter `ScCid`.
  SnapAds MCP exposes account/measurement reads, not documentation search;
  Context7 returned no official Snap library, so the official page was opened
  directly. Both requested names are forwarded unchanged; no alias is synthesized.

The complete 26-name policy is the operator-approved scope. Existing local
`clickIdSessionStore.ts` and `campaignAttributionSessionStore.ts` establish the
current consumers, including the `hsa_*` aliases. This work does not claim to
revalidate every provider's downstream schema or activate any advertising platform.

## Canonical Event tool

The current page tool is `canonical_event_context`, registered by
`src/lib/canonical-control/registerControlTool.ts`. Its local domain service,
`getCanonicalContext`, was queried for `page_view`; the result declared
`live_evidence: not_queried` and pipeline `evidence: source_only`.
The registration/execution and strict-output tests were also run.
Webcmd was unavailable in PATH, and the browser connector failed to load its
request-header policy. No authenticated production WebMCP invocation is claimed.

Utekos Shopify Platform MCP `describe_checkout_bridge` was called read-only.
It describes a development checkout bridge and is not authority for the
storefront redirect policy.

## Verification boundary

Initial redirect-only verification completed on 2026-09-20 (the accompanying
Proxy capture report records the subsequent 108-test release suite):

- 52 targeted tests passed, including the existing attribution stores and
  Canonical Control registration/strict-result contracts.
- `next typegen`, `tsc --noEmit`, targeted ESLint and `git diff --check` passed.
- `pnpm build` passed with 173 generated pages. It reported the existing
  Google Sans Flex fallback-font warning and local runtime-cache/region notices.
- The local production HTTP smoke passed six scenarios (three redirects,
  with and without approved parameters), including all 26 attribution names,
  repeated values and the four landing selectors.
- `tracking:gateway:smoke` passed against the same local production server:
  Stape loader HTTP 200, health HTTP 200 and `no-store, max-age=0`.
- The foreground verification server was stopped after the checks.

Tests cover all approved names on each destination policy, exact encoding,
unknown/PII-named parameter removal, encoded names and delimiters, duplicate
values, case sensitivity, malformed keys, landing selectors, status 307, no
query logging, and unchanged matcher/synthetic behavior. The updated HTTP check
also requires the new Proxy Meta cookies and private/no-store responses; cookie
creation is deliberately separate from query-name filtering.

Production deployment was explicitly authorized by the operator and still
requires the gates in `DEPLOYMENT.md`. This report does not assert production behavior, event
receipt, provider finality or attribution outcomes.

The runtime regression check is
`node scripts/tracking/verify-redirect-attribution.mjs http://127.0.0.1:3217`
against a local `next start` build. It checks all three redirects with all 26
attribution keys, duplicate click IDs, opaque values and unknown parameters,
then checks each redirect with only unknown parameters. It does not follow
redirects or execute browser tracking. It refuses non-local targets.
