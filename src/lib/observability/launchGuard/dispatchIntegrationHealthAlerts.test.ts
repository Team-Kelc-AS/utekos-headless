import assert from 'node:assert/strict'
import test from 'node:test'
import { dispatchIntegrationHealthAlerts } from './dispatchIntegrationHealthAlerts'

const alert = {
  channels: ['sentry', 'codex', 'twilio_sms'] as const,
  currentOpenedAt: '2026-08-29T12:00:00.000Z',
  fingerprint: 'probe:api_log_contract:abc',
  incidentId: '11111111-1111-4111-8111-111111111111',
  integration: 'vercel',
  kind: 'incident' as const,
  severity: 'critical' as const,
  summaryCode: 'valid_probe_rejected',
  surface: 'api_log_contract'
}

test('delivers Sentry, leaves Codex pending, and suppresses SMS before the controlled receipt', async () => {
  const updates: Array<Record<string, unknown>> = []
  let sequence = 0
  const summary = await dispatchIntegrationHealthAlerts([alert], {
    captureMessage: () => 'sentry-event',
    environment: {},
    fetch: async () => {
      throw new Error('must not send SMS')
    },
    flush: async () => true,
    now: () => new Date('2026-08-29T12:05:00.000Z'),
    sendSms: async () => {
      throw new Error('must not send SMS')
    },
    store: {
      hasDeliveredTwilioTest: async () => false,
      reserveDelivery: async () => `delivery-${++sequence}`,
      updateDelivery: async input => {
        updates.push(input)
      }
    }
  })

  assert.deepEqual(summary, {
    codexPending: 1,
    failed: 0,
    sentrySent: 1,
    suppressed: 1,
    twilioSent: 0
  })
  assert.deepEqual(
    updates.map(update => update.status),
    ['sent', 'suppressed']
  )
})

test('sends SMS only after a delivered test receipt', async () => {
  const updates: Array<Record<string, unknown>> = []
  const summary = await dispatchIntegrationHealthAlerts(
    [{ ...alert, channels: ['twilio_sms'] }],
    {
      captureMessage: () => 'unused',
      environment: { LAUNCH_GUARD_SMS_ENABLED: 'true' },
      fetch: async () => Response.json({}),
      flush: async () => true,
      now: () => new Date('2026-08-29T12:05:00.000Z'),
      sendSms: async () => ({
        status: 'sent',
        providerReceiptId: `SM${'1'.repeat(32)}`
      }),
      store: {
        hasDeliveredTwilioTest: async () => true,
        reserveDelivery: async () =>
          '22222222-2222-4222-8222-222222222222',
        updateDelivery: async input => {
          updates.push(input)
        }
      }
    }
  )

  assert.equal(summary.twilioSent, 1)
  assert.equal(updates[0]?.status, 'sent')
})
