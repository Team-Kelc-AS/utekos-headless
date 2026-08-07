# Dun waitlist → Shopify sync — STEG 5 controlled cutover

## Status (Phase A complete; Phase B blocked on production PGMQ)

```text
Code: reversible backend selector ready locally (not yet production-deployed)
Production owner: legacy
PGMQ in production: NOT PRESENT (extension + queue missing)
Rollback path: set backend=legacy (no DB rollback) — once PGMQ exists
```

### Phase B preflight snapshot (2026-08-07, project `hkoawfbomhnzupcsdggb`)

**Legacy status counts** (`provider=shopify`, `event_type=dun_waitlist_customer_sync`):

| status | n |
| --- | --- |
| succeeded | 10 |
| pending | 0 |
| processing | 0 |
| retry_scheduled | 0 |

Legacy active queue is drained (gate OK).

**PGMQ metrics:** FAILED — `schema "pgmq" does not exist`.

**Migration history:** latest applied is `20260805094715_optimize_provider_dispatch_health`.  
Repo migrations **not** applied to production:

- `20260807090113_enable_pgmq_shopify_dun_waitlist_sync`
- `20260807124034_enqueue_dun_waitlist_shopify_pgmq_shadow`

**Blocker:** STEG 1–2 must be applied to production before shadow drain / `pgmq` owner switch.

**Do not set production `DUN_WAITLIST_SYNC_BACKEND=pgmq` until PGMQ exists and Phase A code is deployed with `legacy` first.**

## Before

```text
production owner = legacy (ops.integration_events)
PGMQ = shadow enqueue (STEG 2) + dormant consumer (STEG 3–4)
```

## After Phase B (target)

```text
production owner = PGMQ
scheduler = Vercel Cron → /api/cron/shopify-dun-waitlist-sync
legacy runner = available via env=legacy (rollback only)
historical ops.integration_events = preserved
```

## Why Vercel Cron

Shopify Admin GraphQL, Sentry, cron auth, and the existing Next.js worker
already live in this runtime. Moving the consumer to Supabase Edge Functions
during cutover would expand blast radius without required gain.

## Backend selector

```text
DUN_WAITLIST_SYNC_BACKEND=legacy|pgmq
```

- Strict Zod enum — missing/invalid fails closed (HTTP 500, no runner).
- One cron execution → exactly one owner (never dual-run).
- First production deploy after Phase A code must set `legacy`.

## Scheduler / batch (unchanged)

| Setting | Value |
| --- | --- |
| Path | `/api/cron/shopify-dun-waitlist-sync` |
| Schedule | `*/5 * * * *` |
| Batch size | `10` |
| `maxDuration` | `60` |

## Durable sync evidence (PGMQ success)

On Shopify success under PGMQ, the consumer inserts a guarded
`ops.integration_events` row:

```text
provider = shopify
event_type = dun_waitlist_customer_sync
status = succeeded
payload = { lead_id, synced_at, sync_owner: "pgmq" }
```

This enables:

- `already_satisfied` on PGMQ redelivery after archive failure
- legacy `ENQUEUE_MISSING` skip on rollback (any integration_event for lead)

Evidence is written **before** `pgmq.archive`. Failures / `already_satisfied`
do not write new evidence.

## Queue health thresholds

| Level | Criterion |
| --- | --- |
| Healthy | oldest **visible/processable** message age &lt; 15 min (allow VT-hidden retries) |
| Warning | oldest processable ≥ 15 min without expected `set_vt` delay |
| Critical | oldest processable ≥ 30 min **or** consecutive cron failures |

PGMQ cron responses include bounded `queueMetrics` when `pgmq.metrics` succeeds.

## Preflight queries (Phase B — read-only)

### Legacy status counts

```sql
select status, count(*)::bigint as n
from ops.integration_events
where provider = 'shopify'
  and event_type = 'dun_waitlist_customer_sync'
group by status
order by status;
```

Require before owner switch:

```text
pending = 0
processing = 0
retry_scheduled = 0
```

(`succeeded` / `dead_lettered` may be non-zero historical.)

### PGMQ metrics

```sql
select * from pgmq.metrics('shopify_dun_waitlist_sync');
```

### Archive count (optional)

```sql
select count(*)::bigint as archived
from pgmq.a_shopify_dun_waitlist_sync;
```

## Shadow reconciliation template

| Bucket | Count | Notes |
| --- | --- | --- |
| shadow messages total | _TBD_ | enqueued_at &lt; CUTOVER_AT |
| already_satisfied | _TBD_ | |
| processed_by_pgmq | _TBD_ | |
| retry_scheduled | _TBD_ | known VT |
| dead_lettered | _TBD_ | |
| remaining unexplained | _TBD_ | must be 0 |

Do **not** `pgmq.purge_queue`.

## Cutover boundary (fill in Phase B)

```text
CUTOVER_AT=<ISO-8601 UTC>
deployment=<Vercel deployment id / git SHA>
DUN_WAITLIST_SYNC_BACKEND=pgmq
```

## Rollback triggers

Rollback PGMQ → legacy when any of:

- cron systematically fails in PGMQ mode
- PGMQ DB functions fail systematically
- Shopify success messages are not archived (and evidence/retry broken)
- retry/`set_vt` messages do not become available as expected
- unexplained duplicate Shopify side-effects
- queue backlog grows past critical threshold
- systemic dead-letter regression

A single transient Shopify failure + successful `set_vt` is **not** a rollback reason.

## Rollback procedure

1. Set `DUN_WAITLIST_SYNC_BACKEND=legacy`
2. Activate production config / redeploy if required
3. Verify next cron reports `backend=legacy`
4. Do **not** purge PGMQ; leave STEG 2 enqueue trigger active
5. Legacy `ENQUEUE_MISSING` recreates jobs only for leads without an
   `ops.integration_events` row for this provider/event_type
6. Capture PGMQ metrics; fix root cause; re-reconcile before re-cutover

## Phase B checklists

### Preflight

- [ ] latest production deployment healthy
- [ ] queue extension + queue exist
- [ ] legacy active jobs drained
- [ ] PGMQ shadow metrics captured
- [ ] controlled shadow batch succeeded
- [ ] no systemic dead-letter issue
- [ ] backend selector deploy verified with `legacy`
- [ ] rollback config documented
- [ ] Sentry tag `dun_waitlist_sync_backend` visible

### Cutover

- [ ] set backend to `pgmq`
- [ ] activate production deployment/config
- [ ] verify cron invokes PGMQ runner only
- [ ] capture `CUTOVER_AT` + deployment SHA/ID
- [ ] inspect first queue batch + metrics

### Post-cutover

- [ ] new Dun lead → PGMQ message → consumer → Shopify → archive + succeeded evidence
- [ ] no new legacy integration_event enqueue from runtime for that lead
- [ ] queue health normal
- [ ] no unexpected dead-letter / duplicate side effects

## Explicit non-goals

- No STEG 6 legacy code deletion in this step
- No second cron path / Edge Function worker
- No cadence/batch/concurrency change at cutover
- No canonical provider dispatch / GTM / Meta / Google / Microsoft changes
