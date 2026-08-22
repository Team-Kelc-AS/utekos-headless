import assert from 'node:assert/strict'
import test from 'node:test'

import {
  handleAbandonedCheckoutRecoveryUnsubscribeGet,
  handleAbandonedCheckoutRecoveryUnsubscribePost
} from './route'

const customerId = 'gid://shopify/Customer/123456'

function request(method: 'GET' | 'POST', token = 'opaque-token') {
  return new Request(
    `https://utekos.no/api/email/abandoned-checkout-recovery/unsubscribe?token=${token}`,
    { method }
  )
}

function dependencies() {
  return {
    verifyToken: (token: string) => {
      if (token !== 'opaque-token') {
        throw new Error('invalid')
      }

      return { shopifyCustomerId: customerId }
    },
    unsubscribe: async (_input: { shopifyCustomerId: string }) => undefined
  }
}

test('GET validates without unsubscribing and shows a confirmation form', async () => {
  let unsubscribeCalls = 0
  const response = await handleAbandonedCheckoutRecoveryUnsubscribeGet(
    request('GET'),
    {
      ...dependencies(),
      unsubscribe: async () => {
        unsubscribeCalls += 1
      }
    }
  )

  assert.equal(response.status, 200)
  assert.equal(unsubscribeCalls, 0)
  assert.match(await response.text(), /Meld meg av/u)
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('POST processes one-click unsubscribe and returns an empty body', async () => {
  let receivedCustomerId = ''
  const response = await handleAbandonedCheckoutRecoveryUnsubscribePost(
    request('POST'),
    {
      ...dependencies(),
      unsubscribe: async input => {
        receivedCustomerId = input.shopifyCustomerId
      }
    }
  )

  assert.equal(response.status, 200)
  assert.equal(await response.text(), '')
  assert.equal(receivedCustomerId, customerId)
})

test('invalid tokens never call unsubscribe', async () => {
  let unsubscribeCalls = 0
  const response = await handleAbandonedCheckoutRecoveryUnsubscribePost(
    request('POST', 'tampered'),
    {
      ...dependencies(),
      unsubscribe: async () => {
        unsubscribeCalls += 1
      }
    }
  )

  assert.equal(response.status, 400)
  assert.equal(unsubscribeCalls, 0)
})

test('returns a retryable response when Shopify or persistence fails', async () => {
  const response = await handleAbandonedCheckoutRecoveryUnsubscribePost(
    request('POST'),
    {
      ...dependencies(),
      unsubscribe: async () => {
        throw new Error('provider unavailable')
      }
    }
  )

  assert.equal(response.status, 503)
  assert.equal(await response.text(), '')
})
