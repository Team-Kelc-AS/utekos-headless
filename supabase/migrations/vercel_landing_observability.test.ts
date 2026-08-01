import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  './20260801062712_add_vercel_landing_observability.sql',
  import.meta.url
)

test('Vercel observations have a narrow privacy-safe schema and idempotency key', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  const tableDefinition = sql.match(
    /create table if not exists ops\.vercel_edge_request_observations \([\s\S]*?\n\);/
  )?.[0]

  assert.ok(tableDefinition)
  assert.match(
    tableDefinition,
    /vercel_log_id text primary key/i
  )
  assert.match(tableDefinition, /edge_request_id uuid/i)
  assert.match(tableDefinition, /route_pathname text not null/i)
  assert.match(
    tableDefinition,
    /fbclid_present boolean not null/i
  )
  assert.match(tableDefinition, /fbclid_hmac text/i)
  assert.doesNotMatch(
    tableDefinition,
    /\bclient_ip\b|\buser_agent\b|\braw_query\b|\bquery_string\b|\braw_fbclid\b|\bmessage text\b|\bdestination text\b/i
  )
  assert.match(
    tableDefinition,
    /position\('\?' in route_pathname\) = 0[\s\S]*position\('#' in route_pathname\) = 0/i
  )
})

test('landing consent stores only terminal decisions without a drain-order FK', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  const tableDefinition = sql.match(
    /create table if not exists ops\.landing_consent_observations \([\s\S]*?\n\);/
  )?.[0]

  assert.ok(tableDefinition)
  assert.match(
    tableDefinition,
    /edge_request_id uuid primary key/i
  )
  assert.match(tableDefinition, /page_view_id uuid not null/i)
  assert.match(
    tableDefinition,
    /decision in \('granted', 'denied', 'partial'\)/i
  )
  assert.match(tableDefinition, /source = 'cookiebot'/i)
  assert.match(
    tableDefinition,
    /observation_count smallint not null default 1[\s\S]*between 1 and 4/i
  )
  assert.match(
    tableDefinition,
    /'human_or_unknown',[\s\S]*'verified_bot',[\s\S]*'automated_bot',[\s\S]*'synthetic'/i
  )
  assert.doesNotMatch(
    tableDefinition,
    /\breferences\b|\bforeign key\b|\bpending\b/i
  )
})

test('all observation tables are private and expire after thirty days', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  for (const table of [
    'vercel_edge_request_observations',
    'vercel_trace_observations',
    'landing_consent_observations'
  ]) {
    assert.match(
      sql,
      new RegExp(
        `alter table ops\\.${table} force row level security`,
        'i'
      )
    )
    assert.match(
      sql,
      new RegExp(
        `revoke all on table ops\\.${table}[\\s\\S]*from public, anon, authenticated, service_role`,
        'i'
      )
    )
    assert.match(
      sql,
      new RegExp(
        `delete from ops\\.${table}[\\s\\S]*interval '30 days'`,
        'i'
      )
    )
  }

  assert.match(sql, /security definer\s+set search_path = ''/i)
  assert.match(
    sql,
    /jobname = 'purge_expired_landing_observations'/i
  )
  assert.match(
    sql,
    /pg_cron cron\.job is required for landing observation retention/i
  )
  assert.match(
    sql,
    /ops\.has_active_privacy_retention_exception/i
  )
})

test('trace observations retain only the bounded server trace envelope', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  const tableDefinition = sql.match(
    /create table if not exists ops\.vercel_trace_observations \([\s\S]*?\n\);/
  )?.[0]

  assert.ok(tableDefinition)
  assert.match(tableDefinition, /trace_id text primary key/i)
  assert.match(
    tableDefinition,
    /start_time_unix_nano numeric\(20, 0\) not null/i
  )
  assert.match(
    tableDefinition,
    /end_time_unix_nano numeric\(20, 0\) not null/i
  )
  assert.match(
    tableDefinition,
    /duration_ms numeric\(20, 6\) not null/i
  )
  assert.doesNotMatch(
    tableDefinition,
    /\bspan_id\b|\bspan_name\b|\battributes\b|\buser_agent\b|\bclient_ip\b|\burl\b/i
  )
})

test('security-invoker read model propagates correlation within one Vercel request', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  const viewDefinition = sql.match(
    /create or replace view ops\.meta_landing_observability[\s\S]*?\ncomment on view ops\.meta_landing_observability/
  )?.[0]

  assert.ok(viewDefinition)
  const projectedColumns = viewDefinition.match(
    /select\n  timezone\('UTC',[\s\S]*?\nfrom ranked_edge edge/
  )?.[0]
  assert.ok(projectedColumns)
  assert.match(
    viewDefinition,
    /with \(security_invoker = true\)/i
  )
  assert.match(
    viewDefinition,
    /partition by edge\.request_partition_key/i
  )
  assert.match(
    viewDefinition,
    /directly_linked_edge[\s\S]*bridged_edge[\s\S]*canonical_edge_request_id/i
  )
  assert.match(
    viewDefinition,
    /canonical_request_id[\s\S]*canonical_vercel_id[\s\S]*canonical_trace_id/i
  )
  assert.match(
    viewDefinition,
    /trace\.trace_id = edge\.correlated_trace_id/i
  )
  assert.match(
    viewDefinition,
    /consent\.edge_request_id = edge\.correlated_edge_request_id/i
  )
  assert.match(
    viewDefinition,
    /candidate\.payload ->> 'edge_request_id' = edge\.correlated_edge_request_id::text/i
  )
  assert.match(viewDefinition, /is_primary_request_observation/i)
  assert.match(
    viewDefinition,
    /fbclid_document_observation_rank[\s\S]*is_first_fbclid_observation/i
  )
  assert.match(
    viewDefinition,
    /partition by[\s\S]*edge\.project_id[\s\S]*'fbclid:' \|\| edge\.fbclid_hmac/i
  )
  assert.doesNotMatch(
    projectedColumns,
    /edge\.fbclid_hmac|edge\.request_id|edge\.trace_id|edge\.edge_request_id|candidate\.payload/i
  )
})
