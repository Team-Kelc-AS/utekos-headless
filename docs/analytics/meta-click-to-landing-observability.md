# Meta click-to-landing observability

Status date: 2026-08-13

## 2026-08-13 emergency cutover: BotID removed from telemetry latency path

This source change is authorized for a direct emergency production cutover.
Until the matching Git/Vercel release reaches `READY` and owns the production
aliases, the production baseline below still describes the active BotID
behavior.

The release candidate removes the application BotID integration from both
sides of the time-critical telemetry path:

- `instrumentation-client.ts` no longer patches browser `fetch`/XHR or waits
  for a BotID/Kasada challenge before `/api/events/*`,
  `/api/observability/landing-consent`, or
  `/api/observability/page-view-dispatch`;
- the event and observation handlers no longer call `checkBotId()` before
  accepting or storing a request;
- the BotID Next.js wrapper, runtime dependency, and local Kasada patch are
  removed, so the application no longer provisions BotID proxy rewrites.

The existing low-latency trust boundaries remain: same-origin enforcement on
observation writes, signed edge-correlation tokens, strict body-size limits,
Zod contracts, consent checks, idempotency, and the signed synthetic-document
cookie/signature exclusion. Vercel Firewall remains the independent edge
enforcement surface. A request that is neither verified synthetic traffic nor
otherwise rejected is deliberately classified as `human_or_unknown`; it must
not be described as verified human. Historical `automated_bot` and
`verified_bot` rows remain valid audit data but are not produced by the new
collector path.

## 2026-08-12 operational supersession: Trace Drain is diagnostic-only

The permanent production Trace Drain was removed from Vercel on 2026-08-12.
`vercel-trace-drain` remains deployed in Supabase solely as a manually enabled,
time-bounded diagnostic receiver. It is not a canonical collector, does not
gate the consent or provider pipelines, and must not be recreated by an
application deployment.

The Vercel Log Drain remains active. It is the pre-consent request-observation
source for the click-to-edge read model; its continued operation is independent
of Trace Drain delivery. Canonical tracking remains unchanged: browser
collection, the canonical ledger, provider outbox and provider dispatch do not
depend on either Trace Drain configuration or trace rows.

Any future Trace Drain activation requires separate operator approval, a
written start/end window, an explicit sampling rate below 100 percent, and a
post-window deletion check. Do not use a standing Trace Drain, a rate of `1`,
or an application deployment as an activation mechanism.

Release state: the implementation is active in production. The
application, two Supabase migrations, two signed Edge Function
receivers, the dedicated Vercel environment secret and
project-scoped 100-percent Log and Trace Drains were released and
verified on 2026-08-01. The controlled physical iOS Meta
in-app-browser matrix is complete. Android was not run because no
physical Android device was available and remains explicitly
unverified. The first scheduled post-cutover Insights run and the
overlapping-day baseline remain incomplete. No GTM publish or Meta
write mutation was performed.

## 2026-08-02 superseding acceptance update

The final pre-integration production baseline was deployment
`dpl_9PviuC8Zn6d2zkJoGDSyaCXcpipJ` on commit
`62d8135be603bbe305de50188f196666be07645b`. All four controlled
landing routes returned HTTP 200 and the final BotID/KPSDK issue
was not reproduced. Valid OTLP deliveries and trace joins work;
fully unscoped Trace Drain resources remain deliberate,
classified HTTP 400 rejections.

The controlled physical iOS matrix passed eight of eight cells:
Facebook and Instagram across `/skreddersy-varmen`, `/comfyrobe`,
`/skreddersy-varmen/utekos-orginal` and
`/handlehjelp/storrelsesguide`. Every cell reached the edge with
HTTP 200 in the expected iOS in-app browser, preserved `fbclid`,
recorded consent, emitted one canonical `PageView`, produced both
browser and collector receipts, and reached Meta as
`accepted_unverified`. The ledger retained `fbclid`, `fbc` and
`fbp`. Android remains zero of eight controlled cells and must not
be reported as physically verified; the operator accepted this as
the stopping point for 2026-08-02 because no Android device was
available.

