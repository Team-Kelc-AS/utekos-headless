import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalAddToCartSchema } from '../addToCartEvent'
import {
  buildMicrosoftUetCapiAddToCartRequest,
  mapCanonicalAddToCartToMicrosoftUet
} from './mapCanonicalAddToCartToMicrosoftUet'

function addToCart(overrides: Record<string, unknown> = {}) {
  return canonicalAddToCartSchema.parse({
    schema_version: 1,
    event_name: 'add_to_cart',
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    event_time: '2026-07-17T10:05:00.000Z',
    source: 'web',
    environment: 'test',
    page_view_id: '11111111-1111-4111-8111-111111111111',
    page_url: 'https://utekos.no/produkter/utekos-dun',
    page_title: 'Utekos Dun',
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
      cart_mutation_id: 'mutation_abc',
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

test('maps canonical add_to_cart to Microsoft UET CAPI custom event', () => {
  const event = mapCanonicalAddToCartToMicrosoftUet(addToCart())

  assert.equal(event.eventType, 'custom')
  assert.equal(event.eventName, 'add_to_cart')
  assert.equal(event.eventId, '61c2ef59-6e6f-4f56-a63a-567ca398f9de')
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
    '11111111-1111-4111-8111-111111111111'
  )
  assert.equal(event.customData.pageType, 'product')
  assert.equal(event.customData.value, 2490)
  assert.equal(event.customData.currency, 'NOK')
  assert.equal(event.customData.transactionId, 'mutation_abc')
  assert.deepEqual(event.customData.itemIds, ['42903234609400'])
  assert.deepEqual(event.customData.items?.[0], {
    id: '42903234609400',
    name: 'Utekos Dun',
    price: 2490,
    quantity: 1
  })
})

test('builds the documented Microsoft UET CAPI request body', () => {
  const request = buildMicrosoftUetCapiAddToCartRequest(addToCart())

  assert.equal(request.dataProvider, 'utekos-headless')
  assert.equal(request.continueOnValidationError, false)
  assert.equal(request.data[0]?.eventName, 'add_to_cart')
})

test('rejects mapping without marketing consent', () => {
  assert.throws(
    () =>
      mapCanonicalAddToCartToMicrosoftUet(
        addToCart({
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
