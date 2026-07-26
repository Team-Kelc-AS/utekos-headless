# GA4 multi-source purchase beta evidence — 2026-07-25

## Documentation status

Documentation status: sufficient for local implementation and
preview verification.

Verified sources:

- Google Data Manager API:
  [Send events](https://developers.google.com/data-manager/api/devguides/events/send-events)
- Google Data Manager API:
  [Diagnostics](https://developers.google.com/data-manager/api/devguides/diagnostics)
- Google Analytics:
  [Improve purchase measurement](https://support.google.com/analytics/answer/16391665)
- Local confidential customer guide:
  `/Users/kristofferohnstadhjelmeland/Downloads/[NDA - Web] Multi-source events - Customer Guide.pdf`

The confidential guide was read locally and was not uploaded to
an external service.

## Day 0 scope

- GA4 property `489598217` is allowlisted for multi-source
  events.
- Shopify paid order remains the purchase source of truth.
- Shopify Customer Events remains the browser purchase source.
- The existing Google Data Manager outbox remains the
  supplementary server source.
- Browser and server use `shopify_order_<legacy-order-id>` as
  `transaction_id`.
- No GA4 Data Import source, Measurement Protocol sender,
  historical replay, GTM publish, Shopify mutation, Supabase
  migration, or production deployment is part of this change.

## Local implementation

The local runtime now:

- requires analytics consent for Google purchase dispatch;
- accepts `clientId`, consent-permitted GCLID, or
  consent-permitted User-ID as the qualifying GA identifier;
- does not qualify hashed `userData` alone;
- records purchase freshness as `within_48h`,
  `late_within_window`, or `outside_72h`;
- sends through 72 hours and skips older purchases with
  `google_event_outside_72h`;
- uses `missing_google_analytics_identifier` for purchase-only
  identifier skips while preserving `missing_client_id` for other
  Google events;
- keeps one event per Data Manager request;
- starts provider status retrieval after 30 minutes, applies
  `1.3` backoff with small jitter, caps the interval at 60
  minutes, and stops after 24 hours;
- evaluates `eventsIngestionStatus.recordCount`, `errorInfo`, and
  `warningInfo` even when the provider status is `SUCCESS`;
- marks only `SUCCESS`, `record_count=1`, and no error/warning
  entries as provider-confirmed green;
- retains warning-bearing success as
  `accepted_unverified/provider_confirmed_success_with_warnings`
  for review;
- dead-letters provider failure, partial success, error-bearing
  success, and record-count mismatch without automatic replay;
- retains a 24-hour lookup timeout as
  `accepted_unverified/provider_status_timeout` and returns HTTP
  `503` from that cron run so the timeout is operationally
  visible.

The Shopify pixel parity test verifies the same transaction ID,
value, currency, and item contract as the server mapping.

## Local verification

Green checks:

- complete relevant analytics suite: `545/545` tests;
- final targeted multi-source suite: `81/81` tests;
- Shopify Customer Events pixel suite: `6/6` tests, including
  browser/server parity;
- changed-file ESLint;
- `pnpm exec next typegen`;
- `pnpm build`, including Next.js TypeScript and 126 generated
  routes;
- production tracking-gateway smoke against `https://utekos.no`
  (`/__gtg` and `/__sgtm/healthy` HTTP 200,
  `Cache-Control: no-store`, `x-vercel-cache: MISS`);
- `ops:ga4-multisource-report -- --fail-on-alerts`;
- `git diff --check`.

Release blockers outside this implementation:

- standalone `pnpm exec tsc --noEmit` reports 14 existing
  test-type errors in product metadata, customer assistant,
  page-view acceptance, and cart webhook tests; none are in the
  multi-source files;
- local tracking-gateway smoke reached a separately running
  localhost gateway whose health response lacks
  `Cache-Control: no-store`; the production gateway passed;
- `mcp:doctor` reports missing `CONTEXT7_API_KEY` and detects the
  existing Google Developers key in ignored generated MCP
  outputs; no secret value was printed or committed;
- the global provider and identifier reports remain red because
  144 historical Google dead letters are unresolved, and the
  provider report also flags the historical Microsoft UET skip
  rate;
- no preview deployment was created because these are release
  no-go conditions in `DEPLOYMENT.md`.

## Read-only production baseline

Command:

```text
npm run ops:ga4-multisource-report -- --fail-on-alerts
```

Observed at `2026-07-24T23:31:15.631Z`, with a 14-day lookback:

| Evidence                                                             | Count |
| -------------------------------------------------------------------- | ----: |
| Canonical purchase rows                                              |    39 |
| Operational Google purchase attempts                                 |    21 |
| Provider-confirmed success                                           |    16 |
| `SUCCESS` with warnings                                              |     0 |
| Dead-lettered Google purchase requests                               |     0 |
| Record-count mismatch                                                |     0 |
| Warning records                                                      |     0 |
| Error records                                                        |     0 |
| Provider status timeout                                              |     0 |
| Unresolved non-legacy status older than 24 hours                     |     0 |
| `validate_only=true` rows, reported separately                       |     1 |
| Legacy rows without `validate_only` metadata, reported separately    |     3 |
| Transaction IDs occurring more than once in the canonical 14-day set |     4 |

Provider status groups:

- `succeeded/provider_confirmed_success`: 16
- `skipped_unqualified/historical_unqualified_missing_client_id`:
  2
- `accepted_unverified` legacy rows without response semantics: 3

Identifier coverage across the 21 operational Google attempts:

- GA client ID: 1
- GCLID: 0
- User-ID: 18
- at least one of the three qualifying identifiers: 18

Freshness measurable from current attempt payloads:

- within 48 hours: 18
- between 48 and 72 hours: 0
- older than 72 hours: 0

The report returned no alerts. The four repeated transaction IDs
are reported as an informational warehouse baseline; they are not
replayed and do not constitute GA4 deduplication proof.

## Production evidence still required

Production remains unchanged until explicit deployment approval.

The first organic, analytics-consented purchase after deployment
is the canary. Required evidence:

1. Exactly one canonical purchase row and one Google provider
   row.
2. The same `shopify_order_<legacy-order-id>` in the Shopify
   browser event and Data Manager server event.
3. Data Manager terminal status checked no earlier than 30
   minutes after ingestion.
4. `SUCCESS`, `record_count=1`, no errors, and no warnings for
   green provider status.
5. One deduplicated GA4 transaction after the 24-hour and 48-hour
   reporting windows.

If no eligible organic purchase occurs within 24 hours after
deployment, stop and request separate approval before any test
order.

The absent GA4 BigQuery dataset remains a separate
analysis-evidence gap and is not a launch blocker for this beta.

## 14-day outcome window

The outcome review is pending. At the end of the 14-day
observation period, append:

- browser purchase count;
- server purchase count;
- deduplicated GA4 transaction count;
- incremental recovered purchases;
- provider warning/error/timeout counts;
- identifier and 48/72-hour coverage;
- Purchase Journey and S2S reporting evidence at 24 and 48 hours;
- any change in Google Ads bidding inputs, reported separately
  from ingestion success.

Do not convert this section to verified evidence until the
provider and GA4 reporting surfaces have been observed for the
full window.
