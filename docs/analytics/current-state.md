# Canonical analytics architecture: current state

**Evidence freeze:** 2026-07-20T21:46Z (docs refresh after UET
CAPI purchase journey) **Repository baseline:**
`utekos-brand/utekos-headless` at
`ed16dfd06ecddf1bea37e3f710c40f2bbfd76abc` (feat `490f33126`)
**Production deployment:** `dpl_3Pe1KmJSj5unFh1jD7VytiPvFr5H`,
READY, owns `utekos.no`, `arn1`, Node.js 24.x **Branch:** `main`
**Live snapshots:** Supabase pink-lens `hkoawfbomhnzupcsdggb`
queried 2026-07-20T21:45Z; GTM Admin inventory 2026-07-20; Meta
Graph/EMQ 2026-07-20; Microsoft Ads audit 2026-07-20

## Documentation status

Oppgave 0 verification is complete for the surfaces agents can
read. Repository, live Supabase warehouse, Vercel production,
first-party GTM/sGTM, published web container, GTM Admin (web +
server `GTM-M8GT97CV`), Meta Events Manager/Graph EMQ, Microsoft
Ads/UET goals, and Shopify Admin app-scoped webhook inventory
were inspected. Remaining gaps are called out as **Unknown**,
**Blocked**, or open deviations — not as blanket “unavailable”
for already-resolved providers.

Status vocabulary:

- **Verified:** direct source plus runtime/database
  corroboration, or two independent primary sources.
- **Observed:** one current primary source.
- **Unknown:** evidence does not decide the question.
- **Blocked:** the required system exists, but current
  authorization/tooling cannot read it.
- **Refuted:** current primary evidence contradicts the prior
  claim.

## Executive summary

The project already has a substantial canonical architecture. It
has a typed event catalog, a shared consent-aware browser
collector, 23 first-party event routes, Zod validation, atomic
ledger/outbox persistence, a generic `SKIP LOCKED` outbox, 33
provider workers (24 Google, 8 Meta, 1 Microsoft UET purchase),
provider retries/dead letters, Google request-status
reconciliation, intended Shopify webhook purchase/refund routes
with verified browser/backfill purchase ingestion, Cookiebot
Consent Mode and first-party GTM/sGTM routing.

The principal problem is not absence of a canonical pipeline. It
is coexistence with historical naming/data, overly broad
immediate dispatch (DEV-001 / Oppgave 1), generic acceptance
semantics and remaining provider gaps. A successful browser
request schedules all registered provider-event workers, each
with `maxItems: 1`; it can therefore claim unrelated backlog and
compete with the five-minute cron. The live warehouse has 19,043
ledger rows and 21,588 attempts, no active backlog and no
duplicate canonical IDs, but contains both canonical snake_case
and legacy/provider PascalCase names. Google finality is
reconciled via status cron; Meta success remains
`accepted_unverified` with browser/server dedupe not proven
(DEV-020). Microsoft browser UET is live; purchase UET CAPI is
production-verified (`accepted_unverified`, not `missing_msclkid`
/ `missing_capi_token`).

## System boundaries

```text
Shopify storefront and webhooks
  -> Next.js 16.2 App Router on Vercel
  -> first-party event APIs
  -> Supabase PostgreSQL canonical ledger and provider outbox
  -> Google Data Manager / Meta CAPI workers

Browser
  -> dataLayer / web GTM
  -> first-party /__gtg loader
  -> first-party /__sgtm server tagging endpoint
  -> GA4 / Meta browser / Microsoft UET according to GTM and consent
```

Klarna Search & Compare is a commerce/feed experiment, not a
registered canonical event provider. PostHog is catalogued but
the storefront integration is currently not implemented.

## Repository and production freeze

| Item              | Current state                                    | Evidence                                          |
| ----------------- | ------------------------------------------------ | ------------------------------------------------- |
| Default branch    | `main`                                           | Git remote HEAD                                   |
| Docs refresh HEAD | `ed16dfd06ecddf1bea37e3f710c40f2bbfd76abc`       | Git; UET CAPI feat `490f33126`                    |
| Latest production | READY, owns `utekos.no`                          | Vercel `dpl_3Pe1KmJSj5unFh1jD7VytiPvFr5H`         |
| Runtime region    | `arn1`                                           | `.vercel/project.json`, `vercel.json`, Vercel API |
| Node.js           | 24.x                                             | `package.json`, Vercel project                    |
| PR 44             | Open, conflicting/dirty, functionally superseded | GitHub PR and main source                         |

