import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const migration = readFileSync(
  new URL(
    './20260823214252_add_provisional_page_view_capture.sql',
    import.meta.url
  ),
  'utf8'
)

test('provisional page views are private and expire within 24 hours', () => {
  assert.match(
    migration,
    /create table if not exists marketing\.provisional_page_view_captures/i
  )
  assert.match(
    migration,
    /force row level security/i
  )
  assert.match(
    migration,
    /expires_at[\s\S]*interval '24 hours'/i
  )
  assert.match(
    migration,
    /purge_expired_provisional_page_view_captures/i
  )
})

test('the provisional table cannot create provider dispatches', () => {
  assert.doesNotMatch(
    migration,
    /insert into ops\.provider_dispatch_attempts/i
  )
})
