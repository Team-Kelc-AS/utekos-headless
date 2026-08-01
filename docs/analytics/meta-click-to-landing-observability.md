# Meta click-to-landing observability

Status date: 2026-08-01

Release state: active in production. The application, two
Supabase migrations, two signed Edge Function receivers, the
dedicated Vercel environment secret, and project-scoped 100-percent
Log and Trace Drains were released and verified on 2026-08-01.
No GTM publish or Meta write mutation was performed.

## Production release evidence

The latest follow-up application deployment is
`dpl_CTUfdAuSz5mJRS1Uce1gFs2G77xg`, built from clean branch commit
`ad92bda52565bfb6e1b772379fe81afc4f4977a0` and promoted to
`utekos.no` on 2026-08-01. It preserves
`src/components/analytics/VercelTelemetry.tsx` at SHA-256
`1aec7e5c586a29baa55e4bc7e191317e309a201ca85e3f8246d32b81c9499938`.
The Vercel production build generated 134 of 134 pages. A fresh in-app-browser
read returned HTTP 200 documents for `/skreddersy-varmen`, `/comfyrobe`,
`/skreddersy-varmen/utekos-orginal` and `/produkter/utekos-dun`, with no
captured console warnings or errors. The rendered root included
`@vercel/analytics/next` 2.0.1 and `@vercel/speed-insights/next` 2.0.0;
both first-party scripts and the Analytics `/view` request returned HTTP 200.
The production sGTM/GTM smoke was green, and Vercel returned no error-level or
5xx request logs in the release window.

The same release makes click-to-edge availability fail explicit: the daily
store selects a current comparison day only when at least one edge document
exists. The first post-release health read therefore returned `NULL` for
`click_to_edge_current_date`, `click_to_edge_rate` and
`click_to_edge_success_rate`, rather than the former misleading zero based on
99 provider clicks and no overlapping edge day. The read reported 191
PageViews with `fbclid`, 100-percent `fbc | fbclid`, 100-percent Meta API
acceptance across 71 eligible attempts, 95.71-percent edge Meta click-ID
coverage across 140 landings, p95 collector ACK latency 5,997 ms, no missing
provider attempts and no dead letters. `healthy=false` is therefore a real
click-ID-threshold result while click-to-edge remains unavailable.

The provider-health route now calls `Sentry.flush(1500)` before returning an
unhealthy response and fails visibly if flushing returns false. Production
returned `alert_delivery_flushed=true`. The correct existing
`SENTRY_ACCESS_TOKEN` returned HTTP 200 from Sentry's official project Issues
API and exposed the unresolved click-ID-coverage issue with ten occurrences
from 14:45 through 20:45 UTC. This proves SDK flushing and external issue
ingestion, not email or mobile-notification delivery. The separate Insights
cron monitor is still disabled because Sentry rejected activation for
insufficient pay-as-you-go seat capacity.

A subsequent bounded audit identified five of the six no-`fbclid` rows as
controlled Utekos probes from their exact timestamps, routes, marketing
parameters and surrounding Vercel runtime activity. A fail-closed precheck
found five edge observations and zero consent observations, canonical ledger
events or provider attempts. The rows were retained as audit evidence and
reclassified as two `synthetic_client` and three `browser_automation`
observations. The authorized production health read then reported 138 of 139
qualifying human-or-unknown Meta landings with `fbclid` (99.28 percent),
100-percent `fbc | fbclid`, 100-percent Meta API acceptance, no dead letters
and `healthy=true`. The remaining no-`fbclid` row is a physical iOS landing on
`/skreddersy-varmen` with an active-ad signal, explicit denied consent, no
canonical PageView and no provider dispatch. It remains human-or-unknown and
must not be attributed more narrowly from the available evidence.

The final application deployment is
`dpl_CqHhnFYQMn5PjYFWNeq3g9g84faN`, built from commit
`f3cb219ebe9b5280bfee1b2849e2ad3cfa28daec` and active on
`utekos.no`. Later commits `3bf6b9580` and `94d0a4aaf` changed only
the Log Drain Edge Function and documentation; the Edge Function
was redeployed after each change.