PR 44 adds a ten-identifier cap and positive retry jitter to
pre-refactor files. The same intent is already on `main`:
`googleDataManagerSharedMapping.ts` centralizes
`MAX_USER_IDENTIFIERS = 10`, deduplication and interleaving,
while `processProviderOutboxAttempt.ts` applies positive jitter.
Merging PR 44 would reintroduce event-specific mapping structure.
It should be closed as superseded only after separate approval;
Oppgave 0 did not change it.

## Canonical event model

`src/lib/analytics/eventCatalog.ts` declares 29 events: 25 active
and four `blocked_source`. `src/lib/analytics/canonicalEvent.ts`
defines the implemented Zod discriminated union. Each active
event declares an owner, trigger, dedupe policy, consent policy
and provider mapping. The complete chain is in
[event-matrix.md](event-matrix.md).

The four source-blocked events are:

- `add_shipping_info`
- `add_payment_info`
- `checkout_error`
- `payment_error`

They are not eligible for persistence or provider dispatch until
an authoritative source is implemented.

### Event creation

- Browser reporters create UUID `event_id` values and ISO-offset
  `event_time` values.
- `page_view` uses a per-navigation `page_view_id`; a committed
  navigation is emitted once by `pageViewSession.ts`.
- Mutation events use an authoritative mutation/interaction
  identifier.
- Shopify `purchase` and `refund` use deterministic UUIDs derived
  from the order/refund identifiers, preserving retry
  idempotency.
- Ledger idempotency is `event_name:event_id`; provider
  idempotency is provider plus the canonical key.

### Browser collection and dataLayer

Most active browser events follow this shared pattern:

1. An event-specific reporter builds and validates the canonical
   payload.
2. The reporter emits a canonical snake_case dataLayer event
   through `sendGTMEvent`.
3. A thin event-specific collector transport delegates to
   `createCanonicalCollectorTransport`.
4. The collector waits for Cookiebot when no authoritative
   response exists.
5. It strips consent-ineligible identifiers and sends JSON to
   `/api/events/<event>`.
6. It retries one network/408/429/5xx failure once, then reports
   failure to Sentry.

The event-specific `*CollectorTransport.ts` files are thin
endpoint/name/type wrappers. Reporter files are necessary
specialization because they map UI-specific inputs and own
dataLayer emission. `pageViewCollectorTransport.ts` and
`viewItemCollectorTransport.ts` contain additional
enrichment/dedupe behavior and are not mere aliases. No
compatibility alias was proven unused; deletion requires
call-site analysis in a later task.

### URL, referrer and request context

- Page/referrer URLs are normalized as absolute HTTP(S) URLs.
- Google mapping removes fragments, then query strings if
  required, and truncates to provider limits.
- Browser event schemas never accept an arbitrary client-provided
  IP/user agent as trusted server context.
- Server request context derives IP/user agent from headers and
  applies provider restrictions.

## Consent and identity

Cookiebot is the CMP. The published web container contains
`uc.js` and `implementation=gtm`; the app does not load `uc.js`
itself. The application defines default-denied Consent Mode v2
before tag use:

- `ad_storage`, `ad_user_data`, `ad_personalization`,
  `analytics_storage`, `functionality_storage`,
  `personalization_storage`: denied
- `security_storage`: granted
- `ads_data_redaction`: true
- `url_passthrough`: true
- Microsoft UET `ad_storage`: denied

The shared collector maps Cookiebot statistics to analytics,
marketing to marketing and preferences to preferences. Without
consent:

- analytics browser IDs are removed unless analytics is granted;
- marketing browser/click IDs, external ID, user data and
  impression ID are removed unless marketing is granted;
- browser-permission location requires preferences consent;
- IP and user agent are not accepted from the browser payload.

Identity handling:

