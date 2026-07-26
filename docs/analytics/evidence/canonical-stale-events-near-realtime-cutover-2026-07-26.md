# Canonical stale-events and near-real-time cutover — 2026-07-26

## Evidence classification

- **Documentation status:** verified against the local Meta documentation,
  Meta Business SDK/Parameter Builder contracts, Vercel Queue 0.4.0, Next.js
  16.2, Shopify Storefront Cart API, Google Data Manager and the current
  Microsoft UET CAPI guide.
- **Implementation state:** release candidate; web-GTM mapping activated.
- **Production state:** GTM v133 live; application not deployed.
- **Mutations performed:** isolated GTM workspace 141 changed only tag 153 and
  trigger 152, then published as v133. No Vercel deployment, Supabase
  schema/data mutation, event replay, campaign change or synthetic event.

This file intentionally separates local correctness from provider freshness.
An old Events Manager timestamp for a low-volume genuine action is not itself a
delivery failure. The production gate requires a deliberately triggered real
action and a correlated chain of evidence.

## Root causes closed in the candidate

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
| Full repository lint | Existing baseline failure outside this candidate: 55,426 findings, dominated by vendored `.agents/skills`, generated UI/Supabase files and pre-existing utilities. No candidate lint finding remains. |
| Visibility/schema/sequence tests | Passed, including 50%/1s cancellation, re-entry dedupe and 21→20+1 chunking |
| Quick-view/accordion state tests | Passed |
| Remove-from-cart tests | Passed for full delete, 1→0, 3→2, rapid decrements and Shopify failure |
| Queue/exact-claim/fallback tests | Passed |
| Meta exact-name/event-ID/consent/identifier tests | Passed |
| Google new-event mapping tests | Passed |
| Health-job tests | Passed |
| GTM template contract tests | Passed |
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
| Published web-GTM version | `133` — `Meta canonical realtime cutover - 2026-07-26` |
| GTM workspace / exact diff | `141`; only tag `153` and trigger `152`; Quick Preview compiled successfully |
| GTM template SHA-256 | `3cb06efffdeef4240549b3b110063e3f829a40cccff1091cf88d669584e8ce0b` |
| Previous GTM rollback version | `132` |
| Vercel deployment ID and exact Git SHA | Pending explicit deploy approval |
| Previous READY deployment rollback | Resolve immediately before approved deploy |
| Queue trigger visible and first callback | Pending deploy |
| Representative event IDs | Pending genuine consented user actions |
| Collector / ledger / exact-attempt correlation | Pending deploy |
| Meta `events_received=1`, trace and no messages | Pending deploy |
| Pixel/CAPI identical Meta name and ID | Pending deploy |
| Google Data Manager request IDs/status | Pending deploy |
| Events Manager freshness/dedupe/source result | Pending deploy and dashboard latency |
| Provider ACK p95 ≤60s; fallback ≤5m | Pending production sample |
| 7-day quality result | Pending deployment + 7 days |
| 14-day quality result | Pending deployment + 14 days |

## Rollback and safety

- GTM rollback is the previously published container version.
- Runtime rollback is the previous READY Vercel deployment.
- The queue trigger can be disabled without losing accepted events because the
  Supabase outbox and five-minute cron remain authoritative.
- No blind historical replay is permitted. No heartbeat events are permitted.
- Microsoft server events added by this Meta cutover remain disabled until the
  browser/server `pageLoadId`, VID/ID sync and `msclkid` contract is proven.