- Supabase migrations `20260801062712` and `20260801062912` are
  applied to pink-lens. The landing, consent, trace and Meta
  delivery tables have deny-by-default RLS, bounded grants and
  active retention jobs.
- Vercel Log Drain `drn_oje49nFh1Hj93CZO` is enabled for all seven
  production log sources with no sampling. Trace Drain
  `drn_J0LeFWHHSeHpo5Bb` is enabled as OTLP/HTTP JSON with head
  sampling `1`.
- A signed production canary proved that the UUIDv5 derived from
  the application's final `x-vercel-id` segment exactly matched the
  Log Drain `requestId`; the same row joined to the Vercel trace.
  The synthetic rows were deleted after verification.
- In the final 30-minute verification window, the receivers stored
  221 edge observations and 531 trace observations; 200 edge rows
  joined to a stored trace. This is receiver and correlation
  evidence, not proof of browser completion.
- Vercel reported no runtime-error cluster for
  `/skreddersy-varmen`, `/comfyrobe` and the selected active product
  routes in the final 30-minute window. The final deployment had
  successful HTTP 200 observations for `/skreddersy-varmen` and
  `/produkter/utekos-stapper`. Routes without a request in that
  bounded window are not inferred healthy from absence alone.
- Controlled same-site navigation and `_rsc` canaries produced no
  landing rows after drain delivery. Controlled campaigns are
  classified as synthetic; verified bots, recognized automation
  and signed synthetic collector traffic are excluded before
  marketing dispatch.
- The Meta sync returned HTTP 200 and stored 437 rows for all five
  independent grains over 2026-07-25 through 2026-07-31 in
  `America/Los_Angeles`. There were no duplicate keys or metric
  availability violations.
- The current 24-hour health read found 120 consented PageViews with
  `fbclid` and 100-percent `fbc | fbclid` coverage. Seven strong
  Meta-signal edge landings also had 100-percent click-ID coverage.
  No human-or-unknown landing with a numeric Meta ad signal or
  Meta UTM source lacked `fbclid` in that bounded read.

The click-to-edge baseline is intentionally unavailable at release:
the Drain began on 2026-08-01 while the newest completed Insights
date was 2026-07-31, so zero prior days satisfy the three-day
baseline contract. Provider health now exposes the metric as `NULL` rather
than allowing it to influence the health result as a false zero. Meta API
acceptance remains `accepted_unverified` and does not prove provider finality.

Remaining release evidence is deliberately open. Physical Facebook
and Instagram in-app browser runs have now been performed on iOS;
Android remains untested on a physical or approved device-cloud
browser. Chromium user-agent probes passed, including redirect query
preservation, but do not close the Android gate. The controlled
browser displayed the Cookiebot widget and exactly one GTM-owned
`uc.js` URL with `implementation=gtm`. A follow-up in the page's main
JavaScript world verified the Cookiebot API object, `hasResponse=true`,
explicit granted consent for every category, and working widget
open/close methods. The earlier `undefined` observation came from an
isolated evaluation world and is not Cookiebot runtime evidence.

The physical Instagram iOS run covered the profile landing, internal
navigation to `/skreddersy-varmen` and `/comfyrobe`, and a direct-message
landing on `/skreddersy-varmen/utekos-orginal`. The direct-message link
also produced separate Instagram preview-bot requests; those requests
created no canonical PageView or provider dispatch. The physical
Facebook iOS run proved a direct organic profile landing with denied
consent, no PageView and no dispatch, followed by granted consent and
a PageView only after refresh. A later Facebook navigation to
`/skreddersy-varmen` retained prior browser identifiers but lacked a
deterministic PageView-to-edge join, while a simultaneous paid landing
had different privacy-safe identifiers and was therefore excluded from
the tester's chain. This is physical in-app-browser evidence, but it is
not an ad-click proof for the tester.

