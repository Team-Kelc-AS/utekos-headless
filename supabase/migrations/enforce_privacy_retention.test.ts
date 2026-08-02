import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  './20260726034756_enforce_privacy_retention.sql',
  import.meta.url
)

test('privacy retention migration contains the approved boundaries', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  for (const boundary of [
    'interval \'30 days\'',
    'interval \'90 days\'',
    'interval \'12 months\'',
    'interval \'14 months\'',
    'interval \'3 years\'',
    'interval \'5 years\''
  ]) {
    assert.equal(sql.includes(boundary), true)
  }
})

test('privacy purge is protected and scheduled idempotently', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  assert.match(sql, /security definer\s+set search_path = ''/i)
  assert.match(
    sql,
    /revoke execute on function ops\.purge_expired_privacy_data\(\)[\s\S]*from public, anon, authenticated/i
  )
  assert.match(sql, /where jobname = 'purge_expired_privacy_data'/)
  assert.doesNotMatch(sql, /cron schedule skipped/i)
  assert.match(sql, /ops\.privacy_retention_exceptions/)
  assert.match(
    sql,
    /revoke select on table marketing\.meta_high_value_customer_audience_export\s+from service_role/i
  )
  assert.match(
    sql,
    /to_regclass\('marketing\.meta_customer_audience'\) is not null[\s\S]*revoke select on table marketing\.meta_customer_audience\s+from service_role/i
  )
})

test('anonymous aggregate excludes direct and pseudonymous dimensions', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  const tableDefinition = sql.match(
    /create table if not exists analytics\.daily_privacy_safe_event_metrics \([\s\S]*?\n\);/
  )?.[0]

  assert.ok(tableDefinition)
  assert.doesNotMatch(
    tableDefinition,
    /email|phone|anonymous_id|external_id|source_url|click|payload|first_occurred_at|last_occurred_at/i
  )
  assert.match(sql, /else 'other'\s+end as event_name/i)
  assert.match(
    sql,
    /from marketing\.event_ledger ledger[\s\S]*not exists \([\s\S]*canonical_event_source_evidence evidence[\s\S]*canonical_idempotency_key = ledger\.idempotency_key[\s\S]*union all/i
  )
})

test('historical audience sources have explicit privacy-first expiry', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  assert.match(
    sql,
    /customer_source_meta_2025_raw[\s\S]*interval '30 days'/
  )
  assert.match(
    sql,
    /customer_identity_links[\s\S]*interval '14 months'/
  )
  assert.match(
    sql,
    /customer_source_meta_2025[\s\S]*interval '14 months'/
  )
})
