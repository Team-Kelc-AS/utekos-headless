import assert from 'node:assert/strict'
import test from 'node:test'
import { createCheckoutAttributionSnapshot } from '@/lib/analytics/checkoutAttributionSnapshot'
import { buildKlarnaExpressOrderAttributes } from './buildKlarnaExpressOrderAttributes'

test('persists the Klarna order id and consented attribution only', () => {
  const attribution = createCheckoutAttributionSnapshot(
    {
      browser_id: {
        fbc: 'fb.1.1784195000000.meta-click',
        fbp: 'fb.1.1784194900000.123456789'
      },
      click_id: { fbclid: 'meta-click' },
      campaign: {
        campaign_id: '1201',
        adset_id: '1202',
        ad_id: '1203'
      },
      consent: {
        analytics: 'denied',
        marketing: 'granted',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      },
      external_id: 'anon_550e8400-e29b-41d4-a716-446655440000'
    },
    '2026-07-18T12:00:00.000Z'
  )

  const attributes = buildKlarnaExpressOrderAttributes({
    attribution,
    klarnaOrderId: 'klarna-order-1',
    productContextItems: [
      {
        item_id: '48249962135800',
        item_brand: 'Utekos',
        item_category: 'Ponchoer'
      }
    ]
  })

  assert.equal(
    attributes.find(
      attribute => attribute.key === 'klarna_order_id'
    )?.value,
    'klarna-order-1'
  )
  assert.equal(
    attributes.some(
      attribute => attribute.key === 'klarna_authorization_token'
    ),
    false
  )
  assert.equal(
    attributes.find(attribute => attribute.key === 'fbclid')
      ?.value,
    'meta-click'
  )
  assert.equal(
    attributes.find(
      attribute => attribute.key === 'utekos_campaign_id'
    )?.value,
    '1201'
  )
  assert.equal(
    attributes.find(
      attribute => attribute.key === 'utekos_adset_id'
    )?.value,
    '1202'
  )
  assert.equal(
    attributes.find(
      attribute => attribute.key === 'utekos_ad_id'
    )?.value,
    '1203'
  )
  assert.match(
    attributes.find(
      attribute => attribute.key === 'utekos_product_context_v1'
    )?.value ?? '',
    /"item_category":"Ponchoer"/
  )
})
