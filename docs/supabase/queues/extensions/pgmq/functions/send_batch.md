# send_batch

Part of the [PGMQ SQL functions](./index.md) reference.

Send 1 or more messages to a queue with optional headers and delay.

**Signatures:**

```text
pgmq.send_batch(queue_name text, msgs jsonb[])
pgmq.send_batch(queue_name text, msgs jsonb[], headers jsonb[])
pgmq.send_batch(queue_name text, msgs jsonb[], delay integer)
pgmq.send_batch(queue_name text, msgs jsonb[], delay timestamp with time zone)
pgmq.send_batch(queue_name text, msgs jsonb[], headers jsonb[], delay integer)
pgmq.send_batch(queue_name text, msgs jsonb[], headers jsonb[], delay timestamp with time zone)

RETURNS SETOF bigint
```

**Parameters:**

| Parameter      | Type | Description     |
| :---        |    :----   |          :--- |
| queue_name      | text       | The name of the queue   |
| msgs   | jsonb[]       | Array of messages to send to the queue      |
| headers   | jsonb[]       | Array of headers for each message (must match msgs length, or can be omitted)      |
| delay   | integer        | Time in seconds before the messages become visible      |
| delay   | timestamp with time zone        | Timestamp when the messages become visible      |

**Returns:** The IDs of the messages that were added to the queue.

**Validation:** When `headers` is provided (not NULL), its array length must exactly match the length of `msgs`. This includes empty arrays - an empty headers array (e.g., `ARRAY[]::jsonb[]`) will fail validation if `msgs` is not empty. To send messages without headers, either omit the `headers` parameter or pass NULL.

Examples:

```sql
-- Send multiple messages
select * from pgmq.send_batch('my_queue',
    ARRAY[
        '{"hello": "world_0"}',
        '{"hello": "world_1"}'
    ]::jsonb[]
);
 send_batch
------------
          1
          2

-- Send with headers for each message
select * from pgmq.send_batch('my_queue',
    ARRAY['{"hello": "world_0"}', '{"hello": "world_1"}']::jsonb[],
    ARRAY['{"trace_id": "abc"}', '{"trace_id": "def"}']::jsonb[]
);
 send_batch
------------
          3
          4

-- Messages with a delay of 5 seconds
select * from pgmq.send_batch('my_queue',
    ARRAY[
        '{"hello": "world_0"}',
        '{"hello": "world_1"}'
    ]::jsonb[],
    5
);
 send_batch
------------
          5
          6

-- Messages readable from tomorrow
select * from pgmq.send_batch('my_queue',
    ARRAY[
        '{"hello": "world_0"}',
        '{"hello": "world_1"}'
    ]::jsonb[],
    CURRENT_TIMESTAMP + INTERVAL '1 day'
);
 send_batch
------------
          7
          8
```
