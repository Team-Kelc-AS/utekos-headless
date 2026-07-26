# Canonical stale-events and near-real-time cutover — 2026-07-26

## Evidence classification

- **Documentation status:** verified against the local Meta documentation,
  Meta Business SDK/Parameter Builder contracts, Vercel Queue 0.4.0, Next.js
  16.2, Shopify Storefront Cart API, Google Data Manager and the current
  Microsoft UET CAPI guide.
- **Implementation state:** deployed and production-verified.
- **Production state:** application deployment
  `dpl_7EvERHHrH7pfAYK7jQcwMySZjD5W` is `READY`, owns `utekos.no`, and was
  built from exact Git SHA `3799e58ac90a4c0177d3bd6fba8a1d2ad3fd2ea2`.
- **Mutations performed:** isolated GTM workspace 141 changed only tag 153 and
  trigger 152, published as v133; v134 then removed GTM's redundant additional
  consent requirement while the tag's explicit Cookiebot marketing gate
  remained fail-closed. The app and queue runtime were deployed. No Supabase
  schema mutation, historical replay, campaign change or synthetic event was
  performed.

This file intentionally separates local correctness from provider freshness.
An old Events Manager timestamp for a low-volume genuine action is not itself a
delivery failure. The production gate requires a deliberately triggered real
action and a correlated chain of evidence.

## Root causes closed in the release

| Finding | Implemented correction |
| ------- | ---------------------- |
| `view_item_list` had no source | Product-card observer requires ≥50% continuous visibility for 1 second, dedupes each variant/list per page view and chunks at 20 items with increasing `impression_sequence`. |
| Accordion and quick-view existed only as historical names | Added strict canonical schemas, reporters, API routes, normalization, ledger/outbox acceptance and Google/Meta adapters. |
| Cart/category/hero/scroll/list events lacked Meta CAPI | Added exact Meta mappings and registered CAPI workers while preserving canonical IDs. |
| Cart decrement 3→2 emitted nothing | Reporting now waits for a successful Shopify Storefront response and uses the actual returned quantity delta. |
| Generic immediate batch could claim unrelated work and five-minute cron dominated latency | Acceptance returns only newly inserted attempt IDs after commit; Vercel Queue wakes an exact primary-key/provider claim. Cron remains retry/fallback. |
| Operational regressions were detected manually | Added a 15-minute Sentry health job with concrete attempt/publish/pending/dead-letter/p95 gates. |

## Event contracts

| Canonical name | Meta name | Source gate | Required event-specific context |
| -------------- | --------- | ----------- | ------------------------------- |
| `view_item_list` | `ViewItemList` | ≥50% visible for 1 continuous second | list ID/name, sequence, total count, currency/value/gross/tax and ≤20 complete items |
| `view_cart` | `ViewCart` | cart surface visible | complete canonical commerce context |
| `scroll_depth` | `LandingScrollDepth` | real threshold crossing | threshold and landing-page context |
| `view_category` | `ViewCategory` | category surface visible | category context |
| `hero_interact` | `HeroInteract` | real hero CTA interaction | CTA/hero context |
| `interact_with_accordion` | `InteractWithAccordion` | user-triggered PDP closed→open transition | resolved product/variant, accordion ID/title, `interaction_type=open`, sequence |
| `open_quick_view` | `OpenQuickView` | dialog open with product and selected variant resolved | full commerce context, source surface, open sequence; failed load emits nothing |

The Meta Pixel template uses the same exact name and canonical UUID as CAPI.
The provider mapper includes only available, consent-qualified `event_time`,
`action_source=website`, source URL, IP, user agent, `external_id`, `fbp`, `fbc`
and hashed contact fields. It does not create absent identifiers.

`select_item` and `add_to_wishlist` remain regression-covered but unchanged;
their prior stale timestamps can legitimately reflect low user volume.
`Purchase` is deliberately untouched.

## Queue and fallback contract

```ts
{
  schema_version: 1
  attempt_id: string
  adapter_key: RegisteredProviderAdapterKey
}
```

- Topic: `canonical-provider-dispatch-v1`.
- Idempotency: `${adapter_key}:${attempt_id}`.
- Retention: seven days.
- Region: Vercel auto-detection; project runtime is configured for `arn1`.
- Consumer claim: exact attempt primary key plus adapter provider/event.
- Provider-classified outcomes: stored as accepted/retry/dead-letter and queue
  callback acknowledged.
- Infrastructure outcome: thrown for Vercel redelivery after 15 seconds.
- Publish failure after commit: Sentry capture; collector remains `202`; cron
  recovers the durable pending row.