The missing PageView after a denied-to-granted transition was traced to
the browser transport clearing its pending PageView on explicit denial.
Production deployment `dpl_H8fmEoav8QH15VxbBjiroYwbC4X9` retains at most the
latest/current PageView while
denied and flushes it on Cookiebot consent events. Multiple denied SPA
navigations do not replay historical pages, and existing event-id,
in-flight and completed-event guards keep the late flush idempotent.
The implementation has 50 green related unit tests plus green lint,
type generation and TypeScript checks. It must still be re-proved in the
physical Facebook browser without a manual refresh after consent is granted.

The repeated `KPSDK has already been configured` client message on
`/skreddersy-varmen` is Vercel BotID/Kasada, not Klarna. The BotID
1.5.11 `client/core` loader used a `loaded` boolean without sharing an
in-flight Promise, so simultaneous protected startup requests could
register multiple `kpsdk-load` handlers and call `KPSDK.configure`
more than once after a single `p.js` response. The production release
patches both the ESM and CJS `client/core` exports to share one pending
load and to remove a failed `p.js` element before a later retry. Its
focused behavior test proves three concurrent calls share one
configure and completion, and that three callers can jointly retry
after a failed first script load. Deployment
`dpl_9DiA1WQgtNj6XYh5d7keRWy1Wfkv` completed successfully, and a fresh
production browser navigation loaded one BotID `p.js` response with
HTTP 200 and exposed one configured KPSDK runtime. Sentry reported no
KPSDK issue with `lastSeen` at or after the deployment. Klarna's own
SDK loaded once, completed once and rendered the Express Checkout
control; no payment authorization or order was attempted, so this is
integration rendering evidence rather than payment proof. Vercel
showed no corresponding server runtime error. The Trace Drain receiver
was upgraded to version 3 with
PII-free rejection counters and OTLP partial-success handling. Live
warnings classified the remaining HTTP 400 responses as fully
unscoped batches whose resources lacked both documented Vercel
project and deployment attributes and contained no valid observation.
Mixed batches no longer discard correctly scoped observations: the
receiver persists those observations and returns HTTP 200 with
`partialSuccess.rejectedSpans`. Valid OTLP deliveries and trace joins
continue to work. The upstream reason Vercel emits fully unscoped
resources remains unknown, but their receiver response is now
classified and deliberately fail-closed.

Trace Drain v4 adds a second-level classification without storing attribute
values. In the stable post-v4 window 2026-08-01 15:58–20:00 UTC, function
console logs contained 5,408 `invalid_trace_scope` warnings representing
8,116 invalid resources and 27,470 rejected spans. All 8,116 resources had
`service.name`, while none had a Vercel project scope key, a Vercel deployment
scope key or `scope.name=vercel`. There were no invalid spans, timestamps,
trace conflicts or project mismatches in this invalid set. A separate 339
`partial_trace_scope` warnings represented mixed batches whose valid
observations were retained with HTTP 200 partial success. Invocation logs for
the same window initially recorded 3,915 HTTP 200 and 5,323 HTTP 400. A full
Log Explorer query corrected the 503 sample to 83 app-level responses. All 83
used the handler's sole 503 path and occurred in the same three minutes as 270
Postgres FATAL records, all SQLSTATE `53300` (`too_many_connections`). There
were no boot, timeout, resource-limit or Edge Function rate-limit signals.
This proves connection exhaustion as the supported trigger for the database
catch, while the v4 log cannot join the SQLSTATE to each request individually.
Function console logs and invocation logs are asynchronously ingested; the
aggregates are not a one-to-one warning/request join and do not explain why
Vercel emits the separate unscoped resources.

Supabase's current connection guidance identifies the default Edge Function
`SUPABASE_DB_URL` as direct and recommends transaction-mode pooling on port
6543 for edge/serverless clients. Trace Drain therefore requires a separate
`VERCEL_TRACE_DRAIN_DATABASE_URL`, validates the 6543 port and keeps
`prepare:false`. The v6 pooler cutover exposed a second issue rather than
closing the gate: all scoped v6 deliveries returned HTTP 503, with no HTTP 200.
The same `postgres@3.4.9` driver reproduced SQLSTATE `28P01` against the
existing local pooler URL, while the canonical direct URL and an in-memory
pooler URL rebuilt with the canonical password both passed `select 1`. The
dedicated production secret was replaced from that validated value without
printing or writing it.

