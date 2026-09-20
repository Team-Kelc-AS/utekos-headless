import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('v3 migration validates the replacement before removing the v2 constraint', async () => {
  const sql = await readFile(
    new URL(
      './20260920081500_allow_shopify_checkout_observation_v3.sql',
      import.meta.url
    ),
    'utf8'
  )
  assert.match(
    sql,
    /check \(schema_version in \(1, 2, 3\)\) not valid/i
  )
  assert.ok(
    sql.indexOf('validate constraint') <
      sql.indexOf('drop constraint')
  )
  assert.match(
    sql,
    /rename constraint shopify_checkout_observations_schema_version_v3_check\s+to shopify_checkout_observations_schema_version_check/
  )
  assert.doesNotMatch(
    sql,
    /drop table|truncate|delete from|disable|grant|revoke/i
  )
})

test('declarative checkout observation schema supports exactly the application versions', async () => {
  const sql = await readFile(
    new URL('../schemas/40_ops.sql', import.meta.url),
    'utf8'
  )
  const table = sql.match(
    /create table if not exists ops\.shopify_checkout_observations \([\s\S]*?\n\);/
  )?.[0]
  assert.ok(table)
  assert.match(table, /check \(schema_version in \(1, 2, 3\)\)/)
})
