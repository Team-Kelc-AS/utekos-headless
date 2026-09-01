import assert from 'node:assert/strict'
import test from 'node:test'
import type { CanonicalPurchase } from '../purchaseEvent'
import { mapCanonicalPurchaseToMeta } from './mapCanonicalPurchaseToMeta'

function purchase(): CanonicalPurchase {
  return {
    schema_version: 1,
    event_name: 'purchase',
    event_id: '0dd12184-386f-4e87-b6dc-ce62883b8273',
    event_time: '2026-07-18T22:10:49.000Z',
    source: 'webhook',
    environment: 'production',
    page_url: 'https://utekos.no/produkter/utekos-stapper',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    custom_data: {
      currency: 'NOK',
      value: 0,
      item_revenue: 0,
      transaction_discount: 159.2,
      transaction_id: 'shopify_order_6964976517368',
      order_name: '1867',
      items: [
        {
          item_id: '42903954292984',
          item_name: 'Utekos Stapper™',
          quantity: 1,
          unit_price: 0,
          final_unit_price: 0,
          discount: 159.2
        }
      ]
    }
  }
}

test('omits a zero item price instead of reporting the gross price', () => {
  const normalized =
    mapCanonicalPurchaseToMeta(purchase()).normalize()

  assert.equal(normalized.custom_data.value, 0)
  assert.equal(
    normalized.custom_data.contents[0]?.item_price,
    undefined
  )
})

test('uses the final customer-facing item price for Meta contents', () => {
  const event = purchase()
  event.custom_data.value = 149.25
  event.custom_data.items[0]!.unit_price = 159.2
  event.custom_data.items[0]!.final_unit_price = 149.25

  const normalized =
    mapCanonicalPurchaseToMeta(event).normalize()

  assert.equal(
    normalized.custom_data.contents[0]?.item_price,
    149.25
  )
})

test('keeps compatibility with historical canonical purchase rows', () => {
  const event = purchase()
  delete event.custom_data.items[0]!.final_unit_price
  event.custom_data.items[0]!.unit_price = 199

  const normalized =
    mapCanonicalPurchaseToMeta(event).normalize()

  assert.equal(
    normalized.custom_data.contents[0]?.item_price,
    199
  )
})

test('maps the verified customer segment inside custom_data', () => {
  const event = purchase()
  event.custom_data.customer_segmentation =
    'existing_customer_to_business'

  const normalized =
    mapCanonicalPurchaseToMeta(event).normalize()

  assert.equal(
    normalized.custom_data.customer_segmentation,
    'existing_customer_to_business'
  )
})