The newsletter path already creates canonical `generate_lead`
only after a successful submission and maps it to Meta standard
event `Lead`. Published web-GTM v135 maps `generate_lead` to
`Lead` and supplies the canonical `event_id` as Pixel `eventID`;
Meta CAPI uses the same value as `event_id`. A release-candidate
repair now builds the browser payload from the consent-normalized
accepted event, preventing hashed lead data from reaching
`dataLayer` when marketing consent is denied. The event catalog
also records the actual browser/server shared-ID contract, and a
dedicated Meta Lead mapper test protects the exact name and ID.
No GTM publish is required for this repair.

`src/components/analytics/VercelTelemetry.tsx` remains byte-exact
at SHA-256
`1aec7e5c586a29baa55e4bc7e191317e309a201ca85e3f8246d32b81c9499938`
and must be included unchanged in the integrated production
release.

## Production release evidence

The current application deployment is
`dpl_5mgNh6toa3fVtuNV8Dx3Wg5o2NHn`, built from clean branch
commit `d35fe5d6eff6b0ba164bcae29b47d11ec2e11460`, `READY` at
2026-08-01T21:34:17.493Z and promoted to all three production
aliases. It includes the late-consent repair, the BotID
concurrency patch and the 10:17 UTC Insights schedule. It
preserves `src/components/analytics/VercelTelemetry.tsx` at
SHA-256
`1aec7e5c586a29baa55e4bc7e191317e309a201ca85e3f8246d32b81c9499938`.
The Vercel production build generated 134 of 134 pages. A fresh
browser read returned HTTP 200 documents for
`/skreddersy-varmen`, `/comfyrobe`,
`/skreddersy-varmen/utekos-orginal` and `/produkter/utekos-dun`,
with no application console errors, runtime exceptions or
duplicate KPSDK configuration. A CDP capture identified the
deployment-generated base paths, both injected script nodes,
`@vercel/analytics/next` 2.0.1 and `@vercel/speed-insights/next`
2.0.0. Both first-party scripts and Analytics `/view` returned
HTTP 200 on `/skreddersy-varmen` and `/comfyrobe`; a separate
Speed Insights `vitals` submission was not observed in the short
sample. The production sGTM/GTM smoke was green, and Vercel
returned no error-level or 5xx request logs in the release
window.

The same release makes click-to-edge availability fail explicit:
the daily store selects a current comparison day only when at
least one edge document exists. The latest health read therefore
returned `NULL` for `click_to_edge_current_date`,
`click_to_edge_rate` and `click_to_edge_success_rate`, rather
than a misleading zero while the newest completed Insights date
still does not overlap the edge window. After the bounded
controlled-traffic reclassification, the same read reported 138
of 139 qualifying landings with `fbclid` (99.28 percent),
100-percent `fbc | fbclid`, 100-percent Meta API acceptance, no
dead letters and `healthy=true`.

The provider-health route now calls `Sentry.flush(1500)` before
returning an unhealthy response and fails visibly if flushing
returns false. Production returned `alert_delivery_flushed=true`.
The correct existing `SENTRY_ACCESS_TOKEN` returned HTTP 200 from
Sentry's official project Issues API and exposed the unresolved
click-ID-coverage issue with ten occurrences from 14:45 through
20:45 UTC. The same token returned HTTP 200 from the official
organization Workflows API. Workflow `612443` is enabled for new
and existing high-priority issues, has an active email action for
issue owners with active-member fallback, and reports
`lastTriggered=2026-08-01T20:46:05.419094Z`, eleven seconds after
the issue's latest occurrence. This proves SDK flushing, external
issue ingestion, workflow evaluation and an active email action;
it does not prove mailbox delivery or message opening. The
separate Insights cron monitor is still disabled because Sentry
rejected activation for insufficient pay-as-you-go seat capacity.

