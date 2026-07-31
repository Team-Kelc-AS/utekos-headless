# Known deviations

## DEV-001

- **Priority:** Closed P0
- **Status:** **Superseded/closed 2026-07-26.** The description below is
  retained as historical audit evidence.
- **Historical description:** Every accepted browser event and transaction
  webhook scheduled a full provider registry drain.
- **Historical evidence:** the former `createBrowserEventRouteHandler` wiring
  invoked `runRegisteredProviderOutboxBatch`; registered workers could claim
  unrelated provider/event rows.
- **Historical consequence:** One request could claim unrelated backlog,
  execute every registered worker claim, compete with cron, and move queue
  drainage into the request deployment lifecycle.
- **Systems:** All `/api/events/*`, purchase/refund webhooks,
  Vercel functions, Supabase outbox.
- **Resolution evidence:** After database commit, only newly created attempt
  primary keys are published to `canonical-provider-dispatch-v1`. The strict
  PII-free envelope contains exact `attempt_id` plus `adapter_key`; the consumer
  calls `claimById`, whose SQL also constrains provider, event name,
  `server_retry`, due state, and claimant cutover. The route no longer starts a
  registry batch.
- **Retry boundary:** `retry_scheduled`/`dead_lettered` are database outcomes
  and ACK the Queue message. Only thrown infrastructure errors trigger Vercel
  Queue redelivery after 15 seconds. The five-minute cron is recovery/fallback.
- **Target task:** Closed by the 2026-07-26 targeted Queue release.

## DEV-002

- **Priority:** P2 (downgraded from P1 on 2026-07-20 after GTM
  Admin + EMQ)
- **Description:** Residual Meta tag reconciliation is limited to
  operational follow-ups (currency warning, dedupe Overlap), not
  destination mismatch.
- **Evidence:** Browser + dataset agree on `1092362672918571`;
  sGTM version 29 has no Meta CAPI Gateway tag; browser uses
  openbridge3. EMQ live. Dedupe tracked as DEV-020.
- **Consequence:** Low residual risk of misreading server GTM as
  Meta CAPI path.
- **Systems:** Server GTM, Meta Events Manager, Meta adapters.
- **Recommended next action:** Keep inventory artifact current;
  DEV-020 shared event_id proven; Overlap UI still open.
- **Target task:** Documentation/ops hygiene (not Oppgave 1
  blocker).

## DEV-003

- **Priority:** P1 (downgraded from P0 on 2026-07-20 — design
  gate, not dispatch blocker)
- **Description:** Canonical snake_case and historical/provider
  PascalCase names coexist in ledger/attempt data.
- **Evidence:** Live ledger distribution contains `page_view` and
  `PageView`, `view_item` and `ViewContent`, `purchase` and
  `Purchase`, plus legacy custom names. Current claimers use
  canonical names. Live 7d Meta provider window is
  PascalCase-only.
- **Consequence:** Historical rows can be unclaimable; blind
  repair/replay can duplicate provider events.
- **Systems:** `event_ledger`, provider attempts, adapters, GTM.
- **Recommended next action:** Freeze the name/destination matrix
  and decide explicit historical disposition per name; no bulk
  rename/replay.
- **Target task:** Oppgave 1 design gate (after dispatch
  isolation).

## DEV-004

- **Priority:** P1
- **Description:** Generic success always persists
  `accepted_unverified`, although provider finality differs.
- **Evidence:** `runProviderOutboxWorker.ts:45-58`;
  `markAcceptedUnverified`; only Google has status
  reconciliation.
- **Consequence:** Meta/Microsoft API acceptance and Google
  pending diagnostics are operationally indistinguishable until
  secondary fields are inspected.
- **Systems:** Outbox status model, dashboards, alerts.
- **Recommended next action:** Add provider-owned completion
  semantics such as pending diagnostics, accepted terminal and
  provider-confirmed success without rewriting the generic
  worker.
- **Target task:** Oppgave 1 after dispatch isolation.

## DEV-005

- **Priority:** P1 (env/regression watch — not currently
  validate-only)
- **Description:** Data Manager can be switched to validate-only
  via `GOOGLE_DATA_MANAGER_VALIDATE_ONLY`; executed ingestion is
  the current production mode and must not be flipped without
  approval.