Version 8 is active with bundle hash
`d37aae6f781d5995d68aa1ddbb32ee14c913eaaeb023a8deaac936aad5b729b8`. Its
bounded nested classifier distinguishes authentication, connection, TLS,
permission, schema and connection-exhaustion families without logging raw
SQLSTATE, message, SQL, host, stack or connection URL. In the first production
window through 21:15 UTC, v8 returned twelve scoped HTTP 200, seventeen
deliberate unscoped HTTP 400 and zero HTTP 503. It inserted 38 trace rows across
the production deployment after cutover. The same post-cutover window had zero
Postgres ERROR/FATAL/PANIC and zero connection-exhaustion records. The scoped
database-write gate is therefore production-proven; the upstream unscoped
resources remain separately classified and rejected fail-closed.

The same production release also closes the synthetic-browser
propagation gap. `UTEKOS_SYNTHETIC_TRAFFIC_SECRET` is encrypted in
Vercel Production and Preview. A signed document canary returned HTTP
200 and a separate server-signed synthetic correlation cookie; its
protected PageView collector returned HTTP 204 with classification
`synthetic` and `Cache-Control: no-store`. The warehouse recorded one
edge row and one trace row, with zero consent, ledger and provider
rows. Those two canary observations were then deleted. This proves
exclusion before marketing persistence and dispatch without treating
UTM text as a trusted synthetic signal.

## Metric contract

Keep these stages separate. A later stage never retroactively
proves an earlier one, and Meta API receipt does not prove
provider attribution or Events Manager finality.

| Stage                            | Evidence                                                                      | Correlation                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Meta outbound click              | `marketing.meta_ad_delivery_insights`, overall daily ad grain                 | `ad_id`, Meta account date                                                                                  |
| Vercel edge document or redirect | `ops.vercel_edge_request_observations`                                        | `edge_request_id`, `request_id`, `trace_id`, required-when-present `fbclid_hmac`, numeric Meta ad parameter |
| Resolved consent                 | `ops.landing_consent_observations`                                            | `edge_request_id`, `page_view_id`                                                                           |
| Browser canonical PageView       | consent row's `page_view_id` and the browser dataLayer contract               | `page_view_id`                                                                                              |
| Collector acceptance             | `marketing.event_ledger` `page_view` row                                      | payload `edge_request_id`, `page_view_id`, `event_id`                                                       |
| Meta dispatch                    | `ops.provider_dispatch_attempts`                                              | `event_id`, provider `meta`                                                                                 |
| Meta reporting observation       | Meta Dataset Quality snapshot or another documented provider-finality surface | provider event name and provider reporting window                                                           |

`accepted_unverified` means that the Meta adapter received an
accepted API response. It is not provider finality and is not
attribution proof.

## Verified production baseline

Read-only checks on 2026-08-01 established:

- For all consented PageViews observed from 2026-07-22, 2,037 of
  2,037 PageViews containing `fbclid` also contained `fbc`.
- Ad `120246491016410788` recorded 3,429 outbound clicks and
  1,816 landing page views from 2026-07-13 through 2026-08-01, a
  provider-reported click-to-landing-page-view rate of 52.96
  percent.
- From 2026-07-22, 1,149 canonical PageViews were associated with
  that ad. Ten had the expected Facebook UTM/ad signal, granted
  marketing consent, an iPhone WebKit user agent and `fbp`, but
  lacked both `fbclid` and `fbc`. All ten used
  `/skreddersy-varmen`.
- The active production deployment returned successful documents
  for `/skreddersy-varmen`, `/comfyrobe` and the active product
  pages during the audit. Historical failures still exist on
  older deployments: compressed response failures for the two
  landing pages and invalid postponed-state fallbacks for product
  pages. A current successful sample does not prove that the
  intermittent failure is permanently resolved.

