# Supabase Queues

Durable message queues with guaranteed delivery in Postgres.

Supabase Queues is a Postgres-native durable message queue system with guaranteed
delivery, built on the [`pgmq`](https://github.com/pgmq/pgmq) database extension.
It lets you persist and process messages in the background while improving
resiliency and scalability.

Queues couples the reliability of Postgres with Supabase’s platform and developer
experience, so you can manage background tasks with minimal configuration.

## Features

- **Postgres-native** — create and manage queues with any Postgres tooling on top of `pgmq`
- **Guaranteed delivery** — messages added to queues are delivered to consumers
- **Exactly-once delivery** — a message is delivered exactly once within a customizable visibility window
- **Durability and archival** — messages live in Postgres; archive them for analytics or audit
- **Granular authorization** — control client access with API permissions and Row Level Security (RLS)
- **Management and monitoring** — create, manage, and monitor queues in the Supabase Dashboard

## Local docs

### Dun waitlist → Shopify (canonical)

Use Supabase PGMQ for this workload because leads originate in Postgres and
need atomic `INSERT` + `pgmq.send`. Vercel Cron is only the pull-worker
scheduler; the Next.js/Vercel runtime remains the Shopify worker.

- Producer: `marketing.leads` AFTER INSERT trigger → `pgmq.send`
- Consumer: `/api/cron/shopify-dun-waitlist-sync` → `runDunWaitlistShopifyQueueBatch`
- Retry: `pgmq.set_vt` with 5/10/20/40 minute backoff; max 5 attempts
- Dead-letter: `ops.dead_letter_events` source `shopify_dun_waitlist_pgmq`
- Observability: privacy-safe queue metrics on cron responses + Sentry spans
- Retention: PGMQ archive 30 days; dead-letter rows 14 months (privacy job)
- Security: server-only; no Data API / anon / authenticated queue access
- Runbook: [STEG 6 Part 1 hardening](./shopify-dun-waitlist-sync-steg-6-hardening.md)
- Final architecture (Part 2 pending): [final ADR](./shopify-dun-waitlist-sync-final.md)

Canonical provider dispatch (Meta / Google / Microsoft) stays on Vercel Queue.
Dun PGMQ is not a general queue migration.

### Project baselines (Completed / historical)

- [Dun waitlist → Shopify sync — STEG 1 PGMQ baseline](./shopify-dun-waitlist-sync-steg-1-baseline.md) (Completed / historical)
- [Dun waitlist → Shopify sync — STEG 2 PGMQ shadow enqueue](./shopify-dun-waitlist-sync-steg-2-shadow-enqueue.md) (Completed / historical)
- [Dun waitlist → Shopify sync — STEG 3 PGMQ consumer core](./shopify-dun-waitlist-sync-steg-3-consumer-core.md) (Completed / historical)
- [Dun waitlist → Shopify sync — STEG 4 retry / dead-letter](./shopify-dun-waitlist-sync-steg-4-retry-dead-letter.md) (Completed / historical)
- [Dun waitlist → Shopify sync — STEG 5 controlled cutover](./shopify-dun-waitlist-sync-steg-5-cutover.md) (Completed / historical)
- [Dun waitlist → Shopify sync — STEG 6 Part 1 hardening](./shopify-dun-waitlist-sync-steg-6-hardening.md) (Active observation window)

### Supabase Queues guides

- [Quickstart](./queues-start.md)
- [API (`pgmq_public`)](./api.md)
- [Consume messages with Edge Functions](./consuming-messages-with-edge-functions.md)
- [Expose queues (local / self-hosted)](./expose-self-hosted-queues.md)

### PGMQ extension

- [PGMQ overview](./extensions/pgmq/README.md)
- [Types](./extensions/pgmq/types.md)
- [Functions](./extensions/pgmq/functions/index.md)
- [FIFO queues](./extensions/pgmq/fifo/index.md)
- [Topic-based routing](./extensions/pgmq/topics.md)
- [Partitioned queues](./extensions/pgmq/partitioned-queues.md)

## Upstream

- [Supabase Queues quickstart](https://supabase.com/docs/guides/queues/quickstart)
- [Supabase Queues API](https://supabase.com/docs/guides/queues/api)
- [PGMQ documentation](https://pgmq.github.io/pgmq/)
- [PGMQ GitHub](https://github.com/pgmq/pgmq)
