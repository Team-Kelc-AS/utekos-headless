import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canonicalAddToWishlistCustomDataSchema,
  createCanonicalAddToWishlist
} from '@/lib/analytics/addToWishlistEvent'

const item = {
  item_id: 'gid://shopify/ProductVariant/123',
  product_id: 'gid://shopify/Product/456',
  variant_id: 'gid://shopify/ProductVariant/123',
  item_name: 'Utekos TechDown',
  product_handle: 'utekos-techdown',
  quantity: 1,
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

test('custom_data requires wishlist_mutation_id and commerce values', () => {
  assert.throws(() =>
    canonicalAddToWishlistCustomDataSchema.parse({
      currency: 'NOK',
      value: 1432,
      gross_value: 1790,
      tax_value: 358,
      items: [item]
    })
  )
})

test('createCanonicalAddToWishlist accepts full commerce wishlist payload', () => {
  const event = createCanonicalAddToWishlist({
    environment: 'production',
    eventId: '72b6c4d3-cf47-493b-844c-147e237fcf45',
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
      wishlist_mutation_id: 'mutation-1',
      currency: 'NOK',
      value: 1432,
      gross_value: 1790,
      tax_value: 358,
      items: [item]
    }
  })

  assert.equal(event.event_name, 'add_to_wishlist')
  assert.equal(event.custom_data.wishlist_mutation_id, 'mutation-1')
  assert.equal(event.custom_data.gross_value, 1790)
})
