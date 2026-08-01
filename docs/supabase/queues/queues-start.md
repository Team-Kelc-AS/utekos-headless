# Quickstart

Learn how to use Supabase Queues to add and read messages.

This guide introduces Supabase Queues via the Dashboard and the official client
library. See the [Queues API reference](./api.md) for API details.

Upstream: [Supabase Queues Quickstart](https://supabase.com/docs/guides/queues/quickstart).

## Concepts

Supabase Queues is a pull-based message queue with three main components: queues,
messages, and queue types.

### Pull-based queue

A pull-based queue stores messages until consumers fetch them when ready to
process — similar to refreshing a page for the latest updates. Supabase Queues
process messages in First-In-First-Out (FIFO) order without priority levels.

### Message

A message in a queue is a JSON object stored until a consumer explicitly processes
and removes it — like a task on a to-do list.

### Queue types

Supabase Queues offers these queue types:

- **Basic queue** — durable queue that stores messages in a logged table
- **Unlogged queue** — transient queue that stores messages in an unlogged table
  for better performance, with possible message loss

## Create queues

Navigate to the
[Supabase Queues](https://supabase.com/dashboard/project/_/integrations/queues/overview)
Postgres module under **Integrations** in the Dashboard and enable the `pgmq`
extension.

> **Note:** The `pgmq` extension is available in Postgres version `15.6.1.143` or later.

![Supabase Dashboard Integrations page, showing the Queues Postgres Module](https://supabase.com/docs/img/queues-quickstart-install-dark.png)

On the [Queues page](https://supabase.com/dashboard/project/_/integrations/queues/queues):

1. Click **Create queue**
2. Name your queue
   > Queue names must be lowercase. Hyphens and underscores are allowed.
3. Select your [queue type](#queue-types)
4. Leave Row Level Security (RLS) enabled unless you have a specific reason not to.
   With RLS enabled, you do not need additional RLS on the queue tables.

![Create a Queue from the Supabase Dashboard](https://supabase.com/docs/img/queues-quickstart-create-dark.png)

> **Note:** Every new queue creates two tables in the `pgmq` schema:
> `pgmq.q_<queue_name>` for active messages and `pgmq.a_<queue_name>` for archived
> messages.

A **basic queue** creates both tables as logged tables.

An **unlogged queue** creates `pgmq.q_<queue_name>` as an unlogged table for better
performance (less durability). The archive table `pgmq.a_<queue_name>` remains
logged so archived messages stay durable.

## Expose queues to client-side consumers

Queues are not exposed over the Supabase Data API by default and are only
accessible via Postgres clients.

You can grant client-side access by enabling the Data API and permissions for the
Queues API: database functions in the `pgmq_public` schema that wrap a subset of
`pgmq` functions.

This prevents direct access to the `pgmq` schema and its tables (RLS is not enabled
by default on those tables) and database functions.

In the Dashboard, open
[Queues → Settings](https://supabase.com/dashboard/project/_/integrations/queues/settings)
and enable **Expose Queues via PostgREST**. Supabase then creates and exposes the
`pgmq_public` schema with wrappers around a subset of `pgmq` functions.

For local and self-hosted setups, also see
[Expose queues for local and self-hosted Supabase](./expose-self-hosted-queues.md).

### Enable RLS on `pgmq` tables

If you expose queues via the Data API, enable Row Level Security on all queue
tables (tables in the `pgmq` schema that begin with `q_`).

Add an RLS policy for each queue your client-side consumers should use via
**Add RLS Policy** on the
[queue overview page](https://supabase.com/dashboard/project/_/integrations/queues/queues).

### Grant permissions to `pgmq_public` functions

In addition to RLS on queue tables, grant the correct permissions on
`pgmq_public` functions for each Data API role.

| Operations | Permissions required |
| --- | --- |
| `send`, `send_batch` | `SELECT`, `INSERT` |
| `read`, `pop` | `SELECT`, `UPDATE` |
| `archive`, `delete` | `SELECT`, `DELETE` |

Manage queue permissions via the Queue Settings cog on the
[queue overview page](https://supabase.com/dashboard/project/_/integrations/queues/queues).

![Queue Settings button on the Queues overview page](https://supabase.com/docs/img/queues-quickstart-queue-settings-dark.png)

Then enable the required role permissions. Example:

| Role | Select | Insert | Update | Delete |
| --- | --- | --- | --- | --- |
| `anon` | | | | |
| `authenticated` | enabled | enabled | enabled | enabled |
| `postgres` | enabled | enabled | enabled | enabled |
| `service_role` | enabled | enabled | enabled | enabled |

> **Caution:** Never expose the `postgres` or `service_role` roles client-side.

### Enqueueing and dequeueing messages

Once the queue exists, you can enqueue and dequeue messages.

```tsx
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "supabaseURL";
const supabaseKey = "supabaseKey";

const supabase = createClient(supabaseUrl, supabaseKey);

const QueuesTest: React.FC = () => {
  const sendToQueue = async () => {
    const result = await supabase.schema("pgmq_public").rpc("send", {
      queue_name: "foo",
      message: { hello: "world" },
      sleep_seconds: 30,
    });
    console.log(result);
  };

  const popFromQueue = async () => {
    const result = await supabase.schema("pgmq_public").rpc("pop", {
      queue_name: "foo",
    });
    console.log(result);
  };

  return (
    <div className="p-6">
      <h2 className="mb-4 text-2xl font-bold">Queue Test Component</h2>
      <button
        type="button"
        onClick={sendToQueue}
        className="mr-4 rounded-sm bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Add Message
      </button>
      <button
        type="button"
        onClick={popFromQueue}
        className="rounded-sm bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Pop Message
      </button>
    </div>
  );
};

export default QueuesTest;
```
