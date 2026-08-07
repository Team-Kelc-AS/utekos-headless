# Dun waitlist → Shopify sync — STEG 1 PGMQ baseline

Status after STEG 1: infrastructure only, no production cutover.

## Purpose

Record the audited pre-cutover baseline for migrating Dun waitlist
customer sync from the current `ops.integration_events` state machine
to a durable Supabase Queues / PGMQ queue.

This note is evidence for STEG 1 only. Production runtime ownership is
unchanged.

## Before migration (canonical runtime)

```text
marketing.leads
→ ops.integration_events
→ runDunWaitlistShopifySyncBatch
→ syncDunWaitlistCustomerToShopify
→ Shopify Admin API
```

Owner surfaces:

- Batch worker: `src/lib/shopify/runDunWaitlistShopifySyncBatch.ts`
- Shopify Admin sync: `src/lib/shopify/syncDunWaitlistCustomerToShopify.ts`
- Cron route: `src/app/api/cron/shopify-dun-waitlist-sync/route.ts`
- Cron schedule: `vercel.json` → `/api/cron/shopify-dun-waitlist-sync`

### Semantics audited from repo (2026-08-07)

| Setting | Value |
| --- | --- |
| Provider | `shopify` |
| Event type | `dun_waitlist_customer_sync` |
| Max attempts | `5` |
| Stale processing recovery | `5 minutes` via `FOR UPDATE SKIP LOCKED` |
| Retry backoff | `min(60, 5 * 2^(attempt-1))` minutes → 5, 10, 20, 40, 60 |
| Cron batch size | `10` |
| Cron cadence | `*/5 * * * *` |
| Dead-letter source | `shopify_dun_waitlist_sync` |
| Lead source filter | `product_waitlist_utekos_dun` with non-empty email |
| Enqueue lock | advisory xact lock `(20260807, 1)` |
| Shopify idempotency | email lookup → create → race re-lookup → phone-less create fallback → tag `dunvarsel` |

Statuses used by the current queue/state machine:

- `pending`
- `processing`
- `retry_scheduled`
- `succeeded`
- `dead_lettered`

## STEG 1 infrastructure added

- Extension: `pgmq` via migration
  `20260807090113_enable_pgmq_shopify_dun_waitlist_sync`
- Durable/basic queue: `shopify_dun_waitlist_sync`
- TypeScript message contract:
  `src/lib/shopify/dunWaitlistShopifyQueueMessage.ts`

Future queue message shape (not published yet):

```json
{
  "schema_version": 1,
  "lead_id": "<uuid>"
}
```

PII (email, phone, name, consent, Shopify customer payloads) must not
appear in queue messages. Consumers load fresh rows from
`marketing.leads`.

Access model:

- Server-side / direct Postgres only
- Not exposed through Data API
- No `pgmq_public` in PostgREST schemas
- No `anon` / `authenticated` grants for queue operations

## Future target (not active after STEG 1)

```text
marketing.leads
→ PGMQ shopify_dun_waitlist_sync
→ worker
→ Shopify Admin API
```

## Explicit non-goals completed as non-changes

- No cutover of `/api/cron/shopify-dun-waitlist-sync`
- No changes to `runDunWaitlistShopifySyncBatch` claim/retry machine
- No `pgmq.send` / `pgmq.read` / `pgmq.delete` / `pgmq.archive` /
  `pgmq.set_vt` in production runtime
- No backfill or rewrite of `ops.integration_events`
- No Edge Function consumer
- No browser / Data API queue access
