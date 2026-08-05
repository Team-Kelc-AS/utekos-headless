import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  './20260805094715_optimize_provider_dispatch_health.sql',
  import.meta.url
)

test('provider health uses a private lightweight edge read model', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  const viewDefinition = sql.match(
    /create or replace view ops\.meta_landing_edge_health[\s\S]*?\ncomment on view ops\.meta_landing_edge_health/
  )?.[0]

  assert.ok(viewDefinition)
  assert.match(viewDefinition, /with \(security_invoker = true\)/i)
  assert.match(
    viewDefinition,
    /'request:' \|\| edge\.request_id/i
  )
  assert.match(
    viewDefinition,
    /partition by edge\.request_partition_key/i
  )
  assert.match(
    viewDefinition,
    /max\(edge\.edge_request_id::text\)[\s\S]*resolved_edge_request_id/i
  )
  assert.match(
    viewDefinition,
    /consent\.edge_request_id = edge\.resolved_edge_request_id/i
  )
  assert.match(
    viewDefinition,
    /partition by edge\.project_id, edge\.fbclid_hmac/i
  )
  assert.doesNotMatch(
    viewDefinition,
    /marketing\.event_ledger|ops\.tagging_observations|ops\.provider_dispatch_attempts|ops\.vercel_trace_observations/i
  )
  assert.doesNotMatch(
    viewDefinition,
    /\brequest_id\b[\s\S]*as request_id|\bedge_request_id\b[\s\S]*as edge_request_id|\bfbclid_hmac\b[\s\S]*as fbclid_hmac/i
  )
  assert.match(
    sql,
    /revoke all on table ops\.meta_landing_edge_health[\s\S]*from public, anon, authenticated, service_role/i
  )
  assert.match(
    sql,
    /grant select on table ops\.meta_landing_edge_health to service_role/i
  )
})
