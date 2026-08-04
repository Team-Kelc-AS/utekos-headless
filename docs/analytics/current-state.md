# Canonical analytics architecture: current state

**Current evidence:** 2026-07-31T01:04:19Z. **Repository baseline:** newest
`main` at `7a9f19ed3f94cc08ee3140ddb4c99afe4af3d564`. **Production
deployment:** `dpl_7aYMhUMJTxyiTtWL38Wkxh5QpzaL`, `READY`, owns
`utekos.no`, exact same SHA, `arn1`, Node.js 24.x. **Live snapshots:** read-only
Supabase `pink-lens` (`hkoawfbomhnzupcsdggb`) and Vercel runtime/deployment
queried 2026-07-31.

**Historical evidence freeze:** the 2026-07-20 audit at `ed16dfd06` /
`dpl_3Pe1KmJSj5unFh1jD7VytiPvFr5H`, including its GTM, Meta, Microsoft, and
Supabase snapshots, is retained below for audit value and is not current
deployment state.

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

## Current production contract — 2026-08-04

- Canonical inventory: 33 total, 30 active, three `blocked_source`.
- Active provider/event registry: 49 workers — 29 Google, 17 Meta, three
  Microsoft UET CAPI.
- Accepted events persist ledger plus provider attempts atomically. Only newly
  inserted attempt primary keys are published after commit to Vercel Queue.
- The strict message contains `schema_version`, exact `attempt_id`, and
  `adapter_key`. The consumer calls `claimById`; SQL constrains the exact ID,
  provider, event name, `server_retry`, due state, and claimant cutover.
- Provider-classified `retry_scheduled`/`dead_lettered` outcomes acknowledge
  the Queue message. Only thrown infrastructure errors are redelivered by
  Vercel Queue after 15 seconds. Database retry follows `next_attempt_at`.
- `/api/cron/provider-outbox-dispatch` is scheduled every five minutes for
  recovery, due retry, and stale-claim fallback. Vercel logs on the current
  deployment showed recurring `200` responses at that cadence; it is not the
  primary delivery wake-up. A post-commit Queue publish failure leaves the
  durable attempt pending for this fallback.
- Microsoft server workers are active and have production API-acceptance
  history for `add_to_cart`, `begin_checkout`, and `purchase`. Missing
  `msclkid`/ApiToken remains fail-closed as `skipped_unqualified`.

## Historical tracking release — 2026-07-26

This section retains the 2026-07-26 tracking activation freeze. Web-GTM v135
is live; v133 introduced the canonical
mapping from workspace 141, v134 changed only the redundant GTM
additional-consent setting, and v135 changed only tag 153 to initialize on
page load and poll future canonical `dataLayer` entries with the app bridge's
shared duplicate guard. Application deployment
`dpl_7EvERHHrH7pfAYK7jQcwMySZjD5W` from exact SHA
`3799e58ac90a4c0177d3bd6fba8a1d2ad3fd2ea2` was `READY` and owned
`utekos.no` at activation time:

| Release surface | Repository state | Production evidence |
| --------------- | ---------------- | ------------------- |
| Canonical catalog | 33 events: 29 active and four `blocked_source`; includes `interact_with_accordion` and `open_quick_view` | Both new routes accepted genuine production actions |
| Product-list impressions | 50% continuous visibility for 1s, per-page variant dedupe, ≤20-item chunking and named surfaces | `view_item_list` `5d162e4f-9416-4883-aad0-2787b4601a53`; Meta `events_received=1`, Google later `SUCCESS` |
| Meta CAPI | 17 registered workers with exact new PascalCase mappings | Every controlled stale-event request returned `events_received=1`; adapter latency 127–304 ms |
| Meta browser | Same-origin bridge and GTM template share mapping and duplicate-suppression state | `InteractWithAccordion` `d51aa3ea-a427-4f8a-9098-005f77007626` captured with identical Pixel `eid` and CAPI `event_id` |
| Google Data Manager | 28 registered workers including both new canonical events | Executed (`validate_only=false`) request IDs stored; representative first requests reconciled to `SUCCESS` |
| Immediate delivery | Post-commit Vercel Queue wake-up with exact attempt claim, seven-day retention and 15-second infrastructure redelivery | Queue consumer returned `200`; completed attempts precede the five-minute fallback window |
| Fallback | Existing five-minute provider cron retained; stale-processing reclaim aligned to fallback window | Retained and not needed for the representative immediate dispatches |
| Health | 15-minute Sentry health route for missing attempts, publish failures, pending age, dead letters and p95 ACK | First scheduled run returned `200` at `2026-07-26T15:45:30Z`; 190-sample p95 `5 750 ms`; zero initial pending >2m, recent dead letters or canonical events without an attempt |
| Remove from cart | Shopify response is authoritative for full deletion and actual positive quantity delta, including 3→2 | Genuine 3→2 event `cb48d8fb-0fbb-416e-8d57-f83715a42a59`; Meta `events_received=1` |