A subsequent bounded audit identified five of the six no-`fbclid`
rows as controlled Utekos probes from their exact timestamps,
routes, marketing parameters and surrounding Vercel runtime
activity. A fail-closed precheck found five edge observations and
zero consent observations, canonical ledger events or provider
attempts. The rows were retained as audit evidence and
reclassified as two `synthetic_client` and three
`browser_automation` observations. The authorized production
health read then reported 138 of 139 qualifying human-or-unknown
Meta landings with `fbclid` (99.28 percent), 100-percent
`fbc | fbclid`, 100-percent Meta API acceptance, no dead letters
and `healthy=true`. The remaining no-`fbclid` row is a physical
iOS landing on `/skreddersy-varmen` with an active-ad signal,
explicit denied consent, no canonical PageView and no provider
dispatch. It remains human-or-unknown and must not be attributed
more narrowly from the available evidence.

- Supabase migrations `20260801062712` and `20260801062912` are
  applied to pink-lens. The landing, consent, trace and Meta
  delivery tables have deny-by-default RLS, bounded grants and
  active retention jobs.
- Vercel Log Drain `drn_oje49nFh1Hj93CZO` is enabled for all
  seven production log sources with no sampling. Trace Drain
  `drn_J0LeFWHHSeHpo5Bb` is enabled as OTLP/HTTP JSON with head
  sampling `1`.
- A signed production canary proved that the UUIDv5 derived from
  the application's final `x-vercel-id` segment exactly matched
  the Log Drain `requestId`; the same row joined to the Vercel
  trace. The synthetic rows were deleted after verification.
- Trace Drain Edge Function version 8 is active with
  transaction-pooler port 6543 and prepared statements disabled.
  From 21:13 through 21:36 UTC it returned 202 scoped HTTP 200,
  257 deliberate unscoped HTTP 400 and zero HTTP 503, without
  `database_write_failed`. This is receiver and persistence
  evidence, not proof of browser completion.
- Vercel reported no runtime-error cluster for
  `/skreddersy-varmen`, `/comfyrobe` and the selected active
  product routes in the final 30-minute window. The final
  deployment had successful HTTP 200 observations for
  `/skreddersy-varmen` and `/produkter/utekos-stapper`. Routes
  without a request in that bounded window are not inferred
  healthy from absence alone.
- Controlled same-site navigation and `_rsc` canaries produced no
  landing rows after drain delivery. Controlled campaigns are
  classified as synthetic; verified bots, recognized automation
  and signed synthetic collector traffic are excluded before
  marketing dispatch.
- The Meta sync returned HTTP 200 and stored 437 rows for all
  five independent grains over 2026-07-25 through 2026-07-31 in
  `America/Los_Angeles`. There were no duplicate keys or metric
  availability violations.
- The current qualifying edge read found 138 of 139
  human-or-unknown Meta landings with `fbclid` and 100-percent
  `fbc | fbclid` coverage. The one remaining no-`fbclid`
  observation had denied consent, no canonical PageView and no
  provider dispatch.

The click-to-edge baseline is intentionally unavailable at
release: the Drain began on 2026-08-01 while the newest completed
Insights date was 2026-07-31, so zero prior days satisfy the
three-day baseline contract. Provider health now exposes the
metric as `NULL` rather than allowing it to influence the health
result as a false zero. Meta API acceptance remains
`accepted_unverified` and does not prove provider finality.
Vercel lists the Insights cron enabled at `17 10 * * *` UTC with
no undeployed or modified jobs. Because the current deployment
became ready at 21:34 UTC, the first possible scheduled execution
is 2026-08-02T10:17:00Z. The observed post-release `401` proves
only the unauthenticated gate; scheduler execution and the
corresponding database refresh remain open until that time.

