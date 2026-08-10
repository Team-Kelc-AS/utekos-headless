import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalPurchaseSchema } from '../purchaseEvent'
import {
  MicrosoftUetCapiConfigError,
  MicrosoftUetCapiHttpError,
  sendMicrosoftUetCapiPurchase
} from './sendMicrosoftUetCapiPurchase'

function purchase(overrides: Record<string, unknown> = {}) {
  return canonicalPurchaseSchema.parse({
    schema_version: 1,
    event_name: 'purchase',
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    event_time: '2026-07-17T10:05:00.000Z',
    source: 'webhook',
    environment: 'test',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    click_id: {
      msclkid: 'dd4afccc-b1c9-4a4c-ad95-44dd7e5006ab'
    },
    custom_data: {
      currency: 'NOK',
      value: 100,
      transaction_id: 'shopify_order_1',
      order_name: '#1',
      items: [
        {
          item_id: '1',
          item_name: 'Item',
          quantity: 1,
          unit_price: 100
        }
      ]
    },
    ...overrides
  })
}

test('posts purchase events to the Microsoft UET CAPI endpoint', async () => {
  const calls: Array<{ body: string; url: string }> = []

  const result = await sendMicrosoftUetCapiPurchase(purchase(), {
    fetchFn: async (url, init) => {
      calls.push({
        body: String(init.body),
        url
      })

      return {
        headers: new Headers({ 'x-ms-request-id': 'req-1' }),
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            eventsReceived: 1,
            error: {
              code: 'ValidationError',
              details: [
                {
                  attemptedValue: 'do-not-persist',
                  errorCode: 'InvalidUrl',
                  errorMessage: 'Invalid referrer URL',
                  index: 0,
                  isWarning: true,
                  propertyName: 'data[0].referrerUrl'
                }
              ]
            }
          })
      }
    },
    readConfig: () => ({
      apiToken: 'uet-token',
      tagId: '97247724'
    }),
    resolveToken: () => 'uet-token'
  })

  assert.equal(
    calls[0]?.url,
    'https://capi.uet.microsoft.com/v1/97247724/events'
  )
  assert.match(calls[0]?.body ?? '', /"eventName":"purchase"/)
  assert.equal(result.status, 200)
  assert.equal(result.requestId, 'req-1')
  assert.equal(result.tagId, '97247724')
  assert.equal(result.eventsReceived, 1)
  assert.equal(result.validationWarnings.length, 1)
  assert.doesNotMatch(JSON.stringify(result), /do-not-persist/)
})

test('fails closed when the ApiToken is missing', async () => {
  await assert.rejects(
    () =>
      sendMicrosoftUetCapiPurchase(purchase(), {
        fetchFn: async () => {
          throw new Error('fetch should not run')
        },
        readConfig: () => ({ tagId: '97247724' }),
        resolveToken: () => undefined
      }),
    (error: unknown) =>
      error instanceof MicrosoftUetCapiConfigError
      && error.reason === 'missing_capi_token'
  )
})

test('surfaces sanitized non-2xx Microsoft responses as HTTP errors', async () => {
  await assert.rejects(
    () =>
      sendMicrosoftUetCapiPurchase(purchase(), {
        fetchFn: async () => ({
          headers: new Headers(),
          ok: false,
          status: 401,
          text: async () =>
            JSON.stringify({
              error: {
                code: 'Unauthorized',
                details: [
                  {
                    attemptedValue: 'do-not-persist',
                    errorCode: 'InvalidValue',
                    errorMessage: 'The value is invalid',
                    index: 0,
                    propertyName: 'data[0].userData.msclkid'
                  }
                ],
                message: 'Authentication failed'
              }
            })
        }),
        readConfig: () => ({
          apiToken: 'bad-token',
          tagId: '97247724'
        }),
        resolveToken: () => 'bad-token'
      }),
    (error: unknown) => {
      if (!(error instanceof MicrosoftUetCapiHttpError)) {
        return false
      }

      assert.equal(error.status, 401)
      assert.match(error.message, /Unauthorized: Authentication failed/)
      assert.doesNotMatch(error.message, /do-not-persist/)
      assert.doesNotMatch(JSON.stringify(error.details), /do-not-persist/)
      return true
    }
  )
})
