# Dun waitlist → Shopify sync — STEG 5 controlled cutover

## Status (Phase B complete)

```text
production owner = PGMQ
scheduler = Vercel Cron → /api/cron/shopify-dun-waitlist-sync
DUN_WAITLIST_SYNC_BACKEND = pgmq
legacy runner = available via env=legacy (rollback only)
historical ops.integration_events = preserved
```

## Cutover boundary

```text
CUTOVER_AT=2026-08-07T16:42:29Z
deployment (legacy verify)=dpl_2VMJXpBBNYBdo4fYp3KhyiowZeiT
deployment (pgmq owner)=dpl_BRWdtoMX5PhFVPhBxMbzyfokCoqA
git SHA=545fd4c1c
```

Prior first cutover (same day, retained for audit):

```text
CUTOVER_AT=2026-08-07T16:27:12Z
deployment (legacy-ready selector)=dpl_EcYNM1m2r5vXjAJ3H7f3EHNK2sQ8
deployment (pgmq owner)=dpl_FwwG3qFoa8FbPbhJUYJvQBzZNjnX
git SHA=497185369
```

## Before

```text
production owner = legacy (ops.integration_events)
PGMQ = not yet migrated in production (STEG 1–2 applied during Phase B)
```

## After

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

## Scheduler / batch (unchanged)

| Setting | Value |
| --- | --- |
| Path | `/api/cron/shopify-dun-waitlist-sync` |
| Schedule | `*/5 * * * *` |
| Batch size | `10` |
| `maxDuration` | `60` |

## Preflight (production)

### Legacy status counts

| status | n |
| --- | --- |
| succeeded | 10 |
| pending | 0 |
| processing | 0 |
| retry_scheduled | 0 |
| dead_lettered | 0 |

Active legacy jobs drained: **yes**.

Dun leads with email: **10**, all already `succeeded` synced: **10**.

### PGMQ baseline note

STEG 1–2 had **not** been applied to production pink-lens before Phase B.
They were applied during this cutover:

1. `enable_pgmq_shopify_dun_waitlist_sync`
2. `enqueue_dun_waitlist_shopify_pgmq_shadow`

Immediate post-migration metrics:

```text
queue_length = 0
total_messages = 0
```

No historical shadow backlog existed (enqueue is INSERT-only; no backfill).

## Shadow reconciliation (re-cutover 2026-08-07T16:42Z)

Sequence executed after operator approval:

1. `DUN_WAITLIST_SYNC_BACKEND=legacy` → deploy `dpl_2VMJXpBBNYBdo4fYp3KhyiowZeiT`
2. Cron verified: `{"backend":"legacy","ok":true,"claimed":0,...}`
3. Seeded already-synced lead `763027f9-33f8-438f-a350-71000110009d` into PGMQ
4. `DUN_WAITLIST_SYNC_BACKEND=pgmq` → deploy `dpl_BRWdtoMX5PhFVPhBxMbzyfokCoqA`
5. Controlled shadow drain + post-cutover lead proof below

| Bucket | Count | Notes |
| --- | --- | --- |
| seeded already-synced message | 1 | lead `763027f9-…` |
| already_satisfied | 1 | first PGMQ cron after re-cutover |
| processed_by_pgmq (Shopify success) | 1 | post-cutover lead `8b247798-…` |
| retry_scheduled | 0 | |
| dead_lettered | 0 | |
| remaining unexplained | 0 | |

First PGMQ cron response (re-cutover):

```json
{
  "read": 1,
  "succeeded": 0,
  "alreadySatisfied": 1,
  "retryScheduled": 0,
  "deadLettered": 0,
  "archived": 1,
  "backend": "pgmq",
  "ok": true,
  "queueMetrics": {
    "queueLength": 0,
    "totalMessages": 3
  }
}
```

## Post-cutover new lead proof

Inserted Dun lead `8b247798-f200-4702-9a43-837d20fded0e`
(`source=product_waitlist_utekos_dun`).

Verified:

- atomic PGMQ enqueue (`msg_id=4`)
- **0** legacy active jobs (`succeeded` only; n=12)
- cron `backend=pgmq` result:

```json
{
  "read": 1,
  "succeeded": 1,
  "alreadySatisfied": 0,
  "archived": 1,
  "backend": "pgmq",
  "ok": true,
  "queueMetrics": {
    "queueLength": 0,
    "totalMessages": 4
  }
}
```

- durable evidence row:

```text
ops.integration_events
  status = succeeded
  payload.sync_owner = pgmq
  payload.lead_id = 8b247798-f200-4702-9a43-837d20fded0e
```

- PGMQ archive contains the message; active queue length = 0

## Durable sync evidence (PGMQ success)

On Shopify success under PGMQ, the consumer inserts a guarded
`ops.integration_events` row:

```text
provider = shopify
event_type = dun_waitlist_customer_sync
status = succeeded
payload = { lead_id, synced_at, sync_owner: "pgmq" }
```

## Queue health thresholds

| Level | Criterion |
| --- | --- |
| Healthy | oldest **visible/processable** message age < 15 min (allow VT-hidden retries) |
| Warning | oldest processable ≥ 15 min without expected `set_vt` delay |
| Critical | oldest processable ≥ 30 min **or** consecutive cron failures |

Post-cutover health: `queue_length=0`, `legacy_active=0`.

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

## Explicit non-goals

- No STEG 6 legacy code deletion in this step
- No second cron path / Edge Function worker
- No cadence/batch/concurrency change at cutover
- No canonical provider dispatch / GTM / Meta / Google / Microsoft changes

## Final confirmation

```text
PGMQ is now the production owner for Dun waitlist → Shopify synchronization.

The existing Vercel Cron remains the scheduler and now invokes the PGMQ consumer.

The legacy Dun queue is drained and is no longer the normal production owner.

Historical ops.integration_events data was preserved.

PGMQ enqueue remains atomic with marketing.leads.

A documented rollback path to the legacy consumer exists and does not require a database rollback.

No canonical provider dispatch, GTM, sGTM, Meta, Google or Microsoft queueing paths were changed.
```
