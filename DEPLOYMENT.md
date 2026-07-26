# Deployment And Migration Checklist

Status date: 2026-07-26

This is the mandatory release checklist for Utekos Headless. Use it
before every deploy, production mutation, provider change, GTM publish,
tracking change, database migration, or operational tooling change.

The purpose is simple: no runtime change should reach production before
its required database, provider, environment, and verification steps are
known and completed in the correct order.

## Active Meta stale-event / near-real-time release 2026-07-26

Web-GTM v134 is live. Version 133 introduced the canonical mapping from
isolated workspace 141 with only tag 153 and trigger 152 changed; v134 changed
only GTM's redundant additional-consent setting while the tag's explicit
Cookiebot marketing guard remained fail-closed. Application deployment
`dpl_7EvERHHrH7pfAYK7jQcwMySZjD5W` from exact Git SHA
`3799e58ac90a4c0177d3bd6fba8a1d2ad3fd2ea2` is `READY` and owns
`utekos.no`. It required no database migration and did not change Purchase,
destination IDs, campaign settings, budgets, conversion goals or historical
events. The configured Meta pixel/dataset remains `1092362672918571`.

Activation was executed in this order, with each mutation separately approved:

1. Create/verify an isolated web-GTM workspace from
   `config/gtm/web-meta-pixel.html`, then publish only the approved mapping
   diff. Record the resulting GTM version; the previous published version is
   the GTM rollback.
2. Deploy the application release with the queue trigger for
   `canonical-provider-dispatch-v1` and the 15-minute
   `/api/cron/provider-dispatch-health` schedule. Record exact Git SHA and
   deployment ID; the previous READY deployment is runtime rollback.
3. Perform only genuine, controlled, consented actions for every affected
   event. Do not use heartbeat events or blind historical replay.
4. Correlate each action through `dataLayer`, collector 2xx, ledger, exact
   provider-attempt, queue consumer, provider receipt and external UI/API.
   Meta requires the exact same PascalCase name and canonical UUID in Pixel
   `eventID` and CAPI `event_id`.
5. Record normal p95 ACK ≤60 seconds and fallback ≤5 minutes. Recheck Dataset
   Quality, dedupe, match keys and freshness after 7 and 14 days.

Queue messages contain no PII and use `${adapter_key}:${attempt_id}`
idempotency with seven-day retention. A publish failure after database commit
must preserve collector `202`, alert Sentry and let the cron recover. Microsoft
CAPI expansion is excluded until `pageLoadId`, VID/ID sync and `msclkid` pass a
separate quality gate.

Production evidence:

| Evidence | Value |
| -------- | ----- |
| Published GTM version | `134`; immediate rollback `133`; pre-cutover rollback `132` |
| Vercel deployment ID / Git SHA | `dpl_7EvERHHrH7pfAYK7jQcwMySZjD5W` / `3799e58ac90a4c0177d3bd6fba8a1d2ad3fd2ea2`; `READY`, aliased |
| Representative canonical event IDs | `ViewItemList` `5d162e4f-9416-4883-aad0-2787b4601a53`; `OpenQuickView` `74cec7fd-81f6-4a7b-95b1-0b1c65d7cd01`; `InteractWithAccordion` `d51aa3ea-a427-4f8a-9098-005f77007626`; 3→2 `RemoveFromCart` `cb48d8fb-0fbb-416e-8d57-f83715a42a59` |
| Meta/Google receipts | Every controlled Meta attempt returned `events_received=1`; Google requests were executed with `validate_only=false`, with the first representative new-event requests later reconciled to `SUCCESS` |
| Browser/server dedupe contract | Captured Pixel POST `InteractWithAccordion` used the same `d51aa3ea-a427-4f8a-9098-005f77007626` as CAPI; CAPI trace `A_2GZMmmYF3z8AlGEUWrcaV`, 250 ms |
| Provider health | First scheduled `/api/cron/provider-dispatch-health` completed `200` at `2026-07-26T15:45:30Z`; direct snapshot: 190 accepted samples, p95 ACK `5 750 ms`, zero initial pending >2m, zero recent dead letters, zero canonical events without attempts |
| External Meta freshness | Dataset browser `2026-07-26T15:40:07Z`; server `2026-07-26T15:41:17Z`; event-level dashboard aggregation can lag these receipt times |
| 7-day / 14-day quality result | Pending elapsed observation windows; due 2026-08-02 and 2026-08-09 |

Production proved that the mapped GTM Custom HTML tag did not execute. The
same-origin `/analytics/meta-pixel-canonical-v1.js` bridge therefore owns the
browser channel deterministically. It and the GTM template share the same
mapping and `window.__utekosMetaPixelState.sent` duplicate guard. Direct app
CAPI remains the sole Meta server owner. Polling parity is saved in GTM draft
workspace 143, but publishing that draft is blocked until the expired GTM
OAuth token is refreshed; the live app bridge does not depend on it.

## Golden Rules

- Never deploy Vercel runtime code before required Supabase production
  schema changes are applied and verified.
- Never run `supabase db reset --linked`, destructive SQL, blind diffs,
  or drop-generating migration output against production.
- Never hand-edit generated MCP files such as `mcp.json`,
  `.vscode/mcp.json`, or `.cursor/mcp.json`.
- Never publish GTM, mutate provider resources, change campaigns,
  change budgets, change Shopping catalogs, deploy Microsoft Ads
  Scripts, mutate Shopify catalog data, or deploy production without
  explicit user approval for that concrete action.
- Treat Meta, Google, and Microsoft as equal first-class ad platforms
  whenever they are active.
- Treat row counts as evidence only when source, status, reason,
  unresolved/resolved state, and replay policy are visible.

### Meta identifier and checkout attribution release 2026-07-18

The production release adds a consent-gated Meta Parameter Builder route,
first-party `_fbp`/`_fbc` persistence, dispatch-time `external_id`, trusted
Vercel location matching, a Meta CAPI PageView worker and checkout attribution
for standard Shopify checkout and Klarna Express. It uses the existing
canonical ledger/outbox schema; no Supabase migration was applied.

The Meta PageView adapter has a fixed
`claimNotBefore=2026-07-18T13:13:10.000Z`. Preserve this gate during release:
it allows rows created by the new runtime while preventing blind delivery of
historical blocked PageView rows. Any historical replay remains a separate,
explicitly approved operation.

The runtime was released through commits `8eb0db2a53`, `375f68070`,
`bfd9cf4ef` and `9aa2b787b`, with exact-SHA Vercel deployments verified
`READY` before production aliases moved. Targeted analytics/Klarna tests,
changed-file lint, `next typegen`, TypeScript, production build, MCP
build/doctor and tracking gateway smoke were green.

The consent-gated Meta browser-parity follow-up was released through commits
`76e535dd9` and `74c269061`. Exact-SHA Vercel deployment
`dpl_2B5VwzkG4xg4BFPVRNMhfV9oApan` reached `READY` and was validated on the
production aliases. Web-GTM version `121` is live with Meta Pixel tag `153`,
canonical event trigger `152`, and `autoConfig=false`; version `120` is the
immediate rollback. The isolated GTM workspace diff contained only tag `153`,
compiled without errors and was published after explicit approval. The exact
published tag source has SHA-256
`d9a4186f1bd50804217b8fed91f849f89c6656158e03542f07be1e796101f79e`.
No Supabase schema or environment mutation was required.

The final runtime follow-up is `main` commit
`647e0b7efa1222be67cbb39be0e5588c17ef989e`. Vercel deployment
`dpl_CRYYmnj5D2xRxxodENqBWhsXRiL4` is `READY`, has that exact Git SHA and
owns `utekos.no`, `www.utekos.no`, and `feed.utekos.no`.

After deploy, verify all of the following:

- no `_fbp`, `_fbc` or `utekos_external_id` before marketing consent;
- homepage, product and campaign landings preserve the latest `fbclid`, refresh
  `_fbc` for a new click and retain stable `_fbp`/`external_id`;
- direct product landing creates `page_view` and `view_item` with the same
  `page_view_id`, including after product-query normalization;
- `page_view` and `view_item` ledger rows use trusted Vercel IP/UA/geolocation
  and create only the catalog-approved provider rows;
- Meta accepts the new PageView with `events_received=1`, while no historical
  PageView row is claimed;
- Pixel and CAPI use the same canonical `event_id`, `external_id`, `fbp` and
  `fbc`; Pixel `/tr` and OpenBridge both return 200 after consent;
- Meta automatic event setup remains disabled and the browser produces no
  inferred or unexpected Pixel events;
