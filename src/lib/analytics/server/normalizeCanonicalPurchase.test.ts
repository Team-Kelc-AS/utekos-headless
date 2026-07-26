import assert from 'node:assert/strict'
import test from 'node:test'
import {
  deterministicPurchaseEventId,
  shopifyPurchaseTransactionId
} from '../purchaseEvent'
import { normalizeCanonicalPurchase } from './normalizeCanonicalPurchase'

function purchase(orderLegacyId: string, eventId?: string) {
  return {
    schema_version: 1 as const,
    event_name: 'purchase' as const,
    event_id:
      eventId ?? deterministicPurchaseEventId(orderLegacyId),
    event_time: '2026-07-22T01:00:00.000Z',
    source: 'server' as const,
    environment: 'test' as const,
    consent: {
      analytics: 'denied' as const,
      marketing: 'denied' as const,
      preferences: 'denied' as const,
      source: 'cookiebot' as const,
      version: '1'
    },
    custom_data: {
      currency: 'NOK',
      value: 100,
      transaction_id:
        shopifyPurchaseTransactionId(orderLegacyId),
      order_name: '#100',
      items: [
        {
          item_id: 'variant-1',
          item_name: 'Utekos',
          quantity: 1,
          unit_price: 100
        }
      ]
    }
  }
}

test('accepts the deterministic Purchase identity derived from transaction_id', () => {
  const event = normalizeCanonicalPurchase(purchase('100'), {})

  assert.equal(
    event.event_id,
    deterministicPurchaseEventId('100')
  )
  assert.equal(
    event.custom_data.transaction_id,
    shopifyPurchaseTransactionId('100')
  )
})

test('rejects an alternative event_id for the same Shopify order', () => {
  assert.throws(
    () =>
      normalizeCanonicalPurchase(
        purchase('100', '61c2ef59-6e6f-4f56-a63a-567ca398f9de'),
        {}
      ),
    /canonical_purchase_identity_mismatch/
  )
})

test('rejects a Purchase transaction_id outside the Shopify order namespace', () => {
  assert.throws(
    () =>
      normalizeCanonicalPurchase(
        {
          ...purchase('100'),
          custom_data: {
            ...purchase('100').custom_data,
            transaction_id: 'checkout-100'
          }
        },
        {}
      ),
    /canonical_purchase_identity_mismatch/
  )
})

test('different Shopify orders retain different deterministic event IDs', () => {
  const first = normalizeCanonicalPurchase(purchase('100'), {})
  const second = normalizeCanonicalPurchase(purchase('101'), {})

  assert.notEqual(first.event_id, second.event_id)
})

test('removes hashed user data and marketing identifiers when marketing consent is denied', () => {
  const event = normalizeCanonicalPurchase(
    {
      ...purchase('100'),
      browser_id: {
        fbc: 'fb.1.1784368700000.meta-click',
        fbp: 'fb.1.1784368600000.123456789'
      },
      click_id: { fbclid: 'meta-click', gclid: 'google-click' },
      external_id: 'shopify_customer_100',
      user_data: {
        email_sha256: ['a'.repeat(64)],
        phone_sha256: ['b'.repeat(64)]
      }
    },
    {}
  )

  assert.equal(event.browser_id, undefined)
  assert.equal(event.click_id, undefined)
  assert.equal(event.external_id, undefined)
  assert.equal(event.user_data, undefined)
})