| Identifier     | Source and lifetime                                               | Consent                                   | Recipients/current use                                       |
| -------------- | ----------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| `event_id`     | UUID per occurrence; deterministic for Shopify transaction events | Event's collection basis                  | Ledger, outbox, Meta dedupe, provider mappings               |
| `page_view_id` | In-memory UUID per committed navigation                           | Analytics or marketing                    | Related browser events                                       |
| `external_id`  | `anon_<uuid>` first-party cookie, one year                        | Marketing                                 | Canonical payload, Meta/approved provider mappings           |
| GA `client_id` | `_ga` and Google tag `get` path                                   | Analytics                                 | Google mappings; missing value becomes `skipped_unqualified` |
| `fbp`, `fbc`   | Meta cookies                                                      | Marketing                                 | Meta matching/dedupe support                                 |
| click IDs      | URL, sessionStorage and 90-day localStorage                       | Marketing                                 | Google/Meta/Microsoft mappings as applicable                 |
| email/phone    | Pre-hashed SHA-256 arrays only                                    | Marketing                                 | Google/Meta mappings; max ten Google identifiers             |
| IP/user agent  | Server request context                                            | Provider policy and consent               | Meta website context; Google device info where allowed       |
| postal/country | Customer/server/browser location source                           | Marketing/preferences according to source | Provider matching where approved                             |

The durable click-ID store catches storage/privacy failures
silently by design. This is a documented best-effort browser
persistence behavior, not evidence of provider delivery.

## Validation and API routes

`canonicalEventEnvelopeSchema` is strict and validates schema
version, event name, UUID, offset datetime, source/environment,
Cookiebot consent, hashed-contact shapes, identifier maps, URLs
and optional location/device context. `canonicalEventSchema`
dispatches by `event_name`.

There are 23 browser event routes under `src/app/api/events`.
Each route delegates collection to the event-specific canonical
handler and wires `runRegisteredProviderOutboxBatch` through
`after()`. Intended authoritative purchase/refund sources are the
Shopify `orders-paid` and `refunds-create` webhook routes;
verified active purchase ingestion is the browser purchase route
plus Meta purchase-backfill (webhook production delivery is
unverified). `generate_lead` and `form_submit` are server-owned
even though event API routes also exist for their canonical
collection path.

Duplicate canonical events return the existing event outcome
without inserting new dispatch rows. Live production has 19,043
distinct event IDs and idempotency keys across 19,043 ledger
rows.

## Persistence and atomicity

`postgresCanonicalPageViewStore.ts` is misnamed but generic:

- It creates one `postgres` client using
  `SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING`.
- `sql.begin()` encloses ledger insertion and every
  provider-attempt insertion.
- Ledger insertion uses
  `ON CONFLICT (idempotency_key) DO NOTHING`.
- If ledger insertion is duplicate, no dispatch rows are created.
- Provider insertion uses
  `ON CONFLICT (provider, idempotency_key) DO NOTHING`.
- Any dispatch insertion error rejects the callback and rolls
  back the ledger insertion.

No database RPC or trigger performs the same acceptance
transaction. Direct PostgreSQL transaction code is the sole
current implementation. The exported
`postgresCanonicalPageViewStore` is only an alias of
`postgresCanonicalEventStore`; the file cannot be deleted before
the generic implementation is moved/renamed.

Live constraints:

- unique `marketing.event_ledger(idempotency_key)`;
- unique
  `ops.provider_dispatch_attempts(provider, idempotency_key)`;
- status, dispatch mode, attempt count, HTTP status and latency
  checks;
- RLS enabled, no policies, no `anon`/`authenticated` grants, no
  triggers.

## Provider outbox

### Creation

`planCanonicalEventDispatch` reads the active catalog. It creates
only active, supported outbox intents for which required consent
exists. Non-purchase Google rows without `client_id` are persisted
as terminal `skipped_unqualified` with
`skip_reason='missing_client_id'`. Google purchase accepts
`clientId`, consent-permitted GCLID, or consent-permitted User-ID;
hashed `userData` alone is not qualifying. A purchase without all
three uses `missing_google_analytics_identifier`. Purchases older
than 72 hours use `google_event_outside_72h`; purchases between 48
and 72 hours remain eligible and are measured as
`late_within_window`.

### Claim and locking

Each adapter owns a `(provider, event_name)` claimant. The claim
query:

