# Partitioned queues

You need [pg_partman](https://github.com/pgpartman/pg_partman/) to use PGMQ
partitioned queues.

Upstream: [Partitioned Queues](https://pgmq.github.io/pgmq/latest/partitioned-queues/).

## Overview

`pgmq` queue tables can be created as partitioned tables with
`pgmq.create_partitioned()`. [pg_partman](https://github.com/pgpartman/pg_partman/)
handles maintenance: creating new partitions and dropping old ones.

Partition behavior is configured when the queue is created via
`pgmq.create_partitioned()`. That function takes three parameters:

## Parameters

### `queue_name` (`text`)

Name of the queue. Queue tables are prefixed with `q_` (for example `q_my_queue`).
Archive tables are prefixed with `a_` (for example `a_my_queue`).

### `partition_interval` (`text`)

Interval at which partitions are created. Either a Postgres duration supported by
pg_partman, or an integer:

- **Duration** — partitions by `enqueued_at`. Example: `'daily'` creates a new
  partition each day.
- **Integer** — partitions by `msg_id`. Example: `'100'` creates a new partition
  every 100 messages.

Must agree with `retention_interval` (both time-based or both numeric). Default:
`'10000'`.

For the archive table, an integer interval partitions by `msg_id`; a duration
partitions by `archived_at` (unlike the queue table).

### `retention_interval` (`text`)

How long to retain partitions. Either a duration or an integer:

- **Duration** — drop partitions older than the duration.
- **Integer** — drop partitions with `msg_id` less than
  `max(msg_id) - retention_interval`. Example: if max `msg_id` is `100` and
  retention is `60`, partitions with `msg_id` values less than `40` are dropped.

Must agree with `partition_interval`. Default: `'100000'`.

`retention_interval` does not apply to messages removed with `pgmq.delete()` or
archived with `pgmq.archive()`. Delete removes messages permanently; archive moves
them to the archive table permanently (for example `a_my_queue`).

## Partition maintenance

Automatic maintenance requires settings in `postgresql.conf` (typically under the
Postgres `DATADIR`). Defaults below match PGMQ Docker images.

Changing `shared_preload_libraries` requires a Postgres restart.

`pg_partman_bgw.interval` sets how often pg_partman runs maintenance (new
partitions and dropping partitions outside `retention_interval`). By default,
pg_partman keeps 4 partitions ahead of the active partition.

```text
shared_preload_libraries = 'pg_partman_bgw' # requires restart of Postgres
pg_partman_bgw.interval = 60
pg_partman_bgw.role = 'postgres'
pg_partman_bgw.dbname = 'postgres'
```
