# Canonical events

Status date: 2026-08-10

The application owns event meaning. GTM and sGTM are delivery
adapters, not the event inventory or source of truth.

## Active inventory

The v1 inventory contains **33 canonical events: 30 active and three
`blocked_source`**. The blocked events are `add_shipping_info`,
`checkout_error`, and `payment_error`. The machine-readable catalog and its
contract tests are authoritative for the exact list.

| Event | Owner | Detection | Delivery | Status |
| --- | --- | --- | --- | --- |
| `page_view` | Next.js application | Initial render and App Router URL change | `dataLayer` -> web GTM -> `/__sgtm` -> GA4, plus consent-aware first-party collection, qualified Meta CAPI and consent-gated Microsoft browser UET | Active; Meta server outbox active; Microsoft browser active; no registered Microsoft `page_view` server worker |
| `view_item` | Next.js application | Resolved product and selected variant on a product page or landing purchase context (`/skreddersy-varmen`) | GTM/sGTM + ledger + Google Data Manager + Meta CAPI | Active |
| `add_to_cart` | Shopify cart service | After accepted cart mutation | GTM/sGTM + ledger + Google Data Manager + Meta CAPI + qualified Microsoft UET CAPI | Active |
| `begin_checkout` | Shopify checkout service | Before checkout redirect with valid checkout URL | GTM/sGTM + ledger + Google Data Manager + Meta CAPI + qualified Microsoft UET CAPI; persists checkout consent snapshot | Active |
| `add_payment_info` | Shopify App Web Pixel | `payment_info_submitted` correlated to an analytics-consented canonical `begin_checkout` | Ledger + Google Data Manager | Active; submission semantics, not payment success |
| `purchase` | Shopify orders-paid webhook | Verified order-paid webhook | Ledger (operational) + Google Data Manager + Meta CAPI + qualified Microsoft UET CAPI when checkout consent permits | Active |
| `refund` | Shopify refunds-create webhook | Verified refund webhook | Ledger (operational) + Google Data Manager | Active |
| Remaining behavior/commerce/lead/form/UX events | Storefront detectors / reporters | See `EVENT_CATALOG.md` | First-party API + Google Data Manager; Meta where catalog specifies | Active (schemas, collectors, adapters); some detectors still reporter-only |
| `add_shipping_info`, `checkout_error`, `payment_error` | — | — | — | `blocked_source` until an authoritative Shopify checkout source is approved |

GA4 Enhanced Measurement page views, browser-history page views
and the Google tag's automatic `send_page_view` must remain
disabled. This avoids double counting and makes the application
event the only semantic source.

## `page_view` v1 contract

The canonical payload is available at `canonical_event` on the
GTM `page_view` event. Required fields are:

- `schema_version`, `event_name`, `event_id`, `page_view_id`
- `event_time` as UTC ISO 8601 with milliseconds
- `source`, `environment`, `page_url`, `page_title`
- a Cookiebot consent snapshot

Optional, validated context includes `referrer_url`, `click_id`,
`browser_id`, `impression_id`, `user_data`, `custom_data`,
`client_ip_address`, `event_device_info`, `region_code` and
`location`. Provider adapters translate these neutral names to
Google, Meta and Microsoft fields.

The browser does not prompt for precise geolocation during
`page_view`. IP and coarse location are server enrichment fields.
Precise browser location requires a separate explicit browser
permission and use case.

Existing browser identifiers are read only when the matching
Cookiebot category is already granted. The event does not create
identifier cookies.

## Current production dispatch contract

Ledger insertion and provider-attempt creation are one idempotent database
transaction. After commit, only the primary keys of attempts created by that
transaction are published to Vercel Queue topic
`canonical-provider-dispatch-v1`. The PII-free envelope contains only
`schema_version`, `attempt_id`, and `adapter_key`, with idempotency key
`${adapterKey}:${attemptId}` and seven-day retention.

The Queue consumer validates both fields and invokes the matching registered
worker. Its SQL claim is constrained by the exact attempt primary key,
provider, canonical event name, `dispatch_mode='server_retry'`, due state, and
claim cutover. It cannot claim unrelated backlog.