### Ad `120246491016410788`

The read-only Meta Insights investigation used the ad account's
live `America/Los_Angeles` timezone. Provider values from
2026-07-13 through the partial 2026-08-01 account day were:

| Breakdown  | Outbound clicks | Landing-page views |   Rate |
| ---------- | --------------: | -----------------: | -----: |
| Overall    |           3,429 |              1,816 | 52.96% |
| Facebook   |           3,213 |              1,694 | 52.72% |
| Instagram  |             216 |                121 | 56.02% |
| Mobile app |           3,382 |              1,792 | 52.99% |
| Mobile web |              29 |                 14 | 48.28% |
| Desktop    |              18 |                  9 | 50.00% |

The dimensioned rows account for 1,815 of the 1,816 overall
landing-page views. Do not silently force breakdown rows to
reconcile when the provider omits a dimension.

Key placement rows were Facebook or Instagram Feed 3,329 to
1,768, Facebook Reels 47 to 16, Instagram Reels 8 to 3, and
Facebook Stories 42 to 26. The sharpest date anomalies were
2026-07-15 at 182 to 2, 2026-07-16 at 150 outbound clicks with
the landing-page-view field unavailable rather than zero, and
2026-07-17 at 170 to 54. The more recent completed 2026-07-22
through 2026-07-28 window was 1,579 to 965, or 61.11 percent. A
2026-07-29 row reported zero outbound clicks and one landing-page
view, which is provider-attribution evidence to investigate
rather than a mathematically meaningful conversion rate.

The ten PageViews from 2026-07-24 13:34 UTC through 2026-07-27
15:26 UTC with UTM/ad signal but without `fbclid` and `fbc` shared
the same bounded pattern: `/skreddersy-varmen`,
Facebook source, the audited ad identifier in campaign content,
iPhone Safari/WebKit, mobile, `fbp` present, no referrer, granted
marketing consent, and no bot/headless classification. This
establishes that the click identifier was absent when the
canonical PageView arrived; it does not by itself identify
whether Meta, an in-app navigation, a redirect before Utekos, or
the original destination URL removed it.

A separate read-only Graph API v25 investigation closes the
configuration side of that uncertainty for ad
`120246491016410788`, including the dates of the ten rows. Meta's
activity history records a creative change on 2026-07-28 at 13:59
UTC from creative `4608432669479938` to `2134034140490187`. The old
creative therefore covers the 2026-07-24 through 2026-07-27 window;
both old and current creatives have exactly two link URL assets,
and every asset uses `https://utekos.no/skreddersy-varmen` as
`website_url`. Every placement customization rule selects one of
those link assets, and both creatives' `url_tags` include the same
ad identifier as `hsa_ad`. The historical configured Meta
destination was consequently the canonical landing page, without
an upstream Utekos redirect.

This direct creative and activity evidence is separate from
Insights metrics. It proves configuration history, not the exact
URL Meta delivered for each impression or click, and it does not
identify where the ten historical click identifiers were lost. It
also says nothing about collector acceptance, dispatch acceptance
or provider finality.

On the 2026-08-01 completion recheck, ad `120246491016410788` had
effective status `CAMPAIGN_PAUSED`. The configured account's only
effective `ACTIVE` ad was `120246830675150788`, using creative
`1855977708900925`. Its live `asset_feed_spec` contained three
unique Utekos destinations:

- `http://www.utekos.no/skreddersy-varmen`;
- `http://www.utekos.no/comfyrobe`;
- `https://utekos.no/skreddersy-varmen/utekos-orginal`.

The first two destinations take two 308 hops, first HTTP to HTTPS
and then `www` to the canonical apex host. All four HTTP
user-agent profiles—Facebook iOS, Instagram iOS, Facebook Android
and Instagram Android—preserved the synthetic `fbclid` and UTM
values through every hop for all three destinations and finished
with HTTP 200. The twelve request chains completed in 86.6-255.2
ms in this controlled sample. This proves current server redirect
preservation, not Meta in-app browser rendering or a real user's
completed landing.