- **Evidence:** Env name present on Vercel Production. Live 7d:
  majority `validation_result.validate_only='false'` including
  purchase 2026-07-20T21:45Z; historical `true` rows end
  2026-07-18 (`DEPLOYMENT.md` temporary gate). Status cron
  filters `validate_only=false`.
- **Consequence:** Accidental `true` would stop real Ads
  ingestion while still producing `accepted_unverified`
  validation receipts.
- **Systems:** Google adapter/config, Vercel env, provider health
  reporting.
- **Recommended next action:** Keep Production `false`; alert if
  new rows show `validate_only=true`; any mode change is
  approval/deployment-gated.
- **Target task:** Continuous env gate (separate from Oppgave 1
  code).

## DEV-006

- **Priority:** P1
- **Description:** Google diagnostics claim scans lack a
  request-ID index; outbox claim lacks event-name alignment.
- **Scope clarification:** The outbox scan concern applies to the generic
  five-minute fallback `claimNext` path. Targeted Queue delivery uses
  `claimById` with the exact attempt primary key and does not perform that
  shared backlog scan.
- **Evidence:** Live `pg_indexes` and safe EXPLAIN.
- **Consequence:** Status polling and multi-worker backlog
  processing scale through avoidable scans.
- **Systems:** Supabase `provider_dispatch_attempts`.
- **Recommended next action:** Benchmark and propose partial
  composite indexes; apply only through an approved migration.
- **Target task:** Oppgave 1/2 schema change with explicit
  approval.

## DEV-007

- **Priority:** P2
- **Status:** **Superseded in part 2026-07-22.** The purchase-only description
  was accurate on 2026-07-20 but is no longer current.
- **Current description:** Microsoft UET CAPI server workers are active for
  `add_to_cart`, `begin_checkout`, and `purchase`. Earlier funnel events such
  as `page_view` and `view_item` remain `blocked_no_worker` on the server.
- **Evidence:** Read-only production data at 2026-07-31T01:04:19Z shows
  `accepted_unverified` for exact attempts
  `6d35806a-fe96-474d-a8b3-a9057ddd2e48` (`add_to_cart`),
  `8cf42314-450b-4441-b53c-9b19bba2462e` (`begin_checkout`), and
  `f8a584d8-359d-4584-923a-325a18a5ad52` (`purchase`). Each used
  `dispatch_mode='server_retry'` and `attempt_count=1`.
- **Consequence:** The three approved lower-funnel server paths have provider
  API acceptance evidence, but `accepted_unverified` is not final attribution.
  Current rows without `msclkid` correctly remain `skipped_unqualified`.
- **Systems:** Microsoft UET/CAPI, catalog, outbox.
- **Recommended next action:** Keep ApiToken and `msclkid` coverage healthy;
  treat expansion beyond the three approved workers as a separate release.
- **Target task:** Ongoing quality gate, not a missing-worker task for the three
  active events.

## DEV-008

- **Priority:** P1
- **Status:** **Partially resolved.** Live `orders-paid` delivery is proven;
  subscription ownership and `refunds-create` delivery remain open.
- **Description:** The inspected Admin token returns zero shop-specific
  webhook subscriptions, while Shopify notification delivery reaches the
  authoritative `orders-paid` route.
- **Evidence:** Vercel observed 14 production requests to
  `/api/shopify/webhooks/orders-paid` in seven days (12 HTTP 202, two HTTP 200),
  corroborated by ledger/attempt evidence. `refunds-create` had no matching
  traffic. App-specific notification subscriptions are not visible through the
  shop-specific GraphQL/REST query.
- **Consequence:** Purchase webhook delivery is not missing, but the owning
  Shopify app/configuration is unknown and refund delivery is not proven.
- **Systems:** Shopify app configuration, purchase/refund routes.
- **Recommended next action:** Identify and document the Shopify notification
  owner without creating a duplicate subscription; separately verify
  `refunds-create` delivery.
- **Target task:** Ops prerequisite (not Oppgave 1 code blocker).

## DEV-009

- **Priority:** P1
- **Description:** Supabase session connection exhaustion affects
  consent and web-vitals persistence.
