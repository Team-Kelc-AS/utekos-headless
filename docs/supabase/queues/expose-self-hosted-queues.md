# Expose queues for local and self-hosted Supabase

Learn how to expose queues when running Supabase with the Supabase CLI or Docker Compose.

By default, local and self-hosted Supabase instances expose only core schemas like
`public` and `graphql_public`. To allow client-side consumers to use your queues,
add the `pgmq_public` schema to the list of exposed schemas.

Before continuing, complete
[Expose queues to client-side consumers](./queues-start.md#expose-queues-to-client-side-consumers)
from the Queues quickstart. That step creates the `pgmq_public` schema, which must
exist before it can be exposed through the API.

> **Note:** You only need to expose the `pgmq_public` schema manually when running
> Supabase locally with the Supabase CLI or self-hosting with Docker Compose.

Upstream:
[Expose Queues for local and self-hosted Supabase](https://supabase.com/docs/guides/queues/expose-self-hosted-queues).

## Expose queues with Supabase CLI

When running Supabase locally with the Supabase CLI, update your project’s
`config.toml`. In the `[api]` section, add `pgmq_public` to the list of schemas:

```toml
[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public", "pgmq_public"]
```

Then restart your local Supabase stack:

```bash
supabase stop && supabase start
```

## Expose queues with Docker Compose

When running Supabase with Docker Compose, locate the `PGRST_DB_SCHEMAS` variable
in your `.env` file and add `pgmq_public`. That environment variable is passed to
the `rest` service in `docker-compose.yml`.

```bash
PGRST_DB_SCHEMAS=public,graphql_public,pgmq_public
```

Restart your containers for the changes to take effect:

```bash
docker compose down
docker compose up -d
```

## Stop exposing queues

If you no longer want to expose the `pgmq_public` schema, remove it from your
configuration:

- **Supabase CLI:** remove `pgmq_public` from the `[api]` schemas list in `config.toml`
- **Docker Compose:** remove `pgmq_public` from `PGRST_DB_SCHEMAS` in `.env`

After updating configuration, restart your containers for the changes to take effect.