- standard Shopify checkout carries the attribution snapshot into the
  paid-order webhook and resulting purchase provider payload; this is closed
  by the paid order `1866` evidence below;
- Klarna Express carries the same snapshot through a separately approved paid
  order; opening the production auth/BankID surface is not payment proof;
- Dataset Quality is compared with the documented pre-release baseline after
  sufficient traffic, not inferred from one smoke event.

### Meta SDK v25 native request-context release 2026-07-19

Production commit `1117a0e385832b73aa76a3705e2747dc6757fbc6` replaces the
project-owned `MetaServerEvent` wrapper with the native
`facebook-nodejs-business-sdk@25.0.3` `ServerEvent.setRequestContext()` API.
Vercel deployment `dpl_DCw986Yc1vLsfX2ViadqFpKatTgg` reached `READY`, has the
exact Git SHA and was verified on `utekos.no`, `www.utekos.no` and
`feed.utekos.no`. A later documentation-only deployment may own the aliases
without changing the verified runtime implementation; inspect current alias
ownership separately.

The dependency is pinned to
`file:vendor/facebook-nodejs-business-sdk-25.0.3.tgz`. The checked-in archive
has SHA-256
`88fac8a67e6e78a3715909fa2fd27ccb30da48550530ec6af920d510cc983aac` and its
source, license and README match upstream commit
`584ba8d7414574744abe2f3bf0f2390937c916d5`. Preserve this install form: the
direct Git dependency requires a package build and its nested legacy install
scripts are incompatible with the repository's fail-closed pnpm policy. No
Meta-specific `allowBuilds` exception is required or present.

All active Meta mappers now instantiate the SDK `ServerEvent` and apply the
canonical request context. Explicit event data remains authoritative, so the
raw `ipAddress(request)` result, browser `_fbc`/`_fbp`, canonical
`external_id`, `event_time`, `event_id`, source URL and user agent are retained
when available. The native builder fills only absent values from the request
context and applies Meta's documented appendix to supported user-data values.
The browser Pixel and server CAPI continue to share the canonical event name
and event ID for deduplication.

Release verification:

- frozen pnpm install and runtime import reported SDK `25.0.3`,
  `setRequestContext=function` and `Preference=function`;
- 170 server analytics tests, targeted lint, Next type generation, TypeScript,
  production build, MCP build/doctor and the production tracking-gateway smoke
  passed;
- fresh consented homepage, product and campaign production journeys produced
  matching canonical, Pixel and OpenBridge event names and IDs; all expected
  Pixel and OpenBridge requests returned HTTP 200;
- each of the five fresh canonical IDs had one first-attempt Meta provider row
  with raw IP, user agent, `_fbc`, `_fbp`, `external_id` and a source URL
  containing `fbclid`; Meta returned one received event, no messages and a
  trace ID;
- provider status `accepted_unverified` proves API acceptance only. It is not
  evidence of downstream attribution, campaign reporting or optimization;
- no Supabase schema, Vercel environment or GTM container was changed.

The release-time Dataset Quality baseline is PageView `6.6`, ViewContent
`5.7`, AddToCart `6.4`, InitiateCheckout `6.1`, Purchase `9.3` and Lead `9.0`.
The preceding seven-day event volumes were respectively `2013`, `923`, `44`,
`22`, `42` and `11`; AddToWishlist and Search both had zero reported events.
Zero or low volume is insufficient to diagnose a route failure or establish a
quality trend. A read-only daily snapshot guard runs for 14 days, with explicit
day-7 and day-14 reviews scheduled for 2026-07-26 and 2026-08-02 at 06:45
Europe/Oslo. Those reviews must compare denominators, browser/server volume,
deduplication, match-key coverage, provider acceptance and retry/dead-letter
state; GA data remains separate context rather than Meta quality evidence.

The source runtime has no direct GA4 Measurement Protocol transport. The
legacy `GA4 - MP Purchase` tag was removed under explicit approval and
server-GTM version `29` was published. ADC readback verifies server live v29
and web live v121. See `META_ATTRIBUTION_AUDIT_2026-07-18.md`.

The classified production set contained 628 Google Data Manager
dead-lettered attempts: 594 parameter values longer than the documented
100-character limit, 29 events without a valid GA client ID, and 5 events
outside the accepted timestamp window. This release bounds every
additional event parameter to 100 characters and persists future consented
Google events without a valid client ID as
`skipped_unqualified/missing_client_id` instead of dispatching them. No schema
migration is required: the linked production history matches all 18 local
migrations, and the existing outbox already exposes `status`, `skip_reason`,
`processed_at`, and `response_semantics`.

The 594 length-rejected attempts were requeued after the runtime reached
`READY`: 593 were accepted and one historical `begin_checkout` was closed as
payload-incompatible because it lacked canonical `cart_id`. The 29
missing-client rows and 5 expired rows were closed fail-closed without replay.
Two subsequent clock-skew failures were accepted after the timestamp clamp.
Current provider evidence: 0 failed/dead-lettered rows and 0 unresolved Google
or Meta dead letters. Executed Data Manager requests with a non-terminal
`PROCESSING` status remain status-reconciliation candidates and are not
reported as failures or confirmed delivery. The Microsoft skipped-rate warning
remains intentional because no Microsoft server adapter is registered after
reset.

### Klarna Express production gate 2026-07-18

Production uses the live EU API endpoint and the deployed environment aliases
`KLARNA_API_KEY_USERNAME`/`KLARNA_API_KEY_PASSWORD`. The public client-config
route now fails closed unless server credentials also validate, and it returns
`environment=production` with `Cache-Control: no-store`. The live storefront
opened Klarna's real BankID flow successfully. The authorization token is used
only to create the Klarna order and must never be persisted as a Shopify custom
attribute.

Do not complete a synthetic live payment merely to smoke-test tracking: it
creates a real Shopify order and production provider events. Use Klarna
Playground for a full controlled payment, or verify the next separately
approved live purchase. A visible button and opened auth frame prove client
configuration and origin continuity, not final payment capture. A read-only
scan of the post-release paid orders found no Klarna gateway/tag match, so this
gate remains open without manufacturing an order.

### Vercel Web Analytics restoration 2026-07-18

Web Analytics is enabled on Vercel project
`prj_MpZN3Z0PDp8rfwpdzAeplGe4Di0s`, and the first-party production script
at `https://utekos.no/_vercel/insights/script.js` returns HTTP 200.
The local release adds `@vercel/analytics@2.0.1` and renders
`<Analytics />` from the root App Router layout. Lint, TypeScript and the
full production build pass with 117/117 generated pages.

This is a Vercel runtime change. It requires an explicitly approved push to
`main`, the resulting production deployment must reach `READY`, and the
post-deploy page source/network evidence must show the Web Analytics script
and a successful first-party page-view request. Vercel does not backfill the
missing interval from 2026-07-15. No Supabase migration, GTM publish or
provider mutation is required for this release.

### Canonical event foundation and `view_item` cutover 2026-07-17

The remaining Google Data Manager identifier-limit/retry-jitter patch
was committed directly to `main` as
`2239f30a161da30228d4a5792f31822ef982fd26`. Git-triggered production
deployment `dpl_FMi3yX1D4ASAAP5BNBf8t9bZoY52` reached `READY`.

Production `GOOGLE_DATA_MANAGER_VALIDATE_ONLY` was then changed to
`false`, followed by an exact-SHA redeploy. The first redeploy failed
closed on a transient Shopify prerender timeout without moving the
production aliases; retry deployment
`dpl_JCXHqKaFBHY9r6tEwwU6VNM8mo2K` reached `READY` and owns
`utekos.no`/`www.utekos.no`.

Live consented event `a28a8f3c-ba90-4006-9dd8-429072a3c772` returned
HTTP 202. Its Google row is `accepted_unverified` with request ID
`a9ebe80f-9c54-4bd9-9971-6c4c7bb1a43c` and
`validate_only=false`; its Meta row is `accepted_unverified` with
`events_received=1`. This proves provider acceptance, not that the published
GTM tag forwarded `transaction_id` or that GA4 deduplicated the two sources.
No GTM publish or Supabase mutation was performed.