Provider-classified outcomes such as `retry_scheduled` and `dead_lettered` are
stored in PostgreSQL and acknowledge the Queue message. Only uncategorized
infrastructure exceptions are rethrown for Vercel Queue redelivery, configured
after 15 seconds. Provider retries follow the database row's `next_attempt_at`.
If post-commit publishing fails before a Queue message exists, the database
attempt remains pending and the failure is reported; the cron later recovers
that row.
The authenticated `/api/cron/provider-outbox-dispatch` runs every five minutes
as recovery, due-retry, and stale-claim fallback; it is not the primary wake-up
for newly accepted events.

The current registry contains 49 active provider/event pairs: 29 Google, 17
Meta, and three Microsoft UET CAPI workers. Microsoft server delivery is active
for `add_to_cart`, `begin_checkout`, and `purchase`; missing ApiToken or
`msclkid` is recorded fail-closed as `skipped_unqualified`. A provider API
receipt remains `accepted_unverified`, not proof of final dashboard attribution.

Web-GTM v141 is the current published browser container and v140 is its
immediate rollback. A controlled Microsoft `page_view` CAPI probe returned
HTTP 200 with `eventsReceived=1`, but this is transport evidence only and does
not add `page_view` to the registered three-worker Microsoft server contract.

## Server ingestion foundation

The server ingestion foundation includes tested first-party Route
Handlers at `POST /api/events/page-view` and
`POST /api/events/view-item`. Their browser transports wait for a
Cookiebot decision and collect only when analytics or marketing
consent is granted.

At the server trust boundary:

- the complete payload is reparsed with the canonical Zod schema;
- request-derived IP address, user agent and coarse location
  replace browser-supplied values;
- marketing identifiers and hashed user data are removed unless
  marketing consent is granted; and
- events with both analytics and marketing consent denied are
  rejected before storage.

The generic Postgres adapter persists the canonical event in
`marketing.event_ledger` and its provider intents in
`ops.provider_dispatch_attempts` within one transaction. Stable
idempotency keys use the canonical event name and `event_id`; a
ledger conflict returns `duplicate` without creating new outbox
rows. No schema change is required.

The Route Handler requires same-origin JSON, rejects bodies over
32 KiB, returns no-store responses, and derives IP, user agent
and coarse location with `@vercel/functions`. Raw database errors
and event payloads are not returned or logged.

Historical Microsoft `page_view`/`view_item` rows have no approved server
worker and must not be blindly replayed. Historical Meta `page_view` rows from
before claimant cutover must also remain separated from current canonical
traffic. New qualified events create only the outbox pairs owned by the current
catalog. Provider attempts keep independent counts, statuses, and retry
histories.

**Historical — Superseded 2026-07-26:** the 2026-07-17 deployment started a
combined Meta/Google registry batch through Next.js `after()`, while the
five-minute cron existed only in the local foundation. The targeted Vercel
Queue contract above replaced that request-path full-registry drain in
production. The five-minute cron is now deployed and retained as fallback.
Google authenticates with Vercel OIDC and Google Workload Identity
Federation, then sends to Data Manager with
`GOOGLE_DATA_MANAGER_VALIDATE_ONLY=false`. An accepted response is
stored as `accepted_unverified`, including request and validation
metadata. The adapter caps `additionalItemParameters` at the live
provider limit of 24; the canonical ledger retains every source
field. The shipped mapping uses canonical `event_id` as browser
`transaction_id` and Data Manager's top-level `transactionId`, which Google
documents as the cross-source deduplication field. It also omits request IP
unless server-derived country is known and outside the EEA, UK and
Switzerland.

The production event
`a28a8f3c-ba90-4006-9dd8-429072a3c772` reached Meta and Google on
their first independent attempts after the executed-ingestion cutover.
Google returned request ID
`a9ebe80f-9c54-4bd9-9971-6c4c7bb1a43c` with
`validate_only=false`; Meta returned `events_received=1`.
This proves provider acceptance, not that the published GTM tag forwarded
`transaction_id` or that GA4 counted the event only once.