Remaining release evidence is deliberately open. Physical iOS
evidence from earlier deployments is partial, but no controlled
cell may be carried forward as proof of the current deployment's
late-consent behavior. A fresh read through 21:56:34 UTC found
zero edge, consent, canonical PageView or Meta-dispatch rows after
the `dpl_5mg` cutover in all twelve app-by-OS-by-route cells:
Facebook and Instagram on iOS and Android across
`/skreddersy-varmen`, `/comfyrobe` and
`/skreddersy-varmen/utekos-orginal`. One separate iOS landing at
21:42:19 UTC reached edge, granted consent, canonical PageView and
`accepted_unverified`, but had `in_app_browser='none'` and no
`fbclid`, UTM or ad signal. It remains unattributed observational
traffic and cannot close any physical IAB cell.

Earlier production observation contains human-or-unknown Android
IAB traffic on `/skreddersy-varmen`: seven Facebook landings
reached edge and consent, four continued to canonical PageView
and `accepted_unverified`, while one Instagram Android landing
reached edge and consent without PageView or dispatch. There is
no earlier Android evidence for `/comfyrobe` or
`/skreddersy-varmen/utekos-orginal`. Those observational rows do
not replace the controlled current-deployment gate. Chromium
user-agent probes passed, including redirect query preservation,
but also do not close that gate. The controlled browser displayed
the Cookiebot widget and exactly one GTM-owned
`uc.js` URL with `implementation=gtm`. A follow-up in the page's
main JavaScript world verified the Cookiebot API object,
`hasResponse=true`, explicit granted consent for every category,
and working widget open/close methods. The earlier `undefined`
observation came from an isolated evaluation world and is not
Cookiebot runtime evidence.

The earlier physical Instagram iOS run covered the profile landing,
internal navigation to `/skreddersy-varmen` and `/comfyrobe`, and
a direct-message landing on `/skreddersy-varmen/utekos-orginal`.
The direct-message link also produced separate Instagram
preview-bot requests; those requests created no canonical
PageView or provider dispatch. The physical Facebook iOS run
proved a direct organic profile landing with denied consent, no
PageView and no dispatch, followed by granted consent and a
PageView only after refresh. A later Facebook navigation to
`/skreddersy-varmen` retained prior browser identifiers but
lacked a deterministic PageView-to-edge join, while a
simultaneous paid landing had different privacy-safe identifiers
and was therefore excluded from the tester's chain. This is
physical in-app-browser evidence, but it is not an ad-click proof
for the tester.

The open current-deployment physical gate is therefore the entire
twelve-cell matrix, including the Facebook late-consent flow
without refresh. Earlier physical runs remain useful diagnostic
evidence but are not current-release acceptance evidence.

The missing PageView after a denied-to-granted transition was
traced to the browser transport clearing its pending PageView on
explicit denial. Current production deployment
`dpl_5mgNh6toa3fVtuNV8Dx3Wg5o2NHn` retains at most the
latest/current PageView while denied and flushes it on Cookiebot
consent events. Multiple denied SPA navigations do not replay
historical pages, and existing event-id, in-flight and
completed-event guards keep the late flush idempotent. The
implementation has 50 green related unit tests plus green lint,
type generation and TypeScript checks. It must still be re-proved
in the physical Facebook browser without a manual refresh after
consent is granted.

