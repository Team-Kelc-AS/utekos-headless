import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  './20260803194441_add_shopify_checkout_observations.sql',
  import.meta.url
)
const declarativeOpsSchemaUrl = new URL(
  '../schemas/40_ops.sql',
  import.meta.url
)
const declarativeRlsSchemaUrl = new URL(
  '../schemas/90_rls.sql',
  import.meta.url
)

test('creates a normalized observed-only store outside canonical and provider tables', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  const tableDefinition = sql.match(
    /create table if not exists ops\.shopify_checkout_observations \([\s\S]*?\n\);/
  )?.[0]

  assert.ok(tableDefinition)
  assert.match(
    tableDefinition,
    /verification_status text not null default 'observed'[\s\S]*verification_status = 'observed'/i
  )
  assert.match(
    tableDefinition,
    /event_name in \([\s\S]*'checkout_shipping_info_submitted'[\s\S]*'payment_info_submitted'[\s\S]*'alert_displayed'/i
  )
  assert.doesNotMatch(
    tableDefinition,
    /\breferences\b|\bforeign key\b|event_ledger|provider_dispatch|outbox/i
  )
})

test('persists explicit Shopify privacy state and strict event shapes', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  for (const flag of [
    'analytics_processing_allowed',
    'marketing_allowed',
    'preferences_processing_allowed',
    'sale_of_data_allowed'
  ]) {
    assert.match(sql, new RegExp(`${flag} boolean not null`, 'i'))
  }

  assert.match(
    sql,
    /event_name in \([\s\S]*'checkout_shipping_info_submitted'[\s\S]*'payment_info_submitted'[\s\S]*checkout_token is not null[\s\S]*item_quantity is not null[\s\S]*alert_type is null/i
  )
  assert.match(
    sql,
    /event_name = 'alert_displayed'[\s\S]*alert_type in \('CHECKOUT_ERROR', 'PAYMENT_ERROR'\)[\s\S]*checkout_token is null[\s\S]*currency_code is null[\s\S]*commerce_value is null[\s\S]*item_quantity is null/i
  )
})

test('stores no raw payload or PII-capable convenience fields', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  const tableDefinition = sql.match(
    /create table if not exists ops\.shopify_checkout_observations \([\s\S]*?\n\);/
  )?.[0]

  assert.ok(tableDefinition)
  assert.doesNotMatch(
    tableDefinition,
    /\bjsonb\b|\braw_payload\b|\bpayload json\b|\bname\b|\bemail\b|\bphone\b|\baddress\b|\burl\b|\bquery_string\b|\breferrer\b|\buser_agent\b|\bcookie\b|\bclick_id\b|\bclient_id\b|\bline_items?\b|\bpayment_method\b|\bgateway\b|\balert_message\b/i
  )
  assert.match(
    sql,
    /Raw payloads, names, email, phone, addresses, URLs, query strings, cookies, click ids, client ids, user agents, line items, payment methods, gateways, alert text and provider data are forbidden/i
  )
})

test('supports replay equality without allowing conflict overwrite', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  assert.match(sql, /idempotency_key text not null unique/i)
  assert.match(
    sql,
    /idempotency_key = concat_ws\([\s\S]*contract_name[\s\S]*schema_version::text[\s\S]*source[\s\S]*event_name[\s\S]*event_id/i
  )
  assert.match(
    sql,
    /payload_sha256 text not null[\s\S]*payload_sha256 ~ '\^\[a-f0-9\]\{64\}\$'/i
  )
  assert.match(
    sql,
    /A matching payload hash is an identical replay; a different hash is an idempotency conflict and must never overwrite the first observation/i
  )
  assert.match(
    sql,
    /observation_count integer not null default 1[\s\S]*observation_count >= 1/i
  )
  assert.match(
    sql,
    /create or replace function ops\.enforce_shopify_checkout_observation_replay\(\)[\s\S]*new\.payload_sha256[\s\S]*old\.payload_sha256[\s\S]*identity and payload are immutable/i
  )
  assert.match(
    sql,
    /new\.observation_count <> old\.observation_count \+ 1[\s\S]*replay counters must advance monotonically/i
  )
  assert.match(
    sql,
    /create trigger enforce_shopify_checkout_observation_replay[\s\S]*before update on ops\.shopify_checkout_observations/i
  )
})

test('keeps the table private and expires observations after thirty days', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  assert.match(
    sql,
    /alter table ops\.shopify_checkout_observations force row level security/i
  )
  assert.match(
    sql,
    /revoke all on table ops\.shopify_checkout_observations[\s\S]*from public, anon, authenticated, service_role/i
  )
  assert.match(
    sql,
    /grant select, insert, update on table ops\.shopify_checkout_observations[\s\S]*to service_role/i
  )
  assert.match(
    sql,
    /observation\.last_observed_at < v_now - interval '30 days'/i
  )
  assert.match(
    sql,
    /ops\.has_active_privacy_retention_exception\([\s\S]*'shopify_checkout_observations'/i
  )
  assert.match(
    sql,
    /jobname = 'purge_expired_shopify_checkout_observations'/i
  )
})

test('keeps declarative schema and access rules aligned with the migration', async () => {
  const [opsSql, rlsSql] = await Promise.all([
    readFile(declarativeOpsSchemaUrl, 'utf8'),
    readFile(declarativeRlsSchemaUrl, 'utf8')
  ])

  assert.match(
    opsSql,
    /create table if not exists ops\.shopify_checkout_observations/i
  )
  assert.match(
    opsSql,
    /create or replace function ops\.purge_expired_shopify_checkout_observations\(\)/i
  )
  assert.match(
    opsSql,
    /create or replace function ops\.enforce_shopify_checkout_observation_replay\(\)/i
  )
  assert.match(
    rlsSql,
    /alter table ops\.shopify_checkout_observations force row level security/i
  )
  assert.match(
    rlsSql,
    /grant select, insert, update on table ops\.shopify_checkout_observations[\s\S]*to service_role/i
  )
})
