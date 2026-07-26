import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildInteractWithAccordionDataLayerEvent,
  createCanonicalInteractWithAccordion
} from './interactWithAccordionEvent'
import {
  buildOpenQuickViewDataLayerEvent,
  createCanonicalOpenQuickView
} from './openQuickViewEvent'
import { canonicalViewItemListCustomDataSchema } from './viewItemListEvent'

const item = {
  item_id: 'gid://shopify/ProductVariant/46944403882232',
  product_id: 'gid://shopify/Product/456',
  variant_id: 'gid://shopify/ProductVariant/46944403882232',
  item_name: 'Utekos TechDown',
  product_handle: 'utekos-techdown',
  quantity: 1,
  unit_price: 1_272,
  gross_unit_price: 1_590,
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

const base = {
  environment: 'test' as const,
  eventId: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
  eventTime: '2026-07-26T10:00:00.000Z',
  pageUrl: 'https://utekos.no/produkter/utekos-techdown',
  pageTitle: 'Utekos TechDown',
  pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
  consent: {
    analytics: 'granted' as const,
    marketing: 'granted' as const,
    preferences: 'denied' as const,
    source: 'cookiebot' as const,
    version: '1'
  }
}

const commerce = {
  currency: 'NOK',
  value: 1_272,
  gross_value: 1_590,
  tax_value: 318,
  items: [item]
}

test('creates quick-view dataLayer payload with the canonical event id', () => {
  const event = createCanonicalOpenQuickView({
    ...base,
    customData: {
      ...commerce,
      open_sequence: 1,
      source_surface: 'hytte_pricing'
    }
  })
  const dataLayerEvent = buildOpenQuickViewDataLayerEvent(event)

  assert.equal(dataLayerEvent.event, 'open_quick_view')
  assert.equal(dataLayerEvent.event_id, event.event_id)
  assert.equal(dataLayerEvent.canonical_event.event_id, event.event_id)
  assert.equal(dataLayerEvent.custom_data.items.length, 1)
})

test('accepts only accordion open transitions with a positive sequence', () => {
  const event = createCanonicalInteractWithAccordion({
    ...base,
    customData: {
      ...commerce,
      accordion_id: 'materialer',
      accordion_title: 'Materialer',
      interaction_sequence: 1,
      interaction_type: 'open'
    }
  })
  const dataLayerEvent =
    buildInteractWithAccordionDataLayerEvent(event)

  assert.equal(dataLayerEvent.event, 'interact_with_accordion')
  assert.equal(dataLayerEvent.event_id, event.event_id)
  assert.equal(dataLayerEvent.custom_data.interaction_type, 'open')
  assert.throws(() =>
    createCanonicalInteractWithAccordion({
      ...base,
      customData: {
        ...event.custom_data,
        interaction_sequence: 0
      }
    })
  )
})

test('enforces maximum 20 items and a truthful total list count', () => {
  const twentyItems = Array.from({ length: 20 }, (_, index) => ({
    ...item,
    item_id: `${item.item_id}-${index}`,
    variant_id: `${item.variant_id}-${index}`
  }))

  assert.equal(
    canonicalViewItemListCustomDataSchema.safeParse({
      ...commerce,
      impression_sequence: 1,
      item_list_id: 'featured_products',
      item_list_name: 'Utvalgte produkter',
      items: twentyItems,
      total_item_count: 20
    }).success,
    true
  )
  assert.equal(
    canonicalViewItemListCustomDataSchema.safeParse({
      ...commerce,
      impression_sequence: 1,
      item_list_id: 'featured_products',
      item_list_name: 'Utvalgte produkter',
      items: [...twentyItems, item],
      total_item_count: 21
    }).success,
    false
  )
  assert.equal(
    canonicalViewItemListCustomDataSchema.safeParse({
      ...commerce,
      impression_sequence: 1,
      item_list_id: 'featured_products',
      item_list_name: 'Utvalgte produkter',
      items: twentyItems,
      total_item_count: 19
    }).success,
    false
  )
})
