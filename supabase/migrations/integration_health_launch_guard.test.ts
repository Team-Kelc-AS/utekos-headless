import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  './20260829181448_integration_health_launch_guard.sql',
  import.meta.url
)

test('creates private launch-guard snapshots, incidents, and delivery receipts', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  for (const table of [
    'integration_health_snapshots',
    'integration_health_incidents',
    'integration_alert_deliveries'
  ]) {
    assert.match(
      sql,
      new RegExp(`create table if not exists ops\\.${table}`)
    )
    assert.match(
      sql,
      new RegExp(
        `alter table ops\\.${table}\\s+enable row level security`
      )
    )
    assert.match(
      sql,
      new RegExp(
        `alter table ops\\.${table}\\s+force row level security`
      )
    )
    assert.match(
      sql,
      new RegExp(
        `revoke all on table ops\\.${table}\\s+from public, anon, authenticated`
      )
    )
  }

  assert.match(sql, /fingerprint text not null unique/)
  assert.match(sql, /idempotency_key text not null unique/)
  assert.match(sql, /accepted_unverified/)
  assert.match(sql, /result_code text not null/)
  assert.match(sql, /unique \(run_id, integration, surface\)/)
  assert.match(sql, /integration_health_incidents_last_snapshot_idx/)
  assert.match(sql, /integration_health_snapshots_failure_idx/)
  assert.match(sql, /integration_alert_deliveries_twilio_test_idx/)
  assert.match(sql, /alert_suppressed_until timestamptz/)
  assert.match(sql, /recovery_pending/)
  assert.doesNotMatch(sql, /phone_number|message_body|journey_id|click_id/)
})