The same three final routes rendered to
`document.readyState='complete'` in the in-app Chromium browser
with their expected title and H1 and no captured console errors.
The active Meta creative should nevertheless be updated to
canonical `https://utekos.no/...` destinations after separate
provider-write approval, eliminating two avoidable network
transitions from paid clicks.

### Vercel route investigation

The pre-release deployment `dpl_e5cmT5y8QLKckXGoTYtm6LsY6yyW` at
commit `aa5415cfa8a969766f5a35b8363fc7c352aa45cc` returned 200
for both landing pages and every active product handle in Safari,
Facebook iOS and Instagram Android HTTP probes. Chromium browser
rendering additionally passed for Facebook and Instagram
user-agent profiles on iOS and Android.

Historical Vercel evidence remains material:

- `/skreddersy-varmen` had compressed-response
  `Z_BUF_ERROR`/`Z_DATA_ERROR` failures and two Shopify cart
  errors on older deployments, most recently 2026-07-28.
- `/comfyrobe` had two cache-response 502 errors on an older
  deployment on 2026-07-30.
- product routes had 13 `invalid postponed state` incidents in
  the seven-day query window: 11 for `/produkter/techdown`, one
  for `/produkter/mikrofiber` and one for `/produkter/dun`. The
  last was 2026-07-31 20:20 UTC on an older deployment. The
  fallback still returned HTTP 200, so status alone would have
  hidden the degraded render path.

The controlled cache-hit probes measured 73-132 ms time to first
byte and 146-260 ms total time for the two landing pages. Product
probes measured 74-125 ms time to first byte and 331-559 ms total
time. These are small diagnostic samples, not production latency
distributions; the Trace Drain is needed for a continuous
server-side distribution.

At 2026-08-01 14:26 UTC, Vercel's grouped runtime-error read returned
no error clusters during the preceding 24 hours for
`/skreddersy-varmen`, `/comfyrobe` or
`/skreddersy-varmen/utekos-orginal`. Grouped log counts included
successful 200/202 responses and some 4xx traffic, but the wide 4xx
detail query timed out and is not classified as a route failure.

Do not compare Meta's broad `fbc` percentage across every event
with `fbc | fbclid`. The first includes Google, Bing, direct and
automated traffic; the second measures click-ID construction when
a Meta click identifier is actually present.

## Collection boundaries

The application proxy creates an opaque UUID for each document
request, logs only that UUID, forwards it in
`x-utekos-edge-request-id`, and exposes it to the browser through
the `utekos_edge` Server-Timing entry. A separate
`utekos_edge_auth` entry carries a 30-minute HMAC token bound to
that UUID. The token authorizes only the terminal consent
observation and is never stored. The proxy does not log the
incoming URL, query or token.

The signed Vercel Log Drain receiver is the pre-consent source of
truth for HTTP status, route, deployment, cache, region and
bounded campaign metadata. It discards raw query strings, IP
addresses, user agents, raw referrers, arbitrary messages and raw
`fbclid`. The `fbclid_hmac` uses a required dedicated secret and
may only be used for equality/deduplication. The read model
projects only whether a row is the first document observation for
that digest, so redirects and reloads cannot inflate the
strong click-ID stratum of the click-to-edge numerator.

The signed Vercel Trace Drain receiver stores a bounded
server-side trace duration keyed by the documented `trace_id`.
That duration is not browser TTFB, DOM readiness or page-load
duration.

The browser captures the initial landing correlation and
`page_view_id` before any SPA navigation and retains that pair
until Cookiebot resolves. It sends a terminal consent observation
only after a resolved response. A failed transmission is retried
with bounded backoff at most three times for the exact consent
state; subsequent Cookiebot events cannot make the attempts
unbounded. States are serialized per edge request and PageView,
so a newer decision is always sent after any older in-flight
retry. The server fails closed unless
the UUID-bound token is valid. One UUID is immutable to one
`page_view_id` and accepts at most four terminal state writes.
Pending consent is deliberately not persisted as a guessed
decision. A denied decision does not create a canonical collector
event.

