import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canonicalPurchaseSchema,
  deterministicPurchaseEventId
} from '@/lib/analytics/purchaseEvent'
import { getVerifiedShopifyCustomerContext } from '@/lib/analytics/server/getVerifiedShopifyCustomerContext'
import { normalizeCanonicalPurchase } from '@/lib/analytics/server/normalizeCanonicalPurchase'

test('uses verified Shopify customer context instead of webhook-request geolocation', () => {
  const purchase = canonicalPurchaseSchema.parse({
    schema_version: 1,
    event_name: 'purchase',
    event_id: deterministicPurchaseEventId('12345'),
    event_time: '2026-07-18T10:06:00.000Z',
    source: 'webhook',
    environment: 'test',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'granted',
      source: 'cookiebot',
      version: '1'
    },
    client_ip_address: '203.0.113.8',
    event_device_info: { user_agent: 'Mozilla/5.0' },
    location: {
      city: 'Oslo',
      country_code: 'NO',
      postal_code: '0150',
      region_code: '03',
      source: 'customer_provided'
    },
    custom_data: {
      currency: 'NOK',
      value: 1990,
      transaction_id: 'shopify_order_12345',
      order_name: '#12345',
      items: [
        {
          item_id: '48249962135800',
          item_name: 'Utekos TechDown',
          quantity: 1,
          unit_price: 1990
        }
      ]
    }
  })

  const requestContext =
    getVerifiedShopifyCustomerContext(purchase)

  assert.deepEqual(requestContext, {
    city: 'Oslo',
    clientIpAddress: '203.0.113.8',
    countryCode: 'NO',
    postalCode: '0150',
    regionCode: '03',
    userAgent: 'Mozilla/5.0'
  })

  const normalized = normalizeCanonicalPurchase(
    purchase,
    requestContext
  )

  assert.equal(normalized.client_ip_address, '203.0.113.8')
  assert.equal(
    normalized.event_device_info?.user_agent,
    'Mozilla/5.0'
  )
  assert.deepEqual(normalized.location, purchase.location)
})
