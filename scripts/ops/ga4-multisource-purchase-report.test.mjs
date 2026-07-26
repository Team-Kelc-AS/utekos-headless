import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildReport,
  formatReport
} from './ga4-multisource-purchase-report.mjs'

const healthySummary = {
  canonical_purchase_count: '16',
  google_attempt_count: '16',
  client_id_count: '14',
  gclid_count: '1',
  user_id_count: '3',
  eligible_identifier_count: '16',
  within_48h_count: '15',
  late_within_window_count: '1',
  outside_72h_count: '0',
  duplicate_transaction_count: '0',
  provider_confirmed_success_count: '16',
  provider_confirmed_warning_count: '0',
  dead_lettered_count: '0',
  record_count_mismatch_count: '0',
  warning_record_count: '0',
  error_record_count: '0',
  status_timeout_count: '0',
  status_older_than_24h_count: '0',
  validate_only_count: '1',
  legacy_validation_metadata_count: '3'
}

test('summarizes GA4 multi-source purchase evidence without treating legacy metadata as green', () => {
  const report = buildReport(
    healthySummary,
    [
      {
        status: 'succeeded',
        response_semantics: 'provider_confirmed_success',
        row_count: '16'
      }
    ],
    { generatedAt: '2026-07-25T12:00:00.000Z' }
  )

  assert.deepEqual(report.identifiers, {
    clientId: 14,
    gclid: 1,
    userId: 3,
    eligible: 16
  })
  assert.deepEqual(report.freshness, {
    within48Hours: 15,
    lateWithinWindow: 1,
    outside72Hours: 0
  })
  assert.deepEqual(report.validation, {
    validateOnly: 1,
    legacyWithoutMetadata: 3
  })
  assert.equal(report.alerts.length, 0)
  assert.match(
    formatReport(report),
    /provider_confirmed_success=16/
  )
  assert.match(formatReport(report), /late within window: 1/)
})

test('alerts on warnings, errors, mismatched record counts, and stale status', () => {
  const report = buildReport(
    {
      ...healthySummary,
      provider_confirmed_success_count: '12',
      provider_confirmed_warning_count: '1',
      dead_lettered_count: '1',
      record_count_mismatch_count: '1',
      warning_record_count: '2',
      error_record_count: '1',
      status_timeout_count: '1',
      status_older_than_24h_count: '1'
    },
    [],
    { generatedAt: '2026-07-25T12:00:00.000Z' }
  )

  assert.deepEqual(
    report.alerts.map(alert => alert.code),
    [
      'provider_success_with_warnings',
      'provider_dead_lettered',
      'provider_record_count_mismatch',
      'provider_warning_records',
      'provider_error_records',
      'provider_status_timeout',
      'provider_status_stale'
    ]
  )
})
