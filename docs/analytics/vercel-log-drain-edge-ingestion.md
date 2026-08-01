# Vercel Log and Trace Drains to Supabase landing observability

Status date: 2026-08-01

Release state: local release candidate only. The migration has
not been applied, the Edge Functions have not been deployed, no
Supabase secret has been changed, and no Vercel Drain has been
created.

## Purpose and boundary

The Log Drain endpoint records the first Vercel-observable
document or redirect request before consent and before the
canonical `page_view`. The Trace Drain endpoint records only the
bounded server trace envelope correlated by Vercel `traceId`.
Both are hosted as Supabase Edge Functions instead of routes in
the drained Vercel project, which prevents recursive drain
traffic.

The endpoint is not a canonical marketing event collector and
does not dispatch to Meta, Google, Microsoft, PostHog or any
other provider. Its rows are evidence for the
`outbound click -> edge request` transition only. Consent-stage
evidence is stored separately in
`ops.landing_consent_observations`.

Current official sources:

- [Vercel Log Drains reference](https://vercel.com/docs/drains/reference/logs),
  including the `vercel.log.v1` JSON fields and batched JSON
  delivery; last updated 2026-07-01.
- [Vercel Trace Drains reference](https://vercel.com/docs/drains/reference/traces),
  including OTLP/HTTP, JSON `resourceSpans`, exact
  `vercel.projectId` and `vercel.deploymentId` resource
  attributes, `traceId`, and nanosecond span start/end fields;
  last updated 2026-07-06.
- [Vercel Drains configuration](https://vercel.com/docs/drains/using-drains),
  including project selection, production sampling rules, custom
  HTTPS endpoints, JSON trace format and automatic log/trace
  correlation; last updated 2026-07-21.
- [Vercel Drains security](https://vercel.com/docs/drains/security),
  including HMAC-SHA1 over the exact request body in
  `x-vercel-signature` and the constant-time comparison
  recommendation; last updated 2026-02-27.
- [Supabase Edge Function secrets](https://supabase.com/docs/guides/functions/secrets).
- [Supabase Edge Function Postgres connections](https://supabase.com/docs/guides/functions/connect-to-postgres).
- [Supabase Edge Function tests](https://supabase.com/docs/guides/functions/unit-test).

## Data flow

1. Vercel batches `vercel.log.v1` objects as an uncompressed JSON
   array.
2. The Supabase Edge Function reads at most 4 MiB and 500 array
   entries.
3. It verifies HMAC-SHA1 against the exact raw bytes before JSON
   parsing.
4. Each entry is validated against the configured project,
   environment and host allowlists.
5. Only `GET` or `HEAD` document/redirect observations are
   selected. Build logs, APIs, Next.js assets, sGTM/GTM proxies
   and background revalidation entries are ignored.
6. Query data is reduced to an allowlist before persistence. The
   path is stored without its query or fragment.
7. Rows are inserted with `vercel_log_id` as the immutable
   idempotency key.
8. Repeated log records keep their distinct Vercel log IDs. The
   read model bridges `request_id`, `edge_request_id`,
   `vercel_id` and `trace_id` across sibling records before
   selecting one primary HTTP-request observation.
9. The separate signed Trace Drain accepts OTLP/HTTP JSON, checks
   the exact project and deployment resource attributes, and
   stores one trace envelope keyed by `trace_id`.
10. The daily retention job removes request, trace and consent
    observations after 30 days unless a documented, time-limited
    privacy exception is active.

The migration fails with SQLSTATE `55000` when `cron.job` is not
available. A successful schema migration therefore cannot
silently leave privacy retention unscheduled. Release evidence
must still read the active job back from production.

Database errors return `503`, allowing Vercel to retry the same
immutable log ids safely. Invalid signatures return `403`.
Structurally invalid signed payloads return `4xx`; rejected
individual log objects are counted but do not cause valid entries
in the same signed batch to be retried.

## Persisted request contract

`ops.vercel_edge_request_observations` contains only:

- Vercel log, deployment, project, request, trace and
  proxy/Vercel identifiers;
- optional `edge_request_id`, parsed only from the exact
  structured message
  `[landing-edge] {"edge_request_id":"<uuid>"}`;
- timestamp, environment, host, method, pathname and
  document/redirect type;
- source, status, cache, WAF, path type, regions and response
  bytes;
- referrer hostname only;
- normalized Facebook/Instagram in-app, device, OS and automation
  classes;
- `fbclid_present` and HMAC-SHA256 of `fbclid` when present;
- bounded UTM tokens and numeric Meta campaign, ad-set and ad
  identifiers, placement and site-source token. `meta_ad_id`
  prefers a numeric `ad_id` and falls back only to a numeric
  `utm_content`; descriptive `utm_content` is never treated as an
  ad ID.

The table has no raw query, `fbclid`, IP address, user agent,
referrer URL, destination URL, request body or arbitrary log
message column. The function must not print an incoming body or
parsed entry to its own logs.

The required click HMAC secret must be different from the Vercel
Drain signature secret. HMAC permits equality joins without
making an opaque click id available to readers. The read model
exposes only a boolean marking the first document observation for
each digest; it does not expose the digest itself. Coordinated
secret rotation starts a new deduplication boundary and must be
recorded in release evidence.

`vercel_log_id` is the ingestion idempotency key, not the
business definition of one edge request. A single HTTP request
can produce multiple Log Drain records. The persisted
`request_id` and strict `edge_request_id` are indexed for
investigation. The read model propagates non-null edge and trace
correlation values across all records sharing the same project,
deployment and request key, then ranks one row as
`is_primary_request_observation`. Filter that boolean for HTTP
request counts. Use `is_first_fbclid_observation` for the strong
click-ID stratum of the click-to-edge numerator, so redirects and
reloads do not inflate it. Meta-signal primary requests without
`fbclid` form a separate lower-identity stratum. Count arrival
regardless of status, then report 2xx/3xx success separately.
Inspect all ranked rows for redirect/error diagnosis.

## Trace-stage contract

`ops.vercel_trace_observations` is keyed by the same 32-character
hexadecimal `trace_id` documented on Vercel Log Drain records. It
stores only:

- exact Vercel project and deployment IDs;
- production scope asserted by the receiver configuration;
- earliest span start, latest span end, their server
  trace-envelope duration in milliseconds, and bounded span
  count;
- observed, ingested and updated timestamps.

It does not persist span IDs, span names, resource/span
attributes, URLs, headers, IP addresses, user agents or request
bodies. The duration is server-side trace-envelope time. It is
not browser TTFB, Largest Contentful Paint, page-load duration or
proof that a visitor saw the page.

The OTLP trace payload documents project and deployment IDs but
no environment field. Therefore the receiver validates the exact
project in the signed payload, while production-only scope must
be proved in the Vercel Trace Drain sampling configuration after
creation. Until that provider-side check exists, production scope
is a blocked verification rather than an inferred fact.

## Consent-stage contract

`ops.landing_consent_observations` is keyed by `edge_request_id`
and deliberately has no foreign key to the asynchronously
delivered Vercel row. It stores:

- the correlated `page_view_id`;
- analytics, marketing and preferences booleans;
- terminal decision `granted`, `denied` or `partial`;
- fixed source `cookiebot`;
- traffic classification `human_or_unknown`, `verified_bot`,
  `automated_bot` or `synthetic`;
- a bounded observation count from one through four;
- observed and updated timestamps.

Pending consent is not persisted. The browser supplies a
short-lived HMAC token created with the initial document UUID.
The application verifies that token before classification or
persistence, binds the UUID permanently to the first
`page_view_id`, and permits at most four terminal-state writes. A
request with an invalid token is rejected before database access;
a conflicting page-view ID or exhausted write budget is
rate-limited. Browser delivery uses at most three attempts per
exact state and serializes state changes per edge/PageView, which
prevents an older retry from overwriting a newer decision.

## Required Supabase configuration

The hosted runtime supplies `SUPABASE_DB_URL`. Configure these
Edge Function secrets only after explicit approval:

```text
VERCEL_LOG_DRAIN_SIGNATURE_SECRET=<dedicated drain secret, minimum 32 characters>
VERCEL_LOG_DRAIN_PROJECT_ID=<exact Vercel project id>
VERCEL_LOG_DRAIN_ENVIRONMENT=production
VERCEL_LOG_DRAIN_ALLOWED_HOSTS=utekos.no,www.utekos.no
VERCEL_FBCLID_HMAC_SECRET=<required, separate secret, minimum 32 characters>
VERCEL_TRACE_DRAIN_SIGNATURE_SECRET=<dedicated trace drain secret, minimum 32 characters>
VERCEL_TRACE_DRAIN_PROJECT_ID=<exact Vercel project id>
VERCEL_TRACE_DRAIN_ENVIRONMENT=production
```

The Vercel application separately requires
`LANDING_OBSERVABILITY_SIGNING_SECRET` with at least 32
characters before the app deploy. It must be distinct from both
Drain signature secrets, the optional click-ID HMAC secret,
`CRON_SECRET` and the synthetic-traffic secret.

The functions have `verify_jwt = false` because Vercel cannot
present a Supabase JWT. This does not make the endpoint
unauthenticated: it fails closed on the Drain-specific body
signature before parsing or database access.

## Required Vercel Drain configuration

Creating or changing the Drain is a separate provider mutation
and requires explicit approval. Configure it only after the
migration and Edge Function are production-verified:

- destination: the Supabase `/functions/v1/vercel-log-drain`
  HTTPS endpoint;
- schema: `log` version `v1`;
- encoding: `json`;
- compression: `none`;
- project: only the exact Utekos Vercel project;
- environment: `production`;
- sources needed for document evidence: static, lambda, edge,
  external, firewall and redirect; build entries are never
  persisted;
- sampling: 100 percent while calculating click-to-edge rates.

Create a separate Trace Drain only after its receiver is
verified:

- destination: the exact Supabase
  `/functions/v1/vercel-trace-drain` HTTPS endpoint. Vercel
  accepts a custom OTLP/HTTP endpoint; `/v1/traces` is typical
  but is not appended to this Supabase function URL;
- type: Trace;
- format: JSON over OTLP/HTTP, not protobuf or OTLP/gRPC;
- project: only the exact Utekos Vercel project;
- sampling rule: `production`, 100 percent while computing
  latency distributions and click-to-edge rates.

Sampling below 100 percent invalidates the raw click-to-edge
denominator unless the rate is incorporated explicitly into every
report. Do not treat a successful Drain delivery test as proof
that production traffic is being stored.

## Release order and evidence

The release remains blocked until an operator explicitly approves
each mutation. Follow this order:

1. Review the migration and run the targeted tests.
2. Check linked migration history and remote `ops` schema.
3. Run a local Supabase reset and database lint when Docker is
   available.
4. Apply the migration to `hkoawfbomhnzupcsdggb`.
5. Prove all three tables, the security-invoker read model, RLS,
   grants, indexes, purge function and cron job exist.
6. Set the Edge Function secrets and the separate application
   correlation secret without printing their values.
7. Deploy `vercel-log-drain` and `vercel-trace-drain` with JWT
   verification disabled only for these functions.
8. Send a controlled signed canary directly to Supabase and prove
   one sanitized row, idempotent replay and no raw identifier
   columns.
9. Send a controlled signed OTLP JSON canary and prove only one
   bounded trace envelope is stored.
10. Create the Vercel Log and Trace Drains with separate
    dedicated signature secrets.
11. Use Vercel's delivery validation, then prove a real document
    request creates one corresponding database observation.
12. Prove the production-only Trace sampling rule, 100-percent
    sampling and a Log-to-Trace join for a real request.
13. Verify the Edge Function logs and Vercel Drain status without
    exposing body, signature secret, click id or database URL.
14. After the consent collector is released, prove
    invalid/expired tokens are rejected, a UUID cannot switch
    `page_view_id`, and the bounded update limit works.
15. Prove the same `edge_request_id` joins to a terminal consent
    row and the corresponding canonical `page_view_id` after an
    SPA navigation when applicable.

Targeted local tests:

```bash
source "$HOME/.nvm/nvm.sh" && nvm use --silent
corepack pnpm exec tsx --test \
  supabase/functions/vercel-log-drain/*.test.ts \
  supabase/functions/vercel-trace-drain/*.test.ts \
  supabase/migrations/vercel_landing_observability.test.ts
corepack pnpm run typecheck:edge-functions
```

Required post-migration checks include:

```sql
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where oid in (
  'ops.vercel_edge_request_observations'::regclass,
  'ops.vercel_trace_observations'::regclass,
  'ops.landing_consent_observations'::regclass
);

select jobname, schedule, active
from cron.job
where jobname = 'purge_expired_landing_observations';

select
  observed_date_utc,
  meta_ad_id,
  meta_placement,
  device_class,
  os_class,
  status_code,
  server_trace_duration_ms,
  consent_decision,
  canonical_page_view_observed,
  meta_dispatch_status,
  count(*)
from ops.meta_landing_observability
where observed_at >= now() - interval '24 hours'
  and is_primary_request_observation
group by 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
order by count(*) desc;
```

No production deployment, schema mutation, secret change or Drain
creation is part of this local release-candidate implementation.