## Attribution and breakdowns

Meta delivery is stored as separate daily grains. Never add rows
from two grains together:

- overall, used for outbound-click and landing-page-view
  denominators;
- publisher platform;
- publisher platform plus placement;
- device platform;
- raw impression device. The sync does not infer an operating
  system from a provider device label.

Meta's documented delivery breakdowns do not provide a
trustworthy standalone OS grain for this query. The landing-side
`os_class` is therefore an edge arrival classification only; it
must not be presented as Meta's outbound-click denominator by OS.

Edge observations use the campaign parameters that actually
arrived at Utekos. A numeric `utm_content` may be classified as
the Meta ad id because the audited campaign uses that documented
template. Non-numeric content is not coerced into an ad id.

Verified bot, recognized automation and explicitly signed
synthetic collector traffic are excluded from marketing dispatch.
Unknown traffic remains fail-open and visible; it must not be
silently called human.

## Alert definitions

The existing provider-health cron evaluates:

- `fbc | fbclid` over consented canonical PageViews for 24 hours;
  alert below 98 percent with at least 50 PageViews containing
  `fbclid`;
- edge Meta click-ID coverage over human-or-unknown Meta-signal
  documents for 24 hours; alert below 98 percent with at least 50
  documents;
- click-to-edge rate for the latest stored Meta account date;
  alert when at least 50 outbound clicks exist, at least three
  prior eligible days exist, and the current rate is below 80
  percent of the prior eligible-day average;
- Meta API acceptance over eligible server dispatches for one
  hour; alert below 99 percent with at least 20 attempts. Its
  semantics remain `accepted_unverified`.

The click-to-edge numerator has two explicit strata: the first
document observation for each HMAC-deduplicated `fbclid`, plus
one primary request for Meta UTM/ad evidence without `fbclid`.
The latter is lower-identity evidence and is reported separately.
Arrival counts include 4xx/5xx, because a failed response still
reached Vercel; the successful 2xx/3xx component and success rate
are reported separately. The security-invoker read model bridges
Vercel request, proxy, edge and trace identifiers before ranking
one primary row, so multiple Log Drain entries do not receive
multiple request weight. A terminal BotID classification
overrides the weaker user-agent classification when it exists.
The denominator uses only the configured account's overall Meta
outbound-click grain in the ad-account timezone. Rates are
unavailable until both the Meta daily sync and a complete Vercel
Drain history exist; absence of that history must not generate a
false alert.

## Redirect contract

Next.js configuration redirects and rewrites preserve unmatched
query parameters under the current documented framework contract.
The custom Magasinet canonical redirect explicitly copies the
complete query string. The Facebook checkout bridge already
forwards every parameter except its consumed `products` and
`coupon` inputs.

Never move `fbclid` into the pathname, canonical metadata or
server logs. Canonical HTML URLs may omit campaign parameters;
the actual navigation URL and canonical PageView payload must
retain them.

## Release gates

Follow `DEPLOYMENT.md`. The required order is:

1. Run the complete local test, type, lint, build and migration
   checks.
2. Review and apply the Supabase migrations to the pink-lens
   tracking project.
3. Configure and deploy the signed Log and Trace Drain Edge
   Functions.
4. Prove signed canaries, idempotency, RLS/grants, retention and
   absence of raw identifiers.
5. Configure the dedicated application correlation-signing
   secret, deploy the Vercel application and verify both proxy
   correlation entries, consent observation, canonical PageView,
   collector and Meta attempt.
6. Create the 100-percent Vercel Log and Trace Drains only after
   separate approval, then prove real production delivery.
7. Run physical or approved device-cloud Facebook and Instagram
   in-app browser tests on iOS and Android. Chromium user-agent
   emulation is useful evidence, but it is not this release gate.
8. Observe at least three complete Meta account days before
   enabling the baseline click-to-edge alert as an operational
   signal.

Production deploys, Supabase mutations, Vercel Drain creation,
provider secrets and Meta/GTM changes require explicit operator
approval.
