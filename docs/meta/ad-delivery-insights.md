# Meta ad-delivery insights

## Documentation status

Implementation contract verified on 2026-08-01 against Meta Marketing API
`v25.0` field semantics, the live Utekos ad-account read surface, the vendored
official Meta Node SDK `25.0.3`, current Next.js 16.2 route-handler guidance,
current Vercel cron authorization behavior, and current Supabase RLS/Data API
guidance. Production deployment, migration application, scheduled execution,
and database readback remain unverified until an approved release.

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
dimension is missing. Production scheduled execution and database readback
remain release gates.

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
2. Deploy the app and confirm the new Vercel cron at `17 5 * * *` UTC.
3. Confirm unauthenticated access returns `401` and `Cache-Control: no-store`.
4. Run one authorized sync and verify all five grains for the seven-day window.
5. Confirm retries update the unique rows rather than inserting duplicates.
6. Confirm unavailable metrics remain `NULL` and actual zeroes remain `0`.
7. Compare account dates using the stored Meta account timezone.

`accepted_unverified`, API receipt, Insights visibility, landing-page view,
campaign attribution, and provider-confirmed finality remain distinct states.
