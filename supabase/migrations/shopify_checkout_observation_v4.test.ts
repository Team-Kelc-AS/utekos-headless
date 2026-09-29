import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const replacementConstraints = [
  'shopify_checkout_observations_schema_version',
  'shopify_checkout_observations_event_name',
  'shopify_checkout_observations_shape'
] as const

test('v4 migration validates every replacement before removing the active guard', async () => {
  const sql = await readFile(
    new URL(
      './20260929132736_allow_shopify_checkout_observation_v4.sql',
      import.meta.url
    ),
    'utf8'
  )

  for (const constraint of replacementConstraints) {
    const replacement = `${constraint}_v4_check`
    const active = `${constraint}_check`
    const addIndex = sql.indexOf(`add constraint ${replacement}`)
    const validateIndex = sql.indexOf(
      `validate constraint\n    ${replacement}`
    )
    const dropIndex = sql.indexOf(`drop constraint ${active}`)
    const renameIndex = sql.indexOf(
      `rename constraint ${replacement}`
    )

    assert.notEqual(
      addIndex,
      -1,
      `missing replacement for ${active}`
    )
    assert.notEqual(
      validateIndex,
      -1,
      `missing validation for ${active}`
    )
    assert.notEqual(
      dropIndex,
      -1,
      `missing active drop for ${active}`
    )
    assert.notEqual(
      renameIndex,
      -1,
      `missing canonical rename for ${active}`
    )
    assert.ok(addIndex < validateIndex)
    assert.ok(validateIndex < dropIndex)
    assert.ok(dropIndex < renameIndex)
  }

  assert.match(
    sql,
    /check \(schema_version in \(1, 2, 3, 4\)\) not valid/i
  )
  assert.match(
    sql,
    /event_name = 'checkout_completed'[\s\S]*?schema_version = 4[\s\S]*?item_quantity is not null[\s\S]*?item_quantity between 1 and 1000000/
  )
  assert.doesNotMatch(
    sql,
    /drop table|truncate|delete from|disable|grant|revoke/i
  )
})

test('v4 migration and declarative schema enforce the same versioned event shapes', async () => {
  const [migration, schema] = await Promise.all([
    readFile(
      new URL(
        './20260929132736_allow_shopify_checkout_observation_v4.sql',
        import.meta.url
      ),
      'utf8'
    ),
    readFile(
      new URL('../schemas/40_ops.sql', import.meta.url),
      'utf8'
    )
  ])

  const table = schema.match(
    /create table if not exists ops\.shopify_checkout_observations \([\s\S]*?\n\);/
  )?.[0]
  assert.ok(table)

  for (const sql of [migration, table]) {
    assert.match(
      sql,
      /event_name in \([\s\S]*?'checkout_shipping_info_submitted',[\s\S]*?'payment_info_submitted'[\s\S]*?\)[\s\S]*?and schema_version in \(1, 2, 3\)/
    )
    assert.match(
      sql,
      /event_name = 'checkout_completed'[\s\S]*?and schema_version = 3[\s\S]*?and item_quantity is not null/
    )
    assert.match(
      sql,
      /event_name = 'checkout_completed'[\s\S]*?and schema_version = 4[\s\S]*?and currency_code is not null[\s\S]*?and commerce_value is not null[\s\S]*?and item_quantity is not null[\s\S]*?and item_quantity between 1 and 1000000/
    )
    assert.match(
      sql,
      /event_name = 'alert_displayed'[\s\S]*?and schema_version = 1[\s\S]*?'CONTACT_ERROR'[\s\S]*?'DELIVERY_ERROR'/
    )
  }
})