Microsoft UET CAPI maps `page_view_id` to `pageLoadId` and uses
`event_id` for deduplication. Microsoft ID sync remains a
separate consent-gated browser responsibility when audience
matching or remarketing is enabled.

## Documentation and release consistency

Any change to event meaning, source, consent, destination, worker registry or
provider finality must update the affected contract surfaces together:

- `EVENT_CATALOG.md` and its machine-readable implementation/tests;
- this document and `docs/analytics/event-matrix.md`;
- `docs/analytics/current-state.md` and `FLOW.md` when active status changes;
- `DEPLOYMENT.md` for release order, provider mutation, rollback and evidence.

Release verification must follow the same event ID from browser or webhook
through collector, ledger/outbox, provider response and external reporting.
HTTP 200, `eventsReceived`, a `READY` deployment or a visible browser request
must never be promoted to provider attribution or bidding proof.

The pre-consent Google `dataLayer` event remains separate from
first-party persistence. A consent update may release a held
canonical event to the collector, but it must never emit a second
Google event.

## `view_item` v1 contract

`view_item` reuses the canonical event context and the
`page_view_id` from the page view that owns the product render.
Its `custom_data` contains one provider-neutral commerce item
with Shopify product and variant ids, currency, net and gross
values, tax data, availability, selected options and collection
context.

The product reporter emits once for each resolved product/variant
context after the owning `page_view` has been emitted. This covers
product pages and the `/skreddersy-varmen` landing purchase section.
Re-rendering the same context is deduplicated; a committed variant
change is a new legitimate `view_item`. The collector re-evaluates
Cookiebot at send time, removes marketing identifiers without
marketing consent and replaces browser-supplied IP, user-agent
and coarse location with request-derived values at the server
boundary.

## Event foundation

[`EVENT_CATALOG.md`](EVENT_CATALOG.md) and
`src/lib/analytics/eventCatalog.ts` are the authoritative human- and
machine-readable allowlists for all 33 v1 decisions. All 30 active
catalog events now have implemented schemas in the discriminated
canonical union. The three `blocked_source` entries remain decisions
without runtime detectors until an authoritative checkout source is
approved.

Provider routing reads the deployed catalog and can enqueue only an explicitly
active provider/event pair. A registry invariant test requires the
catalog's active outbox pairs, adapter keys and worker keys to be
identical. Queue claim, retry, receipt, dead-letter and Postgres logic
are generic; a new event therefore adds its detector, schema, provider
mappings/adapters and tests without a new queue or retry architecture.
The Supabase/Postgres outbox remains the durable attempt and retry truth;
Vercel Queue is the targeted wake-up transport, not a second provider-status
ledger. Vercel Workflow is not part of this dispatch path.

Ledger insertion and provider-row creation are transactionally
idempotent. Completion is guarded by the claimed attempt generation so a
stale worker cannot commit over a newer claim. Provider transport remains
at-least-once across the crash window after external acceptance and before
the local receipt commit; retries preserve Meta `event_id` and Google
`transactionId` for provider deduplication. Both active HTTP transports have
a 10-second request deadline; timeout failures are retryable.

## Browser verification gate

Before publish, prove in GTM Preview and sGTM Preview that:

1. The Google base tag is processed before `page_view` and has
   `send_page_view=false` and
   `server_container_url=https://utekos.no/__sgtm`.
2. One initial view and one event per App Router URL change are
   emitted.
3. Initial external referrer and subsequent virtual referrers are
   correct.
4. Denied consent creates no optional cookies; Google cookieless
   pings may still use `/__sgtm` in Advanced Consent Mode.
5. Meta, Microsoft and other non-Google adapters do not fire
   without their required consent.
6. The actual browser/sGTM Google request for `view_item` contains
   `transaction_id` equal to Data Manager `transactionId`. If this cannot be
   proved, Data Manager must remain validate-only or one Google route must be
   disabled before executed ingestion is approved.
