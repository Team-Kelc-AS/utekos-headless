import assert from 'node:assert/strict'
import test from 'node:test'
import { protos } from '@google-ads/datamanager'
import type { CanonicalRefund } from '@/lib/analytics/refundEvent'
import { mapCanonicalRefundToGoogleDataManager } from '@/lib/analytics/server/mapCanonicalRefundToGoogleDataManager'

function itemlessRefund(): CanonicalRefund {
  return {
    schema_version: 1,
    event_name: 'refund',
    event_id: '4fe247d5-d8f8-458f-b09f-a8d8511f2644',
    event_time: '2026-07-22T10:00:00.000Z',
    source: 'webhook',
    environment: 'test',
    browser_id: { ga_client_id: '123456789.1784201643' },
    consent: {
      analytics: 'granted',
      marketing: 'denied',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    custom_data: {
      currency: 'NOK',
      value: 49,
      transaction_id: 'shopify_order_555',
      refund_id: 'shopify_refund_900',
      items: []
    }
  }
}

test('itemless refund omits Data Manager cartData and preserves event value', () => {
  const mapped =
    mapCanonicalRefundToGoogleDataManager(itemlessRefund())

  const serialized =
    protos.google.ads.datamanager.v1.Event.toObject(mapped)

  assert.equal(mapped.cartData, null)
  assert.equal('cartData' in serialized, false)
  assert.equal(mapped.conversionValue, 49)
  assert.equal(mapped.currency, 'NOK')
  assert.equal(mapped.transactionId, 'shopify_order_555')
  assert.equal(mapped.eventName, 'refund')
})

test('line-item refund keeps normal Data Manager cart mapping', () => {
  const event = itemlessRefund()
  event.custom_data.items = [
    {
      item_id: 'variant-1',
      item_name: 'Utekos Stapper',
      quantity: 1,
      unit_price: 199,
      sku: 'UTEKOS-STAPPER'
    }
  ]

  const mapped = mapCanonicalRefundToGoogleDataManager(event)

  assert.equal(mapped.cartData?.items?.length, 1)
  assert.equal(mapped.cartData?.items?.[0]?.itemId, 'variant-1')
  assert.equal(mapped.cartData?.items?.[0]?.unitPrice, 199)
})