The release does not change the database schema, Purchase contract,
destination IDs, campaigns, budgets, conversion goals or historical rows.
Missing PII/`fbc`/`fbp` is not synthesized. At this release point, Microsoft
CAPI expansion was a separate quality gate; all three approved lower-funnel
workers were production-accepted by 2026-07-22. The deployment did not change the Supabase
schema and performed no synthetic or historical replay.
Activation evidence is tracked in
[canonical-stale-events-near-realtime-cutover-2026-07-26.md](evidence/canonical-stale-events-near-realtime-cutover-2026-07-26.md).

## Executive summary

The project has a typed 33-event catalog, a shared consent-aware browser
collector, 27 first-party event routes, Zod validation, atomic ledger/outbox
persistence, exact-attempt Vercel Queue wake-up, a generic `SKIP LOCKED`
database fallback, and 49 provider workers (29 Google, 17 Meta, three
Microsoft UET CAPI). It also has provider retries/dead letters, Google request-status
reconciliation, intended Shopify webhook purchase/refund routes
with verified browser/backfill purchase ingestion, Cookiebot
Consent Mode and first-party GTM/sGTM routing.

The principal remaining problems are coexistence with historical naming/data,
generic acceptance semantics, and provider-specific quality gaps. DEV-001's
full-registry request-path drain is closed by exact-attempt Queue dispatch. At
2026-07-31T01:04:19Z, the live warehouse had 36,591 ledger rows and 43,705
attempts, with no `pending`, `processing`, `retry_scheduled`, or `failed`
backlog, but still contains both canonical snake_case and legacy/provider
PascalCase names. Google finality is
reconciled via status cron; Meta success remains `accepted_unverified`.
Browser/server shared-`event_id` parity is wire-proven, while Events Manager
Overlap UI remains unverified (DEV-020). Microsoft browser UET is live; `add_to_cart`, `begin_checkout`, and
`purchase` UET CAPI each have `accepted_unverified` production evidence.

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

## Repository and deployment state

| Item | Current state | Evidence |
| --- | --- | --- |
| Default branch / HEAD | `main` / `7a9f19ed3f94cc08ee3140ddb4c99afe4af3d564` | Git remote HEAD |
| Current production | `READY`, owns `utekos.no`, exact same SHA | Vercel `dpl_7aYMhUMJTxyiTtWL38Wkxh5QpzaL` |
| Historical tracking release | Targeted Queue activation evidence | `dpl_7EvERHHrH7pfAYK7jQcwMySZjD5W` / `3799e58a` |
| Runtime region | `arn1` | Vercel API |
| Node.js | 24.x | `package.json`, Vercel project |

**Historical PR note:** PR 44 added a ten-identifier cap and positive retry jitter to
pre-refactor files. The same intent is already on `main`:
`googleDataManagerSharedMapping.ts` centralizes
`MAX_USER_IDENTIFIERS = 10`, deduplication and interleaving,
while `processProviderOutboxAttempt.ts` applies positive jitter.
Merging PR 44 would reintroduce event-specific mapping structure.
It should be closed as superseded only after separate approval;
Oppgave 0 did not change it.

## Canonical event model

`src/lib/analytics/eventCatalog.ts` declares 33 events: 30 active
and three `blocked_source`. `src/lib/analytics/canonicalEvent.ts`
defines the implemented Zod discriminated union. Each active
event declares an owner, trigger, dedupe policy, consent policy
and provider mapping. The complete chain is in
[event-matrix.md](event-matrix.md).