- Duplicate canonical acceptance: creates and publishes nothing.
- Fallback: `/api/cron/provider-outbox-dispatch` every five minutes.
- Native optional `cbor-extract` build: explicitly disabled; standard JSON
  transport requires no native binary. Existing `workflow` dependency remains
  untouched and unused by this path.

## Local verification record

| Gate | Result |
| ---- | ------ |
| Node runtime | Node.js 24.17.0 bundled project runtime |
| TypeScript | Passed: `tsc --noEmit` |
| Changed-file lint | Passed with zero errors/warnings for all changed and new TS/TSX/MJS files |
| Full repository lint | Existing baseline failure outside this release: 55,426 findings, dominated by vendored `.agents/skills`, generated UI/Supabase files and pre-existing utilities. No release lint finding remains. |
| Visibility/schema/sequence tests | Passed, including 50%/1s cancellation, re-entry dedupe and 21→20+1 chunking |
| Quick-view/accordion state tests | Passed |
| Remove-from-cart tests | Passed for full delete, 1→0, 3→2, rapid decrements and Shopify failure |
| Queue/exact-claim/fallback tests | Passed |
| Meta exact-name/event-ID/consent/identifier tests | Passed |
| Google new-event mapping tests | Passed |
| Health-job tests | Passed |
| GTM/app Pixel contract tests | Passed: 7/7; the app bridge and GTM template share the same inner mapping, including future dataLayer polling, consent gating and shared duplicate suppression |
| Full analytics regression suite | Passed: 147 client + 399 server + 25 API route tests = 571/571 |
| GTM template contract suite | Passed: 5/5 (576 total tracking-related automated tests) |
| Production build | Passed: Next.js 16.2.9, 130 static/PPR pages; new routes and queue handler included |
| MCP configuration gate | `mcp:build` and `mcp:doctor` passed; optional `CONTEXT7_API_KEY` and `TRENDS_MCP_BEARER_TOKEN` remain locally unset |
| Whitespace/patch gate | `git diff --check` passed |

## Local real-browser evidence

Playwright drove the actual Next.js development runtime with Shopify-backed
product data. This is local trigger/dataLayer evidence, not consented provider
delivery or production evidence.

| Flow | Observed result |
| ---- | --------------- |
| Product-list visibility | `frontpage_featured_products` emitted event ID `615e79d6-c017-422b-8f4c-50e38bca7c0b`, sequence 1, `total_item_count=3`, three complete items and `currency=NOK`. Scrolling away and back for more than one second left the event count at exactly one. |
| Quick-view first open | Event ID `c45daf0e-4cc0-4ad7-ac93-8e96566e97eb`, `source_surface=hytte_pricing`, sequence 1 and one complete item after the dialog/product/variant resolved. |
| Quick-view reopen | Event ID `29449186-7d65-4b01-9671-a97aa20e37e0`, same source surface, sequence 2. Keeping the closed modal instance mounted fixed the initially observed sequence reset. |
| Accordion first open | Event ID `b464bd42-52b8-40fb-b385-dade880c8701`, `accordion_id=materialer`, sequence 1, `interaction_type=open`, one item. |
| Accordion second open | Event ID `8f4fef01-3026-4404-a9fe-fbb1d2cdb58b`, `accordion_id=funksjoner`, sequence 2, `interaction_type=open`, one item. |
| Browser error gate | The first run exposed an unbound timer `Illegal invocation` in the new visibility tracker. Timer calls were bound through `globalThis`; the repeated visibility flow emitted correctly with no recurrence. Local Klarna messaging CORS noise is unrelated to tracking and expected for an unapproved localhost origin. |

## Production acceptance record