- **Evidence:** Vercel `EMAXCONNSESSION` runtime error groups.
- **Consequence:** Adjacent telemetry writes can be lost and
  shared database capacity can degrade tracking reliability.
- **Systems:** Vercel functions, Supabase pooler.
- **Recommended next action:** Isolate connection usage and
  verify transaction-mode/bounded pooling.
- **Target task:** Separate reliability task.

## DEV-010

- **Priority:** P1
- **Description:** Consent snapshots stop after the 2026-07-15
  reset.
- **Evidence:** Live max snapshot date and operating contract.
- **Consequence:** Historical consent table must not be described
  as an active current consent audit stream.
- **Systems:** Cookiebot, consent snapshot route, warehouse.
- **Recommended next action:** Decide whether canonical
  event-embedded snapshots are sufficient or restore a bounded
  consent audit writer.
- **Target task:** Consent architecture decision.

## DEV-011

- **Priority:** P2
- **Description:** Generic persistence lives in
  `postgresCanonicalPageViewStore.ts`.
- **Evidence:** `postgresCanonicalEventStore` implementation plus
  page-view alias.
- **Consequence:** File naming encourages accidental deletion and
  hides reuse.
- **Systems:** All canonical acceptance paths.
- **Recommended next action:** Rename/move only after imports and
  tests are updated; no behavior change.
- **Target task:** Oppgave 1 cleanup after functional changes.

## DEV-012

- **Priority:** P2
- **Description:** PR 44 is open despite its logic already
  existing on main.
- **Evidence:** PR diff/merge state and shared mapping/jitter
  source.
- **Consequence:** Merge can regress the generic refactor or
  duplicate tests.
- **Systems:** GitHub workflow.
- **Recommended next action:** Confirm equivalent tests then
  close as superseded with approval.
- **Target task:** Repository hygiene.

## DEV-013

- **Priority:** P3 (mostly resolved)
- **Description:** Previous GTM IDs in planning text are stale;
  canonical IDs are now documented.
- **Evidence:** Active web `GTM-5TWMJQFP`; server `GTM-M8GT97CV`
  verified; prior `GTM-WZ4R3PQL`/`GTM-PGTJ3FJ` fail probes.
- **Consequence:** Residual risk only if agents follow old
  planning docs outside `docs/analytics`.
- **Systems:** Documentation/GTM.
- **Recommended next action:** Grep/replace stale IDs in
  non-canonical planning files when touched.
- **Target task:** Documentation hygiene.

## DEV-014

- **Priority:** P2
- **Description:** Data Manager historical request-ID coverage is
  incomplete.
- **Evidence:** The request-ID coverage query observed 3,501
  Google rows with request ID and 2,594 without; a separate live
  provider query observed three fewer Google rows because the
  audit did not hold one repeatable-read snapshot.
- **Consequence:** Older accepted rows cannot receive per-request
  diagnostics.
- **Systems:** Google status reconciliation.
- **Recommended next action:** Classify pre-request-ID history as
  historical terminal/unknown; do not synthesize IDs.
- **Target task:** Operational data policy.

## DEV-015

- **Priority:** P2
- **Status:** **Historical audit-count discrepancy.** This is not an unresolved
  dead-letter count.
- **Description:** The 2026-07-20 dead-letter audit total had fallen by 47
  relative to the previous observation.
- **Evidence:** Prior 1,174 versus 1,127 on 2026-07-20. At
  2026-07-31T01:04:19Z, `ops.dead_letter_events` contained 1,281 historical
  rows, all resolved; unresolved count was 0. Separately,
  `ops.provider_dispatch_attempts` contained 144 historical rows with status
  `dead_lettered`.
- **Consequence:** Retention/deletion/admin cleanup provenance is
  unknown.
- **Systems:** `ops.dead_letter_events`, audit controls.
- **Recommended next action:** Reconcile audit
  logs/migration/admin actions.
- **Target task:** Warehouse governance.

## DEV-016

- **Priority:** P3
- **Description:** Event-specific collector wrappers are highly
  repetitive.
- **Evidence:** Thin `*CollectorTransport.ts` files delegate to
  one generic factory.
- **Consequence:** Maintenance overhead, but explicit typed
  endpoints improve discoverability.