- selects `server_retry` rows;
- claims `pending`/`retry_scheduled` rows whose `next_attempt_at`
  is due;
- reclaims `processing` rows stale for ten minutes;
- orders stale processing first;
- uses `FOR UPDATE SKIP LOCKED`;
- atomically updates the row to `processing` and increments
  `attempt_count`.

### Retry and dead letter

- Max batch size: 100.
- Current adapters use their declared max attempts/delay schedule
  and positive jitter.
- Retryable errors become `retry_scheduled`.
- Permanent errors or exhausted attempts become `dead_lettered`.
- Dead lettering and insertion into `ops.dead_letter_events`
  happen in one SQL statement.
- Invalid payloads are dead-lettered without provider dispatch.

### Immediate and cron dispatch

Both `/api/cron/provider-outbox-dispatch` and
`/api/cron/google-data-manager-status` run every five minutes.
The dispatch cron uses one item per worker. Browser routes and
Shopify transaction webhooks also schedule
`runRegisteredProviderOutboxBatch({maxItems: 1})` after
successful acceptance.

`runRegisteredProviderOutboxBatch` executes every registry entry
in `Promise.all`. There are 33 workers: 24 Google, 8 Meta, and 1
Microsoft UET purchase. Thus `maxItems: 1` means one item **per
worker**, not one item for the accepted event. This confirms the
P0 isolation defect.

### Index alignment

The queue has useful status, provider/status, event/provider,
skipped and dead-letter indexes. The main claim key includes
provider, event name, dispatch mode, status and due time, but no
index includes `event_name`; under backlog, each worker can
heap-filter the shared queue. Google status polling has no
`request_id` index and currently plans a sequential scan. No
index was added in this audit.

## Status and finality

Live allowed statuses:

| Status                | Set by                                     |                  Terminal | Meaning                                                   |
| --------------------- | ------------------------------------------ | ------------------------: | --------------------------------------------------------- |
| `pending`             | Persistence plan                           |                        No | Eligible for initial claim                                |
| `processing`          | Claim/reclaim query                        |                        No | Leased/being processed; reclaim after ten minutes         |
| `retry_scheduled`     | Generic worker                             |                        No | Retryable failure with due time                           |
| `accepted_unverified` | Generic worker completion                  |        Provider-dependent | Adapter call returned a receipt; finality not proven      |
| `succeeded`           | Google reconciliation or historical repair |                       Yes | Provider-confirmed or administratively classified success |
| `failed`              | Historical schema state                    |   No current writer found | Legacy/non-current                                        |
| `dead_lettered`       | Worker or Google reconciliation            | Yes until explicit replay | Permanent/exhausted/invalid/provider-confirmed failure    |
| `skipped_unqualified` | Dispatch planning/repair                   |                       Yes | Provider prerequisites absent or adapter unavailable      |

The worker outcome `succeeded` is always persisted through a
method named `markAcceptedUnverified`, so both Google and Meta
successful adapter calls first become `accepted_unverified`.
Google has a separate reconciler: request IDs are leased and
statuses map `SUCCESS` to `succeeded`, `FAILED`/`PARTIAL_SUCCESS`
to dead letter, and `PROCESSING`/unknown back to
`accepted_unverified`. Meta has no equivalent reconciliation
worker in the repository. Generic acceptance therefore overstates
neither finality nor provider equality, but the shared
name/status is too coarse for operational decisions.

## Provider state

### Google Analytics and GTM

- Active GA4 measurement ID in the published container:
  `G-FCES3L0M9M`.
- Active Google tag: `GT-MKRLF5WK`.
- Web GTM container: `GTM-5TWMJQFP`.
- First-party paths: `/__gtg` and `/__sgtm`.
- `server_container_url`: `https://utekos.no/__sgtm`.
- sGTM health and Google tag endpoints return 200.
- `/__sgtm` is `no-store` and was not a cache HIT.
- No `AW-` native Google Ads conversion tag was found in the
  published web payload. However, live browser smoke (2026-07-20)
  observed Google Ads destination `AW-18180376403` in
  `pagead2.googlesyndication.com/ccm/collect` pings both
  pre-consent (cookieless, `npa=1`) and post-consent. The
  destination is most plausibly wired through the `GT-MKRLF5WK`
  Google tag configuration rather than a GTM tag. This must be
  reconciled against the policy that excludes native Google Ads
  conversion tags (see DEV-017).

