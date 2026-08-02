import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  './20260801150243_add_meta_ad_creative_destinations.sql',
  import.meta.url
)
const marketingSchemaUrl = new URL(
  '../schemas/20_marketing.sql',
  import.meta.url
)
const rlsSchemaUrl = new URL(
  '../schemas/90_rls.sql',
  import.meta.url
)

test('Meta creative destinations use the v25 runtime and SCD contracts', async () => {
  const [migrationSql, schemaSql] = await Promise.all([
    readFile(migrationUrl, 'utf8'),
    readFile(marketingSchemaUrl, 'utf8')
  ])

  for (const sql of [migrationSql, schemaSql]) {
    for (const column of [
      'destination_url',
      'normalized_destination_url',
      'url_tags',
      'source_kind',
      'source_path',
      'dynamic_resolution_status',
      'destination_fingerprint',
      'observed_version',
      'ad_created_time',
      'ad_updated_time',
      'effective_status',
      'observed_from',
      'observed_through',
      'observed_until',
      'effective_from',
      'effective_until',
      'effective_period_basis'
    ]) {
      assert.match(sql, new RegExp(`\\b${column}\\b`, 'i'))
    }

    assert.match(
      sql,
      /api_version text not null default 'v25\.0' check \(api_version = 'v25\.0'\)/i
    )
    assert.match(
      sql,
      /unique \(\s*account_id,\s*ad_id,\s*creative_id,\s*observed_version,\s*destination_fingerprint\s*\)/i
    )
    assert.match(sql, /observed_from <= observed_through/i)
    assert.match(
      sql,
      /effective_period_basis in \('unknown', 'meta_activity'\)/i
    )
    assert.doesNotMatch(
      sql,
      /effective_from timestamptz not null/i
    )
    assert.doesNotMatch(
      sql,
      /effective_until timestamptz not null/i
    )
  }
})

test('Meta creative destinations preserve every runtime source classification', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  for (const sourceKind of [
    'asset_feed_link_url',
    'object_story_link_data',
    'object_story_template_data',
    'object_story_video_call_to_action',
    'object_url',
    'template_url_spec_web',
    'catalog_product_set',
    'unresolved'
  ]) {
    assert.match(sql, new RegExp(`'${sourceKind}'`))
  }

  for (const resolutionStatus of [
    'static',
    'template',
    'deeplink',
    'catalog_dynamic',
    'unresolved'
  ]) {
    assert.match(sql, new RegExp(`'${resolutionStatus}'`))
  }

  assert.match(sql, /destination_url text check/i)
  assert.match(sql, /normalized_destination_url text check/i)
  assert.doesNotMatch(sql, /raw_payload|access_token/i)
})

test('Meta creative destinations are private and retained for 14 months', async () => {
  const [migrationSql, rlsSql] = await Promise.all([
    readFile(migrationUrl, 'utf8'),
    readFile(rlsSchemaUrl, 'utf8')
  ])

  assert.match(
    migrationSql,
    /alter table marketing\.meta_ad_creative_destinations enable row level security/i
  )
  assert.match(
    migrationSql,
    /revoke all on table marketing\.meta_ad_creative_destinations\s+from public, anon, authenticated, service_role/i
  )
  assert.match(
    migrationSql,
    /security definer\s+set search_path = ''/i
  )
  assert.match(migrationSql, /interval '14 months'/i)
  assert.match(
    migrationSql,
    /ops\.has_active_privacy_retention_exception/i
  )
  assert.match(
    migrationSql,
    /where jobname = 'purge_expired_meta_ad_creative_destinations'/i
  )
  assert.match(
    migrationSql,
    /pg_cron cron\.job is required for Meta creative-destination retention/i
  )
  assert.match(
    rlsSql,
    /alter table marketing\.meta_ad_creative_destinations enable row level security/i
  )
})
