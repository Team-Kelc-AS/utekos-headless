import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalAddPaymentInfoSchema } from '../addPaymentInfoEvent'
import { mapCanonicalAddPaymentInfoToGoogleDataManager } from './mapCanonicalAddPaymentInfoToGoogleDataManager'

const event = canonicalAddPaymentInfoSchema.parse({
  schema_version: 1,
  event_name: 'add_payment_info',
  event_id: '4487f69d-7b0b-4a62-a349-748c2fe20e16',
  event_time: '2026-08-04T10:05:00.000Z',
  source: 'web',
  environment: 'test',
  browser_id: { ga_client_id: '1234567890.987654321' },
  consent: {
    analytics: 'granted',
    marketing: 'denied',
    preferences: 'denied',
    source: 'cookiebot',
    version: '1'
  },
  custom_data: {
    currency: 'NOK',
    value: 2490,
    gross_value: 2490,
    tax_value: 498,
    checkout_id: 'checkout-token',
    payment_revision: 'shopify-payment-event-1',
    begin_checkout_event_id:
      '71c2ef59-6e6f-4f56-a63a-567ca398f9de',
    items: [
      {
        item_id: 'variant-1',
        item_name: 'Utekos Dun',
        unit_price: 2490,
        gross_unit_price: 2490,
        quantity: 1,
        tax_amount: 498,
        tax_rate: 0.25,
        taxable: true,
        price_includes_tax: true,
        product_id: 'product-1',
        variant_id: 'variant-1',
        product_handle: 'utekos-dun',
        available_for_sale: true,
        currently_not_in_stock: false,
        quantity_available: 3,
        collection_ids: [],
        collection_titles: [],
        selected_options: []
      }
    ]
  }
})

test('maps the canonical event to the documented GA add_payment_info shape', () => {
  const mapped =
    mapCanonicalAddPaymentInfoToGoogleDataManager(event)

  assert.equal(mapped.eventName, 'add_payment_info')
  assert.equal(mapped.transactionId, event.event_id)
  assert.equal(mapped.clientId, '1234567890.987654321')
  assert.equal(mapped.currency, 'NOK')
  assert.equal(mapped.conversionValue, 2490)
  assert.equal(mapped.cartData?.items?.[0]?.itemId, 'variant-1')
  assert.equal(
    mapped.additionalEventParameters?.some(
      parameter => parameter.parameterName === 'page_location'
    ),
    false
  )
})

test('rejects analytics-denied delivery', () => {
  assert.throws(
    () =>
      mapCanonicalAddPaymentInfoToGoogleDataManager({
        ...event,
        consent: { ...event.consent, analytics: 'denied' }
      }),
    /granted analytics consent/
  )
})