The repeated `KPSDK has already been configured` client message
on `/skreddersy-varmen` is Vercel BotID/Kasada, not Klarna. The
BotID 1.5.11 `client/core` loader used a `loaded` boolean without
sharing an in-flight Promise, so simultaneous protected startup
requests could register multiple `kpsdk-load` handlers and call
`KPSDK.configure` more than once after a single `p.js` response.
The current production release patches both the ESM and CJS
`client/core` exports to share one pending load and to remove a
failed `p.js` element before a later retry. Its focused behavior
test proves three concurrent calls share one configure and
completion, and that three callers can jointly retry after a
failed first script load. A fresh browser pass against deployment
`dpl_5mgNh6toa3fVtuNV8Dx3Wg5o2NHn` loaded one BotID `c.js` and
one `p.js` response with HTTP 200 on each of the four routes,
with no duplicate KPSDK configuration or corresponding Vercel
runtime error. Klarna's own SDK loaded once, completed once and
rendered the Express Checkout control; no payment authorization
or order was attempted, so this is integration rendering evidence
rather than payment proof. Vercel showed no corresponding server
runtime error. Trace Drain version 8 retains PII-free rejection
counters and OTLP partial-success handling. Live warnings
classified the remaining HTTP 400 responses as fully unscoped
batches whose resources lacked both documented Vercel project and
deployment attributes and contained no valid observation. Mixed
batches no longer discard correctly scoped observations: the
receiver persists those observations and returns HTTP 200 with
`partialSuccess.rejectedSpans`. Valid OTLP deliveries and trace
joins continue to work. The upstream reason Vercel emits fully
unscoped resources remains unknown, but their receiver response
is now classified and deliberately fail-closed.

Trace Drain v4 adds a second-level classification without storing
attribute values. In the stable post-v4 window 2026-08-01
15:58–20:00 UTC, function console logs contained 5,408
`invalid_trace_scope` warnings representing 8,116 invalid
resources and 27,470 rejected spans. All 8,116 resources had
`service.name`, while none had a Vercel project scope key, a
Vercel deployment scope key or `scope.name=vercel`. There were no
invalid spans, timestamps, trace conflicts or project mismatches
in this invalid set. A separate 339 `partial_trace_scope`
warnings represented mixed batches whose valid observations were
retained with HTTP 200 partial success. Invocation logs for the
same window initially recorded 3,915 HTTP 200 and 5,323 HTTP 400.
A full Log Explorer query corrected the 503 sample to 83
app-level responses. All 83 used the handler's sole 503 path and
occurred in the same three minutes as 270 Postgres FATAL records,
all SQLSTATE `53300` (`too_many_connections`). There were no
boot, timeout, resource-limit or Edge Function rate-limit
signals. This proves connection exhaustion as the supported
trigger for the database catch, while the v4 log cannot join the
SQLSTATE to each request individually. Function console logs and
invocation logs are asynchronously ingested; the aggregates are
not a one-to-one warning/request join and do not explain why
Vercel emits the separate unscoped resources.

Supabase's current connection guidance identifies the default
Edge Function `SUPABASE_DB_URL` as direct and recommends
transaction-mode pooling on port 6543 for edge/serverless
clients. Trace Drain therefore requires a separate
`VERCEL_TRACE_DRAIN_DATABASE_URL`, validates the 6543 port and
keeps `prepare:false`. The v6 pooler cutover exposed a second
issue rather than closing the gate: all scoped v6 deliveries
returned HTTP 503, with no HTTP 200. The same `postgres@3.4.9`
driver reproduced SQLSTATE `28P01` against the existing local
pooler URL, while the canonical direct URL and an in-memory
pooler URL rebuilt with the canonical password both passed
`select 1`. The dedicated production secret was replaced from
that validated value without printing or writing it.

Version 8 is active with bundle hash
`d37aae6f781d5995d68aa1ddbb32ee14c913eaaeb023a8deaac936aad5b729b8`.
Its bounded nested classifier distinguishes authentication,
connection, TLS, permission, schema and connection-exhaustion
families without logging raw SQLSTATE, message, SQL, host, stack
or connection URL. In the stable production window from 21:13
through 21:36 UTC, v8 returned 202 scoped HTTP 200, 257
deliberate unscoped HTTP 400 and zero HTTP 503, without
`database_write_failed`. The scoped database-write gate is
therefore production-proven; the upstream unscoped resources
remain separately classified and rejected fail-closed.