- **Systems:** Browser analytics.
- **Recommended next action:** Consider generated/static
  definitions only after behavior and ownership are stable.
- **Target task:** Later refactor.

## DEV-017

- **Priority:** P1
- **Description:** Google Ads destination `AW-18180376403` is
  live in browser traffic despite the documented policy that
  native Google Ads conversion tags remain excluded.
- **Evidence:** Browser smoke 2026-07-20 observed
  `pagead2.googlesyndication.com/ccm/collect` pings carrying
  `tid=AW-18180376403` both pre-consent (cookieless, `npa=1`,
  `gcs=G100`) and post-consent (`gcs=G111`). No `AW-` tag exists
  in the published web GTM payload, so the destination is most
  plausibly configured on the `GT-MKRLF5WK` Google tag.
- **Consequence:** Potential double-counting risk against
  GA4-imported conversions — the exact risk the exclusion policy
  exists to prevent — and an undocumented active ad destination.
- **Systems:** Google tag configuration, Google Ads, consent
  surface.
- **Recommended next action:** Identify where `AW-18180376403` is
  configured (Google tag settings in GTM or Google Ads-side
  linking), verify whether conversion actions are attached, and
  reconcile with the GA4-import conversion policy before any
  change.
- **Target task:** Oppgave 1 prerequisite.

## DEV-018

- **Priority:** P1
- **Description:** A concurrent branch replays Meta purchases
  through backfill ledger rows with **new** event IDs.
- **Evidence:** Ledger rows
  `backfill:meta-purchase-replay:shopify_order...` are paired
  with browser `purchase:<uuid>` rows sharing `occurred_at` but
  carrying different `event_id` values. The script
  `scripts/ops/force-resend-meta-purchases-jul19.ts` exists only
  on branch `fix/meta-fbc-durable-click-ids` (c6c88efaf). Three
  Meta attempts from the backfill are `accepted_unverified`.
- **Consequence:** Meta dedupe requires identical event name
  **and** event ID; a replay with a new event ID cannot
  deduplicate against the original browser Purchase and can
  double-count revenue in Meta.
- **Systems:** `event_ledger`, Meta adapters, concurrent branch
  work.
- **Recommended next action:** Coordinate with the owner of
  `fix/meta-fbc-durable-click-ids`; any replay must reuse the
  original `event_id` or be explicitly accepted as incremental.
  Do not merge the branch before this is resolved.
- **Target task:** Oppgave 1 design gate.

## DEV-019

- **Priority:** P2
- **Status:** ROOT_CAUSE_IDENTIFIED_FIX_PENDING_DEPLOY (2026-07-24)
- **Description:** Meta Pixel logs
  `Invalid parameter format for currency` in production.
- **Evidence:** Product-page isolation 2026-07-24
  (`docs/analytics/evidence/ce-meta-currency-purchase-value.md`):
  unused `data-product-price` /
  `data-product-currency` on `ProductPageView` are scraped by
  Meta Pixel on ViewContent even when `fbq` currency is valid
  `NOK`. Secondary: incomplete `product:price:*` metadata when
  `selectedOrFirstAvailableVariant` is absent from GraphQL.
- **Consequence:** Meta may drop or degrade value/currency on
  affected browser events, reducing value-based optimization
  quality.
- **Systems:** Product page DOM attributes; product metadata;
  GTM Meta tag 153 (defense-in-depth ISO omit).
- **Recommended next action:** Deploy app fix removing
  `data-product-*` attrs + metadata pairing; confirm console
  clean on product ViewContent. GTM ISO harden published.
- **Target task:** Oppgave 1 / Meta quality.

## DEV-020

- **Priority:** P2 (downgraded from P1 on 2026-07-22 — wire
  parity proven; UI Overlap badge still unverified)
- **Status:** SHARED_EVENT_ID_PROVEN_UI_OVERLAP_OPEN
- **Description:** Meta browser/server **shared `event_id`** for
  PageView, ViewContent, AddToCart, and InitiateCheckout is proven
  on production wire + ledger + CAPI accept. Events Manager
  Deduplication **Overlap UI** is still not API-readable and remains
  `blocked_verification`.
