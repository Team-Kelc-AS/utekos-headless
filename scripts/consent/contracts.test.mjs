import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = path =>
  readFileSync(new URL(path, import.meta.url), 'utf8')

test('every registered operation declares its purpose, data, consent, retention, owner and evidence', () => {
  const register = JSON.parse(
    read('../../contracts/consent/operations.v1.json')
  )
  assert.equal(
    register.status,
    'implemented_locally_not_production_verified'
  )
  const ids = register.operations.map(operation => operation.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const operation of register.operations) {
    for (const field of [
      'id',
      'classification',
      'purpose',
      'data',
      'terminalAccess',
      'recipients',
      'consentGate',
      'gdprBasis',
      'retention',
      'ownerComponent',
      'evidence'
    ]) {
      assert.equal(
        typeof operation[field],
        'string',
        operation.id + ':' + field
      )
      assert.ok(operation[field].length > 0)
    }
  }
})

test('prepared GTM patch gates only named UET tags and preserves the sole Cookiebot loader and paused tags', () => {
  const patch = JSON.parse(
    read('../../contracts/consent/gtm-required-changes.v1.json')
  )
  assert.equal(patch.status, 'prepared_not_published')
  assert.deepEqual(
    patch.changes.map(change => change.tagId),
    ['160', '172', '173', '174']
  )
  assert.ok(
    patch.preconditions.some(value => value.includes('126'))
  )
  assert.ok(
    patch.preconditions.some(value =>
      value.includes('153, 170 or 171')
    )
  )
  for (const change of patch.changes) {
    assert.equal(
      change.afterConsentSettings.consentStatus,
      'needed'
    )
    assert.deepEqual(
      change.afterConsentSettings.consentType.list.map(
        item => item.value
      ),
      ['ad_storage', 'ad_user_data', 'ad_personalization']
    )
  }
})

test('migration declares private, initially disabled aggregates and bounded new-data retention (static contract only)', () => {
  const sql = read(
    '../../supabase/migrations/20260910060000_add_operational_v1_privacy_policy.sql'
  )
  assert.match(
    sql,
    /operational_statistics_control \(enabled\) values \(false\)/
  )
  assert.match(
    sql,
    /daily_operational_traffic enable row level security/
  )
  assert.match(
    sql,
    /edge_request_id is null and not fbclid_present and fbclid_hmac is null/
  )
  assert.match(sql, /interval '7 days'/)
  assert.match(sql, /::date - 89/)
  assert.match(sql, /has_active_privacy_retention_exception/)
  const aggregateTable = sql
    .split('create table ops.daily_operational_traffic (')[1]
    .split(');')[0]
  assert.doesNotMatch(
    aggregateTable,
    /visitor|user_agent|click_id|request_id|trace_id|hmac/
  )
})
