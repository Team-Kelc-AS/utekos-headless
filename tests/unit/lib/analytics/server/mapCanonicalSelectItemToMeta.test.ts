import assert from 'node:assert/strict'
import test from 'node:test'
import type { CanonicalSelectItem } from '@/lib/analytics/selectItemEvent'
import {
  mapCanonicalSelectItemToMeta,
  resolveMetaSelectItemEventName
} from '@/lib/analytics/server/mapCanonicalSelectItemToMeta'

function selectItem(itemListId: string): CanonicalSelectItem {
  return {
    schema_version: 1,
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'granted',
      source: 'cookiebot',
      version: '1'
    },
    custom_data: {
      interaction_id: 'size-selection-1',
      item_list_id: itemListId,
      currency: 'NOK',
      value: 1432,
      gross_value: 1790,
      tax_value: 358,
      items: [
        {
          item_id: 'gid://shopify/ProductVariant/46944403882232',
          product_id: 'gid://shopify/Product/9240112693496',
          variant_id:
            'gid://shopify/ProductVariant/46944403882232',
          item_name: 'Utekos TechDown™',
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
          selected_options: [
            { name: 'Størrelse', value: 'Middels' }
          ],
          collection_ids: [],
          collection_titles: []
        }
      ]
    },
    environment: 'production',
    event_id: '72b6c4d3-cf47-493b-844c-147e237fcf45',
    event_name: 'select_item',
    event_time: '2026-09-29T10:00:00.000Z',
    page_title: 'Utekos TechDown™',
    page_url: 'https://utekos.no/produkter/techdown',
    source: 'web'
  } as CanonicalSelectItem
}

test('maps TechDown size-selector events to Meta CustomizeProduct', () => {
  const event = selectItem('techdown-size-selector')
  const normalized =
    mapCanonicalSelectItemToMeta(event).normalize()

  assert.equal(
    resolveMetaSelectItemEventName(event),
    'CustomizeProduct'
  )
  assert.equal(normalized.event_name, 'CustomizeProduct')
  assert.equal(normalized.event_id, event.event_id)
  assert.deepEqual(normalized.custom_data?.content_ids, [
    '46944403882232'
  ])
  assert.equal(normalized.custom_data?.content_type, 'product')
  assert.equal(normalized.custom_data?.currency, 'NOK')
  assert.equal(normalized.custom_data?.country, 'Norway')
  assert.equal(normalized.custom_data?.value, 1790)
  assert.equal(
    normalized.custom_data?.interaction_id,
    'size-selection-1'
  )
  assert.equal(
    normalized.custom_data?.item_list_id,
    'techdown-size-selector'
  )
})

test('keeps ordinary product-list selections as SelectItem', () => {
  const event = selectItem('frontpage-featured')

  assert.equal(
    resolveMetaSelectItemEventName(event),
    'SelectItem'
  )
  assert.equal(
    mapCanonicalSelectItemToMeta(event).normalize().event_name,
    'SelectItem'
  )
})