The three source-blocked events are:

- `add_shipping_info`
- `checkout_error`
- `payment_error`

They are not eligible for persistence or provider dispatch until
an authoritative source is implemented.

`add_payment_info` is active with Shopify
`payment_info_submitted` submission semantics. A strict v2 observation must
carry a PII-free UUID that resolves to an analytics-consented canonical
`begin_checkout`; the receiver then copies only canonical commerce and GA
browser identifiers into a deterministic `add_payment_info` event. Only the
Google Data Manager outbox is active. Meta, Microsoft and PostHog remain
disabled, and `purchase` ownership is unchanged.

Production cutover completed on 2026-08-04 at `03:27:09Z`. Shopify readback
proved that only the old `payment_info_submitted` subscription was removed;
`checkout_completed` and `purchase` remain intact. Vercel deployment
`dpl_Gpp5WET4fWKxt3A34zSAmHbKdjMp` is `READY`. Supabase migration
`20260804033956_allow_shopify_checkout_observation_v2` is applied, and the
validated observation constraint accepts only schema versions 1 and 2 while
preserving forced RLS and the existing grants. There is not yet a natural
post-cutover v2 observation, canonical event or provider attempt, so live
Google delivery remains pending evidence rather than inferred success.

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

There are 27 event routes under `src/app/api/events`.
Each route delegates collection to the event-specific canonical handler. After
an accepted transaction commits, the store publishes only the exact newly
created provider-attempt IDs to Vercel Queue; event routes do not start a
full-registry `after()` batch. Intended authoritative purchase/refund sources are the
Shopify `orders-paid` and `refunds-create` webhook routes;
verified active purchase ingestion is the browser purchase route
plus Meta purchase-backfill (webhook production delivery is
unverified). `generate_lead` and `form_submit` are server-owned
even though event API routes also exist for their canonical
collection path.

Duplicate canonical events return the existing event outcome without inserting
new dispatch rows. The 2026-07-31 live snapshot had 36,591 ledger rows; the 36
distinct stored event-name spellings include history and are not the 33-event
catalog inventory.

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
exists. Non-purchase Google rows without `client_id` are
persisted as terminal `skipped_unqualified` with
`skip_reason='missing_client_id'`. Google purchase accepts
`clientId`, consent-permitted GCLID, or consent-permitted
User-ID; hashed `userData` alone is not qualifying. A purchase
without all three uses `missing_google_analytics_identifier`.
Purchases older than 72 hours use `google_event_outside_72h`;
purchases between 48 and 72 hours remain eligible and are
measured as `late_within_window`.

### Claim and locking

There are two related claim paths:

1. Targeted Queue delivery uses `claimById`. It requires exact attempt primary
   key, provider, event name, `server_retry`, due/cutover state, and uses
   `FOR UPDATE SKIP LOCKED`. A `processing` row becomes eligible for targeted
   reclaim after 15 seconds.
2. The five-minute recovery cron uses generic `claimNext` per
   `(provider, event_name)`. It:

- selects `server_retry` rows;
- claims `pending`/`retry_scheduled` rows whose `next_attempt_at`
  is due;
- reclaims `processing` rows stale for five minutes;
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

### Targeted Queue and cron fallback

`/api/cron/provider-outbox-dispatch` and
`/api/cron/google-data-manager-status` run every five minutes. The dispatch
cron invokes all 48 registered provider/event workers with `maxItems: 10` as
recovery, due-retry, and stale-processing fallback.

Primary post-commit delivery publishes one PII-free Queue message per newly
created attempt. Idempotency is `${adapterKey}:${attemptId}`; the consumer runs only
that adapter and calls `claimById` for that exact attempt. Provider-classified
`retry_scheduled` and `dead_lettered` outcomes return normally and ACK the
message. Only unclassified infrastructure exceptions are thrown for Vercel
Queue redelivery after 15 seconds. Database retries remain governed by
`next_attempt_at`; Queue redelivery and database retry are not the same state
transition. DEV-001 is closed.

### Index alignment

