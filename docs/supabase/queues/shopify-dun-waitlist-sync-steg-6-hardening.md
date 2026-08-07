# Dun waitlist → Shopify sync — STEG 6 Part 1 hardening

## Status

```text
Part 1 = active (health / retention / docs / observation window)
Part 2 = gated until ROLLBACK_WINDOW_EXPIRES_AT
production owner = PGMQ
DUN_WAITLIST_SYNC_BACKEND = pgmq (rollback still available via legacy)
legacy runner = retained until Part 2
```

## Observation window

```text
CUTOVER_AT=2026-08-07T16:42:29Z
ROLLBACK_WINDOW_EXPIRES_AT=2026-08-08T18:45:00+02:00
```

Until expiry, do **not** remove:

- `DUN_WAITLIST_SYNC_BACKEND`
- `getDunWaitlistSyncBackend`
- `runDunWaitlistShopifySyncBatch`

## Invariant (Part 1 and final)

```text
ops.integration_events must not be used as queue / claim / retry / scheduler
for Dun waitlist → Shopify.

Terminal succeeded audit rows with sync_owner=pgmq remain allowed via
recordDunWaitlistShopifySyncSucceeded.
```

## Queue health / SLO

Age-based operational objective (low volume; not %-SLO):

| Level | Criterion |
| --- | --- |
| Healthy | oldest **visible** (`vt <= now()`) age &lt; 15 min |
| Warning | oldest visible ≥ 15 min |
| Critical | oldest visible ≥ 30 min **or** consecutive cron infrastructure failures |

Delayed messages (`vt > now()`) are expected retry backoff, not stuck backlog.

Cron PGMQ responses expose privacy-safe `queueMetrics` including
`visibleCount`, `delayedCount`, `oldestVisibleAgeSec`, `oldestDelayedVt`,
and `healthLevel`.

## Retention

| Surface | Policy |
| --- | --- |
| Active PGMQ queue | retained until archive / dead-letter; never purged wholesale |
| PGMQ archive `pgmq.a_shopify_dun_waitlist_sync` | **30 days** via `ops.purge_expired_shopify_dun_waitlist_pgmq_archive` + pg_cron |
| `ops.dead_letter_events` | **14 months** (existing privacy retention job) |
| `ops.integration_events` payloads | redacted after **30 days**; rows deleted after **14 months** (existing privacy job) |

Archive is queue lifecycle history, not the business ledger.
Business outcome lives in Shopify (+ optional terminal succeeded audit row).

## Observability

- Sentry spans: receive / process / retry / ack / dead-letter equivalents
- Correlation: `msg_id`, `read_ct`, reason codes, queue name, schema version
- Never in spans: email, phone, name, raw lead, raw Shopify response, tokens
- Prefer excluding `lead_id` from Sentry attributes (allowed in DLQ DB payload)
- Operator script: `scripts/queues/report-dun-waitlist-shopify-queue-health.mjs` (read-only)
- DLQ source: `shopify_dun_waitlist_pgmq` via `ops.dead_letter_summary`

## Retry / dead-letter proof (accepted)

STEG 4 unit tests + local PGMQ smoke cover `set_vt` and dead-letter.
No production failure injection during the observation window.
Natural retry/DLQ will surface via metrics + Sentry if it occurs.

## Part 2 removal checklist (after expiry)

Re-approve only when **all** are true:

1. Now ≥ `ROLLBACK_WINDOW_EXPIRES_AT`
2. Production still `DUN_WAITLIST_SYNC_BACKEND=pgmq`
3. Cron stable through the window (`backend=pgmq`, `ok=true`)
4. Visible backlog / ages healthy; delayed-only backoff is OK
5. No unexplained Shopify duplicates or queue runtime errors
6. Active messages with `enqueued_at < CUTOVER_AT` = 0
7. Post-cutover evidence (`8b247798-…` / later proof) still valid

Then:

- Cron → `runDunWaitlistShopifyQueueBatch` only
- Delete legacy worker + backend selector
- Remove env `DUN_WAITLIST_SYNC_BACKEND`
- Remove `isDunWaitlistShopifyLegacySatisfied` if shadow gate still empty
- Keep `syncDunWaitlistCustomerToShopify` + `recordDunWaitlistShopifySyncSucceeded`

## Roll-forward after Part 2

```text
fix forward
or
revert the cleanup deployment

Do not restore ops.integration_events as queue ownership.
PGMQ messages remain durable.
```

## Explicit non-goals

- No Meta / Google / Microsoft provider-dispatch migration to PGMQ
- No GTM / sGTM / tracking gateway changes
- No Edge Function consumer move
- No partitioned / unlogged queue
- No `drop table ops.integration_events`
- No active queue purge
- No deletion of STEG 1–5 evidence docs

## Observation log

Append dated evidence during the window (do not invent failures).

| When (UTC) | Signal | Result |
| --- | --- | --- |
| 2026-08-07 | Part 1 shipped | health metrics + archive retention + docs |
| 2026-08-07 | Archive purge migration applied | `ops.purge_expired_shopify_dun_waitlist_pgmq_archive` + pg_cron `51 3 * * *` |
| 2026-08-07T18:22Z | Prod cron after deploy `dpl_4GNjNvh7cuQrZSqmBUJ1Eh4PLHwq` | `backend=pgmq`, `ok=true`, `healthLevel=healthy`, visible/delayed=0 |
| 2026-08-07T18:22Z | `pnpm ops:dun-waitlist-queue-health` | healthy; archivedLast24h=4; DLQ 7d=0 |

## Security note (Part 1)

Queue remains server-only: no Data API / `anon` / `authenticated` consumer
grants for `shopify_dun_waitlist_sync`. Purge function is `SECURITY DEFINER`
with empty `search_path`, execute granted only to `service_role` / `postgres`.

Supabase security advisors (2026-08-07): pre-existing INFO that
`ops.dead_letter_events` has RLS enabled without policies. No new pgmq /
Dun-queue exposure advisories. No STEG 6 change to that table's RLS posture.