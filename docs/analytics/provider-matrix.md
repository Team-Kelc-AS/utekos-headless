# Provider matrix

**Evidence freeze:** 2026-07-20.

**Active release:** 2026-07-26. Web-GTM v135 and application deployment
`dpl_7EvERHHrH7pfAYK7jQcwMySZjD5W` are live. The deployment was built from
exact Git SHA `3799e58ac90a4c0177d3bd6fba8a1d2ad3fd2ea2`; controlled production
events have correlated queue and provider receipts.

## Near-real-time dispatch

- **Durable wake-up:** each newly inserted pending provider attempt is
  published after database commit to Vercel Queue topic
  `canonical-provider-dispatch-v1`.
- **Payload:** only `{schema_version, attempt_id, adapter_key}`; no canonical
  payload, identifiers or PII.
- **Targeting/idempotency:** `${adapter_key}:${attempt_id}` and an exact
  primary-key/provider claim. A consumer cannot claim another event.
- **Retention/region:** seven days; Vercel region auto-resolution (`arn1` in
  the configured project).
- **Failure ownership:** provider-classified retry/dead-letter outcomes are
  persisted and acknowledged. Infrastructure failures throw for 15-second
  Vercel redelivery. A queue publish failure is reported to Sentry while the
  collector retains `202` because the transaction is durable.
- **Fallback:** `/api/cron/provider-outbox-dispatch` remains authoritative
  retry/catastrophe fallback every five minutes.
- **Health:** `/api/cron/provider-dispatch-health` runs every 15 minutes and
  checks missing expected attempts, queue-publish failures, initial pending
  age, dead letters and p95 ACK latency. It does not require low-volume
  user actions to occur.

## Google Analytics

- **Owner:** Web GTM/Google tag and sGTM for browser analytics.
- **Transport:** `dataLayer` -> `/__gtg` ->
  `server_container_url=https://utekos.no/__sgtm` -> Google.
- **Events:** canonical snake_case browser events; page view is
  router-owned.
- **Destination:** GA4 `G-FCES3L0M9M`; Google tag `GT-MKRLF5WK`.
- **Dedupe:** canonical `event_id` is present in application
  dataLayer contracts, but GA4 Measurement Protocol has no native
  dedupe guarantee. Server container `GTM-M8GT97CV` v29 forwards
  GA4 + Conversion Linker.
- **Retry:** browser/tag infrastructure, not the Supabase
  provider outbox for `page_view`.
- **Finality:** network/tag receipt is not provider-confirmed
  ingestion.
- **Diagnostics:** Prefer project Google Analytics / GTM MCP with
  working OAuth; Stape remote may still show empty accounts.
- **Status:** present in published web container; server
  container verified. Browser smoke 2026-07-20 observed Google
  Ads destination `AW-18180376403` in `ccm/collect` pings pre-
  and post-consent (DEV-017), despite the documented
  native-Google-Ads exclusion policy.
- **Measurement Protocol:** no direct application `mp/collect`
  transport. `/g/collect` is active Google tag/sGTM protocol
  traffic.

## Google Ads / Data Manager

- **Owner:** canonical server outbox and Google request-status
  cron.
- **Transport:** 28 `(google,event)` workers in production using
  `@google-ads/datamanager`.
- **Events:** all active catalog events except `page_view`;
  blocked-source events excluded.
- **Destination:** configured Google Ads/Data Manager destination
  names are present as environment variables; values are not
  reproduced.
- **Identifiers:** GA client ID required; canonical
  transaction/event ID; click IDs; consent-gated SHA-256
  email/phone; optional device/location context. Maximum ten
  contact identifiers.
- **Dedupe:** provider mapping uses canonical transaction/event
  ID; ledger/outbox uniqueness prevents duplicate local attempts.
- **Retry:** adapter-defined maximum/delays with positive jitter;
  retryable failures scheduled in the outbox.
- **Finality:** ingest receipt -> `accepted_unverified`;
  request-status reconciliation maps SUCCESS to `succeeded`,
  FAILED/PARTIAL_SUCCESS to dead letter, PROCESSING/unknown
  remains pending.
- **Diagnostics:** response, `request_id`, validation result and
  per-request status stored. No `request_id` index.
- **Production delta:** `interact_with_accordion` and `open_quick_view`
  adapters use canonical transaction IDs and full commerce/custom context.
- **Status:** application integration active; Production
  `GOOGLE_DATA_MANAGER_VALIDATE_ONLY` is executed mode (`false`)
  per live `validation_result` and `DEPLOYMENT.md`. Treat
  accidental re-enable of validate-only as P0/P1 regression.

## Meta

- **Owner:** same-origin app Pixel bridge for deterministic browser events;
  the published web-GTM mapping is a shared-state backup. The canonical
  application outbox is the only Meta server owner.