The same production release also closes the synthetic-browser
propagation gap. `UTEKOS_SYNTHETIC_TRAFFIC_SECRET` is encrypted
in Vercel Production and Preview. A signed document canary
returned HTTP 200 and a separate server-signed synthetic
correlation cookie; its protected PageView collector returned
HTTP 204 with classification `synthetic` and
`Cache-Control: no-store`. The warehouse recorded one edge row
and one trace row, with zero consent, ledger and provider rows.
Those two canary observations were then deleted. This proves
exclusion before marketing persistence and dispatch without
treating UTM text as a trusted synthetic signal.

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
15:26 UTC with UTM/ad signal but without `fbclid` and `fbc`
shared the same bounded pattern: `/skreddersy-varmen`, Facebook
source, the audited ad identifier in campaign content, iPhone
Safari/WebKit, mobile, `fbp` present, no referrer, granted
marketing consent, and no bot/headless classification. This
establishes that the click identifier was absent when the
canonical PageView arrived; it does not by itself identify
whether Meta, an in-app navigation, a redirect before Utekos, or
the original destination URL removed it.

A separate read-only Graph API v25 investigation closes the
configuration side of that uncertainty for ad
`120246491016410788`, including the dates of the ten rows. Meta's
activity history records a creative change on 2026-07-28 at 13:59
UTC from creative `4608432669479938` to `2134034140490187`. The
old creative therefore covers the 2026-07-24 through 2026-07-27
window; both old and current creatives have exactly two link URL
assets, and every asset uses
`https://utekos.no/skreddersy-varmen` as `website_url`. Every
placement customization rule selects one of those link assets,
and both creatives' `url_tags` include the same ad identifier as
`hsa_ad`. The historical configured Meta destination was
consequently the canonical landing page, without an upstream
Utekos redirect.

This direct creative and activity evidence is separate from
Insights metrics. It proves configuration history, not the exact
URL Meta delivered for each impression or click, and it does not
identify where the ten historical click identifiers were lost. It
also says nothing about collector acceptance, dispatch acceptance
or provider finality. The Insights table does not contain a
destination URL. Destination configuration is supported only by
the separate Graph API creative and activity-history evidence,
not by Insights rows.

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
`document.readyState='complete'` in controlled Chromium using
Meta user-agent profiles with their expected title and H1 and no
captured console errors. The active Meta creative should
nevertheless be updated to canonical `https://utekos.no/...`
destinations after separate provider-write approval, eliminating
two avoidable network transitions from paid clicks.

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

At 2026-08-01 14:26 UTC, Vercel's grouped runtime-error read
returned no error clusters during the preceding 24 hours for
`/skreddersy-varmen`, `/comfyrobe` or
`/skreddersy-varmen/utekos-orginal`. Grouped log counts included
successful 200/202 responses and some 4xx traffic, but the wide
4xx detail query timed out and is not classified as a route
failure.

On 2026-08-01 at 21:36–21:38 UTC, current deployment
`dpl_5mgNh6toa3fVtuNV8Dx3Wg5o2NHn` returned HTTP 200 for
`/skreddersy-varmen`, `/comfyrobe`,
`/skreddersy-varmen/utekos-orginal` and `/produkter/utekos-dun`.
Controlled-browser documents reached complete state with their
expected H1, and exact Vercel GET logs returned HTTP 200 for all
four routes. No scoped 5xx, route runtime error or KPSDK
duplicate was observed in the bounded window. These successful
samples do not prove that historical intermittent failures can
never recur.

Do not compare Meta's broad `fbc` percentage across every event
with `fbc | fbclid`. The first includes Google, Bing, direct and
automated traffic; the second measures click-ID construction when
a Meta click identifier is actually present.

## Collection boundaries

The application proxy creates an opaque UUID for each document
request, logs only that UUID, forwards it in
`x-utekos-edge-request-id`, and exposes it to the browser through
the `utekos_edge` Server-Timing entry. A separate
`utekos_edge_auth` entry carries an HMAC token bound to that
UUID. The browser fallback cookie expires after 30 minutes, while
the already-loaded document token verifies for up to 24 hours so
a backgrounded in-app browser can still report late consent and
the PageView dispatch receipt. The token authorizes only these
bounded observability writes and is never stored in the
warehouse. The proxy does not log the incoming URL, query or
token.

