import assert from 'node:assert/strict'
import test from 'node:test'
import { parseIntegrationHealthSnapshot } from './integrationHealthSnapshot'
import { replaceRetriedSnapshots } from './collectLaunchGuardHealth'

const runId = '11111111-1111-4111-8111-111111111111'

function snapshot(status: 'healthy' | 'unhealthy') {
  return parseIntegrationHealthSnapshot({
    runId,
    integration: 'vercel',
    surface: 'api_log_contract',
    status,
    severity: status === 'healthy' ? 'info' : 'critical',
    checkedAt: '2026-08-29T12:00:00.000Z',
    sampleCount: 1,
    errorCount: status === 'healthy' ? 0 : 1,
    evidenceLevel: 'synthetic_probe',
    providerReceiptStatus: 'not_applicable',
    ...(status === 'unhealthy' ?
      {
        errorFingerprint: 'probe:api_log_contract:abc',
        safeAction: 'retry_probe_once' as const
      }
    : {}),
    resultCode:
      status === 'healthy' ? 'valid_probe_accepted' : 'valid_probe_rejected',
    measurements: { status_code: status === 'healthy' ? 200 : 500 }
  })
}

test('replaces the first failure with the verification result and consumes the one retry', () => {
  const [result] = replaceRetriedSnapshots(
    [snapshot('unhealthy')],
    [snapshot('healthy')]
  )

  assert.equal(result?.status, 'healthy')
  assert.equal(result?.safeAction, undefined)
  assert.deepEqual(result?.measurements, {
    status_code: 200,
    initial_result_code: 'valid_probe_rejected',
    retry_attempted: true
  })
})