The previous IDs `GTM-WZ4R3PQL` and `GTM-PGTJ3FJ` are refuted as
active identities: both fail runtime resolution and only occur in
planning text. Server container is **verified** as `GTM-M8GT97CV`
(`248521914`) with
`taggingServerUrls=["https://utekos.no/__sgtm"]`. Published
server version 29 contains only `GA4` + `Conversion Linker` tags
(no Meta CAPI Gateway tag in sGTM). Evidence:
`.agent-artifacts/analytics/gtm-readonly-inventory-2026-07-20.json`.
Project `gtm-mcp` OAuth and SA inventory both work for agents;
Stape remote MCP is optional.

No direct application Measurement Protocol transport exists.
Browser Google collection still reaches `/g/collect` through
Google tag/sGTM, which is protocol traffic owned by GTM rather
than a direct application `mp/collect` adapter.

### Google Data Manager

Google Data Manager server outbox exists for 24 active events.
Mappings:

- require a GA client ID for active dispatch;
- use canonical event ID as transaction ID where mapped;
- cap parameter/URL lengths;
- deduplicate and cap hashed email/phone identifiers at ten;
- use restricted-country logic for IP matching;
- persist response, request ID and validation result;
- reconcile request status every five minutes.

**Env source:** Vercel Production secret
`GOOGLE_DATA_MANAGER_VALIDATE_ONLY` (encrypted; name present).
**Live semantics (P0/P1 watch):** executed ingestion is active —
7d Google rows with `validation_result.validate_only='false'`
dominate (2,987) with latest including the 2026-07-20T21:45Z
purchase; historical `true` rows (987) stop at 2026-07-18T18:20Z
after the temporary validate-only gate documented in
`DEPLOYMENT.md`. Status cron only reconciles
`validate_only=false` rows. Agents must not re-enable
validate-only without explicit approval, and must not treat
generic `accepted_unverified` as Google `succeeded` without
request-status reconciliation. The request-ID coverage query
observed 3,501 request IDs among 6,095 Google rows. The separate
provider-total query observed 6,092 Google rows. Those live
queries were not one repeatable-read transaction, so the
three-row difference is snapshot timing rather than a stable
denominator. Rows without request IDs cannot be reconciled
through the current poller.

### Meta

- Published browser destination: `1092362672918571`.
- Current source mappings: `PageView`, `ViewContent`,
  `AddToCart`, `AddToWishlist`, `InitiateCheckout`, `Purchase`,
  `Search`, `Lead`.
- Every current server mapper uses canonical `event_id`.
- Dataset-quality snapshot/retry crons exist.

Events Manager evidence was obtained 2026-07-20 through the Graph
API v23.0 with the system-user token (the remote `facebook-ads`
MCP entry has an empty token header and exposes no tools; direct
Graph API reads replaced it):

- The dataset is live: `last_fired_time` 2026-07-19T22:51Z, and a
  6-hour recheck showed SERVER 242 / BROWSER 125 events still
  arriving.
- The 7-day event-name distribution contains **only PascalCase
  provider names** (PageView 3562, ViewContent 2260,
  LandingScrollDepth 982, Purchase 55 and more). The
  PascalCase/snake_case coexistence in the warehouse is
  historical; it is not present in the current 7-day provider
  window.
- Event-source split 7d: SERVER 3959 / BROWSER 1838. Match keys:
  `external_id` 7461 (dominant), `email` 59, `phone` 47.
- The browser pixel is configured with **openbridge3 / Meta CAPI
  Gateway**: the signals config for `1092362672918571` declares
  gateway endpoint
  `https://mpc2-prod-25-is5qnl632q-wl.a.run.app/` with an AWS ECS
  fallback, and both hosts are explicitly allowed in the
  production CSP `connect-src`. Browser events therefore do not
  use `facebook.com/tr`. In-session wire observation of the
  gateway POST was not possible (the pixel binds its network
  primitives before instrumentation), but dataset arrival of
  BROWSER events proves delivery.
