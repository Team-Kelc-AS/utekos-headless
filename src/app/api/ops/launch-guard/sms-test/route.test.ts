import assert from 'node:assert/strict'
import test from 'node:test'
import { handleLaunchGuardSmsTest } from './route'

function request(secret = 'secret') {
  return new Request(
    'https://utekos.no/api/ops/launch-guard/sms-test',
    {
      headers: { Authorization: `Bearer ${secret}` },
      method: 'POST'
    }
  )
}

test('keeps the real SMS test behind both authorization and an explicit gate', async () => {
  const response = await handleLaunchGuardSmsTest(request(), {
    environment: {},
    fetch,
    getCronSecret: () => 'secret',
    now: () => new Date(),
    sendSms: async () => {
      throw new Error('must not send')
    },
    store: {
      ensureTwilioTestIncident: async () => {
        throw new Error('must not write')
      },
      reserveDelivery: async () => null,
      updateDelivery: async () => undefined
    }
  })

  assert.equal(response.status, 409)
})

test('sends only the controlled test and waits for the callback receipt', async () => {
  const updates: Array<Record<string, unknown>> = []
  const response = await handleLaunchGuardSmsTest(request(), {
    environment: { LAUNCH_GUARD_SMS_TEST_ENABLED: 'true' },
    fetch,
    getCronSecret: () => 'secret',
    now: () => new Date('2026-08-29T12:00:00.000Z'),
    sendSms: async input => {
      assert.equal(input.message.kind, 'test')
      return {
        status: 'sent',
        providerReceiptId: `SM${'1'.repeat(32)}`
      }
    },
    store: {
      ensureTwilioTestIncident: async () => ({
        currentOpenedAt: '2026-08-29T12:00:00.000Z',
        fingerprint: 'twilio:controlled_delivery_test',
        id: '11111111-1111-4111-8111-111111111111'
      }),
      reserveDelivery: async () =>
        '22222222-2222-4222-8222-222222222222',
      updateDelivery: async input => {
        updates.push(input)
      }
    }
  })

  assert.equal(response.status, 202)
  assert.equal(updates[0]?.status, 'sent')
})
