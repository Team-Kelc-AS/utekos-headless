import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalPurchaseSchema } from '../purchaseEvent'
import {
  buildMicrosoftUetCapiPurchaseRequest,
  mapCanonicalPurchaseToMicrosoftUet
} from './mapCanonicalPurchaseToMicrosoftUet'

function purchase(overrides: Record<string, unknown> = {}) {
  return canonicalPurchaseSchema.parse({
    schema_version: 1,
    event_name: 'purchase',
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    event_time: '2026-07-17T10:05:00.000Z',
    source: 'webhook',
    environment: 'test',
    page_url: 'https://kasse.utekos.no/orders/123',
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
    browser_id: {
      ga_client_id: '1234567890.987654321',
      uet_visitor: 'uet-visitor-1'
    },
    external_id:
      'anon_550e8400-e29b-41d4-a716-446655440000',
    client_ip_address: '203.0.113.10',
    event_device_info: {
      user_agent: 'Mozilla/5.0'
    },
    user_data: {
      email_sha256: ['a'.repeat(64)],
      phone_sha256: ['b'.repeat(64)]
    },
    custom_data: {
      currency: 'NOK',
      value: 5980,
      transaction_id: 'shopify_order_123456789',
      order_name: '#1868',
      items: [
        {
          item_id: 'gid://shopify/ProductVariant/456',
          item_name: 'Utekos dun',
          quantity: 2,
          unit_price: 2990
        }
      ]
    },
    ...overrides
  })
}

test('maps canonical purchase to Microsoft UET CAPI purchase', () => {
  const event = mapCanonicalPurchaseToMicrosoftUet(purchase())

  assert.equal(event.eventType, 'custom')
  assert.equal(event.eventName, 'purchase')
  assert.equal(event.eventId, '61c2ef59-6e6f-4f56-a63a-567ca398f9de')
  assert.equal(
    event.userData.msclkid,
    'dd4afccc-b1c9-4a4c-ad95-44dd7e5006ab'
  )
  assert.equal(
    event.userData.anonymousId,
    '550e8400-e29b-41d4-a716-446655440000'
  )
  assert.equal(event.userData.em, 'a'.repeat(64))
  assert.equal(event.customData.pageType, 'purchase')
  assert.equal(event.customData.value, 5980)
  assert.equal(event.customData.currency, 'NOK')
  assert.deepEqual(event.customData.itemIds, ['456'])
  assert.deepEqual(event.customData.items?.[0], {
    id: '456',
    name: 'Utekos dun',
    price: 2990,
    quantity: 2
  })
})

test('builds the documented Microsoft UET CAPI request body', () => {
  const request = buildMicrosoftUetCapiPurchaseRequest(purchase())

  assert.equal(request.dataProvider, 'utekos-headless')
  assert.equal(request.continueOnValidationError, false)
  assert.equal(request.data[0]?.eventName, 'purchase')
})

test('rejects mapping without marketing consent', () => {
  assert.throws(
    () =>
      mapCanonicalPurchaseToMicrosoftUet(
        purchase({
          consent: {
            analytics: 'granted',
            marketing: 'denied',
            preferences: 'denied',
            source: 'cookiebot',
            version: '1'
          }
        })
      ),
    /marketing consent/
  )
})