- The browser console shows a live data-quality warning:
  `[Meta Pixel] - Invalid parameter format for currency`.

Numeric EMQ is verified via Graph `dataset_quality` (upper funnel
6.1, Purchase 9.3). Server GTM has no Meta CAPI Gateway tag
(version 29 = GA4 + Conversion Linker only). The
destination-mismatch hypothesis is refuted for browser and
server-GTM halves: published web payload, source/config and the
live dataset agree on `1092362672918571`; browser delivery uses
openbridge3 CAPI Gateway outside sGTM.

### Microsoft

- Published browser UET tag: `97247724`.
- Browser UET is present and consent-gated.
- Vercel contains the relevant credential variable names,
  including the UET CAPI token name; values were not read in the
  original audit. Local `.env.mcp.local` / `.env.local` hold
  ApiToken aliases for agents.
- **Purchase server worker (2026-07-20):**
  `microsoft_uet:purchase` registered; catalog
  `serverOutbox: active`. Fail-closed plan skips:
  `missing_msclkid`, `missing_capi_token`. Other Microsoft events
  remain `blocked_no_worker`.
- **Production purchase journey verified 2026-07-20T21:45Z:**
  Shopify order `#6ULWCDZT5` (Stapper, `KRISTOFFERTESTRABATT`,
  synthetic `msclkid=14428fb9-9d65-4b7e-8027-c290d49c142e`).
  Ledger purchase
  `event_id=cdd83f38-3b67-4aac-9142-1bb42cea45ab`. Microsoft UET
  attempt `accepted_unverified` / `provider_accepted_unverified`
  (latency 209 ms); **not** `missing_msclkid` /
  `missing_capi_token`. Artifact:
  `.agent-artifacts/analytics/microsoft-uet-capi-purchase-journey-2026-07-20.json`.
- Historical Microsoft rows: 222 prior `skipped_unqualified`
  remain; new qualified purchases use the active worker.

Live conversion goals (2026-07-20 audit): UET Active; Add To
Cart, Begin Checkout, PageView Active. Browser smoke verified UET
`pageLoad` + custom `view_item` post-consent.

### PostHog

PostHog remains represented in the catalog as planned/not
implemented. It is not part of the active canonical dispatch
registry.

## Shopify webhooks

**Intended authoritative source:** Shopify `orders-paid` →
canonical `purchase`; `refunds-create` → canonical `refund`.
Product webhooks (`products-create` / `update` / `delete`) are
cache invalidation only.

**Verified active ingestion:** Browser purchase route and Meta
purchase-backfill (`meta-purchase-replay` / related backfill
keys). Purchases reach the ledger; they are not production-proven
as webhook-owned.

**Unverified:** Whether production traffic actually reaches the
webhook routes. The app owning `SHOPIFY_ADMIN_API_TOKEN` has
**zero** app-scoped `webhookSubscriptions` (Shopify Admin GraphQL
2025-07). No `shopify.app.toml` registration was found. Delivery
by any other app/custom subscriber remains unknown (DEV-008).

Webhook HMAC is verified fail-closed against the raw body with
SHA-256 and constant-time comparison. Purchase/refund IDs are
deterministic when those handlers run. `refunds/create` means a
refund object was created; it does not prove settlement or
financial reconciliation.

## Production data snapshot

| Measure                                         | 2026-07-20 value |
| ----------------------------------------------- | ---------------: |
| Ledger events                                   |           19,043 |
| Provider attempts                               |           21,588 |
| Dead-letter events                              |            1,127 |
| Unresolved dead letters                         |                0 |
| Consent snapshots                               |           15,046 |
| Duplicate ledger event IDs                      |                0 |
| Pending/processing/retry/dead-lettered attempts |                0 |

Provider attempts:

- Meta: 15,274
- Google: 6,092
- Microsoft UET: 222

Status:

- Meta: 13,291 `succeeded`, 1,773 `accepted_unverified`, 210
  skipped
- Google: 4,572 `succeeded`, 1,045 `accepted_unverified`, 475
  skipped
- Microsoft: 222 historical skipped + new qualified purchase
  attempts after UET CAPI deploy (see purchase journey artifact)