The local, unreleased foundation adds the 29-event catalog, implemented-event
union, generic provider router/store/worker registry and Vercel cron at
`/api/cron/provider-outbox-dispatch`. `supabase/schemas/40_ops.sql` is
only synchronized to the already-applied migration shape; this release
must not run a new production schema mutation. Before shipping it,
verify `CRON_SECRET`, typecheck, lint, build, linked Supabase lint and
the registry/idempotency contracts. The cron claims one row per registered
provider per invocation; Google and Meta both have abortable 10-second request
deadlines inside the 60-second function budget. Before executed Google
ingestion can remain approved, prove through the published GTM/sGTM request
that browser `transaction_id` equals Data Manager `transactionId`. If that
read-only proof is unavailable, set Data Manager back to validate-only before
shipping. That environment change and redeploy require explicit approval.
After shipping, prove the scheduled route
exists, a consented `view_item` creates only Google and Meta server rows,
browser and Data Manager both carry the same Google `transaction_id`, and
Meta preserves the same `event_id`. Verify that an EEA event sends no request
IP to Data Manager.

Pre-foundation gate 2026-07-17: production browser smoke did not prove
published GTM/sGTM `transaction_id` forwarding. The live dataLayer event on
`utekos.no` lacked `transaction_id` before this foundation release. Production
`GOOGLE_DATA_MANAGER_VALIDATE_ONLY` was set back to `true` before shipping.
An exact-SHA redeploy of `dpl_JCXHqKaFBHY9r6tEwwU6VNM8mo2K` failed on a
transient Shopify prerender timeout; the foundation Git deploy must pick up the
validate-only env change. Re-enable executed ingestion only after post-deploy
proof that browser `transaction_id` equals Data Manager `transactionId`.

### Google Data Manager executed ingestion and status reconciliation 2026-07-18

Web-GTM version `119`, `Canonical GA4 transaction_id parity - 2026-07-18`,
was created and published through the official Tag Manager API. It adds only
`DLV - transaction_id` and the matching `transaction_id` event setting to
canonical ecommerce tag `118`. Quick Preview and the created/published version
reported no compiler error, the existing firing trigger `146` and exact
`view_item` exception `144` were preserved, and live browser traffic proved
that canonical `event_id`, dataLayer `transaction_id`, and sGTM
`ep.transaction_id` use the same UUID.

Production `GOOGLE_DATA_MANAGER_VALIDATE_ONLY` is now `false`. Exact-source
redeploy `dpl_BmrcpEQwaaxhZUFLFNHHv8odzetG` is `READY`, owns `utekos.no`, and
retains Git SHA `4346106d9d3c8afbe5927e46a1dcd4fc678008a7`. Consented
`view_item` event `66d872a9-7a59-4421-a347-2cc12ff4759d` produced Google
request ID `6cae59f5-7c95-41d8-ba55-ed4c03284aef` with
`validate_only=false`; the same canonical event preserved `external_id`,
`fbp`, `fbc`, `fbclid`, client IP, user agent and Vercel-derived Norwegian
location, while Meta returned `events_received=1`.

`IngestEvents` returning a request ID is only provider acceptance. The release
therefore adds `/api/cron/google-data-manager-status`, scheduled every five
minutes separately from provider dispatch. It claims only executed Google rows
with `accepted_unverified`, uses a per-claim UUID lease, calls the documented
`RetrieveRequestStatus`, and projects the result as follows:

- `SUCCESS` -> `succeeded` and `provider_confirmed_success`;
- `PROCESSING` or unknown -> remains `accepted_unverified` for another poll;
- transient status-call errors -> remains retryable with the error audited;
- `FAILED` or `PARTIAL_SUCCESS` -> `dead_lettered` with provider error and
  warning details retained.

No Supabase migration is required. Controlled production status polling uses
20-row batches and five concurrent calls. At 2026-07-18T21:32Z, 340 executed
requests were provider-confirmed `SUCCESS`; 116 remained non-terminal and 60
of those were last confirmed `PROCESSING`. The 987 historical
`validate_only=true` rows are deliberately excluded. The paid order `1866`
request remained `PROCESSING` at 2026-07-18T20:47:54Z. Status attempt 4 then
returned terminal `SUCCESS` at 2026-07-18T21:31:06Z, so the same row is now
`succeeded` with `provider_confirmed_success`, no error and the original
request ID retained.

The implementation is checked against the repository's official local Google
snapshots in
[`docs/data-manager/Best Practices for Using the Data Manager API.md`](docs/data-manager/Best%20Practices%20for%20Using%20the%20Data%20Manager%20API.md),
[`docs/data-manager/Both the Destination concept and request headers.md`](docs/data-manager/Both%20the%20Destination%20concept%20and%20request%20headers.md),
[`docs/data-manager/format-user-data.md`](docs/data-manager/format-user-data.md),
[`docs/data-manager/examples/ingestion_service.ingest_events.js`](docs/data-manager/examples/ingestion_service.ingest_events.js),
[`docs/data-manager/examples/ingestion_service.retrieve_request_status.js`](docs/data-manager/examples/ingestion_service.retrieve_request_status.js),
[`IngestEventsRequest`](docs/google.ads.datamanager.v1/IngestEventsRequest.md),
[`Event`](docs/google.ads.datamanager.v1/Event.md),
[`RetrieveRequestStatusResponse`](docs/google.ads.datamanager.v1/RetrieveRequestStatusResponse.md),
[`RequestStatusPerDestination`](docs/google.ads.datamanager.v1/RequestStatusPerDestination.md),
and [`RequestStatus`](docs/google.ads.datamanager.v1/RequestStatus.md). These
sources require retaining every `request_id`, reviewing per-destination errors
and warnings, and treating `PROCESSING` as non-terminal. The status worker uses
five concurrent calls, below Google's recommendation of up to ten. Event
ingestion currently preserves one canonical event per provider request for
exact event-level audit and retry ownership; request batching remains a
documented efficiency optimization to evaluate against that idempotency model
before traffic approaches Data Manager request limits.

The standard checkout-to-purchase gate is closed by paid Shopify order `1866`.
The canonical `begin_checkout` and webhook `purchase` were 36 seconds apart;
checkout payload, Shopify custom attributes and Purchase reused the same
`external_id`, `_fbp`, `_fbc`, and `fbclid`. The Shopify transaction was
`SALE/SUCCESS` with `test=false`. Meta returned `eventsReceived=1`, no messages
and a trace ID on the first attempt. This proves the standard Shopify path for
a consented Facebook click. It does not close the separate paid Klarna Express
gate.

### Daily Meta Dataset Quality snapshots 2026-07-18

The former combined campaign-insights/quality cron remains removed. This
release adds only a read-only Dataset Quality collector at
`/api/cron/meta-dataset-quality`. `vercel.json` schedules a primary run at
`17 3 * * *` and delegates an idempotent retry through
`/api/cron/meta-dataset-quality-retry` at `17 4 * * *`. Vercel sends the
existing `CRON_SECRET` bearer authorization; the provider read uses the
existing `META_ACCESS_TOKEN` and `META_PIXEL_ID`. No new environment value or
Supabase migration is required.

The collector requests the documented Meta `v25.0` event-level EMQ,
match-key coverage, diagnostics, event coverage, deduplication feedback,
freshness and ACR fields. Provider data is Zod-validated before an atomic
insert into `marketing.meta_quality_snapshots`. A UTC-day existence check
makes retries idempotent per dataset and event, so a successful primary run
makes the second schedule a no-op while a transient first-run failure retains
one same-day recovery opportunity. The token is sent in the authorization
header and is never included in the request URL or response.

Production-credential verification inserted six event snapshots at
`2026-07-18T21:21:27.253Z`; Supabase readback confirmed all six rows and a
second run inserted zero duplicates. Runtime release
`dpl_EtXm5e58YNqzx4E2xVFvXwr14u76` for code SHA
`da2e3191a947589a084d15b6d794211bbb3dd1a3` reached `READY` and is the runtime
artifact used for cron and route verification. Later documentation-only Git
deployments can advance the production alias while the verified cron and
route implementation remains unchanged, so current alias ownership must be
checked with `vercel inspect`.
Vercel lists the cron as enabled with no undeployed or modified definition.
Production returned 401 without credentials and 200 with the approved bearer
token, both with `Cache-Control: no-store`; the authorized same-day run
reported six events and zero duplicate inserts. Compare event-level
denominators and Meta source split after 7 and 14 days; one daily snapshot is
not a trend.

### Local integration audit 2026-07-14

The isolated Git operations, Microsoft Merchant, PostHog SDK, Klarna
product-card, storefront accessibility, MCP operations and source
hygiene releases were merged into a temporary local audit branch from
the current `origin/main`. There were no merge conflicts. Frozen
install without a minimum-release-age bypass, Next route type
generation, 14/14 targeted tests, MCP generation with 52 servers,
MCP/commerce doctors, ESLint for every changed code file, TypeScript
and a Vercel-like production build with 96/96 routes passed. The
temporary audit ref was removed after recording the result. It was not
pushed, deployed or treated as an alternative production reference.

