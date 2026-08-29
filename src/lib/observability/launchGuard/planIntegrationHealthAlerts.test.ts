import assert from 'node:assert/strict'
import test from 'node:test'
import { planIntegrationHealthAlerts } from './planIntegrationHealthAlerts'

const baseIncident = {
  currentOpenedAt: '2026-08-29T12:00:00.000Z',
  fingerprint: 'probe:api_log_contract:abc',
  id: '11111111-1111-4111-8111-111111111111',
  integration: 'vercel',
  lastAlertedAt: null,
  observationCount: 1,
  recentFailureCount: 1,
  severity: 'critical' as const,
  summaryCode: 'valid_probe_rejected',
  surface: 'api_log_contract'
}

test('requires two five-minute probe failures before critical SMS', () => {
  assert.deepEqual(
    planIntegrationHealthAlerts({
      incidents: [baseIncident],
      recoveries: []
    }),
    []
  )

  const [alert] = planIntegrationHealthAlerts({
    incidents: [
      {
        ...baseIncident,
        observationCount: 2,
        recentFailureCount: 2
      }
    ],
    recoveries: []
  })

  assert.deepEqual(alert?.channels, [
    'sentry',
    'codex',
    'twilio_sms'
  ])
})

test('alerts immediately for dead letters and never sends medium deviations by SMS', () => {
  const alerts = planIntegrationHealthAlerts({
    incidents: [
      {
        ...baseIncident,
        summaryCode: 'provider_dead_letter_present'
      },
      {
        ...baseIncident,
        fingerprint: 'provider_dispatch:ack_latency',
        id: '22222222-2222-4222-8222-222222222222',
        severity: 'medium',
        summaryCode: 'provider_ack_p95_over_60_seconds',
        surface: 'ack_latency'
      }
    ],
    recoveries: []
  })

  assert.deepEqual(alerts[0]?.channels, [
    'sentry',
    'codex',
    'twilio_sms'
  ])
  assert.deepEqual(alerts[1]?.channels, ['codex'])
})

test('sends recovery only through channels used for the incident plus Codex', () => {
  const [recovery] = planIntegrationHealthAlerts({
    incidents: [],
    recoveries: [
      {
        currentOpenedAt: '2026-08-29T12:00:00.000Z',
        fingerprint: 'probe:api_log_contract:abc',
        id: '11111111-1111-4111-8111-111111111111',
        integration: 'vercel',
        severity: 'critical',
        surface: 'api_log_contract',
        wasSentrySent: true,
        wasTwilioSent: false
      }
    ]
  })

  assert.deepEqual(recovery?.channels, ['sentry', 'codex'])
  assert.equal(recovery?.kind, 'recovery')
})
