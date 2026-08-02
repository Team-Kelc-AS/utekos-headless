import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  './20260801225927_add_page_view_funnel_observations.sql',
  import.meta.url
)
const declarativeOpsSchemaUrl = new URL(
  '../schemas/40_ops.sql',
  import.meta.url
)

test('adds privacy-bounded browser and collector receipt identities', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  assert.match(
    sql,
    /add column if not exists page_view_id uuid/i
  )
  assert.match(
    sql,
    /add column if not exists edge_request_id uuid/i
  )
  assert.match(
    sql,
    /'browser_dispatch',[\s\S]*'collector_received'/i
  )
  assert.match(
    sql,
    /event_name = 'page_view'[\s\S]*page_view_id is not null[\s\S]*edge_request_id is not null/i
  )
  assert.match(
    sql,
    /traffic_classification in \([\s\S]*'human_or_unknown'[\s\S]*'verified_bot'[\s\S]*'automated_bot'[\s\S]*'synthetic'/i
  )
  assert.doesNotMatch(
    sql,
    /add column if not exists (page_url|query_string|fbclid|fbc|fbp|cookie|client_ip|user_agent|raw_payload)/i
  )
})

test('separates browser dispatch, collector receipt and canonical acceptance', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  assert.match(
    sql,
    /browser_page_view_dispatch_receipt_received/i
  )
  assert.match(
    sql,
    /browser_page_view_dispatch_receipt_received_at/i
  )
  assert.match(sql, /collector_page_view_receipt_received/i)
  assert.match(sql, /collector_page_view_receipt_received_at/i)
  assert.match(
    sql,
    /ledger\.occurred_at is not null as canonical_page_view_observed/i
  )
  assert.match(
    sql,
    /observation\.event_id = funnel_identity\.event_id/i
  )
  assert.match(
    sql,
    /observation\.page_view_id = funnel_identity\.page_view_id/i
  )
  assert.match(
    sql,
    /candidate\.event_id::text = funnel_identity\.event_id/i
  )
  assert.match(
    sql,
    /candidate\.payload ->> 'page_view_id' = funnel_identity\.page_view_id::text/i
  )
  assert.match(sql, /max\(candidate\.identity_authority\) desc/i)
  assert.match(sql, /browser_page_view_traffic_classification/i)
})

test('keeps funnel receipts private and limited to thirty days', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  assert.match(
    sql,
    /alter table ops\.tagging_observations force row level security/i
  )
  assert.match(
    sql,
    /revoke all on table ops\.tagging_observations[\s\S]*from public, anon, authenticated, service_role/i
  )
  assert.match(
    sql,
    /observation\.observed_at < v_now - interval '30 days'/i
  )
  assert.match(
    sql,
    /ops\.has_active_privacy_retention_exception/i
  )
  assert.match(
    sql,
    /jobname = 'purge_expired_page_view_funnel_observations'/i
  )
})

test('keeps the declarative schema aligned with retention and stage semantics', async () => {
  const sql = await readFile(declarativeOpsSchemaUrl, 'utf8')

  assert.match(
    sql,
    /create or replace function ops\.purge_expired_page_view_funnel_observations\(\)/i
  )
  assert.match(
    sql,
    /jobname = 'purge_expired_page_view_funnel_observations'/i
  )
  assert.match(
    sql,
    /receipt timestamps are server observation times and do not prove strict wire ordering/i
  )
  assert.match(
    sql,
    /observation\.event_id = funnel_identity\.event_id/i
  )
})
