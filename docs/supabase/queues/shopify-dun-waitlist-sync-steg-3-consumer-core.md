# Dun waitlist → Shopify sync — STEG 3 PGMQ consumer core

PGMQ consumer code is implemented but is not scheduled in production.
Legacy Dun sync remains the production owner.
No production cutover was performed.

## State after STEG 3

### WRITE PATH

```text
marketing.leads
  └── atomic PGMQ enqueue (STEG 2 trigger)
```

### PRODUCTION PROCESSING PATH

```text
ops.integration_events
  └── legacy cron /api/cron/shopify-dun-waitlist-sync
      └── runDunWaitlistShopifySyncBatch
      └── Shopify
```

### NEW PGMQ PROCESSOR

```text
implemented
tested
NOT scheduled in production
```

## Consumer modules

| File | Responsibility |
| --- | --- |
| `readDunWaitlistShopifyQueue.ts` | `pgmq.read(queue, vt, qty)` |
| `archiveDunWaitlistShopifyQueueMessage.ts` | `pgmq.archive(queue, msg_id)` |
| `isDunWaitlistShopifyLegacySatisfied.ts` | legacy `succeeded` lookup |
| `processDunWaitlistShopifyQueueMessage.ts` | one-message business processing |
| `runDunWaitlistShopifyQueueBatch.ts` | batch isolation + summary |

## Transport settings

- Queue: `shopify_dun_waitlist_sync`
- Visibility timeout: **120 seconds**
- Read signature: `pgmq.read(queue_name text, vt integer, qty integer)`
- Ack: `pgmq.archive` after `succeeded` or `already_satisfied`
- Never uses `pgmq.pop()`

## Shadow reconciliation

```text
legacy integration_event
  provider = shopify
  event_type = dun_waitlist_customer_sync
  status = succeeded
  payload->>'lead_id' = <lead_id>

→ PGMQ message is already_satisfied
→ archive without Shopify call
```

Messages that fail, are invalid, or lack a lead remain leased until VT
expiry. Terminal dead-letter policy is STEG 4.

## Explicit non-goals

- No new Vercel / Supabase cron
- No Edge Function
- No cutover of `/api/cron/shopify-dun-waitlist-sync`
- No `set_vt` backoff / max-attempt dead-letter yet
- No writes to `ops.integration_events` from the PGMQ consumer
