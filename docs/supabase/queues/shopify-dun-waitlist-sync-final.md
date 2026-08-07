# Dun waitlist → Shopify sync — final architecture

## Status

```text
Canonical transport = Supabase PGMQ (shopify_dun_waitlist_sync)
Scheduler = Vercel Cron → /api/cron/shopify-dun-waitlist-sync
Worker runtime = Next.js / Vercel Function
Part 2 cleanup = PENDING until 2026-08-08 18:45 Europe/Oslo
```

See [STEG 6 Part 1 hardening](./shopify-dun-waitlist-sync-steg-6-hardening.md) for the
observation window and destructive-cleanup gate.

## Architecture decision

```text
Use Supabase PGMQ for Dun waitlist → Shopify because the workload
originates from a Postgres write and benefits from atomic enqueue.

Use Vercel Cron as the pull-worker scheduler.

Keep Shopify business processing in the existing Next.js/Vercel runtime.

Do not use ops.integration_events as a queue for this workload anymore.
Terminal succeeded audit evidence may still be written with sync_owner=pgmq.
```

## Call graph (current production)

```text
marketing.leads INSERT
  → pgmq.send(shopify_dun_waitlist_sync)  [same transaction]
Vercel Cron */5
  → /api/cron/shopify-dun-waitlist-sync
  → DUN_WAITLIST_SYNC_BACKEND=pgmq
  → runDunWaitlistShopifyQueueBatch
  → syncDunWaitlistCustomerToShopify
```

Rollback (temporary until Part 2): set `DUN_WAITLIST_SYNC_BACKEND=legacy`.

## Queue config

| Setting | Value |
| --- | --- |
| Queue | `shopify_dun_waitlist_sync` |
| Schema version | `1` (strict) |
| Read visibility timeout | 120 seconds |
| Max attempts | 5 |
| Retry delays | 5m / 10m / 20m / 40m / terminal |
| Dead-letter source | `shopify_dun_waitlist_pgmq` |

## What this is not

- Not two queue systems: PGMQ is transport; Vercel Cron is wake-up only
- Not a migration of canonical provider dispatch (Meta/Google/Microsoft stay on Vercel Queue)
- Not GTM/sGTM tagging transport

## Evidence trail

- STEG 1–5 docs under this folder = historical migration evidence
- STEG 5 cutover boundary commit: `2bf2fd7ef`
- STEG 6 Part 1 = health, retention, docs while rollback window remains open
