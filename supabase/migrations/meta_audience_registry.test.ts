import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

test('audience registry is private, versioned and separates receipts from delivery', async () => {
  const sql = await readFile(
    new URL(
      './20260906152000_meta_audience_registry.sql',
      import.meta.url
    ),
    'utf8'
  )
  for (const table of [
    'meta_audience_registry_runs',
    'meta_audience_segment_snapshots',
    'meta_audience_snapshots',
    'meta_audience_upload_batches'
  ]) {
    assert.ok(
      sql.includes(
        `alter table marketing.${table} enable row level security;`
      )
    )
    assert.ok(
      sql.includes(
        `revoke all on table marketing.${table} from public, anon, authenticated, service_role;`
      )
    )
  }
  assert.match(sql, /batch_size between 1 and 9999/)
  assert.match(
    sql,
    /'prepared', 'in_flight', 'accepted', 'uncertain', 'rejected'/
  )
  assert.doesNotMatch(
    sql,
    /\b(phone|email|first_name|last_name|raw_payload|access_token)\b/i
  )
  assert.match(sql, /'building', 'complete', 'failed'/)
  assert.doesNotMatch(sql, /drop |truncate |delete from /i)
})
