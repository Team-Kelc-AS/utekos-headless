# Dun waitlist → Shopify sync — STEG 4 retry / dead-letter

PGMQ retry and dead-letter semantics are implemented and tested.
PGMQ consumer remains callable only when `DUN_WAITLIST_SYNC_BACKEND=pgmq`.
Until STEG 5 Phase B cutover approval, legacy Dun sync remains the
production owner.
No production cutover has occurred in STEG 4.
No legacy queue/state was removed.

See [STEG 5 cutover](./shopify-dun-waitlist-sync-steg-5-cutover.md).

## State after STEG 4

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
retry + dead-letter production-ready at the consumer layer
tested
NOT scheduled in production
```

## Retry policy

Canonical attempt count = PGMQ `read_ct`.

`MAX_ATTEMPTS = 5`

| `read_ct` after failure | Action |
| --- | --- |
| 1 | `set_vt` 300s (5 min) |
| 2 | `set_vt` 600s (10 min) |
| 3 | `set_vt` 1200s (20 min) |
| 4 | `set_vt` 2400s (40 min) |
| ≥ 5 + transient failure | dead-letter + archive |

Backoff formula: `min(3600, 5 * 2^(read_ct - 1) * 60)` seconds.

Retry uses `pgmq.set_vt(queue_name text, msg_id bigint, vt integer)` on the
original message. No re-enqueue via `pgmq.send`.

## Permanent failure reasons

- `invalid_waitlist_customer`
- `shopify_customer_lookup_invalid_response`
- `shopify_customer_create_invalid_response`
- `shopify_customer_create_rejected`
- `shopify_tags_add_invalid_response`
- `shopify_tags_add_rejected`
- `invalid_queue_message`
- `lead_not_found`
- `invalid_lead_record`

Permanent failures dead-letter immediately (no retry budget use).

## Transient failure reasons

- `shopify_customer_lookup_failed`
- `shopify_customer_create_failed`
- `shopify_tags_add_failed`
- `unexpected_error`

Unknown/runtime errors classify as `transient` / `unexpected_error`.

## Terminal handling

```text
ops.dead_letter_events
  source = shopify_dun_waitlist_pgmq
+
pgmq.archive(...)
```

Atomic in one Postgres transaction.

Idempotency: guarded insert on `(source, payload->>'pgmq_message_id')`.

Privacy-minimal payload:

```json
{
  "pgmq_message_id": "12345",
  "lead_id": "<uuid>"
}
```

Metadata example:

```json
{
  "queue_name": "shopify_dun_waitlist_sync",
  "read_ct": 5,
  "failure_kind": "transient",
  "schema_version": 1,
  "last_failure_reason": "shopify_tags_add_failed"
}
```

Attempts exhausted uses reason `shopify_dun_waitlist_attempts_exhausted`
and preserves the underlying transient reason in `metadata.last_failure_reason`.

## Semantic deviations from legacy

| Topic | Legacy | PGMQ STEG 4 |
| --- | --- | --- |
| Dead-letter source | `shopify_dun_waitlist_sync` | `shopify_dun_waitlist_pgmq` |
| Attempts exhausted reason | underlying Shopify reason stored as `reason` | dedicated `shopify_dun_waitlist_attempts_exhausted` + `last_failure_reason` |
| Attempt counter | `payload.attempt_count` on `ops.integration_events` | PGMQ `read_ct` |
| Retry transport | `next_attempt_at` on integration event | `pgmq.set_vt` |

Backoff minutes, `MAX_ATTEMPTS`, and permanent/transient Shopify provider
reasons match legacy.

## At-least-once note

If Shopify succeeds and `pgmq.archive` fails, the message can be redelivered.
`syncDunWaitlistCustomerToShopify()` remains side-effect idempotent
(lookup/create race handling + tag-add semantics). No distributed exactly-once
locking is introduced.

## Status

```text
PGMQ consumer is production-ready at the retry/dead-letter layer,
but remains dormant.

Legacy cron remains production owner.

No production cutover has occurred.
```