This audit proves code-level compatibility. It does not replace the
Klarna provider preview gate, production environment verification,
Supabase migration ordering for the separate sGTM release, or explicit
approval for push, merge and production deployment.

### Full sGTM integration audit 2026-07-14

The seven storefront/platform releases and `codex/sgtm-remediation` were
also merged into one temporary branch from `origin/main`. Two documentation
conflicts were resolved explicitly; runtime files had no conflicts. Frozen
install without a supply-chain bypass, 111 changed tests, changed-code ESLint,
TypeScript, MCP build with 52 servers, MCP/commerce doctors and a Vercel-like
production build with 99/99 static pages passed.

Supabase linked lint passed and the dry-run contains exactly
`20260712120000_add_tagging_observations_and_verified_dispatch_status.sql`.
The provider report passed with 0 active failures, 0 unresolved dead letters
and 0 alerts, and seven public sGTM/GTM loader endpoints passed. The release is
still no-go: the migration is unapplied; receipt-secret and protected Vercel
env are absent; Cloud Run is `0/5` instead of `3/10`; the dedicated identity,
secret mount, uptime, metrics, alerts and budget controls are incomplete; and
the GTM publish is unapproved. Local GTM browser smoke also proved duplicate
Cookiebot loading until the planned deletion of web tag `126` is published.

No Supabase migration, Vercel env change, Cloud Run change, GTM publish,
provider write, push or deploy was performed by this audit.

### Remaining candidate classification 2026-07-14

