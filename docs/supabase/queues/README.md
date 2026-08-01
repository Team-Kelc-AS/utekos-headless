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
