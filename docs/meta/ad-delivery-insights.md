# Meta ad-delivery insights

## Documentation status

Implementation and production contract verified on 2026-08-01 against Meta Marketing API
`v25.0` field semantics, the live Utekos ad-account read surface, the vendored
official Meta Node SDK `25.0.3`, current Next.js 16.2 route-handler guidance,
current Vercel cron authorization behavior, and current Supabase RLS/Data API
guidance. The approved production migration, application deployment, three
authorized same-window syncs, and database readback are complete. External
Sentry issue ingestion is proven. The first scheduled execution after the
10:17 UTC cutover remains unobserved.

Primary Meta sources:

- `https://developers.facebook.com/docs/marketing-api/insights`
- `https://developers.facebook.com/docs/marketing-api/insights/breakdowns`
- `https://developers.facebook.com/docs/marketing-api/reference/ads-insights`

The official breakdown page was last updated 2026-06-18 and lists
`publisher_platform, platform_position` as a supported permutation. The live
diagnostic adapter accepted that requested pair on 2026-08-01 but returned only
the publisher field, so it was not sufficient evidence for raw Graph response
shape. A direct read-only run through the application Graph client then returned
187 placement rows for 2026-07-24 through 2026-07-30 with both dimensions
present in every row. The application still fails validation if either
dimension is missing.

## Production verification 2026-08-01

The production route returned `401` with `Cache-Control: no-store` without
authorization. One authorized call returned `200`, refetched completed account
dates 2026-07-25 through 2026-07-31 in `America/Los_Angeles`, and upserted 437
rows. Readback showed 23 overall, 52 publisher-platform, 185
publisher-platform-plus-placement, 65 device-platform and 112
impression-device rows across eight ads. There were zero duplicate unique keys,
zero ambiguous placement rows and zero availability-semantic violations. The
retention cron is active.

Ad `120246491016410788` had 98 rows across all five grains. Its overall rows
for 2026-07-25 through 2026-07-29 reported 46,603 impressions, 1,081 clicks,
824 link clicks, 824 outbound clicks on dates where that field was available,
and 507 landing-page views on the same dates: 61.53 percent outbound-to-LPV.
The 2026-07-29 row reported zero impressions and clicks, one landing-page view,
and unavailable outbound clicks. It is retained as provider output and treated
as a possible reporting adjustment, not coerced into a rate.

This table has no destination-URL field, so the Insights readback alone cannot
prove that the ad landed on `/skreddersy-varmen`. API/storage acceptance,
Insights visibility, event-dispatch `accepted_unverified`, attribution and
provider finality remain separate evidence classes.

Creative destinations belong to the separate
[`marketing.meta_ad_creative_destinations`](./ad-creative-destinations.md)
slowly changing snapshot. A temporal join can prove observed configuration,
but not the exact destination Meta delivered for an individual impression or
click.

The follow-up application deployment
`dpl_CTUfdAuSz5mJRS1Uce1gFs2G77xg` is `READY` on commit
`ad92bda52565bfb6e1b772379fe81afc4f4977a0` and owns `utekos.no`.
It changes provider-health availability and Sentry alert flushing; it does not
change the Meta Insights request or storage contract. The production build
generated 134 of 134 pages. Browser verification returned HTTP 200 documents
for `/skreddersy-varmen`, `/comfyrobe`,
`/skreddersy-varmen/utekos-orginal` and a product route with no captured
console warnings or errors. Vercel returned no error-level or 5xx logs in the
release window.

The first post-release provider-health read correctly returned `NULL` for the
click-to-edge current date and rate because the newest completed Meta account
date still does not overlap the post-Drain edge window. It must not be plotted
as zero. The same read reported 100-percent `fbc | fbclid`, 100-percent Meta API
acceptance, 95.71-percent edge Meta click-ID coverage across 140 qualifying
landings, no dead letters, and `alert_delivery_flushed=true`. The health result
therefore remained red on the click-ID threshold while the click-to-edge metric
remained unavailable.

Sentry SDK flushing is application evidence that the queued alert was handed
off before the cron response. The correct existing `SENTRY_ACCESS_TOKEN`
returned HTTP 200 from the official project Issues API and exposed the
unresolved `meta_edge_click_id_coverage_below_98_percent` issue with ten
occurrences from 14:45 through 20:45 UTC. The official Workflows API also
returned enabled workflow `612443`, configured for new and existing
high-priority issues with an active email action for issue owners and an
active-member fallback. Its `lastTriggered` timestamp was 20:46:05 UTC, eleven
seconds after the issue's latest occurrence. This proves external issue
ingestion, workflow evaluation and an active email action, but not final mailbox
delivery or message opening. The separate Sentry cron monitor
`utekos-meta-ad-delivery-insights` is currently `disabled` with no environment
check-ins. An attempted activation was rejected by Sentry because the account
lacked pay-as-you-go capacity for the required seat, so activating that monitor
remains a billing/capacity decision rather than an application-code defect.

The third authorized sync at 21:22:59 UTC returned HTTP 200 and refreshed the
same complete 437-row window for 2026-07-25 through 2026-07-31: 23 overall,
52 publisher, 185 placement, 65 device-platform and 112 impression-device
rows. Creative-destination observation was refreshed in the same run. The
previous `17 5 * * *` UTC schedule occurred at 22:17 on the preceding Meta
account date and therefore introduced a one-account-day lag. The release
schedule is `17 10 * * *` UTC, after midnight in Los Angeles in both standard
and daylight-saving time.