- **Transport:** `/analytics/meta-pixel-canonical-v1.js` initializes the Meta
  Pixel after marketing consent and polls future canonical dataLayer entries;
  17 Meta CAPI workers are active. Live CDP evidence captured the resulting
  `facebook.com/tr` POST. The app and GTM template share
  `window.__utekosMetaPixelState.sent`, preventing a second send if GTM's
  Custom HTML tag later executes.
- **Production-freeze events:** `PageView`, `ViewContent`, `AddToCart`,
  `AddToWishlist`, `InitiateCheckout`, `Purchase`, `Search`,
  `Lead`. Live 7-day dataset window contains only these
  PascalCase names (verified via Graph API 2026-07-20).
- **Events added:** `ViewItemList`, `ViewCart`,
  `LandingScrollDepth`, `ViewCategory`, `HeroInteract`,
  `InteractWithAccordion` and `OpenQuickView`. Pixel and CAPI mappings use
  those exact names and the same canonical UUID.
- **Destination:** `1092362672918571` in the live bridge, published web
  payload, source/config and receiving dataset. The post-cutover dataset API
  advanced browser freshness to `2026-07-26T15:40:07Z` and server freshness
  to `2026-07-26T15:41:17Z`.
- **Identifiers:** same canonical `event_id`; `external_id`,
  `fbp`, `fbc`, consent-gated hashed contact data, server IP/user
  agent where approved. The release never manufactures absent `fbc`, `fbp`
  or contact data. Live match keys 7d: `external_id` 7461,
  `email` 59, `phone` 47.
- **Dedupe:** source mappers and the browser bridge set the identical canonical
  event ID and exact Meta name. The genuine Materialer accordion open used
  `InteractWithAccordion` / `d51aa3ea-a427-4f8a-9098-005f77007626` in both
  Pixel and CAPI; CAPI returned `events_received=1`. Numeric Events Manager
  overlap remains unavailable from the dataset stats endpoint and is still a
  7-/14-day quality gate.
- **Retry:** targeted Vercel Queue wake-up plus generic outbox
  retry/jitter/dead-letter; five-minute cron is fallback.
- **Finality:** successful API receipt becomes
  `accepted_unverified`; no repository reconciliation poller.
- **Diagnostics:** daily dataset-quality snapshot/retry code exists. Current
  API quality shows upper-funnel EMQ 6.1 where reported and Purchase 8.8;
  `external_id`, `fbp`, IP and user-agent coverage are 100% on the newly
  reported `LandingScrollDepth` quality row. Numeric dedupe feedback remains
  unexposed, so matching name/ID is proven but the overlap UI is not claimed.
- **Production status:** browser and server delivery are live. Representative
  stale-event Meta adapter latency was 127–304 ms, every controlled request
  returned `events_received=1`, and the one-hour provider health sample had
  p95 ACK 5.75 seconds with zero recent dead letters or initial pending rows
  over two minutes. Server GTM remains GA4 + Conversion Linker only.

## Microsoft

- **Owner:** Web GTM for browser UET; analytics server outbox for
  UET CAPI `purchase` and `add_to_cart`.
- **Transport:** browser UET + server Conversions API
  (`capi.uet.microsoft.com`) for `purchase` and `add_to_cart`.
- **Events:** canonical Microsoft names in the catalog; live
  published container contains UET. Server workers registered for
  `purchase` and `add_to_cart`; other Microsoft `serverOutbox`
  values remain `blocked_no_worker`.
- **Destination:** UET tag `97247724`.
- **Auth:** UET tag ApiToken (`MICROSOFT_UET_CAPI_*` aliases),
  not Ads OAuth.
- **Dedupe:** catalog `event_id`; live `pageLoadId`
  browser-server pairing still unverified (purchase-first path
  does not emit pageLoad).
- **Retry:** provider outbox retry for CAPI HTTP/network
  failures; qualification skips are terminal.
- **Finality:** CAPI HTTP 200 → generic
  `accepted_unverified`; missing `msclkid`/token →
  `skipped_unqualified`.
- **Diagnostics:** Microsoft Ads audit green 2026-07-20; browser
  smoke verified UET `97247724` fires `pageLoad` + custom
  `view_item` post-consent only (`asc=G`), Clarity `wupwleuv2e`
  linked.
- **Status:** browser verified; purchase CAPI production-verified
  2026-07-20 (`#6ULWCDZT5` → `accepted_unverified`). `add_to_cart`
  CAPI worker code-contract proven pending production deploy.
  Remaining non-purchase events (e.g. `page_view`, `view_item`)
  still `blocked_no_worker`.

## Supabase

- **Owner:** canonical first-party persistence and operational
  audit.
- **Transport:** direct PostgreSQL transaction through
  `postgres`.
- **Events:** all active canonical events.
- **Destination:** project `hkoawfbomhnzupcsdggb`, schemas
  `marketing`, `ops`, `partner`, `analytics`.
- **Dedupe:** unique ledger idempotency key; unique
  provider/idempotency key.
- **Retry:** provider attempts; no retry for a failed acceptance
  transaction because it rolls back and the caller can safely
  resend the same event.
- **Finality:** ledger insertion is atomic with dispatch attempt
  planning.