The prior 18,400/20,500 counts were earlier lower snapshots. The
prior 1,174 dead letters exceed the current 1,127 by 47;
deletion/retention/earlier counting cannot be proven from current
evidence and requires audit-log reconciliation.

Historical errors:

- 635 `google_data_manager_permanent_error`, resolved
- 340 `Missing client_id`, resolved/marked attribution repair
- page-location/session payload families, resolved/classified
- historical Meta token-expiry rows

Current code converts missing Google client ID to a qualified
skip and caps page-location values. No matching Google
permanent-error runtime group appeared in the last seven days.

## Production logs

Both five-minute crons are active and predominantly return 200.
Neither appears in seven-day Vercel error groups. Relevant
project-wide errors:

- Supabase `EMAXCONNSESSION` for web-vitals and consent
  snapshots: indirectly relevant to warehouse write reliability.
- Next.js “Failed to parse postponed state”: not a canonical
  event defect, but affects high-traffic rendering routes.
- Browser extension/Cookiebot `Illegal invocation`: not
  reproduced in the inspected server error groups.
- Historical `UET is not defined`: not reproduced in the
  inspected server error groups; browser-console verification
  remains blocked.

## Tests and baseline validation

| Command                                                            | Exit | Result                                                                                                              |
| ------------------------------------------------------------------ | ---: | ------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                                   |    0 | Lockfile current                                                                                                    |
| `pnpm lint`                                                        |    1 | Pre-existing repository-wide violations; 55,916 findings, including generated/vendor/skill surfaces                 |
| `pnpm exec tsc --noEmit`                                           |    2 | Stale `.next/types/validator.ts` route constraints for two routes                                                   |
| `node --test $(find src -name '*.test.ts')`                        |    1 | Incorrect direct Node runner cannot resolve the project TS/module setup; no package `test` script exists            |
| `find src -name '*.test.ts' ... pnpm exec tsx --test`              |    1 | 316 tests: 313 passed; three unrelated Shopify/cache tests fail because the standalone runner imports `server-only` |
| `find src/lib/analytics src/app/api/cron ... pnpm exec tsx --test` |    0 | 265 targeted analytics/cron tests passed                                                                            |
| `pnpm build`                                                       |    0 | Next.js production build, type phase and 121 static pages succeeded                                                 |
| `pnpm exec next typegen && pnpm exec tsc --noEmit`                 |    0 | Post-build route types regenerated; standalone typecheck passed                                                     |

The build and explicit post-build type generation demonstrate
that the initial standalone typecheck failure was stale generated
`.next` state rather than a documentation change. No runtime file
was changed to repair baseline failures.

## Principal risks

1. A request-path event drains the entire registry and can
   process unrelated backlog.
2. Meta browser/server event_id parity and deduplication overlap
   remain unproven.
3. Historical/provider names coexist with canonical names; older
   rows are not uniformly claimable by current workers.
4. Generic accepted status does not express Meta and Google
   finality equally.
5. Google diagnostics lookups lack an aligned request-ID index;
   main claims lack an event-name-aligned index.
6. Data Manager executed ingestion is live
   (`GOOGLE_DATA_MANAGER_VALIDATE_ONLY=false`); still treat
   `accepted_unverified` as pre-reconciliation until status cron
   maps SUCCESS → `succeeded` (P0/P1 env watch — do not flip
   validate-only without approval).
7. Microsoft UET CAPI purchase is production-verified for one
   qualified journey; non-purchase Microsoft server events remain
   open.
8. App-scoped Shopify webhook subscriptions are empty; webhook
   delivery path for the routes remains unproven (browser +
   backfill still fill purchases).
9. Consent snapshots stop after the 2026-07-15 reset; this is
   consistent with the reset but must not be described as an
   active snapshot writer.

## Official sources

- Google Data Manager `events.ingest`:
  <https://developers.google.com/data-manager/api/reference/rest/v1/events/ingest>
- GA4 Measurement Protocol:
  <https://developers.google.com/analytics/devguides/collection/protocol/ga4>
- Meta CAPI deduplication:
  <https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events>
- Meta server event parameters:
  <https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/server-event>
- Microsoft UET:
  <https://learn.microsoft.com/en-us/advertising/guides/universal-event-tracking?view=bingads-13>
- Shopify webhooks:
  <https://shopify.dev/docs/apps/build/webhooks>
