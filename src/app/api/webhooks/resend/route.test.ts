import assert from 'node:assert/strict'
import test from 'node:test'

import type { WebhookEventPayload } from 'resend'

import { handleResendWebhook } from './route'

const event = {
  type: 'email.delivered',
  created_at: '2026-08-09T15:00:00.000Z',
  data: {
    created_at: '2026-08-09T15:00:00.000Z',
    email_id: 'email_123',
    from: 'Utekos <kundeservice@utekos.no>',
    to: ['kunde@example.no'],
    subject: 'Glemte du noe i kassen?',
    tags: {
      category: 'abandoned_checkout_recovery',
      dispatch_id: '8d5dce25-4ed0-4ee5-9629-80eb99d1f24d'
    }
  }
} satisfies WebhookEventPayload

function request() {
  return new Request('https://utekos.no/api/webhooks/resend', {
    method: 'POST',
    headers: {
      'svix-id': 'event_1',
      'svix-timestamp': '1786287600',
      'svix-signature': 'v1,signature'
    },
    body: JSON.stringify(event)
  })
}

test('rejects an invalid raw-body signature without persistence', async () => {
  let persisted = false
  const response = await handleResendWebhook(request(), {
    getWebhookSecret: () => 'whsec_test',
    verify: () => {
      throw new Error('invalid signature')
    },
    persist: async () => {
      persisted = true
      return 'persisted'
    }
  })

  assert.equal(response.status, 400)
  assert.equal(persisted, false)
})

test('accepts repeated signed delivery events through idempotent persistence', async () => {
  let calls = 0
  const dependencies = {
    getWebhookSecret: () => 'whsec_test',
    verify: () => event,
    persist: async () => {
      calls += 1
      return 'persisted' as const
    }
  }

  const first = await handleResendWebhook(request(), dependencies)
  const duplicate = await handleResendWebhook(request(), dependencies)

  assert.equal(first.status, 200)
  assert.equal(duplicate.status, 200)
  assert.equal(calls, 2)
})
