import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildRemoveFromCartDataLayerEvent,
  canonicalRemoveFromCartCustomDataSchema,
  createCanonicalRemoveFromCart
} from '@/lib/analytics/removeFromCartEvent'

const item = {
  item_id: 'gid://shopify/ProductVariant/123',
  product_id: 'gid://shopify/Product/456',
  variant_id: 'gid://shopify/ProductVariant/123',
  item_name: 'Utekos TechDown',
  product_handle: 'utekos-techdown',
  quantity: 2,
  unit_price: 1432,
  gross_unit_price: 1790,
  tax_amount: 358,
  tax_rate: 0.25,
  taxable: true,
  price_includes_tax: true,
  available_for_sale: true,
  currently_not_in_stock: false,
  quantity_available: 8,
  selected_options: [],
  collection_ids: [],
  collection_titles: []
}

test('custom_data requires cart_id and cart_mutation_id', () => {
  assert.throws(() =>
    canonicalRemoveFromCartCustomDataSchema.parse({
      currency: 'NOK',
      value: 2864,
      gross_value: 3580,
      tax_value: 716,
      items: [item]
    })
  )
})

test('createCanonicalRemoveFromCart accepts cart commerce payload', () => {
  const event = createCanonicalRemoveFromCart({
    environment: 'production',
    eventId: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
    eventTime: '2026-07-24T00:00:00.000Z',
    pageUrl: 'https://utekos.no/produkter/utekos-techdown',
    pageTitle: 'Utekos TechDown',
    pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    customData: {
      cart_id: 'gid://shopify/Cart/abc',
      cart_mutation_id: 'cart-mutation-remove-1',
      currency: 'NOK',
      value: 2864,
      gross_value: 3580,
      tax_value: 716,
      items: [item]
    }
  })

  assert.equal(event.event_name, 'remove_from_cart')
  assert.equal(event.custom_data.cart_id, 'gid://shopify/Cart/abc')
  assert.equal(event.custom_data.cart_mutation_id, 'cart-mutation-remove-1')
  assert.equal(event.custom_data.gross_value, 3580)
  assert.equal(event.custom_data.items[0]?.quantity, 2)

  const dataLayer = buildRemoveFromCartDataLayerEvent(event)
  assert.equal(dataLayer.event, 'remove_from_cart')
  assert.equal(dataLayer.event_id, event.event_id)
  assert.equal(dataLayer.custom_data.cart_mutation_id, 'cart-mutation-remove-1')
})
