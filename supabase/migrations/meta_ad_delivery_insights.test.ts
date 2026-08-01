import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  './20260801062912_add_meta_ad_delivery_insights.sql',
  import.meta.url
)

test('Meta delivery migration separates every supported daily grain', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  for (const breakdown of [
    'overall',
    'publisher_platform',
    'platform_position',
    'device_platform',
    'impression_device'
  ]) {
    assert.match(sql, new RegExp(`'${breakdown}'`))
  }

  assert.match(
    sql,
    /unique \(\s*account_id,\s*ad_id,\s*insight_date,\s*breakdown_kind,\s*dimension_key\s*\)/i
  )
  assert.match(sql, /metric_availability jsonb not null/i)
  assert.match(
    sql,
    /dimension_key = 'platform_position:' \|\| publisher_platform \|\| ':' \|\| platform_position/i
  )
  assert.doesNotMatch(sql, /raw_payload|access_token/i)
})

test('Meta delivery table is private and has enforced retention', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  assert.match(
    sql,
    /alter table marketing\.meta_ad_delivery_insights enable row level security/i
  )
  assert.match(
    sql,
    /revoke all on table marketing\.meta_ad_delivery_insights\s+from public, anon, authenticated, service_role/i
  )
  assert.match(sql, /security definer\s+set search_path = ''/i)
  assert.match(sql, /interval '14 months'/i)
  assert.match(
    sql,
    /ops\.has_active_privacy_retention_exception/i
  )
  assert.match(
    sql,
    /where jobname = 'purge_expired_meta_ad_delivery_insights'/i
  )
  assert.match(
    sql,
    /pg_cron cron\.job is required for Meta delivery retention/i
  )
})
