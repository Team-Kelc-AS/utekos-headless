import assert from 'node:assert/strict'
import test from 'node:test'
import { createCanonicalRemoveFromCart } from '@/lib/analytics/removeFromCartEvent'
import { mapCanonicalRemoveFromCartToMeta } from '@/lib/analytics/server/mapCanonicalRemoveFromCartToMeta'

const item = {
  item_id: 'gid://shopify/ProductVariant/46944403882232',
  product_id: 'gid://shopify/Product/456',
  variant_id: 'gid://shopify/ProductVariant/46944403882232',
  item_name: 'Utekos TechDown',
  product_handle: 'utekos-techdown',
  quantity: 1,
  unit_price: 1272,
  gross_unit_price: 1590,
  tax_amount: 318,
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

test('maps remove_from_cart to Meta RemoveFromCart with commerce', () => {
  const event = createCanonicalRemoveFromCart({
    environment: 'production',
    eventId: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
    eventTime: '2026-07-24T01:00:00.000Z',
    pageUrl: 'https://utekos.no/',
    pageTitle: 'Utekos',
    pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'granted',
      source: 'cookiebot',
      version: '1'
    },
    customData: {
      cart_id: 'gid://shopify/Cart/abc',
      cart_mutation_id: 'cart-mutation-remove-meta-1',
      currency: 'NOK',
      value: 1272,
      gross_value: 1590,
      tax_value: 318,
      items: [item]
    }
  })

  const serverEvent = mapCanonicalRemoveFromCartToMeta(event)
  const payload = serverEvent.normalize()

  assert.equal(payload.event_name, 'RemoveFromCart')
  assert.equal(payload.event_id, event.event_id)
  assert.equal(payload.action_source, 'website')
  assert.equal(payload.custom_data?.currency, 'NOK')
  assert.equal(payload.custom_data?.value, 1590)
  assert.deepEqual(payload.custom_data?.content_ids, [
    '46944403882232'
  ])
})