As of 2026-08-12, the Proxy matcher runs correlation only for requests that
carry document-navigation signals. RSC, prefetch, API, Vercel-internal,
tracking gateway and static-resource paths are excluded before Proxy
execution; this includes `/analytics/meta-pixel-canonical-v1.js`. The NBCC
root redirect and the Klarna feed host remain explicit matcher contracts.
General CSP, X-Frame, Document-Policy and Referrer-Policy headers are owned by
`next.config.mts`, so proxy-excluded responses retain the same header policy.
Generic user-agent blocking is owned by Vercel Firewall system mitigations;
the 2026-08-13 emergency cutover removes BotID from the event and observability
POST routes. Production retains the older behavior until that exact deployment
is `READY`, owns the aliases, and is verified.

The signed Vercel Log Drain receiver is the pre-consent source of
truth for HTTP status, route, deployment, cache, region and
bounded campaign metadata. It discards raw query strings, IP
addresses, user agents, raw referrers, arbitrary messages and raw
`fbclid`. The `fbclid_hmac` uses a required dedicated secret and
may only be used for equality/deduplication. The read model
projects only whether a row is the first document observation for
that digest, so redirects and reloads cannot inflate the strong
click-ID stratum of the click-to-edge numerator.

When an explicitly approved diagnostic window is active, the signed Vercel
Trace Drain receiver stores a bounded server-side trace duration keyed by the
documented `trace_id`. That duration is not browser TTFB, DOM readiness or
page-load duration. Outside that window no Vercel Trace Drain exists and no
trace observations are expected.

The browser captures the initial landing correlation and
`page_view_id` before any SPA navigation and retains that pair
until Cookiebot resolves. It sends a terminal consent observation
only after a resolved response. A failed transmission is retried
with bounded backoff at most three times for the exact consent
state; subsequent Cookiebot events cannot make the attempts
unbounded. States are serialized per edge request and PageView,
so a newer decision is always sent after any older in-flight
retry. The server fails closed unless the UUID-bound token is
valid. One UUID is immutable to one `page_view_id` and accepts at
most four terminal state writes. Pending consent is deliberately
not persisted as a guessed decision. A denied decision does not
create a canonical collector event.

Only the initial document navigation may use the edge
correlation. Later SPA navigations do not fall back to the
document correlation cookie, so their PageViews cannot be
attributed to the original Meta landing request.

After a permitted consent purpose exists, the browser starts a
separate signed PageView dispatch-receipt request before starting
the canonical collector request. The receipt has three bounded
attempts and never blocks the collector. The collector captures
its receipt time before canonical validation, then schedules the
privacy-bounded database write with Next.js `after`, outside the
response path. The read model selects one landing PageView
identity per edge request and requires the browser receipt,
collector receipt and canonical ledger row to share the exact
`event_id` and `page_view_id`. Receipt timestamps are server
observation times; they do not prove strict network ordering.

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
multiple request weight. Historical terminal BotID classifications remain
stronger than user-agent classification when present. After the 2026-08-13
cutover, new collector requests do not create terminal BotID classifications.
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
6. Keep the Vercel Log Drain active. Do not create a standing Trace Drain.
   A time-bounded Trace Drain diagnostic window requires separate approval,
   a stated end time, sampling below 100 percent, and deletion after the
   post-window evidence is captured.
7. Run physical or approved device-cloud Facebook and Instagram
   in-app browser tests on iOS and Android. Chromium user-agent
   emulation is useful evidence, but it is not this release gate.
8. Observe at least three complete Meta account days before
   enabling the baseline click-to-edge alert as an operational
   signal.

The current partial iOS matrix, observational Android traffic and
synthetic Android user-agent probes do not satisfy gate 7.

Production deploys, Supabase mutations, Vercel Drain creation,
provider secrets and Meta/GTM changes require explicit operator
approval.