- **Evidence (2026-07-22 CE-5.2C):** Smoke
  `verify-meta-pixel-parity.mjs` `ok: true` on `utekos.no`.
  Product ViewContent
  `01c38322-5264-4eb4-9c58-5221ce5e3a29` identical across
  dataLayer, Pixel `/tr`, OpenBridge, ledger, and Meta attempt
  (`accepted_unverified`, `eventsReceived=1`,
  `fbTraceId=AB2THDOhh7jzIowVJHiZ8mZ`). See
  `docs/analytics/evidence/ce-5.2c-meta-live-dedupe.md`.
- **Evidence (2026-07-22 AddToCart):** Smoke
  `verify-meta-add-to-cart-dedupe.mjs` `ok: true`.
  AddToCart `4032dbf1-d588-4d95-ab84-aa5d14f74191` identical
  across dataLayer, Pixel `/tr`, OpenBridge, first-party POST,
  ledger, and Meta attempt (`eventsReceived=1`,
  `fbTraceId=ANBPwKcn-jpu24oX1hKth27`). See
  `docs/analytics/evidence/ce-add-to-cart-meta-browser-server-dedupe.md`.
- **Evidence (2026-07-22 InitiateCheckout):** Smoke
  `verify-meta-begin-checkout-dedupe.mjs` + pink-lens.
  InitiateCheckout `e4d043ee-34af-47ac-8102-22bf2a907b05`
  identical across Pixel `/tr`, OpenBridge, first-party POST,
  ledger, and Meta attempt (`eventsReceived=1`,
  `fbTraceId=AlnCXoK4YDKgFQAzFNRdkYF`). See
  `docs/analytics/evidence/ce-begin-checkout-meta-browser-server-dedupe.md`.
- **Historical (2026-07-20):** Events Manager showed ViewContent
  «Deduplication has not been set up»; Test Events (`TEST46149`)
  had mismatched browser/server IDs — superseded for operational
  shared-ID claim.
- **Consequence:** Residual risk is UI/Overlap visibility lag,
  not missing shared `event_id` on PageView/ViewContent/AddToCart/
  InitiateCheckout.
- **Systems:** Browser Meta Pixel (GTM), Meta CAPI adapters,
  Events Manager Dataset Quality.
- **Recommended next action:** Optional manual Events Manager
  Overlap re-check when convenient; do not block funnel work on
  the UI badge. Do not permanently set
  `META_TEST_EVENT_CODE` on production.
- **Target task:** CE-5.2C (closed for shared-ID proof).

## DEV-021

- **Priority:** P1
- **Status:** CODE_FIXED_AWAITING_DEPLOY (2026-07-22 CE-5.2D)
- **Description:** Marketing-consented `page_view` could persist
  with URL/`click_id` `fbclid` while `browser_id.fbp` and
  `browser_id.fbc` were empty (landing race before ParamBuilder
  cookies). Live 7d: 265 such rows, all with `has_fbp=0`;
  contributes to ~50–54% PageView Click ID coverage of *all*
  PageViews.
- **Evidence:** pink-lens 7d query; fix evidence
  `docs/analytics/evidence/ce-5.2d-page-view-landing-fbp-fbc.md`;
  DEC-015.
- **Consequence:** Weak Meta match keys on first PageView; later
  funnel events looked healthier because cookies existed.
- **Systems:** `acceptCanonicalPageView`,
  `ensureCanonicalMetaBrowserIds`, `/api/meta/parameter-context`,
  first-party `_fbp`/`_fbc`.
- **Recommended next action:** Merge/deploy CE-5.2D; re-measure
  `pct_fbc_given_fbclid` and `has_fbp=0` for marketing `page_view`.
- **Target task:** CE-5.2D.

## DEV-022

- **Priority:** P1
- **Status:** CLOSED_AND_LIVE_VERIFIED (2026-07-22)
- **Description:** Seven UI paths called Shopify `ADD_LINES`
  without `reportCanonicalAddToCart` (ProductCard, Gaveguide,
  Comfyrobe, RecommendedItem, UpsellItem, NBCC, mikrofiber
  `useMicrofiberLogic`). Canonical ATC only fired from three
  purchase hooks.
