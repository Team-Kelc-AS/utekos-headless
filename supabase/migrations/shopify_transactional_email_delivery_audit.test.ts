import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  './20260910123000_shopify_transactional_email_delivery_audit.sql',
  import.meta.url
)

const indexMigrationUrl = new URL(
  './20260910123001_index_shopify_transactional_email_resend_events_fk.sql',
  import.meta.url
)

test('transactional email audit is PII-free and service-only', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  assert.match(
    sql,
    /create table ops\.shopify_transactional_email_deliveries[\s\S]*create table ops\.shopify_transactional_email_resend_events/u
  )
  assert.doesNotMatch(
    sql,
    /^\s*(recipient|customer_email|status_page_url|order_status_url|shipping_address|billing_address)\s+[a-z]/mu
  )
  assert.match(
    sql,
    /alter table ops\.shopify_transactional_email_deliveries[\s\S]*enable row level security/u
  )
  assert.match(
    sql,
    /revoke all[\s\S]*shopify_transactional_email_deliveries[\s\S]*from public, anon, authenticated/u
  )
  assert.match(
    sql,
    /grant select, insert, update, delete[\s\S]*shopify_transactional_email_deliveries[\s\S]*to service_role/u
  )
})

test('transactional audit enforces idempotency and bounded retention', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  assert.match(sql, /idempotency_key text primary key/u)
  assert.match(sql, /resend_email_id text not null unique/u)
  assert.match(
    sql,
    /check \(expires_at > sent_at\)/u
  )
  assert.match(
    sql,
    /security invoker[\s\S]*set search_path = pg_catalog/u
  )
  assert.match(
    sql,
    /revoke all[\s\S]*purge_expired_shopify_transactional_email_audit[\s\S]*from public, anon, authenticated/u
  )
})

test('transactional audit indexes its cascading foreign key', async () => {
  const sql = await readFile(indexMigrationUrl, 'utf8')

  assert.match(
    sql,
    /create index shopify_transactional_email_resend_events_idempotency_idx[\s\S]*on ops\.shopify_transactional_email_resend_events \(idempotency_key\)/u
  )
})