The queue has useful status, provider/status, event/provider,
skipped and dead-letter indexes. The main claim key includes
provider, event name, dispatch mode, status and due time, but no
index includes `event_name`; under backlog, each worker can
heap-filter the shared queue. Google status polling has no
`request_id` index and currently plans a sequential scan. No
index was added in this audit.

## Status and finality

Finality has three independent axes: local attempt status, provider delivery
and external attribution/dedupe. The complete decision matrix and operator
trace are in
[`provider-finality-runbook.md`](provider-finality-runbook.md).

Live allowed attempt statuses:

| Status                | Set by                                      | Local terminality              | Provider meaning                                                        |
| --------------------- | ------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| `pending`             | Persistence plan                            | No                             | No send proven                                                          |
| `processing`          | Claim/reclaim query                         | No                             | Unknown                                                                 |
| `retry_scheduled`     | Generic worker                              | No                             | Retryable local failure; provider outcome can still be unknown          |
| `accepted_unverified` | Generic worker completion                   | Yes for that send attempt      | Expected receipt observed; not provider-confirmed terminal delivery     |
| `succeeded`           | Google reconciliation or historical repair | Yes                            | Confirmed only with Google reconciliation evidence; older rows can be administrative history |
| `failed`              | Historical schema state                     | No current writer found        | Legacy/non-current; unknown                                             |
| `dead_lettered`       | Worker or Google reconciliation             | Yes until explicit repair      | Local terminal failure; provider rejection only when receipt semantics prove it |
| `skipped_unqualified` | Dispatch planning/repair                    | Yes; no send                   | Not attempted; a specific `skip_reason` is required                     |

The worker outcome named `succeeded` is persisted through
`markAcceptedUnverified`, so every successful generic adapter call first
becomes `accepted_unverified`. Google alone has a repository reconciliation
path: `SUCCESS` with exactly one record and no processing errors becomes
`succeeded`; `SUCCESS` with warnings stops polling but remains
`accepted_unverified` with warning semantics; `FAILED`/`PARTIAL_SUCCESS`
becomes a provider-evidenced dead letter; `PROCESSING`, unknown status,
polling errors and timeouts remain unconfirmed. Meta and Microsoft have no
authoritative per-attempt reconciliation path and therefore remain
`accepted_unverified`.

No attempt status proves that the provider deduplicated the event, matched it
to a person, attributed it to an ad or used it for optimization. Those effects
require separate provider evidence at the grain actually exposed.

### KRI-23 read-only finality trace

At `2026-07-31T01:51:42Z`, representative production joins from ledger to
attempt and embedded receipt showed:

- Google `4c5cf358-6a11-4259-bc69-7a500492f1f3`: provider status
  `SUCCESS`, one record, `provider_confirmed=true`, and
  `response_semantics=provider_confirmed_success`.
- Google `8faba95a-7b80-4b1d-930e-0bb6cd11beb8`: provider status
  `PROCESSING`; correctly remained `accepted_unverified`.
- Meta `a01ecb9b-8d89-4593-a439-a6db14be3096`:
  `events_received=1`; correctly remained `accepted_unverified`.
- Microsoft `6d35806a-fe96-474d-a8b3-a9057ddd2e48`: HTTP 200 with no
  request ID; correctly remained `accepted_unverified`.
- Microsoft `89193dc6-d777-496c-ac33-1275d9c0f701`:
  `skipped_unqualified`, `missing_msclkid`, zero attempts.

All five had a correlated ledger row. The first is confirmed provider
processing; the next two provider receipts are observed but unconfirmed; the
skip was not attempted. Attribution and dedupe remain unknown for every sample.

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

Google Data Manager server outbox exists for 28 active events.
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
- **Current server workers:** `microsoft_uet:add_to_cart`,
  `microsoft_uet:begin_checkout`, and `microsoft_uet:purchase` are registered
  with catalog `serverOutbox: active`. Fail-closed plan skips include
  `missing_msclkid` and `missing_capi_token`. Other Microsoft events remain
  `blocked_no_worker` on the server.
