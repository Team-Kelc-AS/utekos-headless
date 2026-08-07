# Dun waitlist → Shopify sync — STEG 2 PGMQ shadow enqueue

PGMQ messages are not consumed in STEG 2.
No production cutover has occurred.

## Purpose

Record the atomic shadow-enqueue path added after STEG 1. New
qualified Dun waitlist leads get a PGMQ message in the **same
Postgres transaction** as `marketing.leads` INSERT. Legacy Shopify
sync remains the only runtime consumer path.

## Before STEG 2

```text
new lead
→ marketing.leads

cron
→ scans leads
→ ops.integration_events
→ Shopify
```

## After STEG 2

```text
new Dun lead
→ marketing.leads
   + atomic PGMQ enqueue (shadow)

PGMQ = shadow-only

eksisterende cron
→ ops.integration_events
→ Shopify
```

## Implementation

| Surface | Value |
| --- | --- |
| Migration | `20260807124034_enqueue_dun_waitlist_shopify_pgmq_shadow` |
| Function | `marketing.enqueue_shopify_dun_waitlist_sync_on_lead_insert()` |
| Trigger | `enqueue_shopify_dun_waitlist_sync_after_insert` |
| Timing | `AFTER INSERT` / `FOR EACH ROW` on `marketing.leads` |
| Queue | `shopify_dun_waitlist_sync` (durable/basic from STEG 1) |

### Qualification predicate

Matches legacy `ENQUEUE_MISSING_QUERY` in
`runDunWaitlistShopifySyncBatch.ts`:

```text
NEW.source = 'product_waitlist_utekos_dun'
AND NEW.email IS NOT NULL
AND btrim(NEW.email) <> ''
```

### Message contract

```json
{
  "schema_version": 1,
  "lead_id": "<uuid>"
}
```

No PII in the queue payload. Future consumers load fresh rows from
`marketing.leads`.

### Atomicity / idempotency

- `pgmq.send` runs inside the lead INSERT transaction (fail-closed).
- `insertMarketingLead()` uses `ON CONFLICT (id) DO NOTHING`, so a
  duplicate id does not re-fire the INSERT trigger.
- No historical backfill in STEG 2.

### Access model

- Server-side / direct Postgres only
- `SECURITY DEFINER` + `search_path = ''`
- Execute revoked from `public`, `anon`, `authenticated`
- No `pgmq_public` / Data API exposure

## Cutover warning for later steps

Messages that accumulate in the shadow queue may later represent
leads that were already synced through the legacy
`ops.integration_events` flow. A future PGMQ consumer must be
idempotent and/or able to detect that the job is already satisfied
before applying Shopify side effects.

Do not solve that in STEG 2.

## Explicit non-goals

- No `pgmq.read` / `pop` / `delete` / `archive` / `set_vt` in runtime
- No cron cutover
- No changes to `runDunWaitlistShopifySyncBatch`
- No historical lead backfill
- No Edge Function / `pg_net` Shopify calls from the trigger