- Shopify delivery verification:
  <https://shopify.dev/docs/apps/build/webhooks/verify-deliveries>
- Next.js `after`:
  <https://nextjs.org/docs/app/api-reference/functions/after>
- Vercel cron jobs: <https://vercel.com/docs/cron-jobs>
- PostgreSQL `SELECT` locking:
  <https://www.postgresql.org/docs/current/sql-select.html>

## Areas blocked from verification

Updated 2026-07-20 (evening) after agent credential repair:

- **Resolved:** GTM Admin for web + server. Project `gtm-mcp`
  OAuth token refreshed; `list_gtm_accounts` returns both
  accounts. Service-account inventory also works via
  `scripts/mcp/run-gtm-readonly-inventory.mjs`. Server container
  is `GTM-M8GT97CV` (`248521914`) with
  `taggingServerUrls=["https://utekos.no/__sgtm"]`. Published
  server version 29 has only `GA4` + `Conversion Linker` tags (no
  Meta CAPI Gateway tag in sGTM). Evidence:
  `.agent-artifacts/analytics/gtm-readonly-inventory-2026-07-20.json`.
- **Resolved (EMQ):** numeric Meta EMQ via Graph
  `v25.0/dataset_quality`. Live 2026-07-20:
  PageView/ViewContent/AddToCart/InitiateCheckout **6.1**,
  Purchase **9.3**.
- **Meta dedupe (2026-07-20 evening — fail-closed):**
  Deduplication is **not proven** and Events Manager shows it is
  **not healthy** for ViewContent right now. Evidence:
  - Events Manager Deduplication: PageView / AddToCart /
    InitiateCheckout = «Still Parsing Your Data»; **ViewContent**
    = «Deduplication has not been set up» / improve event ID
    coverage (no Overlap).
  - Graph `dataset_quality`: field-table spelling
    `dedup_key_feedback` is invalid (`(#100) nonexisting field`);
    example spelling `dedupe_key_feedback` is valid but
    **omitted** from the live response (not `[]`).
    `event_coverage` also omitted. Probe:
    `.agent-artifacts/analytics/meta-dedupe-field-probe-2026-07-20.json`.
  - Test Events (`TEST46149`): browser ViewContent and a manual
    CAPI ViewContent arrived as **separate** events with
    different `event_id`s and products — that only proves both
    channels reach Meta, **not** shared-ID dedupe. A script +
    unrelated UI hit never shares an ID; production dedupe
    requires one app-minted UUID on Pixel `eventID` and CAPI
    `event_id` for the same action.
  - Do not claim browser/server Meta dedupe OK until Events
    Manager shows Overlap for `event_id` (or Dataset Quality
    returns non-omitted `dedupe_key_feedback`) on ViewContent and
    the parsing events. Collector stores omitted feedback as
    `{ status: 'omitted_by_provider' }` instead of coercing to
    `[]`.
- **Resolved:** Microsoft live conversion goals + UET tag via
  `npm run microsoft-ads:audit` after Entra OAuth refresh (keep
  `.env.mcp.local` Microsoft tokens preferred over stale
  `.env.local`). UET `97247724` Active; goals: Add To Cart, Begin
  Checkout, PageView Active; Utgående klikk Paused. Purchase
  product goal not visible in Campaign Management v13 type set.
- **Resolved:** Microsoft UET CAPI purchase journey 2026-07-20 —
  order `#6ULWCDZT5`, attempt `accepted_unverified`, deploy
  `dpl_3Pe1KmJSj5unFh1jD7VytiPvFr5H` (`490f33126`). Auth/gateway
  smoke previously green. Non-purchase Microsoft events remain
  `blocked_no_worker`.
- **Resolved earlier:** Meta Events Manager activity/source
  split/match keys; Shopify app-scoped subscriptions empty;
  browser console/network smoke SMOKE-001..007.
- **Partially resolved:** Google Ads destination `AW-18180376403`
  observed in browser smoke; per-request Data Manager diagnostics
  beyond stored application responses remain limited.
- **Still open:** Meta dedupe Overlap (DEV-020); Shopify webhook
  delivery source (DEV-008); Oppgave 1 dispatch isolation
  (DEV-001).