- **Current read-only evidence (queried 2026-07-31T01:04:19Z):** the three
  latest accepted attempt IDs are
  `6d35806a-fe96-474d-a8b3-a9057ddd2e48` (`add_to_cart`),
  `8cf42314-450b-4441-b53c-9b19bba2462e` (`begin_checkout`), and
  `f8a584d8-359d-4584-923a-325a18a5ad52` (`purchase`). All are
  `server_retry`, `attempt_count=1`, `accepted_unverified`. Counts were 4/1/1
  accepted respectively, plus 93/59/18 `missing_msclkid` skips. These receipts
  prove provider API acceptance, not final attribution.
- **Historical production purchase journey verified 2026-07-20T21:45Z:**
  Shopify order `#6ULWCDZT5` (Stapper, `KRISTOFFERTESTRABATT`,
  synthetic `msclkid=14428fb9-9d65-4b7e-8027-c290d49c142e`).
  Ledger purchase
  `event_id=cdd83f38-3b67-4aac-9142-1bb42cea45ab`. Microsoft UET
  attempt `accepted_unverified` / `provider_accepted_unverified`
  (latency 209 ms); **not** `missing_msclkid` /
  `missing_capi_token`. Artifact:
  `.agent-artifacts/analytics/microsoft-uet-capi-purchase-journey-2026-07-20.json`.
- Historical Microsoft rows remain audit history; new qualified lower-funnel
  events use the three active workers.

Historical conversion-goal audit (2026-07-20): UET Active; Add To
Cart, Begin Checkout, PageView Active. Browser smoke verified UET
`pageLoad` + custom `view_item` post-consent.

### PostHog

PostHog remains represented in the catalog as planned/not
implemented. It is not part of the active canonical dispatch
registry.

## Shopify webhooks

**Authoritative source contract:** Shopify `orders-paid` → canonical
`purchase`; `refunds-create` → canonical `refund`.
Product webhooks (`products-create` / `update` / `delete`) are
cache invalidation only.

**Verified live delivery:** production Vercel received 14
`/api/shopify/webhooks/orders-paid` requests in the inspected seven-day window
(12 HTTP 202, two HTTP 200), and ledger/attempt evidence proves passive
orders-paid ingestion. Historical browser/backfill purchase rows remain in the
warehouse. No matching `refunds-create` runtime traffic was observed.

**Configuration ownership unknown:** the inspected Admin token returned zero
shop-specific GraphQL/REST subscriptions, but app-specific Shopify notification
subscriptions are not visible through that query. Live `orders-paid` delivery
therefore must not be described as missing; the owning app/configuration and
the unobserved `refunds-create` delivery remain open (DEV-008).

Webhook HMAC is verified fail-closed against the raw body with
SHA-256 and constant-time comparison. Purchase/refund IDs are
deterministic when those handlers run. `refunds/create` means a
refund object was created; it does not prove settlement or
financial reconciliation.

## Production data snapshot

### Current read-only snapshot — 2026-07-31T01:04:19Z

| Measure | Value |
| --- | ---: |
| Ledger rows | 36,591 |
| Distinct historical/current ledger spellings | 36 |
| Provider attempts | 43,705 |
| `succeeded` | 31,722 |
| `accepted_unverified` | 10,187 |
| `skipped_unqualified` | 1,652 |
| Historical attempt rows with `dead_lettered` status | 144 |
| `pending` / `processing` / `retry_scheduled` / `failed` | 0 / 0 / 0 / 0 |
| Historical `ops.dead_letter_events` rows | 1,281 |
| Resolved / unresolved dead-letter audit rows | 1,281 / **0** |

The 36 stored names include historical/provider aliases and do not redefine
the code-owned 33-event catalog. Likewise, 144 historical attempt rows with
status `dead_lettered` and 1,281 historical dead-letter audit rows do not mean
there are active dead letters; the unresolved count is zero.

### Historical snapshot — 2026-07-20

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

On current deployment `dpl_7aYMhUMJTxyiTtWL38Wkxh5QpzaL`, Vercel runtime
logs showed `/api/cron/provider-outbox-dispatch` returning `200` at five-minute
intervals from 2026-07-30T23:10Z through 2026-07-31T01:01Z. No Queue callback
appeared in the inspected current-deployment window, so near-real-time callback
evidence remains the historical 2026-07-26 release proof. The cron log proves
the fallback is running, not that it was the claimant for a particular attempt.

