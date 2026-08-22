import assert from 'node:assert/strict'
import test from 'node:test'

import { handleResendWebhook } from './route'

type Dependencies = NonNullable<Parameters<
  typeof handleResendWebhook
>[1]>

const rawPayload = JSON.stringify({
  type: 'email.bounced',
  created_at: '2026-08-22T08:00:00.000Z',
  data: {
    email_id: 'resend_email_123',
    to: ['private@example.com'],
    subject: 'Sensitive subject'
  }
})

function request(
  payload = rawPayload,
  headers: Record<string, string> = {
    'svix-id': 'evt_123',
    'svix-timestamp': '1787385600',
    'svix-signature': 'v1,test-signature'
  }
) {
  return new Request('https://utekos.no/api/webhooks/resend', {
    method: 'POST',
    headers,
    body: payload
  })
}

function dependencies(
  overrides: Partial<Dependencies> = {}
): Dependencies {
  return {
    getWebhookSecret: () => 'whsec_test',
    verify: input => JSON.parse(input.payload) as unknown,
    record: async () => true,
    ...overrides
  }
}

test('verifies the exact raw body and stores only PII-free fields', async () => {
  let verifyPayload = ''
  let recorded: Parameters<Dependencies['record']>[0] | undefined

  const response = await handleResendWebhook(
    request(),
    dependencies({
      verify: input => {
        verifyPayload = input.payload
        assert.equal(input.headers.id, 'evt_123')
        assert.equal(input.webhookSecret, 'whsec_test')
        return JSON.parse(input.payload) as unknown
      },
      record: async input => {
        recorded = input
        return true
      }
    })
  )

  assert.equal(response.status, 200)
  assert.equal(verifyPayload, rawPayload)
  assert.deepEqual(recorded, {
    resendEventId: 'evt_123',
    resendEmailId: 'resend_email_123',
    eventType: 'email.bounced',
    occurredAt: '2026-08-22T08:00:00.000Z'
  })
  assert.equal('email' in recorded!, false)
  assert.equal('recoveryUrl' in recorded!, false)
})

test('rejects an invalid signature before persistence', async () => {
  let recordCalls = 0
  const response = await handleResendWebhook(
    request(),
    dependencies({
      verify: () => {
        throw new Error('invalid signature')
      },
      record: async () => {
        recordCalls += 1
        return true
      }
    })
  )

  assert.equal(response.status, 401)
  assert.equal(recordCalls, 0)
})

test('acknowledges unrelated email ids without leaking payload data', async () => {
  const response = await handleResendWebhook(
    request(),
    dependencies({ record: async () => false })
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    ok: true,
    ignored: true
  })
})

test('returns retryable server error when persistence fails', async () => {
  const response = await handleResendWebhook(
    request(),
    dependencies({
      record: async () => {
        throw new Error('database unavailable')
      }
    })
  )

  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), {
    ok: false,
    error: 'persist_failed'
  })
})
