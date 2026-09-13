# Vercel log-drain diagnostics

## Purpose and evidence boundaries

The drain has two independent selections, committed in one transaction:

- `ops.vercel_edge_request_observations`: existing privacy-reduced document/redirect observations. Its historical `rejected_count` means not selected as a document, not necessarily invalid.
- `ops.vercel_runtime_diagnostics`: warning/error/fatal log entries and HTTP 400–599 responses (even if Vercel labels them `info`). Includes APIs, POSTs, RSC and entries without `proxy`. Build logs remain excluded. Project/environment must match the configured signed drain. Diagnostic entries do not require a public hostname because runtime logs may name the deployment hostname or omit proxy data.

The diagnostic table contains **log entries**, not unique incidents, customers, page views or conversions. A single request can emit multiple log IDs. Duplicate deliveries use `vercel_log_id` and `ON CONFLICT DO NOTHING`. Both inserts roll back if either fails; HTTP 503 requests a provider retry. Delivery/retry success still needs provider readback.

`request_route` is the normalized Vercel request path. `context_route` is the independently normalized route reported inside a recognized JSON envelope. `/api/log` must never be interpreted as the affected page. `/:other` and `/api/:endpoint` indicate lost specificity, not a known concrete route. Null HTTP status means absent, not success. Log severity and HTTP status are independent.

## Message safety and interpretation

Raw messages, stack traces, nested JSON, headers, URL queries, IP addresses, customer identifiers and advertising identifiers are not stored. `event_name` and `error_name` come from fixed allowlists. `category` is a heuristic technical classification, not a proven root cause. Unknown text becomes `unclassified`. `message_policy` explicitly tells the reader whether raw text was omitted or never supplied.

To investigate an unclassified error, use its deployment, timestamp and request/trace ID to retrieve original runtime details from Vercel, subject to Vercel's retention. Do not weaken sanitization to persist arbitrary text. Extend fixed categories and event names with representative privacy tests instead. This change cannot reconstruct older messages or specificity already removed by the app logger.

## Read-only investigation

Start with the rolling two-hour grouping; the view does not mix deployments or environments:

```sql
select * from ops.vercel_runtime_diagnostics_2h
where environment = 'production'
order by log_entries desc, last_seen desc;
```

For a reproducible window, use explicit UTC bounds on the base table. Search both routes:

```sql
select observed_at, ingested_at, level, category, event_name,
       request_route, context_route, status_code, deployment_id,
       request_id, trace_id, vercel_log_id, message_policy
from ops.vercel_runtime_diagnostics
where environment = 'production'
  and observed_at >= :start_utc and observed_at < :end_utc
  and (request_route = '/skreddersy-varmen' or context_route = '/skreddersy-varmen')
order by observed_at desc, vercel_log_id desc;
```

Use the Vercel MCP runtime-log tool with `requestId` and the same project/environment/time bounds. A trace ID can correlate separate diagnostic entries. Do not count `distinct_known_request_ids` as users, and inspect `entries_without_request_id` before drawing request-level conclusions.

## Drain health

Each committed batch emits a structured `batch_processed` event in the **Supabase function logs**, also returned in the HTTP response. Its `diagnostics` object reports selected, inserted and duplicate entries plus exclusions by reason:

- `invalid_schema`: validation failure, logged at warning level. Investigate provider schema changes. No offending payload or Zod input is logged.
- `outside_scope`: another project/environment.
- `build_excluded`: build output.
- `not_diagnostic`: ordinary traffic without an error status.

The diagnostic counts reconcile as `received = selected + within-batch duplicates + all exclusion reasons`. Response `duplicate_count` also includes IDs already in the database. Document and diagnostic selections overlap and must not be added together.

`database_write_failed` is a structured error with `retryable: true`; it exposes a validated SQLSTATE code when available, never database exception text/credentials. An HTTP 200 with no diagnostic rows is not enough to declare a period error-free: confirm recent batch summaries, absence of schema/write failures, provider delivery/sampling coverage and available retention. Supabase's generic MCP log sample may be capped; it is not a complete time-window audit.

## Access, retention and release

The new table forces RLS, has no public/anon/authenticated grants and grants only select/insert to `service_role`. The summary view uses `security_invoker`. The existing hourly `ops.purge_operational_v1()` cleanup gains this table with the same seven-day policy, one-hour safety margin and time-limited legal holds. No new job or statistics aggregation is enabled.

Apply `20260913110000_add_vercel_runtime_diagnostics.sql` and `20260913111500_fix_vercel_diagnostic_request_id_constraint.sql` **before** deploying the changed Edge Function. The legacy function can run with the additive table present; the new function must not run before it exists. Verify the configured database role can insert both tables and the existing purge job is active and succeeding. A Vercel app deployment alone does not deploy this Supabase function.

Production migration/function deployment require the repository's explicit release approval. Read back schema, grants, migration history and deployed function, then verify an actual delivered diagnostic row and a batch summary. Provider sampling and filters determine coverage and are not modified here. Roll back the function first if needed; preserve the additive table and existing cleanup pending investigation.

## Verification and official sources

```sh
pnpm exec tsx --test supabase/functions/vercel-log-drain/*.test.ts
python3 scripts/observability/test-vercel-diagnostics-migration.py
```

Official documentation consulted through native Vercel/Supabase MCP and Context7 on 2026-09-13:

- https://vercel.com/docs/drains/reference/logs — severity, timestamps, proxy and runtime metadata.
- https://vercel.com/docs/observability/debug-production-errors — original runtime details and request investigation.
- https://supabase.com/docs/guides/database/tables — schema, constraints and security-invoker views.
- https://github.com/porsager/postgres#transactions — atomic transactions and bulk inserts.
- https://zod.dev/basics — validation without throwing and safe parsing.

Tests validate local behavior; they do not establish production ingestion or complete upstream coverage.
