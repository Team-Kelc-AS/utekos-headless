import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalBeginCheckoutSchema } from '../beginCheckoutEvent'
import {
  buildMicrosoftUetCapiBeginCheckoutRequest,
  mapCanonicalBeginCheckoutToMicrosoftUet
} from './mapCanonicalBeginCheckoutToMicrosoftUet'

function beginCheckout(overrides: Record<string, unknown> = {}) {
  return canonicalBeginCheckoutSchema.parse({
    schema_version: 1,
    event_name: 'begin_checkout',
    event_id: '71c2ef59-6e6f-4f56-a63a-567ca398f9de',
    event_time: '2026-07-17T10:10:00.000Z',
    source: 'web',
    environment: 'test',
    page_view_id: '22222222-2222-4222-8222-222222222222',
    page_url: 'https://utekos.no/checkout',
    page_title: 'Checkout',
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
    custom_data: {
      currency: 'NOK',
      value: 2490,
      gross_value: 2490,
      tax_value: 498,
      cart_id: 'cart_1',
      checkout_id: 'checkout_abc',
      creation_revision: '1',
      items: [
        {
          available_for_sale: true,
          collection_ids: [],
          collection_titles: [],
          currently_not_in_stock: false,
          gross_unit_price: 2490,
          item_id: 'gid://shopify/ProductVariant/42903234609400',
          item_name: 'Utekos Dun',
          price_includes_tax: true,
          product_handle: 'utekos-dun',
          product_id: 'gid://shopify/Product/1',
          quantity: 1,
          quantity_available: 1,
          selected_options: [],
          tax_amount: 498,
          tax_rate: 0.25,
          taxable: true,
          unit_price: 2490,
          variant_id: 'gid://shopify/ProductVariant/42903234609400'
        }
      ]
    },
    ...overrides
  })
}

test('maps canonical begin_checkout to Microsoft UET CAPI custom event', () => {
  const event = mapCanonicalBeginCheckoutToMicrosoftUet(beginCheckout())

  assert.equal(event.eventType, 'custom')
  assert.equal(event.eventName, 'begin_checkout')
  assert.equal(event.eventId, '71c2ef59-6e6f-4f56-a63a-567ca398f9de')
  assert.equal(
    event.userData.msclkid,
    'dd4afccc-b1c9-4a4c-ad95-44dd7e5006ab'
  )
  assert.equal(
    event.userData.anonymousId,
    '550e8400-e29b-41d4-a716-446655440000'
  )
  assert.equal(
    event.pageLoadId,
    '22222222-2222-4222-8222-222222222222'
  )
  assert.equal(event.customData.pageType, 'cart')
  assert.equal(event.customData.value, 2490)
  assert.equal(event.customData.currency, 'NOK')
  assert.equal(event.customData.transactionId, 'checkout_abc')
  assert.deepEqual(event.customData.itemIds, ['42903234609400'])
  assert.deepEqual(event.customData.items?.[0], {
    id: '42903234609400',
    name: 'Utekos Dun',
    price: 2490,
    quantity: 1
  })
})

test('builds the documented Microsoft UET CAPI request body', () => {
  const request = buildMicrosoftUetCapiBeginCheckoutRequest(
    beginCheckout()
  )

  assert.equal(request.dataProvider, 'utekos-headless')
  assert.equal(request.continueOnValidationError, false)
  assert.equal(request.data[0]?.eventName, 'begin_checkout')
})

test('rejects mapping without marketing consent', () => {
  assert.throws(
    () =>
      mapCanonicalBeginCheckoutToMicrosoftUet(
        beginCheckout({
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
