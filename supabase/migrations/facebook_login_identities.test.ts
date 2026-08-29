import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  './20260824075813_add_facebook_login_identities.sql',
  import.meta.url
)
const marketingSchemaUrl = new URL(
  '../schemas/20_marketing.sql',
  import.meta.url
)
const opsSchemaUrl = new URL(
  '../schemas/40_ops.sql',
  import.meta.url
)
const rlsSchemaUrl = new URL(
  '../schemas/90_rls.sql',
  import.meta.url
)

test('stores the voluntary Meta identity bridge without tokens or plaintext contact', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  const tableDefinition = sql.match(
    /create table marketing\.facebook_login_identities \([\s\S]*?\n\);/
  )?.[0]

  assert.ok(tableDefinition)
  for (const column of [
    'app_id',
    'facebook_login_id',
    'external_id',
    'email_ciphertext',
    'email_sha256',
    'phone_ciphertext',
    'phone_sha256',
    'fbclid',
    'fbc',
    'campaign_id',
    'adset_id',
    'ad_id'
  ]) {
    assert.match(
      tableDefinition,
      new RegExp(`\\b${column}\\b`, 'i')
    )
  }

  assert.match(
    tableDefinition,
    /unique \(app_id, facebook_login_id\)/i
  )
  assert.doesNotMatch(
    tableDefinition,
    /\baccess_token\b|\bapp_secret\b|\bemail text\b|\bphone text\b/i
  )
  assert.match(sql, /Never stores Facebook access tokens/i)
})

test('keeps the identity bridge service-only and bounded to 180 days', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  assert.match(
    sql,
    /alter table marketing\.facebook_login_identities\s+force row level security/i
  )
  assert.match(
    sql,
    /revoke all on table marketing\.facebook_login_identities[\s\S]*from public, anon, authenticated, service_role/i
  )
  assert.match(
    sql,
    /grant select, insert, update, delete[\s\S]*on table marketing\.facebook_login_identities[\s\S]*to service_role/i
  )
  assert.match(sql, /interval '180 days'/i)
  assert.match(
    sql,
    /ops\.has_active_privacy_retention_exception\([\s\S]*'facebook_login_identities'/i
  )
  assert.match(
    sql,
    /jobname = 'purge_expired_facebook_login_identities'/i
  )
})

test('keeps declarative schemas aligned with the migration', async () => {
  const [marketingSql, opsSql, rlsSql] = await Promise.all([
    readFile(marketingSchemaUrl, 'utf8'),
    readFile(opsSchemaUrl, 'utf8'),
    readFile(rlsSchemaUrl, 'utf8')
  ])

  assert.match(
    marketingSql,
    /create table if not exists marketing\.facebook_login_identities/i
  )
  assert.match(
    opsSql,
    /create or replace function ops\.purge_expired_facebook_login_identities\(\)/i
  )
  assert.match(
    rlsSql,
    /alter table marketing\.facebook_login_identities\s+force row level security/i
  )
  assert.match(
    rlsSql,
    /grant select, insert, update, delete[\s\S]*on table marketing\.facebook_login_identities[\s\S]*to service_role/i
  )
})
