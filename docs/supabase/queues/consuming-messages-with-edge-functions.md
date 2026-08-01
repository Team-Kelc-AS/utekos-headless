# Consuming Supabase Queue messages with Edge Functions

Learn how to consume Supabase Queue messages server-side with a Supabase Edge Function.

This guide shows how to read and process queue messages server-side. See the
[Queues API reference](./api.md) for API details.

Upstream:
[Consuming Messages with Edge Functions](https://supabase.com/docs/guides/queues/consuming-messages-with-edge-functions).

## Concepts

Supabase Queues is a pull-based message queue with three main components: queues,
messages, and queue types. You should already be familiar with the
[Queues Quickstart](./queues-start.md).

## Consuming messages in an Edge Function

This Edge Function reads 5 messages from the queue, processes each of them, and
deletes each message when done.

```ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = "supabaseURL";
const supabaseKey = "supabaseKey";

const supabase = createClient(supabaseUrl, supabaseKey);
const queueName = "your_queue_name";

interface QueueMessage {
  msg_id: bigint;
  read_ct: number;
  vt: string;
  enqueued_at: string;
  message: unknown;
}

async function processMessage(message: QueueMessage) {
  // Do whatever logic you need with the message content.

  const { error: deleteError } = await supabase.schema("pgmq_public").rpc("delete", {
    queue_name: queueName,
    msg_id: message.msg_id,
  });

  if (deleteError) {
    console.error(`Failed to delete message ${message.msg_id}:`, deleteError);
  } else {
    console.log(`Message ${message.msg_id} deleted from queue`);
  }
}

Deno.serve(async (_req) => {
  const { data: messages, error } = await supabase.schema("pgmq_public").rpc("read", {
    queue_name: queueName,
    sleep_seconds: 0, // Don't wait if queue is empty
    n: 5, // Read 5 messages off the queue
  });

  if (error) {
    console.error(`Error reading from ${queueName} queue:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!messages || messages.length === 0) {
    console.log("No messages in queue");
    return new Response(JSON.stringify({ message: "No messages in queue" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`Found ${messages.length} messages to process`);

  for (const message of messages) {
    try {
      await processMessage(message as QueueMessage);
    } catch (err) {
      console.error(`Error processing message ${message.msg_id}:`, err);
    }
  }

  return new Response(
    JSON.stringify({
      message: `Processing ${messages.length} messages`,
      count: messages.length,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
});
```

Every time this Edge Function runs it:

1. Reads up to 5 messages from the queue
2. Calls `processMessage` for each message
3. Deletes the message at the end of `processMessage`
4. If `processMessage` throws, the error is logged and the message stays in the
   queue so the next run can read it again

You can run this on a schedule with
[Supabase Cron](https://supabase.com/docs/guides/cron), or invoke it on demand with
[`supabase.functions.invoke`](https://supabase.com/docs/guides/functions/quickstart-dashboard#usage).