Historical project-wide errors:

- Supabase `EMAXCONNSESSION` for web-vitals and consent
  snapshots: indirectly relevant to warehouse write reliability.
- Next.js “Failed to parse postponed state”: not a canonical
  event defect, but affects high-traffic rendering routes.
- Browser extension/Cookiebot `Illegal invocation`: not
  reproduced in the inspected server error groups.
- Historical `UET is not defined`: not reproduced in the
  inspected server error groups; browser-console verification
  remains blocked.

## Historical tests and baseline validation — 2026-07-20

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

1. Meta shared-`event_id` browser/server parity is proven; Events Manager
   Overlap UI remains unverified.
2. Historical/provider names coexist with canonical names; older
   rows are not uniformly claimable by current workers.
3. Generic accepted status does not express Meta, Google, and Microsoft
   finality equally.
4. Google diagnostics lookups lack an aligned request-ID index; the generic
   fallback claim lacks an event-name-aligned index. Exact-ID Queue claims do
   not share this scan risk.
5. Data Manager executed ingestion is live
   (`GOOGLE_DATA_MANAGER_VALIDATE_ONLY=false`); still treat
   `accepted_unverified` as pre-reconciliation until status cron
   maps SUCCESS → `succeeded` (P0/P1 env watch — do not flip
   validate-only without approval).
6. Microsoft UET CAPI has API-acceptance evidence for `add_to_cart`,
   `begin_checkout`, and `purchase`; final attribution and identifier coverage
   remain open, and other Microsoft server events remain blocked.
7. Live `orders-paid` route delivery is proven, but the owning Shopify
   notification subscription/app configuration is unknown and
   `refunds-create` traffic remains unobserved.
8. Consent snapshots stop after the 2026-07-15 reset; this is
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
- Vercel Queue SDK and callback acknowledgement/redelivery:
  <https://vercel.com/docs/queues/sdk>
- Vercel cron jobs: <https://vercel.com/docs/cron-jobs>
- PostgreSQL `SELECT` locking:
  <https://www.postgresql.org/docs/current/sql-select.html>

## Areas blocked from verification

Current KRI-22 boundaries:

- No Queue callback occurred in the inspected window for current deployment
  `dpl_7aYMhUMJTxyiTtWL38Wkxh5QpzaL`. Exact callback evidence therefore comes
  from the historical 2026-07-26 tracking release, while current deployment
  proves the same code SHA and a live five-minute cron.
- Supabase does not record whether Queue or cron owned a particular claim.
  Attempt rows alone cannot prove claimant identity or distinguish Queue
  redelivery from database retry.
- Microsoft `accepted_unverified` receipts do not prove final Ads dashboard
  attribution. No replay, synthetic traffic, provider write, or new checkout
  was authorized for this documentation task.

**Historical access record — 2026-07-20 after credential repair:**

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
  - **Historical/Superseded:** wire-level shared-`event_id` parity is now
    proven. Do not claim the separate Events Manager Overlap UI as verified
    until that provider surface is observable. Collector stores omitted
    feedback as `{ status: 'omitted_by_provider' }` instead of coercing to
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
  smoke previously green. **Historical/Superseded:** at that snapshot,
  non-purchase Microsoft events were `blocked_no_worker`; `add_to_cart` and
  `begin_checkout` joined `purchase` as active workers by 2026-07-22.
- **Resolved earlier:** Meta Events Manager activity/source
  split/match keys; Shopify app-scoped subscriptions empty;
  browser console/network smoke SMOKE-001..007.
- **Partially resolved:** Google Ads destination `AW-18180376403`
  observed in browser smoke; per-request Data Manager diagnostics
  beyond stored application responses remain limited.
- **Historical open set:** Meta dedupe Overlap (DEV-020); Shopify webhook
  delivery source (DEV-008); Oppgave 1 dispatch isolation (DEV-001).
  **Current correction:** shared-`event_id` parity and live `orders-paid`
  delivery are proven; Overlap UI, Shopify configuration ownership,
  `refunds-create`, and the other DEV-008 boundaries remain open. DEV-001 is
  closed by exact-attempt Queue dispatch.
