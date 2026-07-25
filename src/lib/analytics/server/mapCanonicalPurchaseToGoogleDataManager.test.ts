import assert from 'node:assert/strict'
import test from 'node:test'
import { protos } from '@google-ads/datamanager'
import {
  canonicalPurchaseSchema,
  deterministicPurchaseEventId,
  shopifyPurchaseTransactionId,
  type CanonicalPurchase
} from '../purchaseEvent'
import { mapCanonicalPurchaseToGoogleDataManager } from './mapCanonicalPurchaseToGoogleDataManager'

const emailHash = 'a'.repeat(64)
const { Event: DataManagerEvent } =
  protos.google.ads.datamanager.v1

function normalize(
  event: protos.google.ads.datamanager.v1.Event
) {
  assert.equal(DataManagerEvent.verify(event), null)

  return DataManagerEvent.toObject(event, {
    defaults: false,
    enums: String,
    longs: Number
  })
}

function purchase(
  overrides: Partial<CanonicalPurchase> = {}
): CanonicalPurchase {
  const orderLegacyId = '6960826777848'

  return {
    schema_version: 1,
    event_name: 'purchase',
    event_id: deterministicPurchaseEventId(orderLegacyId),
    event_time: '2026-07-16T11:04:57.000Z',
    source: 'server',
    environment: 'production',
    page_url: 'https://utekos.no/skreddersy-varmen',
    referrer_url: 'https://facebook.com/',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'granted',
      source: 'cookiebot',
      version: '1'
    },
    browser_id: {
      ga_client_id: '1773610784.1784104343'
    },
    click_id: {
      fbclid: 'meta-click-id'
    },
    external_id: 'customer-123',
    client_ip_address: '46.15.198.87',
    event_device_info: {
      user_agent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X)'
    },
    location: {
      city: 'Horten',
      country_code: 'NO',
      postal_code: '3182',
      region_code: '07',
      source: 'ip_geolocation'
    },
    user_data: {
      email_sha256: [emailHash]
    },
    custom_data: {
      currency: 'NOK',
      value: 1969.1,
      tax_value: 0,
      shipping_value: 0,
      transaction_id: shopifyPurchaseTransactionId(orderLegacyId),
      order_name: '1859',
      items: [
        {
          item_id: '43959919051000',
          item_name: 'Utekos TechDown™',
          quantity: 1,
          unit_price: 1790,
          sku: 'TECHDOWN-HAVDYP-L'
        }
      ]
    },
    ...overrides
  }
}

test('maps a canonical purchase to a Google Data Manager event', () => {
  const mapped = normalize(
    mapCanonicalPurchaseToGoogleDataManager(purchase())
  )

  assert.equal(mapped.eventName, 'purchase')
  assert.equal(
    mapped.transactionId,
    'shopify_order_6960826777848'
  )
  assert.equal(mapped.clientId, '1773610784.1784104343')
  assert.equal(mapped.currency, 'NOK')
  assert.equal(mapped.conversionValue, 1969.1)
  assert.equal(mapped.eventDeviceInfo?.ipAddress, undefined)
  assert.deepEqual(mapped.userData, {
    userIdentifiers: [{ emailAddress: emailHash }]
  })
  assert.equal(mapped.cartData?.items?.[0]?.itemId, '43959919051000')
})

test('requires granted analytics consent', () => {
  assert.throws(
    () =>
      mapCanonicalPurchaseToGoogleDataManager(
        purchase({
          consent: {
            analytics: 'denied',
            marketing: 'granted',
            preferences: 'granted',
            source: 'cookiebot',
            version: '1'
          }
        })
      ),
    /granted analytics consent/
  )
})

test('accepts GCLID as the only Google Analytics identifier', () => {
  const mapped = normalize(
    mapCanonicalPurchaseToGoogleDataManager(
      purchase({
        browser_id: undefined,
        external_id: undefined,
        click_id: { gclid: 'google-click-id' }
      })
    )
  )

  assert.equal(mapped.clientId, undefined)
  assert.equal(mapped.userId, undefined)
  assert.deepEqual(mapped.adIdentifiers, {
    gclid: 'google-click-id'
  })
})

test('accepts User-ID as the only Google Analytics identifier', () => {
  const mapped = normalize(
    mapCanonicalPurchaseToGoogleDataManager(
      purchase({
        browser_id: undefined,
        click_id: undefined,
        external_id: 'shopify_customer_123'
      })
    )
  )

  assert.equal(mapped.clientId, undefined)
  assert.equal(mapped.userId, 'shopify_customer_123')
  assert.equal(mapped.adIdentifiers, undefined)
})

test('rejects hashed userData as the only identifier', () => {
  assert.throws(
    () =>
      mapCanonicalPurchaseToGoogleDataManager(
        purchase({
          browser_id: undefined,
          click_id: undefined,
          external_id: undefined,
          user_data: { email_sha256: [emailHash] }
        })
      ),
    /clientId, GCLID, or User-ID/
  )
})

test('rejects an empty purchase item list', () => {
  const event = purchase()

  assert.throws(
    () =>
      canonicalPurchaseSchema.parse({
        ...event,
        custom_data: { ...event.custom_data, items: [] }
      }),
    /Too small/
  )
})

test('maps documented cart discounts, coupon and item revenue', () => {
  const event = purchase()
  event.custom_data.item_revenue = 0
  event.custom_data.transaction_discount = 1592
  event.custom_data.coupon_codes = ['FULLDISCOUNT']
  event.custom_data.items[0] = {
    item_id: '43959919051000',
    item_name: 'Utekos TechDown™',
    quantity: 1,
    unit_price: 0,
    final_unit_price: 0,
    discount: 1592,
    sku: 'TECHDOWN-HAVDYP-L'
  }

  const mapped = normalize(
    mapCanonicalPurchaseToGoogleDataManager(event)
  )

  assert.equal(mapped.conversionValue, 0)
  assert.equal(mapped.cartData?.transactionDiscount, 1592)
  assert.deepEqual(mapped.cartData?.couponCodes, ['FULLDISCOUNT'])
  assert.equal(mapped.cartData?.items?.[0]?.unitPrice, 0)
  assert.deepEqual(
    mapped.cartData?.items?.[0]?.additionalItemParameters,
    [
      { parameterName: 'item_name', value: 'Utekos TechDown™' },
      { parameterName: 'sku', value: 'TECHDOWN-HAVDYP-L' },
      { parameterName: 'discount', value: '1592' }
    ]
  )
})