- **Candidate immediate path:** `accept` returns only attempt IDs inserted by
  that transaction after commit; duplicates publish nothing. Those IDs wake
  exact targeted claims through Vercel Queue without a database migration.
- **Diagnostics:** provider health/dead-letter views, attempt
  response/request/status fields.
- **Status:** live and ingesting. RLS enabled, no public
  policies/grants.

## GTM web

- **Owner:** tag bootstrap, Cookiebot, default Consent Mode,
  browser GA4/Meta/UET.
- **Transport:** Next `<GoogleTagManager>` through `/__gtg`.
- **Destination:** `GTM-5TWMJQFP`.
- **Dedupe:** event contracts carry canonical IDs; web container
  verified published.
- **Consent:** Cookiebot `implementation=gtm`, default denied,
  redaction and URL passthrough.
- **Candidate:** `config/gtm/web-meta-pixel.html` includes exact mappings for
  the seven added Meta events and reuses `event_id` as Pixel `eventID`; the
  workspace/container is not published by this implementation task.
- **Status:** verified published and reachable at the historical production
  freeze. Prior
  `GTM-WZ4R3PQL` claim refuted.

## GTM server

- **Owner:** first-party server tagging endpoint.
- **Transport:** `/__sgtm` -> `cloud.server.utekos.no`.
- **Destination:** `GTM-M8GT97CV` (`248521914`); prior
  `GTM-PGTJ3FJ` does not resolve.
- **Clients/tags/transformations:** Published version 29 = GA4 +
  Conversion Linker only (no Meta CAPI Gateway).
- **Consent:** receives consent signals from Google tag.
- **Caching:** verified `no-store`, no cache HIT.
- **Status:** endpoint healthy; container identity verified.

## Shopify

- **Owner:** Shopify Admin notification `Order payment` owns
  Purchase. Shopify Admin reconciliation is duplicate-safe
  missed-delivery recovery. Shopify Admin notification
  `Refund create` owns Refund, with reconciliation as
  duplicate-safe missed-delivery recovery.
- **Transport:** HTTPS webhooks to Next.js routes.
- **Events:** order-paid -> purchase; refund-created -> refund.
- **Dedupe:** Purchase uses the order legacy ID through
  `deterministicPurchaseEventId`; webhook, retry and
  reconciliation converge on that identity. Verified Shopify
  delivery/event IDs are source evidence only and never create an
  alternative canonical or provider event ID. Refund uses its
  Shopify Refund legacy ID through `deterministicRefundEventId`;
  alternative event/refund/order identities fail closed.
- **Consent:** operational ledger; provider export depends on
  captured checkout attribution/consent. Refund resolves that
  snapshot through the deterministic canonical Purchase linkage;
  it does not invent a new browser identifier or reuse webhook
  transport context.
- **Retry:** Shopify delivery retry plus idempotent receiver;
  accepted transaction schedules the generic outbox.
- **Finality:** `refunds/create` means refund created, not
  settled.
- **Item/value contract:** line-item refunds retain their item
  mapping; shipping-only and adjustment-only refunds retain an
  explicit `items: []` without fabricated products. Google Data
  Manager omits `cartData` for the itemless case while preserving
  refund value, currency and identity.
- **Diagnostics:** app-scoped subscriptions verified via Admin
  GraphQL 2025-07: **zero** `webhookSubscriptions` for the app
  token (2026-07-20). Delivery logs for any other subscriber
  remain unavailable.
- **Status:** CE-2.4 is production-proven; CE-3.3R is committed
  and locally verified; CE-2.5 ownership cutover is locally
  implemented with the integrated fresh verifier pending. The
  historical direct provider-resend/backfill entrypoints are
  fail-closed before credentials, database or network access.
  Production activation and the one-ledger-row/provider-attempt
  proof are pending release approval;
  `STOP_ACTIVE_DOUBLE_COUNT_RISK` remains active until the
  complete release candidate is verified, owner-approved and
  production-proven.

## Provider status comparison

| Provider                    | Immediate receipt                    | Stored state                 | Separate reconciliation | Provider-confirmed terminal state |
| --------------------------- | ------------------------------------ | ---------------------------- | ----------------------- | --------------------------------- |
| Google Data Manager         | Ingest/validate receipt + request ID | `accepted_unverified`        | Yes                     | `succeeded` or dead letter        |
| Meta CAPI                   | API receipt                          | `accepted_unverified`        | No repository poller    | Not represented separately        |
| Vercel Queue wake-up        | Queue callback/consumer execution    | Existing provider attempt    | Five-minute cron fallback | Provider-specific state remains authoritative |
| Microsoft UET browser       | Browser request/queue                | Not canonical server attempt | No                      | Not represented                   |
| Microsoft UET CAPI purchase | HTTP 200 / adapter receipt           | `accepted_unverified`        | No repository poller    | Not represented separately        |
| Supabase                    | Transaction commit                   | Ledger + attempts            | Not applicable          | Commit is terminal locally        |