- `codex/release-mcp-operations` contains only MCP configuration,
  operational servers, safe placeholder templates and their runbooks.
  It deliberately excludes the broad candidate's unused Google package
  expansion. The official Google Analytics MCP runtime is pinned at
  0.6.0 and verified against the current
  [Google Analytics MCP setup](https://developers.google.com/analytics/devguides/MCP).
- `codex/release-source-hygiene` contains a comment removal and the
  single-semicolon correction in migration `20260711190423`. That
  migration version already exists locally and remotely, so this branch
  must not trigger a schema push. Linked application-schema lint passes.
- The `posthog-js@1.399.2` minimum-release-age exclusion from the broad
  candidate was rejected. Frozen install now succeeds without bypassing
  the repository's supply-chain age policy.
- Every path from `codex/production-candidate-20260714` is therefore
  classified. The branch remains an archive, not a deploy unit.

## Required Preflight

Run these before deciding the release order:

| Check | Command or source | Required conclusion |
| --- | --- | --- |
| Worktree scope | `git status --short` | Identify relevant files and ignore unrelated dirty files. |
| Runtime diff | `git diff --name-only` | Identify whether app runtime, Supabase, env, MCP, GTM, scripts, or docs changed. |
| Supabase history | `SUPABASE_NO_TELEMETRY=1 npx supabase migration list --linked` | Know exactly which local migrations are missing remote and which remote migrations are missing local. |
| Supabase schema proof | `SUPABASE_NO_TELEMETRY=1 npx supabase db dump --linked --schema ops,marketing --file /tmp/utekos-linked-ops-marketing-schema.sql` | Confirm production has the columns, constraints, tables, and views the runtime will use. |
| MCP config | `npm run mcp:build && npm run mcp:doctor` | Generated MCP output is derived from templates and has no inline secret findings. |
| Commerce MCP | `npm run mcp:commerce-tracking:doctor` | Read-only provider diagnostics and docs map are coherent. |
| Typecheck | `pnpm exec tsc --noEmit` | Runtime types pass. |
| Targeted tests | Use the tests touching changed runtime modules. | Changed behavior is covered. |
| Lint | `npm run lint` | Run when useful, but document existing unrelated repo debt if it is not a clean gate. |

## Change Matrix

| Change type | Must migrate or configure before Vercel deploy | Must deploy | Must verify after |
| --- | --- | --- | --- |
| Supabase schema read/write from runtime | Apply required migration to `hkoawfbomhnzupcsdggb`; verify schema dump contains new objects. | Vercel after Supabase. | `db lint`, schema dump grep, targeted runtime smoke. |
| Tracking runtime writes to `ops.provider_dispatch_attempts` | Ensure required columns, constraints, statuses, and views exist. | Vercel after Supabase. | Provider rows, skip classification, dead-letter summary. |
| PostHog client/runtime tracking | Ensure Cookiebot statistics consent is mapped and env vars are present. | Vercel. | Consent-gated init, no autocapture drift, masked replay, safe events only. |
| Google/Meta/Microsoft provider diagnostics | Configure local/provider credentials outside generated files. | Usually no Vercel deploy unless runtime changed. | Read-only probes and provider dashboard/API status. |
| MCP server/template changes | Update committed templates, then regenerate generated files locally. | No app deploy unless app runtime changed. | `mcp:build`, `mcp:doctor`, relevant MCP doctor. |
| GTM or sGTM behavior | Verify current docs, container IDs, workspace state, and consent model. | GTM publish only with explicit approval; Vercel if app loader changed. | GTM Preview, sGTM endpoints, production tracking smoke. |
| Vercel env vars | Pull/inspect env state and document changed keys. | Redeploy Vercel after env change. | Deployment inspect, runtime logs, route smoke. |
| Dead-letter replay runtime | No Supabase migration required when only app cron/route changes. | Vercel after code merge. | `/api/cron/replay-dead-letter` returns `401` (not `404`); `npm run ops:provider-dispatch-report`. |
| Microsoft UET CAPI env | Set UET tag ApiToken (Conversions API auth) in Vercel Production. | Redeploy after env change. | Purchase row not `missing_capi_token`; see Microsoft env gate. |
| Shopify/Klarna/Sanity runtime | Confirm provider docs, required env and provider-side allowed origins. | Vercel. | Route/action smoke, visible provider UI and provider response proof. |
| Docs-only root docs | No migration. | No production deploy required unless the deploy is used to publish docs. | `git diff --check` and direct file inspection. |

## Production Release Order

1. Read [AGENTS.md](AGENTS.md), [PLAN.md](PLAN.md), this file, and
   relevant local or official provider docs.
2. Classify every changed file as one of: runtime, Supabase schema,
   provider config, env/config, MCP/tooling, GTM, docs-only, ignored
   local artifact.
3. Run preflight checks and record blockers.
4. If Supabase runtime dependencies changed, apply production
   migrations first.
5. Verify Supabase production schema and migration history.
6. Run local verification again after migration.
7. Run `pnpm run sync -- "Commit message"` after explicit production
   approval. The push to `main` triggers the Vercel deployment.
8. Inspect the Vercel production deployment until it is ready or failed.
9. Run post-deploy smoke checks for the changed surfaces.
10. Update [PLAN.md](PLAN.md) with the final deployment and migration
    status.

## Supabase Production Gate

Use this gate for any change touching `supabase/`, `src/types/supabase/`,
`src/lib/tracking/warehouse/`, server-side tracking writes, database
views, jobs, leases, dead letters, or audit rows.

Required sequence:

1. `SUPABASE_NO_TELEMETRY=1 npx supabase migration list --linked`
2. Read the local migration SQL that is expected to run.
3. Dump the relevant remote schemas to `/tmp` and grep for required
   objects.
4. If remote has migration-history drift, repair history only when the
   schema state proves the target migration is already applied or
   intentionally absent.
5. Prefer `SUPABASE_NO_TELEMETRY=1 npx supabase db push --linked
   --dry-run` before any actual push.
6. Run `SUPABASE_NO_TELEMETRY=1 npx supabase db push --linked` only
   after explicit production approval.
7. Run `SUPABASE_NO_TELEMETRY=1 npx supabase db lint --linked --schema
   marketing,ops,analytics`.
8. Dump or query production schema again to prove required objects
   exist.

Current tracking warehouse project:

- Canonical project: `hkoawfbomhnzupcsdggb` (`supabase-pink-lens`,
  eu-north-1)
- Legacy/atlas project: `ycqwilkchurgsldeimdi`; do not use for
  tracking warehouse deployment.

For the 2026-07-07 telemetry hardening, Vercel production must not be
deployed until production has:

- `ops.provider_dispatch_attempts.dispatch_mode`
- `ops.provider_dispatch_attempts.skip_reason`
- status check including `skipped_unqualified`
- `ops.provider_dispatch_health`
- `ops.dead_letter_summary`
- `marketing.campaign_insights`
- `ops.integration_job_leases`
- dead-letter resolution fields

## Vercel Production Gate

### Customer assistant zero-default preview gate

The customer assistant is mounted behind the private server value
`CUSTOMER_ASSISTANT_ROLLOUT_PERCENT`. The accepted values are canonical
integers from `0` through `100`; a missing, malformed, fractional, signed or
out-of-range value resolves to `0`. Production must keep this value at `0` while
the assistant is restricted to a protected Preview deployment.

For a positive rollout, the browser keeps one random bucket in
`utekos_assistant_bucket_v1`. The server-supplied percent remains authoritative.
At zero percent the client does not read or create that storage key. Conversation,
feedback and browser conversation state remain memory-only and are lost on
reload. The pseudonymous UUID session ID is generated in memory, transmitted on
each chat request, and written to structured operational logs with intent,
outcome code and latency. No transcript or customer text is sent to analytics,
Supabase or application logs in this release. Supabase structured outcomes remain
deferred to Release 3.

`POST /api/customer-assistant/chat` owns the bounded request and typed AI SDK
stream response. It accepts same-origin JSON only, rate limits by the transient
session ID, and logs only session ID, intent, outcome code and latency. Exact
`VERCEL_ENV=preview` and a positive, strictly parsed
`CUSTOMER_ASSISTANT_ROLLOUT_PERCENT` are both required for its
12-request-per-minute process-local preview limit. Preview rollout `0`, an absent
or malformed rollout, production, development, and unexpected environments all
resolve to a zero API request limit.

The process-local session limiter is preview containment only. Public exposure or
paid-provider activation requires the durable daily-rotating IP-HMAC plus session
limiter owned by Measurement Task 5. Before either activation, operators must
verify and document access controls and retention for the structured operational
logs. This document does not claim that a retention period is already configured.

Product and availability facts come from a dedicated uncached Shopify Storefront
query for the current response. It reads `availableForSale`, never exact inventory
quantity, and cannot mutate Shopify. Variant details request the Storefront limit
of 250 plus `pageInfo` and fail closed if Shopify reports another page. A real
eight-second abort signal stays below the route's 30-second ceiling. Approved
static Utekos content owns size, shipping and returns guidance. Static content is
not used as a fallback for live price or availability; Shopify or knowledge
failure produces bounded safe text and the existing contact handoff instead of
an invented commercial claim.

Preview enablement requires explicit approval before changing the Vercel Preview
environment. Vercel Deployment Protection must be verified as enabled for the
target preview before any positive rollout is exposed to reviewers; this code
change does not alter that Vercel setting. Set only the rollout value there,
redeploy, and complete the browser gate:

```text
CUSTOMER_ASSISTANT_ROLLOUT_PERCENT=<approved integer 1-100>
```

Vercel supplies the reserved `VERCEL_ENV=preview` value automatically for Preview
deployments; do not try to configure it. The local Playwright gate simulates both
values only in its test and web-server processes with
`CUSTOMER_ASSISTANT_ROLLOUT_PERCENT=50` and exact `VERCEL_ENV=preview`; it does
not write Vercel state. Roll back exposure by removing the rollout value or
setting it to `0`, then redeploying the affected Vercel environment. Both the
environment change and any production deployment require explicit approval.
Production must not be enabled while its request limit is intentionally zero.

Required release evidence:

- complete assistant unit suite, focused ESLint and a successful production build;
- Playwright proof for launcher/accessibility, quick actions, keyboard focus,
  deterministic product and failure streams, restricted handoff, feedback/live
  announcements, retry recovery, product/non-product request context, persistent
  storage-failure exposure, mobile viewport/cart/header clearance, excluded
  routes, and a positive-percent holdout with no assistant graph request;
- a zero-value production-mode runtime proof showing no launcher and no
  `utekos_assistant_bucket_v1` storage entry;
- no Vercel environment mutation, provider mutation, telemetry change or deploy
  unless each action is separately approved.

#### Temporary assistant runtime state (2026-07-25)

- Production deployment `dpl_7qpjdUaja8qp22obVteyv78tR2ht` is `READY`, is
  aliased to `utekos.no`, and has `CUSTOMER_ASSISTANT_ROLLOUT_PERCENT=0`. The
  delivered root payload contains `assistantRolloutPercent: 0`, and a valid
  same-origin assistant request returns HTTP 429 with `rate_limited`.
- Protected Preview deployment `dpl_BBGbYsXsKzisTsHdbcSGhMRpj1w9` at
  `https://utekos-headless-rg3qn2oeq-utekos-marketing-group.vercel.app` is
  `READY` with `CUSTOMER_ASSISTANT_ROLLOUT_PERCENT=100`. Deployment Protection
  remains enabled. Its Node 24 build passed compilation, TypeScript and all 126
  generated pages. Protected runtime smokes passed for exact
  `gemini-3.6-flash` support answers, approved-source citations, live Shopify
  availability without quantity, two-step size-guide clarification, plain-text
  shipping output without Markdown, and explicit handoff to the contact form,
  email and phone. The relevant final regression suite passed 134 of 134 tests,
  and no support-knowledge provider failure appeared in the final Preview logs.
- Enterprise browser policy blocked visual access to the protected Preview URL.
  Code, unit, type, lint, build, deployment-state, payload and protected runtime
  evidence passed, but visual browser proof remains explicitly unverified.
- Generative support answers now call the GA `gemini-3.6-flash` model in
  `global` through the v1 `publishers/google/models/...:generateContent`
  endpoint. A direct provider probe proved that the same model returns
  `Unsupported model interaction` from the experimental Interactions endpoint,
  so the active adapter must not be moved back there. Requests are stateless,
  contain no tools or external search, use structured JSON output, include only
  the seven approved Utekos knowledge documents and are not logged with the raw
  customer question. Malformed output, wrong model versions, missing citations,
  timeouts and provider errors all fail closed to the existing handoff.
- Preview authentication uses the dedicated
  `genai-app-runner@project-c683eb2c-20ae-4ec2-ac3.iam.gserviceaccount.com`
  service account. Its Workload Identity binding is limited to the Vercel
  Preview principal; the production/Data Manager service account was not
  changed. The model documents Standard PayGo support, but applicability of the
  `Trial credit for GenAI App Builder` promotional SKU is not yet verified and
  must not be claimed from model availability alone.
- Recommendations AI catalog preparation is recorded in
  `docs/customer-assistant/retail-resource-manifest.md`: 19 real Shopify-derived
  Retail records were imported successfully. Similar Items remains deliberately
  blocked at 14 real variants versus Google's 100-SKU minimum, so no synthetic
  data, model, serving config or storefront prediction adapter is active. The
  assistant continues to use bounded, stock-aware deterministic ranking until
  that eligibility gate is genuinely met.

### Shopify catalog Runtime Cache release

The Runtime Cache release uses `@vercel/functions@3.7.5` with namespace
`shopify-catalog:v2`. The v2 namespace requires the Shopify vendor and
variant tax fields used by canonical commerce events. Product entries use normalized
`product:handle:{handle}` keys, a 900 second TTL and the tags
`product:{shopifyId}`, `product-handle:{handle}` and `catalog`.

Runtime Cache is an acceleration layer, not durable storage. Cache reads
are Zod-validated; invalid entries are deleted and fetched again. Errors,
missing products and serialized items at or above the 1.9 MB safety limit
are never stored.

Shopify product webhooks must complete both operations before returning
success:

1. `revalidateTag(tag, { expire: 0 })` for the existing Next.js product
   and collection tags.
2. `getCache({ namespace: 'shopify-catalog:v1' }).expireTag(tags)` for
   Runtime Cache.

Do not move either invalidation into `after()`. A failed invalidation must
produce a failed webhook attempt so Shopify can retry it.

`/api/search-index` is a public response cache with the independent tag
`search-index:v1`. It must not receive the Shopify `catalog` tag. `/api/log`
may use `after()` for best-effort Redis persistence and Sentry reporting;
orders and other durable commercial work may not.

Required release evidence:

- Targeted miss -> hit -> signed webhook -> miss test.
- Invalid-hit deletion, null/error exclusion and item-size boundary tests.
- Differential ESLint, Next route type generation, TypeScript and full build.
- Browser proof for product pages, `/skreddersy-varmen`, webhook behavior and
  `/api/search-index` cache headers/tag.
- Production deployment followed by browser and endpoint smoke.

The comparison baseline and required 7-/14-day follow-up are recorded in
[`VERCEL_RUNTIME_CACHE_BASELINE.md`](VERCEL_RUNTIME_CACHE_BASELINE.md).

### Tracking reset and first-party gateway release

The 2026-07-15 tracking reset deliberately removes the legacy browser
tracking hub, first-party event ingestion, Supabase provider dispatch,
provider adapters, tracking webhooks and tracking crons. Those removed
surfaces are gaps and must not be reported as active production
telemetry.

This release has no Supabase migration, provider mutation or GTM publish.

Required local and production gates:

```bash
git diff --check
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm build
npm run mcp:build
npm run mcp:doctor
TRACKING_GATEWAY_BASE_URL=<base-url> npm run tracking:gateway:smoke
```

Production acceptance requires all of the following:

- `/__gtg/gtm.js?id=GTM-5TWMJQFP` returns JavaScript.
- `/__sgtm/healthy` returns `200`.
- `/__sgtm` responses include `Cache-Control: no-store` and never
  return `x-vercel-cache: HIT`.
- Cookiebot is keyboard- and screen-reader-accessible.
- Consent Mode v2 is `denied` before a choice, and no optional cookies
  are created before consent.
- Google cookieless pings may occur before consent, while Meta,
  Microsoft, Clarity and other non-Google tags do not fire.
- Accepting consent updates Google consent and permitted Google traffic
  uses `/__sgtm`.
- Rejecting or later withdrawing consent restores `denied` without new
  optional cookies.

The currently published GTM loader already contains
`server_container_url=https://utekos.no/__sgtm`. No GTM publish belongs
to this release. Cookiebot tag `126` is the current sole CMP loader and
must remain. Live runtime has exactly one `uc.js` request with
`implementation=gtm`; any future GTM mutation still needs separate
approval. A failing container consent gate requires an app rollback
through Git.

The removed commerce-tracking MCP doctor and provider/Supabase runtime
checks are not gates for this reset release. They become mandatory
again only when those capabilities are deliberately reintroduced.

Use this gate for any Next.js runtime, route, action, tracking client,
server tracking, env, or build-affecting change.

### Cookiebot and sGTM env (Preview + Production)

Set these in Vercel before or with the Cookiebot deploy. Remove legacy
Usercentrics keys after verification.

| Key | Required | Canonical value | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_TRACKING_SGTM_ORIGIN` | Recommended | `https://cloud.server.utekos.no` | First-party sGTM origin for GTM loader and noscript. Hostname-only `cloud.server.utekos.no` is accepted and normalized to `https://` at runtime. No trailing slash. |
| `NEXT_PUBLIC_GOOGLE_GTM_ID` | Yes | `GTM-5TWMJQFP` | Web container loaded from sGTM origin. |
| `NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID` | Optional | `f2145160-1ac5-4859-8385-36dc6327495f` | Defaults in code when unset. |
| `GOOGLE_BROWSER_EVENT_TRANSPORT` | Prod | `sgtm` | Only after sGTM + GTM Preview + production smoke pass. |
| `NEXT_PUBLIC_ENABLE_GTM_IN_DEV` | Local only | `1` | For local `tracking:smoke`; do not set in Production. |

Remove after migration:

- `NEXT_PUBLIC_USERCENTRICS_SGTM_ORIGIN`
- `NEXT_PUBLIC_USERCENTRICS_SETTINGS_ID`
- `NEXT_PUBLIC_USERCENTRICS_*_SERVICE_NAME`

Redeploy Vercel after any env change. Verify with:

```bash
TRACKING_SMOKE_BASE_URL=https://utekos.no npm run tracking:smoke
```

Required sequence:

1. Confirm project link with `.vercel/project.json` or `.vercel/repo.json`.
2. Ensure required Supabase migrations and provider/env changes are done
   first.
3. Run `pnpm exec tsc --noEmit` and relevant tests.
4. Run `pnpm run sync -- "Commit message"` after explicit production
   approval.
5. Inspect the resulting production deployment in Vercel.
6. If failed, fetch build logs and stop. Do not retry blindly.
7. If ready, verify the production domain and relevant runtime surfaces.

### Klarna Express Checkout gate (Preview + Production)

Klarna Express Checkout is not verified by the presence of its SDK or
an empty container. The release must prove that Klarna renders the
actual button and accepts the configured origin.

Required before preview sign-off:

1. Verify that `NEXT_PUBLIC_KLARNA_CLIENT_ID` contains the intended
   Klarna Client Identifier in both Vercel Preview and Production. Do
   not print the value in logs or documentation.
2. Verify in Klarna that the exact preview origin and
   `https://utekos.no` are allowed for that Client Identifier.
3. Keep a single Klarna SDK library load per document. Multiple product
   cards may initialize separate containers through the shared loader.
4. Run the Vercel build. `prebuild` must fail closed when the Client
   Identifier is empty in a Vercel build.
5. In the controlled browser verification, verify desktop and mobile DOM,
   screenshot, console and network. At least one eligible product must
   show a visible «Pay with Klarna» button; an SDK request or empty
   container alone is a failed gate.
6. Exercise provider authorization only with an approved test flow and
   confirm the expected completion/redirect response without creating
   an unintended live order.

Current status 2026-07-14: production fails the visible-button gate.
`/produkter` has no product-card integration, while the product-detail
container remains empty despite the SDK loading. The local candidate
passes responsive rendering with a controlled SDK stub. Read-only Vercel
CLI confirms that `NEXT_PUBLIC_KLARNA_CLIENT_ID` exists as a sensitive
variable targeting both Preview and Production without exposing its value.
Provider acceptance remains blocked until Klarna allowed origins and the
visible button are verified in production.

### Klarna Express Checkout gate (Preview + Production)

Klarna Express Checkout is not verified by the presence of its SDK or
an empty container. The release must prove that Klarna renders the
actual button and accepts the configured origin.

Required before preview sign-off:

1. Verify that `NEXT_PUBLIC_KLARNA_CLIENT_ID` contains the intended
   Klarna Client Identifier in both Vercel Preview and Production. Do
   not print the value in logs or documentation.
2. Verify in Klarna that the exact preview origin and
   `https://utekos.no` are allowed for that Client Identifier.
3. Keep a single Klarna SDK library load per document. Multiple product
   cards may initialize separate containers through the shared loader.
4. Run the Vercel build. `prebuild` must fail closed when the Client
   Identifier is empty in a Vercel build.
5. In the controlled browser verification, verify desktop and mobile DOM,
   screenshot, console and network. At least one eligible product must
   show a visible «Pay with Klarna» button; an SDK request or empty
   container alone is a failed gate.
6. Exercise provider authorization only with an approved test flow and
   confirm the expected completion/redirect response without creating
   an unintended live order.

Current status 2026-07-14: production fails the visible-button gate.
`/produkter` has no product-card integration, while the product-detail
container remains empty despite the SDK loading. The local candidate
passes responsive rendering with a controlled SDK stub, but provider
acceptance remains blocked until the environment and allowed origins
are verified in a real preview.

## Tracking And Paid-Media Post-Deploy

Run only the checks that match the changed surface, but never mark a
provider OK without provider-specific proof.

| Surface | Required proof |
| --- | --- |
| Consent | Cookiebot state, accept/deny/withdraw behavior, default-denied Consent Mode, and no optional provider identifiers before consent. |
| Google | dataLayer/sGTM evidence, GA4/Ads status as applicable, no native Ads double count. |
| Meta | Pixel browser evidence, CAPI/provider row, Dataset Quality read-only probe when credentials permit. |
| Microsoft UET | Browser network or queue evidence, UET CAPI purchase row/status for purchase flows. |
| Microsoft UET CAPI env | UET tag ApiToken env set in Vercel Production; not `MICROSOFT_ADS_ACCESS_TOKEN`. |
| Dead-letter replay | Historical only after the 2026-07-15 telemetry reset; no active storefront replay route. Any reintroduction requires a new approved release gate. |
| Microsoft Ads | OAuth `msads.manage`, developer token, CustomerId, AccountId, account/campaign/Ad Insight read-only probes. |
| Microsoft Shopping | Merchant Center store/catalog/product read-only status. |
| Microsoft Clarity | Advertising Dashboard/UET linkage readiness and Consent API V2 `ad_Storage`/`analytics_Storage`. |
| PostHog | Consent-gated init, manual pageview/product events, no autocapture drift, masked replay only. |
| Supabase | `marketing.event_ledger`, `ops.provider_dispatch_attempts`, `ops.provider_dispatch_health`, `ops.dead_letter_summary`. |

## sGTM Remediation Release Gate

This historical gate applies to the two-stage remediation described in
[`PLAN.md`](PLAN.md). The former runtime guide
`src/lib/tracking/server-side-tagging.md` was removed in the 2026-07-15
telemetry reset and is not an active release surface.
Approval from an earlier telemetry release does not authorize these provider,
database, deployment, GTM, Shopify, or Cloud Run mutations.

### Current preflight status 2026-07-14

- The full local integration with the storefront/platform releases passed
  frozen install, 111 changed tests, changed-code ESLint, TypeScript, MCP build
  and doctors, and a Vercel-like production build with 99/99 static pages.
- Supabase linked history and lint are green. The dry-run contains exactly
  `20260712120000_add_tagging_observations_and_verified_dispatch_status.sql`;
  it has not been applied.
- The provider-dispatch report is green with 0 active failures, 0 unresolved
  dead letters and 0 alerts. Seven public sGTM/GTM loader endpoints are green.
- The hardening verifier remains deliberately red: the receipt secret and
  protected Vercel receipt env are absent, Cloud Run is still `0/5` instead of
  `3/10`, the dedicated service identity/mount is absent, and required uptime,
  logging metrics, alert policies and budget configuration are missing or
  drifted.
- Browser smoke with local GTM enabled proves duplicate Cookiebot loading while
  the live GTM configuration still contains web tag `126`. The app owns the
  single CMP loader; the coordinated GTM release must delete tag `126` before
  consent sign-off.
- A fresh Quick Preview capture is still required immediately before publish.
  The latest refresh attempt was blocked by DNS resolution for
  `tagmanager.googleapis.com`; no GTM resource was changed.

No Supabase migration, Vercel env change, Cloud Run change, GTM publish,
provider write or production deploy was performed by this preflight.

### Local preflight

```bash
node --import tsx --test src/lib/tracking/**/*.test.ts
pnpm exec tsc --noEmit
npm run build
npm run mcp:build
npm run mcp:doctor
npm run mcp:commerce-tracking:doctor
npm run tracking:sgtm-loaders:verify
npm run --silent tracking:gtm-quick-preview:capture > /tmp/utekos-gtm-quick-preview.json
GTM_PUBLISH_CONFIRM=I_APPROVE_GTM_PUBLISH GTM_QUICK_PREVIEW_EVIDENCE=/tmp/utekos-gtm-quick-preview.json npm run tracking:gtm-publish-guard
npm run tracking:sgtm-hardening:plan
npm run tracking:sgtm-hardening:verify
SUPABASE_NO_TELEMETRY=1 npx supabase migration list --linked
SUPABASE_NO_TELEMETRY=1 npx supabase db push --linked --dry-run
SUPABASE_NO_TELEMETRY=1 npx supabase db lint --linked --schema marketing,ops
```

The publish guard must fail closed until both `GTM_PUBLISH_CONFIRM` and fresh
Quick Preview evidence are supplied. The hardening verifier must remain a
read-only failure report until Cloud Run and Monitoring changes are explicitly
approved.

The Quick Preview file must be produced by the capture command. The guard
repeats the official `workspaces.quick_preview` call and compares compiler and
sync status, exact workspace changes, live fingerprints, resource digests,
workspace fingerprints and client `6`. It also requires a clean git worktree;
store evidence outside the repository.

### Receipt key contract

- Generate at least 32 random bytes and store their standard base64 encoding as
  `keys.receipt-key` in the Secret Manager-backed JSON file mounted into the
  tagging service.
- Set `SGTM_CREDENTIALS` on the tagging service to the mounted file path.
- Store that exact base64 value as the protected Vercel Preview/Production
  secret `SGTM_RECEIPT_HMAC_KEY_BASE64`.
- Never commit either the raw key, base64 value, credentials file, or generated
  signature.
- Rotate both surfaces together; smoke the receipt route before retiring the
  previous key.

The apply tool is dry-run by default. Its mutating phases are deliberately
separate and each requires the exact confirmation printed by
`tracking:sgtm-hardening:plan`: `receipt-secret-preview` may create the Secret
Manager resource or add its first version and then configures Preview;
`vercel-production` reuses that version; `cloud-secret` only mounts the existing
enabled secret through the runtime identity; Budget API enablement and
operational capacity/monitoring remain separate. An existing enabled version is
always reused. An existing secret with zero versions can receive its first
version only under the `receipt-secret-preview` confirmation. Access, parsing,
disabled-version or ambiguous-not-found errors fail closed and never authorize
automatic replacement or rotation. Same-name monitoring drift fails closed and
must be reconciled explicitly.

Vercel does not expose a protected environment value through its list API, so
the read-only hardening verifier can prove presence/type/target but cannot prove
cross-surface key equality. Equality between the mounted Secret Manager key and
Vercel is proven by the signed Preview receipt smoke before GTM publication;
signature failure blocks the release.

### Release 1: privacy containment

Requires one explicit approval that names all of these actions:

1. Disable Google user-provided-data capabilities and automatic DOM detection.
2. Disable GA4 user-provided-data collection and enable email redaction.
3. Create the server-container global PII exclude transformation, constrain the
   purchase trigger to the intended MP client, and preserve client `6`.
4. Remove browser `purchase` from the web-container commerce trigger.
5. Run Quick Preview and publish both containers.

Rollback may target only the latest privacy-safe version. It must never restore
UPD collection or browser purchase ownership.

### Release 2: runtime, warehouse, GTM, and operations

Run in this order, with a separate explicit approval at every numbered mutation
gate:

1. Apply `20260712120000_add_tagging_observations_and_verified_dispatch_status.sql`
   to the canonical Supabase project, then lint and dump the schemas again.
2. Run the separately approved `receipt-secret-preview` hardening phase with
   `SGTM_HARDENING_APPLY=I_APPROVE_RECEIPT_SECRET_AND_VERCEL_PREVIEW`. It
   creates the Secret Manager resource or its first version only when absent,
   otherwise reuses the enabled latest key, and sets
   `SGTM_RECEIPT_HMAC_KEY_BASE64` in Vercel Preview only. Deploy and test Preview
   without unapproved events.
3. Run the separately approved `vercel-production` phase to reuse that exact
   key in Production only, then deploy Vercel Production and wait for `READY`.
4. Run the separately approved `cloud-secret` phase. It must find an existing,
   enabled, valid secret version; it creates only the dedicated Cloud Run
   service identity/IAM binding, mounts the key file at the exact configured
   path using version `latest`, and sets `SGTM_CREDENTIALS`. Prove the receipt
   endpoint from Preview before a monitoring tag can be published.
5. Quick Preview and publish the web container first, then the server container,
   only after runtime compatibility and the secret mount are proven.
6. Set Cloud Run service-level min/max instances to `3/10`, preserve concurrency
   `80`, and create the approved uptime, exact alert policies and 80/100 budget.
7. Create the Shopify `refunds/create` subscription or App Pixel only after the
   corresponding Shopify mutation is explicitly approved.
8. Run production smoke; a real order, refund, or live tracking event needs its
   own concrete approval and test identifier.

The live event smokes are intentionally not part of a default deploy command:

```bash
TRACKING_SMOKE_BASE_URL=https://utekos.no npm run tracking:smoke
TRACKING_SMOKE_BASE_URL=https://utekos.no npm run tracking:commerce-smoke
```

### CSP enforcement gate

Keep `Content-Security-Policy-Report-Only` for at least the 24-hour observation
window. The policy has a same-origin, size-limited report endpoint that logs
only directive and host names. Report-only `frame-src` must include
`https://www.facebook.com` while Meta Pixel remains active under marketing
consent (Pixel creates a hidden Facebook iframe; see
`docs/analytics/evidence/meta-csp-frame-src-facebook.md`). Do not enforce until
normal navigation, checkout, Cookiebot, Meta, Microsoft, Clarity, PostHog and
sGTM show no unexplained critical violations. Enforcement is a separate
production change; it must not add a nonce design that forces the entire
storefront to dynamic rendering.

Final sign-off requires the 24-hour observation window and matching control
event evidence in GA4, Supabase, Cloud Run and GTM. GA4 BigQuery is a separate
blocking sign-off item while `analytics_489598217` is absent; GA4-only evidence
is explicitly interim and must not be represented as BigQuery proof.

## Resend Environment Gate (transactional email)

Transactional email for kontaktskjema, produktventeliste and nyhetsbrev runs
through [`src/lib/email/`](src/lib/email/). All sends must use the verified
`utekos.no` domain — never `onboarding@resend.dev` in Preview or Production.

The project uses the **Vercel Resend integration**. The runtime resolves the
API key from the integration secret first, then falls back to a legacy local
key for development.

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_HEADLESS_API_KEY_RESEND_API_KEY` | Yes in Vercel | Resend API key from Vercel integration |
| `RESEND_API_KEY` | Local fallback only | Manual/local dev when integration secret is absent |
| `RESEND_FROM_EMAIL` | No (default `kundeservice@utekos.no`) | Verified sender domain |
| `RESEND_FROM_NAME` | No (default `Utekos`) | Display name for customer-facing mail |
| `CONTACT_FORM_SEND_TO_EMAIL` | Yes for kontakt/venteliste | Internal notification recipient |

### Vercel Production requirement

Before marking kontaktskjema or venteliste OK in production:

1. Confirm `utekos.no` is verified in Resend Dashboard → Domains.
2. Connect the Vercel Resend integration to the project so
   `RESEND_HEADLESS_API_KEY_RESEND_API_KEY` is injected in Production.
3. Set `RESEND_FROM_EMAIL=kundeservice@utekos.no`.
4. Set `CONTACT_FORM_SEND_TO_EMAIL=kundeservice@utekos.no`.
5. Redeploy production after env changes.
6. Verify in Resend Dashboard → Logs:
   - kontaktskjema submission from `Utekos Kontaktskjema <kundeservice@utekos.no>`
   - venteliste submission from `Utekos Venteliste <kundeservice@utekos.no>`
   - newsletter welcome from `Utekos <kundeservice@utekos.no>`
   - no `403` domain mismatch errors

Local template preview:

```bash
pnpm run email
```

## Microsoft Environment Gate (UET tag token vs Ads API OAuth)

Microsoft [Conversions API](https://learn.microsoft.com/en-us/advertising/guides/uet-conversion-api-integration?view=bingads-13)
authorization is documented as **UET tagID + token**:

```http
POST https://capi.uet.microsoft.com/v1/{tagId}/events
Authorization: Bearer <ApiToken>
```

The **ApiToken** is the `UetTagAuthKey` returned by Campaign Management
[`GetUetTagAuthKey`](https://learn.microsoft.com/en-us/advertising/campaign-management-service/getuettagauthkey?view=bingads-13)
using OAuth + developer token. That is the same credential our runtime sends
as `Authorization: Bearer …` in `sendMicrosoftUetPurchase`. It is **not**
`MICROSOFT_ADS_ACCESS_TOKEN` (OAuth for Campaign Management / Ads API).

| Credential | Typical env keys | Used for |
| --- | --- | --- |
| **UET tag ApiToken** (Conversions API auth) | `MICROSOFT_UET_CAPI_ACCESS_TOKEN`, `MICROSOFT_UET_CAPI_TOKEN`, `UTEKOS_MICROSOFT_UET_CAPI_TOKEN`, `MICROSOFT_ADS_UET_CAPI_TOKEN` | Historical `sendMicrosoftUetPurchase` → `capi.uet.microsoft.com`; adapter removed in reset |
| **Microsoft Ads OAuth** | `MICROSOFT_ADS_ACCESS_TOKEN`, `MICROSOFT_ADS_REFRESH_TOKEN` | Ads API, MCP campaign probes |
| **Ads API developer token** | `MICROSOFT_ADS_DEVELOPER_TOKEN` | Ads API request header only |

Historical runtime resolution, removed in the telemetry reset:
`src/lib/tracking/microsoft-uet/microsoftUetCapiTokenEnvKeys.ts`.
`MICROSOFT_ADS_ACCESS_TOKEN` is intentionally **excluded** — OAuth
does not substitute for the UET tag ApiToken on the Conversions API
endpoint.

### Obtain UET tag ApiToken

**Historical runtime:** when OAuth env was complete, `sendMicrosoftUetPurchase`
refreshes OAuth and calls `GetUetTagAuthKey` on each dispatch window (short
in-memory cache; forced refresh on 401/403). Rotated `refresh_token` values are
kept in-process for the serverless instance lifetime.

**Bootstrap / local:** after OAuth app registration and token exchange:

```bash
npm run microsoft-ads:fetch-uet-auth-key
```

Writes `MICROSOFT_UET_CAPI_ACCESS_TOKEN` to `.env.local` / `.env.mcp.local` as
fallback when OAuth refresh fails.

**Alternative:** Microsoft Advertising UI → UET tag → **Use Conversions API** →
copy token into the same env key.

Optional cache TTL override: `MICROSOFT_UET_CAPI_TOKEN_CACHE_TTL_SECONDS`
(default 600).

### Vercel Production requirement

Before marking Microsoft UET purchase OK:

1. Set **one** UET tag ApiToken env key in Vercel Production (prefer
   `MICROSOFT_UET_CAPI_ACCESS_TOKEN` or `MICROSOFT_UET_CAPI_TOKEN`).
2. Redeploy production.
3. Verify purchase audit is not `skip_reason=missing_capi_token`:

```bash
npm run ops:provider-dispatch-report
```

Prod evidence on 2026-07-07: order `shopify_order_6946151268600` was
`skipped_unqualified` / `missing_capi_token` while OAuth Ads tokens
were present in local env — confirms `MICROSOFT_ADS_ACCESS_TOKEN` is
not the UET tag ApiToken Microsoft documents for Conversions API auth.

## Historical Dead-Letter Replay Release Gate

The former `src/app/api/cron/replay-dead-letter/route.ts` and Microsoft UET
`server_retry` runtime were removed in the 2026-07-15 telemetry reset. The
following commands are retained only as historical release evidence; they are
not current gates unless the surfaces are deliberately reintroduced.

Preflight:

```bash
node --import tsx --test src/lib/tracking/warehouse/replayDeadLetterSchedule.test.ts
node --import tsx --test src/lib/tracking/warehouse/replayDeadLetterEvents.test.ts
node --import tsx --test src/lib/tracking/google/buildGA4BrowserEventParams.test.ts
node --import tsx --test src/lib/tracking/microsoft-uet/microsoftUetCapiTokenEnvKeys.test.ts
node --import tsx --test src/lib/tracking/microsoft-uet/shouldEnqueueMicrosoftUetRetry.test.ts
pnpm exec tsc --noEmit
```

`/api/cron/replay-dead-letter` is not active. If it is deliberately
reintroduced, it must remain manual-only, must not be listed in `vercel.json`
under `crons`, and requires a separately approved one-time invocation. Never
leave `DEAD_LETTER_REPLAY_ENABLED=1` as the normal production state.

Post-deploy (no secret):

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://utekos.no/api/cron/replay-dead-letter
# Expect 401 when route exists; 404 means not deployed.
npm run ops:provider-dispatch-report
```

After removing an accidental recurring schedule, inspect at least one full
previous schedule interval in Vercel logs and confirm that no new scheduled
`403` calls appear.

First production replay run requires **explicit user approval** (provider
dispatch). Do not blindly replay Google dead letters with reason
`Missing client_id` — they need attribution repair, not replay.

## No-Go Conditions

Stop the release when any of these are true:

- Production runtime expects a database object that production does not
  have.
- Migration history is unclear and the schema state has not been
  inspected.
- A provider write would be required but has not been explicitly
  approved.
- GTM publish would be required but has not been explicitly approved.
- Vercel build fails or `vercel inspect` does not reach a ready state.
- Tracking verification would send live events and no explicit approval
  or test event id exists.
- Microsoft UET CAPI purchase is expected in production but no UET tag
  ApiToken env key is set in Vercel Production.
- `/api/cron/replay-dead-letter` returns `404` when the release
  includes dead-letter replay and the route should be live.
- Secret-like values appear in generated MCP files, tracked files, or
  examples.

## Current Approved Release

Approved by user in this thread on 2026-07-07:

- Supabase production mutation for telemetry hardening.
- Vercel production deploy after Supabase production is verified.

Execution status for this release:

- Supabase production migration history was repaired after schema proof.
- Supabase production migrations
  `20260612120000_add_integration_job_leases.sql` and
  `20260707111433_harden_provider_dispatch_audit_statuses.sql` were
  applied.
- Supabase production verification passed: migration list matches
  local, required telemetry objects exist, required provider dispatch
  constraints exist, and `db lint` for `marketing,ops,analytics`
  returns no schema errors.
- Vercel production deploy is approved for this release and must be
  inspected until `READY` before the release is considered complete.

Still not approved by default:

- Provider writes.
- GTM publish.
- Campaign, budget, audience, creative, Shopping catalog, Shopify
  catalog, or Microsoft Ads Scripts mutations.
