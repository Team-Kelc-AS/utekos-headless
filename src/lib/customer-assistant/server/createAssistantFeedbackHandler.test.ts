import assert from 'node:assert/strict'
import test from 'node:test'
import { createAssistantFeedbackHandler } from './createAssistantFeedbackHandler'

const responseId = 'assistant-response_123'
const enabledEnvironment = {
  VERCEL_ENV: 'production',
  CUSTOMER_ASSISTANT_ENABLED: 'true',
  CUSTOMER_ASSISTANT_ROLLOUT_PERCENT: '5',
  CUSTOMER_ASSISTANT_FEEDBACK_SECRET:
    'feedback-secret-with-at-least-32-characters'
}

function request({
  body = JSON.stringify({ responseId, value: 'helpful' }),
  origin = 'https://utekos.no'
}: {
  body?: string
  origin?: string | null
} = {}) {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (origin !== null) headers.set('Origin', origin)

  return new Request(
    'https://utekos.no/api/customer-assistant/feedback',
    { body, headers, method: 'POST' }
  )
}

function dependencies(
  overrides: Partial<
    Parameters<typeof createAssistantFeedbackHandler>[0]
  > = {}
) {
  return {
    checkRateLimit: async () => ({ allowed: true }),
    environment: enabledEnvironment,
    store: { save: async () => undefined },
    ...overrides
  }
}

test('is unavailable when the assistant kill switch is off', async () => {
  const handler = createAssistantFeedbackHandler(
    dependencies({ environment: {} })
  )
  const response = await handler(request())

  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: 'not_found' })
})

test('rejects cross-origin and malformed feedback without writes', async () => {
  let writes = 0
  const handler = createAssistantFeedbackHandler(
    dependencies({
      store: {
        save: async () => {
          writes += 1
        }
      }
    })
  )

  assert.equal(
    (await handler(request({ origin: 'https://evil.example' })))
      .status,
    403
  )
  assert.equal(
    (await handler(request({ origin: 'https://utekos.no/path' })))
      .status,
    403
  )
  assert.equal(
    (
      await handler(
        request({
          body: JSON.stringify({
            responseId,
            value: 'message text must never be accepted'
          })
        })
      )
    ).status,
    400
  )
  assert.equal(writes, 0)
})

test('fails closed when rate limiting or feedback hashing is unavailable', async t => {
  await t.test('rate limit', async () => {
    const handler = createAssistantFeedbackHandler(
      dependencies({
        checkRateLimit: async () => ({ allowed: false })
      })
    )
    assert.equal((await handler(request())).status, 429)
  })

  await t.test('feedback secret', async () => {
    const handler = createAssistantFeedbackHandler(
      dependencies({
        environment: {
          ...enabledEnvironment,
          CUSTOMER_ASSISTANT_FEEDBACK_SECRET: undefined
        }
      })
    )
    assert.equal((await handler(request())).status, 503)
  })
})

test('stores one HMAC fingerprint without raw response, session, IP or message data', async () => {
  const saved: Array<Record<string, unknown>> = []
  const handler = createAssistantFeedbackHandler(
    dependencies({
      checkRateLimit: async input => {
        assert.equal(input.buyerIp, '203.0.113.8')
        assert.equal(input.sessionId, 'feedback')
        return { allowed: true }
      },
      store: {
        save: async input => {
          saved.push(input)
        }
      }
    })
  )
  const response = await handler(request(), {
    buyerIp: '203.0.113.8'
  })

  assert.equal(response.status, 204)
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0')
  assert.equal(saved.length, 1)
  assert.equal(saved[0]?.rating, 'helpful')
  assert.match(String(saved[0]?.responseFingerprint), /^[a-f0-9]{64}$/u)
  const serialized = JSON.stringify(saved)
  assert.doesNotMatch(serialized, new RegExp(responseId, 'u'))
  assert.doesNotMatch(serialized, /203\.0\.113\.8|message text/u)
})
