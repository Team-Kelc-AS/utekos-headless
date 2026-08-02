import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationPath = new URL(
  './20260712102148_meta_high_value_customer_audience.sql',
  import.meta.url
)

test('fresh database migration treats imported customer sources as optional', async () => {
  const sql = await readFile(migrationPath, 'utf8')

  assert.match(
    sql,
    /to_regclass\('marketing\.customer_source_meta_2025_raw'\) is not null[\s\S]*alter table marketing\.customer_source_meta_2025_raw enable row level security/i
  )
  assert.match(
    sql,
    /to_regclass\('marketing\.customer_source_meta_2025'\) is not null[\s\S]*alter table marketing\.customer_source_meta_2025 enable row level security/i
  )
  assert.match(
    sql,
    /to_regclass\('marketing\.customer_identity_links'\) is not null[\s\S]*alter table marketing\.customer_identity_links enable row level security/i
  )
  assert.match(
    sql,
    /to_regclass\('marketing\.meta_customer_audience'\) is not null[\s\S]*comment on view marketing\.meta_customer_audience/i
  )
})

test('refresh exits without imported source prerequisites', async () => {
  const sql = await readFile(migrationPath, 'utf8')

  assert.match(
    sql,
    /if to_regclass\('marketing\.shopify_customers'\) is null[\s\S]*or to_regclass\('marketing\.customer_identity_links'\) is null[\s\S]*or to_regclass\('marketing\.customer_source_meta_2025'\) is null[\s\S]*return 0/i
  )
  assert.match(
    sql,
    /if to_regclass\('marketing\.shopify_customers'\) is not null[\s\S]*and to_regclass\('marketing\.customer_identity_links'\) is not null[\s\S]*and to_regclass\('marketing\.customer_source_meta_2025'\) is not null[\s\S]*perform marketing\.refresh_meta_high_value_customer_audience\(\)/i
  )
})
