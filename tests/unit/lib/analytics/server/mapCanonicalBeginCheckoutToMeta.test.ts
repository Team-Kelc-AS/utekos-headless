import assert from 'node:assert/strict'
import test from 'node:test'
import type { CanonicalBeginCheckout } from '@/lib/analytics/beginCheckoutEvent'
import { mapCanonicalBeginCheckoutToMeta } from '@/lib/analytics/server/mapCanonicalBeginCheckoutToMeta'

function beginCheckout(): CanonicalBeginCheckout {
  return {
    schema_version: 1,
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    event_name: 'begin_checkout',
    event_time: '2026-09-29T10:00:00.000Z',
    source: 'web',
    environment: 'test',
    page_url: 'https://utekos.no/handlekurv',
    page_title: 'Handlekurv',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'granted',
      source: 'cookiebot',
      version: '1'
    },
    custom_data: {
      cart_id: 'gid://shopify/Cart/abc',
      checkout_id: 'checkout-1',
      creation_revision: '1',
      currency: 'NOK',
      gross_value: 3_580,
      value: 2_864,
      tax_value: 716,
      items: [
        {
          variant_id:
            'gid://shopify/ProductVariant/47123456789012',
          item_name: 'Utekos TechDown™',
          quantity: 2,
          gross_unit_price: 1_790
        }
      ]
    }
  } as CanonicalBeginCheckout
}

test('uses num_items only for Meta InitiateCheckout commerce data', () => {
  const normalized = mapCanonicalBeginCheckoutToMeta(
    beginCheckout()
  ).normalize()

  assert.equal(normalized.event_name, 'InitiateCheckout')
  assert.equal(normalized.custom_data?.num_items, 2)
  assert.deepEqual(normalized.custom_data?.content_ids, [
    '47123456789012'
  ])
  assert.equal(normalized.custom_data?.currency, 'NOK')
  assert.equal(normalized.custom_data?.value, 3_580)
})
