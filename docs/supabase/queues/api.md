# API

When you create a queue in Supabase, you can create helper database functions in
the `pgmq_public` schema. That schema exposes operations to manage queue messages
for client-side consumers, but does not expose functions for creating or dropping
queues.

Database functions in `pgmq_public` can be exposed via the Supabase Data API so
client-side consumers can call them. See the [Quickstart](./queues-start.md) for
an example.

Upstream: [Supabase Queues API](https://supabase.com/docs/guides/queues/api).

## `pgmq_public.pop(queue_name)`

Retrieves the next available message and deletes it from the specified queue.

| Parameter | Type | Description |
| --- | --- | --- |
| `queue_name` | `text` | Queue name |

## `pgmq_public.send(queue_name, message, sleep_seconds)`

Adds a message to the specified queue, optionally delaying its visibility to all
consumers by a number of seconds.

| Parameter | Type | Description |
| --- | --- | --- |
| `queue_name` | `text` | Queue name |
| `message` | `jsonb` | Message payload to send |
| `sleep_seconds` | `integer` (optional) | Delay message visibility by this many seconds. Defaults to `0` |

## `pgmq_public.send_batch(queue_name, messages, sleep_seconds)`

Adds a batch of messages to the specified queue, optionally delaying their
availability to all consumers by a number of seconds.

| Parameter | Type | Description |
| --- | --- | --- |
| `queue_name` | `text` | Queue name |
| `messages` | `jsonb[]` | Array of message payloads to send |
| `sleep_seconds` | `integer` (optional) | Delay messages visibility by this many seconds. Defaults to `0` |

## `pgmq_public.archive(queue_name, message_id)`

Archives a message by moving it from the queue table to the queue’s archive table.

| Parameter | Type | Description |
| --- | --- | --- |
| `queue_name` | `text` | Queue name |
| `message_id` | `bigint` | ID of the message to archive |

## `pgmq_public.delete(queue_name, message_id)`

Permanently deletes a message from the specified queue.

| Parameter | Type | Description |
| --- | --- | --- |
| `queue_name` | `text` | Queue name |
| `message_id` | `bigint` | ID of the message to delete |

## `pgmq_public.read(queue_name, sleep_seconds, n)`

Reads up to `n` messages from the specified queue with an optional visibility
timeout (`sleep_seconds`).

| Parameter | Type | Description |
| --- | --- | --- |
| `queue_name` | `text` | Queue name |
| `sleep_seconds` | `integer` | Visibility timeout in seconds |
| `n` | `integer` | Maximum number of messages to read |
