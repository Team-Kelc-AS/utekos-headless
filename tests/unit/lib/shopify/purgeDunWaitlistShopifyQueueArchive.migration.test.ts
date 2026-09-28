import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const migrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../supabase/migrations/20260807181100_purge_shopify_dun_waitlist_pgmq_archive.sql'
)

test('archive retention migration never targets the active queue table', () => {
  const sql = readFileSync(migrationPath, 'utf8')

  assert.match(sql, /pgmq\.a_shopify_dun_waitlist_sync/)
  assert.match(sql, /archived_at/)
  assert.match(sql, /Never touch the active queue/)
  assert.doesNotMatch(sql, /delete from pgmq\.q_shopify_dun_waitlist_sync/i)
  assert.doesNotMatch(sql, /pgmq\.purge_queue/i)
  assert.match(sql, /revoke execute[\s\S]*from public, anon, authenticated/)
  assert.match(sql, /cron\.schedule/)
})
