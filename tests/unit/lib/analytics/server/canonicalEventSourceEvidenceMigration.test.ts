import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  '../../../../supabase/migrations/20260722001500_add_canonical_event_source_evidence.sql',
  import.meta.url
)
const marketingSchemaUrl = new URL(
  '../../../../supabase/schemas/20_marketing.sql',
  import.meta.url
)
const rlsSchemaUrl = new URL(
  '../../../../supabase/schemas/90_rls.sql',
  import.meta.url
)

const requiredColumns = [
  'canonical_event_id',
  'canonical_event_name',
  'canonical_idempotency_key',
  'observation_key',
  'source_system',
  'source_method',
  'source_object_type',
  'source_object_id',
  'source_topic',
  'source_delivery_id',
  'source_event_id',
  'source_api_version',
  'source_triggered_at',
  'source_observed_at'
]

test('migration and declarative schema define backward-compatible source evidence', async () => {
  const [migration, marketingSchema, rlsSchema] =
    await Promise.all([
      readFile(migrationUrl, 'utf8'),
      readFile(marketingSchemaUrl, 'utf8'),
      readFile(rlsSchemaUrl, 'utf8')
    ])

  for (const source of [migration, marketingSchema]) {
    assert.match(
      source,
      /create table if not exists marketing\.canonical_event_source_evidence/
    )
    for (const column of requiredColumns) {
      assert.match(source, new RegExp(`\\b${column}\\b`), column)
    }
  }

  assert.match(
    migration,
    /references marketing\.event_ledger\(idempotency_key\)/
  )
  assert.match(
    migration,
    /observation_key text not null unique/i
  )
  assert.match(
    migration,
    /alter table marketing\.canonical_event_source_evidence\s+force row level security/
  )
  assert.match(
    rlsSchema,
    /alter table marketing\.canonical_event_source_evidence enable row level security/
  )
  assert.doesNotMatch(migration, /\bdrop table\b/i)
  assert.doesNotMatch(
    migration,
    /alter table marketing\.event_ledger/i
  )
})

test('source evidence table has no provider, payload, secret, HMAC or customer PII columns', async () => {
  const migration = await readFile(migrationUrl, 'utf8')
  const tableDefinition = migration.match(
    /create table if not exists marketing\.canonical_event_source_evidence \(([\s\S]*?)\n\);/
  )?.[1]

  assert.ok(tableDefinition)
  assert.doesNotMatch(
    tableDefinition,
    /\b(meta|google|microsoft|provider|payload|secret|hmac|email|phone|customer)\b/i
  )
})