- **Evidence:**
  `docs/analytics/evidence/ce-add-to-cart-ui-coverage.md`;
  shared helper
  `src/lib/analytics/addProductLineAndReportAddToCart.ts`;
  hook `src/hooks/useCanonicalAddToCart.ts`;
  live ProductCard UUID
  `7f1a2c03-22b0-47b4-b42a-31d4021f6a18` on deploy
  `dpl_BD7FMaeaoiLzdDLiwhXY6yB3rHDz` / SHA `a9c7b7b3c`.
- **Consequence:** Under-counted Meta/Google/Microsoft AddToCart
  for quick-buy and cart-suggestion surfaces.
- **Systems:** Browser ATC reporter, cart mutation actor, listed
  UI CTAs.
- **Recommended next action:** None for coverage; optional cron
  drain re-check for Meta/Google pending on the smoke UUID.
- **Target task:** SAFE — AddToCart UI call-site coverage.

## DEV-023

- **Priority:** P1
- **Status:** CLOSED (2026-07-23 code; awaiting deploy / live Klarna smoke)
- **Description:** Klarna Express Checkout authorized a product-line
  payload without calling
  `reportCanonicalBeginCheckout({ cart })`.
- **Evidence:**
  `docs/analytics/evidence/ce-begin-checkout-complete-traceability.md`
  (Gap 2); remediations in
  `src/components/klarna/utils/prepareKlarnaExpressBeginCheckout.ts`,
  `src/components/klarna/components/KlarnaProductExpressCheckout.tsx`,
  `src/components/klarna/components/KlarnaExpressCheckoutButton.tsx`
  (`onPrepareAuthorize`); SHA
  `90c5e53a261690dc0cdc1213c54ccb8843e13281`.
- **Consequence (pre-fix):** Purchase could occur without a preceding
  canonical `begin_checkout`; funnel asymmetry vs Shopify Checkout.
- **Systems:** Klarna Express UI, begin_checkout reporter, provider
  outbox.
- **Recommended next action:** Deploy branch; optional live BankID
  Klarna smoke with explicit approval. Do not claim production-proven
  until verified.
- **Target task:** SAFE — begin_checkout UI remediations.

## DEV-024

- **Priority:** P2
- **Status:** CLOSED (2026-07-23 code; awaiting deploy)
- **Description:** `usePurchaseLogic.handleGoToCheckout` reported
  canonical `begin_checkout`, but `PurchaseClientView` did not render
  a «Gå til kassen» CTA on `/skreddersy-varmen/utekos-orginal`.
- **Evidence:**
  `docs/analytics/evidence/ce-begin-checkout-complete-traceability.md`
  (Gap 1); wired in
  `src/app/skreddersy-varmen/utekos-orginal/components/PurchaseClientView.tsx`
  (`data-track=SkreddersyVarmenGoToCheckout`); SHA
  `90c5e53a261690dc0cdc1213c54ccb8843e13281`.
- **Consequence (pre-fix):** Dead path; skreddersy users only reached
  checkout via cart drawer after add-to-cart.
- **Systems:** Skreddersy purchase UI, begin_checkout reporter.
- **Recommended next action:** Deploy; confirm CTA in browser smoke
  after release.
- **Target task:** SAFE — begin_checkout UI remediations.

## Previously requested hypotheses

| Hypothesis                                               | Verdict                                                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Generic store in page-view-named file                    | Confirmed                                                                                                     |
| Global outbox dispatch from request path                 | Historical: confirmed in the 2026-07-20 freeze; superseded by exact-attempt Vercel Queue dispatch on 2026-07-26 |
| Common `accepted_unverified`                             | Confirmed                                                                                                     |
| Google permanent-error history                           | Confirmed and currently resolved/classified                                                                   |
| Meta destination mismatch                                | Refuted (web payload/dataset agree; sGTM has no Meta CAPI Gateway tag; browser uses openbridge3)              |
| Mixed event naming                                       | Confirmed in warehouse history; refuted for the live 7-day Meta provider window (PascalCase only)             |
| Open Data Manager PR                                     | Confirmed open; superseded/conflicting                                                                        |
| Missing shop-scoped subscriptions prove missing webhooks | Refuted; live `orders-paid` traffic is proven. Shopify notification ownership and `refunds-create` delivery remain unresolved |
