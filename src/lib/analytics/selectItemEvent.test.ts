import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildSelectItemDataLayerEvent,
  canonicalSelectItemCustomDataSchema,
  createCanonicalSelectItem
} from './selectItemEvent'

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

test('custom_data requires currency and gross_value for Meta commerce parity', () => {
  assert.throws(() =>
    canonicalSelectItemCustomDataSchema.parse({
      interaction_id: 'int-1',
      item_list_id: 'frontpage_featured',
      items: [item]
    })
  )
})

test('createCanonicalSelectItem accepts full commerce select payload', () => {
  const event = createCanonicalSelectItem({
    environment: 'production',
    eventId: '72b6c4d3-cf47-493b-844c-147e237fcf45',
    eventTime: '2026-07-24T00:00:00.000Z',
    pageUrl: 'https://utekos.no/',
    pageTitle: 'Utekos',
    pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    customData: {
      interaction_id: 'int-1',
      item_list_id: 'frontpage_featured',
      destination_url:
        'https://utekos.no/produkter/utekos-techdown',
      currency: 'NOK',
      value: 1432,
      gross_value: 1790,
      tax_value: 358,
      items: [item]
    }
  })

  assert.equal(event.event_name, 'select_item')
  assert.equal(
    event.custom_data.item_list_id,
    'frontpage_featured'
  )
  assert.equal(event.custom_data.gross_value, 1790)

  const dataLayerEvent = buildSelectItemDataLayerEvent(event)
  assert.equal(dataLayerEvent.transaction_id, event.event_id)
  assert.equal(dataLayerEvent.commerce, event.custom_data)
  assert.equal(dataLayerEvent.custom_data, event.custom_data)
})