| Required evidence | Current value |
| ----------------- | ------------- |
| Published web-GTM version | `134`; v133 introduced the canonical mapping and v134 changed only the redundant GTM additional-consent setting. The in-tag Cookiebot gate remains authoritative. |
| GTM workspace / exact diff | Mapping: workspace `141`, tag `153`, trigger `152`. Polling parity is saved in draft workspace `143`; publication was blocked by an expired GTM OAuth token. The production app bridge does not depend on that draft. |
| Current repository hashes | `config/gtm/web-meta-pixel.html`: `894f52dd3efd351431f980b9e34ff74d6ba759f1891c66a45500217b3e87d3fc`; `public/analytics/meta-pixel-canonical-v1.js`: `a4a150d44b1d91827d364045f5c41b3af96e590b48062fa4ab05bbc276a58fed` |
| GTM rollback version | `133` is the immediate live-container rollback; `132` is the pre-cutover rollback. |
| Vercel deployment ID and exact Git SHA | `dpl_7EvERHHrH7pfAYK7jQcwMySZjD5W`; `3799e58ac90a4c0177d3bd6fba8a1d2ad3fd2ea2`; `READY`; aliased to `utekos.no`. |
| Previous READY deployment rollback | Immediate prior deployment `dpl_GYqWAxQA9WjrFKFFCjgmXXZt9Ty4`; server-only cutover baseline `dpl_6nJFntbtN7gVN6Wrz4EKgo6nQkkB`. |
| Queue trigger visible and first callback | Production logs show repeated `POST /api/queues/canonical-provider-dispatch 200`; exact rows completed seconds after collector acceptance, before the five-minute fallback window. |
| Representative event IDs | `scroll_depth` `707ac256-5699-45c7-a12e-6b5a480be13a`; `view_item_list` `5d162e4f-9416-4883-aad0-2787b4601a53`; `hero_interact` `b4216733-4644-423e-a7b5-40c7b585f731`; `view_category` `83f52d06-ab78-4a5e-a195-310b888d0da1`; `open_quick_view` `74cec7fd-81f6-4a7b-95b1-0b1c65d7cd01`; `interact_with_accordion` `95a22a5a-225c-4136-9f49-d4ff8a31deb6`; `view_cart` `8768c4c1-1778-4396-a99b-b21eab9c9f67`; 3→2 `remove_from_cart` `cb48d8fb-0fbb-416e-8d57-f83715a42a59`; `add_to_wishlist` `5d4c93ff-f8c5-4e97-a3ef-0c09b5a77e82`; `select_item` `2e07216e-1b98-4a8e-a75d-ec4b1e09fd74`. |
| Collector / ledger / exact-attempt correlation | All controlled events returned collector `202`, exist once in `marketing.event_ledger`, and have the expected exact Google/Meta attempts. No canonical event in the post-cutover health window lacked an attempt. |
| Meta `events_received=1`, trace and no messages | Every representative Meta attempt returned `events_received=1` on attempt one. Measured adapter latencies were 127–304 ms for the representative stale-event set. |
| Pixel/CAPI identical Meta name and ID | Live app-owned bridge proof: genuine PDP Materialer open emitted `InteractWithAccordion` with UUID `d51aa3ea-a427-4f8a-9098-005f77007626`; the captured `facebook.com/tr` POST had the same name and `eid`, complete commerce/accordion fields, while CAPI returned `events_received=1` with trace `A_2GZMmmYF3z8AlGEUWrcaV` in 250 ms. |
| Browser owner / duplicate protection | Same-origin `/analytics/meta-pixel-canonical-v1.js` initializes `fbq`, observes future canonical dataLayer entries, and shares `window.__utekosMetaPixelState.sent` with the GTM template. This was added after production proved that the GTM Custom HTML tag did not execute even though the live mapping was present. |
| Google Data Manager request IDs/status | Every controlled event created a validated executed request (`validate_only=false`). The first representative list/category/hero/quick-view/accordion requests were subsequently reconciled to provider `SUCCESS`; newer rows remain `accepted_unverified` until the existing status job confirms them. |
| Events Manager freshness/dedupe/source result | Meta's dataset API advanced browser freshness to `2026-07-26T15:40:07Z` and server freshness to `2026-07-26T15:41:17Z`. Event-level aggregate/Events Manager UI remained delayed at the immediate check. Matching name/ID is wire-proven; numeric overlap/dedupe UI remains a 7-/14-day verification gate. |
| Provider ACK p95 ≤60s; fallback ≤5m | First scheduled health cron returned `200` at `2026-07-26T15:45:30Z`. Green production sample: 190 accepted rows, p95 `5,750 ms`; zero initial pending rows over two minutes, zero recent dead letters and zero canonical events without an attempt. |
| 7-day quality result | Pending observation window; due 2026-08-02 |
| 14-day quality result | Pending observation window; due 2026-08-09 |

## Rollback and safety

- GTM rollback is v133 (or v132 for the complete pre-cutover state).
- Runtime rollback is `dpl_GYqWAxQA9WjrFKFFCjgmXXZt9Ty4`; the known
  server-only cutover baseline is `dpl_6nJFntbtN7gVN6Wrz4EKgo6nQkkB`.
- The queue trigger can be disabled without losing accepted events because the
  Supabase outbox and five-minute cron remain authoritative.
- No blind historical replay is permitted. No heartbeat events are permitted.
- Microsoft server events added by this Meta cutover remain disabled until the
  browser/server `pageLoadId`, VID/ID sync and `msclkid` contract is proven.