The later edge audit preserved but reclassified five controlled Utekos probes
as non-human test traffic after proving they had zero consent, canonical
PageView and provider-attempt rows. The next authorized health read reported
138 of 139 qualifying human-or-unknown Meta landings with `fbclid`
(99.28 percent), 100-percent `fbc | fbclid`, 100-percent Meta API acceptance,
no dead letters and `healthy=true`. The only remaining no-`fbclid` observation
is a physical iOS landing with denied consent and no dispatch; Insights cannot
prove whether its missing click ID originated at Meta, an upstream redirect or
in-app navigation.

The complete late-consent and schedule release is Vercel deployment
`dpl_5mgNh6toa3fVtuNV8Dx3Wg5o2NHn` from commit
`d35fe5d6eff6b0ba164bcae29b47d11ec2e11460`. It became `READY` at
2026-08-01T21:34:17.493Z and owns all three production aliases. Vercel reports
the Insights job enabled at `17 10 * * *` with no undeployed or modified jobs.
The first possible scheduled invocation after this promotion is
2026-08-02T10:17:00Z; an unauthenticated `401` after promotion proves only the
authorization gate. The production tracking-gateway smoke returned GTM and
sGTM HTTP 200, `Cache-Control: no-store` on sGTM health, and no Vercel cache
hit. A bounded post-release log window contained no scoped route errors or
deployment 5xx responses. Fresh browser documents for `/skreddersy-varmen`,
`/comfyrobe`, `/skreddersy-varmen/utekos-orginal` and
`/produkter/utekos-dun` returned HTTP 200 with complete DOM and heading, no
application console errors, no runtime exceptions and no duplicate KPSDK
configuration. The two Vercel telemetry endpoints returned HTTP 200 and the
page initialized the telemetry runtime. A follow-up CDP capture identified the
deployment-generated base paths, both injected script nodes and HTTP 200
responses for `@vercel/analytics/next` 2.0.1 and
`@vercel/speed-insights/next` 2.0.0. The Analytics `view` endpoint also
returned HTTP 200 on `/skreddersy-varmen` and `/comfyrobe`. A separate Speed
Insights `vitals` submission was not observed in the short sample window, so
script loading is proven while a sampled vitals delivery remains open.

## Purpose and boundaries

`/api/cron/meta-ad-delivery-insights` reads daily, ad-level Meta delivery data
for click-to-landing diagnostics. It does not mutate Meta and it does not
replace Dataset Quality, the canonical event ledger, provider dispatch audit,
or attribution reporting.

The stored metrics are:

- impressions and all clicks
- link clicks from the `actions` entry `link_click`
- outbound clicks from `outbound_clicks`
- landing-page views from the `actions` entry `landing_page_view`

Meta defines outbound clicks as clicks that lead away from Meta and landing-page
views as clicks followed by a successfully loaded destination page or shop.
Neither metric is the storefront's first-edge-request count.

## Request contract

- Endpoint: `/{version}/act_{account_id}/insights`
- Version: `v25.0`
- Level and time grain: `ad`, `time_increment=1`
- Account attribution setting, `action_report_time=impression`
- The seven most recent completed dates in the account's live `timezone_name`;
  the current partial account day is excluded
- Independent grains for `overall`, `publisher_platform`,
  `platform_position`, `device_platform`, and `impression_device`.
  `platform_position` requests the officially supported
  `publisher_platform,platform_position` permutation so values such as `feed`
  cannot collide across publishers
- Ten-second timeout per Graph request
- `Authorization: Bearer` only; tokens are forbidden in URLs
- Pagination follows only the validated `after` cursor and rebuilds the next
  URL against `graph.facebook.com`; Meta's raw `paging.next` URL is ignored

Only Meta's raw `impression_device` value is stored. The implementation does
not infer an operating system from device names. A separate provider-delivered
OS breakdown is therefore still unavailable.

## Storage semantics

`marketing.meta_ad_delivery_insights` has one unique row per account, ad, date,
breakdown kind, and dimension key. The table has deny-by-default RLS and no
Data API grants. Rows expire after 14 months unless a documented retention
exception is active.

The migration fails with SQLSTATE `55000` if `cron.job` is unavailable, so
the retention schedule cannot be silently omitted. Release proof must still
read back the active `purge_expired_meta_ad_delivery_insights` job.

Provider omission and zero are different:

- Field present with an empty action list: available, value `0`.
- Field absent or `null`: unavailable, value `NULL`.
- A missing ad/date row is absence of provider output, not a zero.

Every row stores `metric_availability` so dashboards and alerts cannot coerce
unavailable provider data into apparent performance.

## Operational verification

Before marking the release active:

1. Apply the migration through the approved Supabase deployment gate.
2. Deploy the app and confirm the Vercel cron at `17 10 * * *` UTC.
3. Confirm unauthenticated access returns `401` and `Cache-Control: no-store`.
4. Run one authorized sync and verify all five grains for the seven-day window.
5. Confirm retries update the unique rows rather than inserting duplicates.
6. Confirm unavailable metrics remain `NULL` and actual zeroes remain `0`.
7. Compare account dates using the stored Meta account timezone.

`accepted_unverified`, API receipt, Insights visibility, landing-page view,
campaign attribution, and provider-confirmed finality remain distinct states.
