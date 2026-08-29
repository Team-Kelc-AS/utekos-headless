import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  './20260829181455_customer_assistant_feedback.sql',
  import.meta.url
)

test('anonymous assistant feedback is minimal, private and automatically expired', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  assert.match(sql, /create table if not exists ops\.customer_assistant_feedback/u)
  assert.match(sql, /response_fingerprint text not null unique/u)
  assert.match(sql, /rating text not null/u)
  assert.doesNotMatch(
    sql,
    /session_id|message_body|email|phone|ip_address/u
  )
  assert.match(sql, /force row level security/u)
  assert.match(sql, /from public, anon, authenticated, service_role/u)
  assert.match(sql, /grant select, insert, update, delete/u)
  assert.match(sql, /purge_expired_customer_assistant_feedback/u)
  assert.match(sql, /interval '30 days'/u)
})
