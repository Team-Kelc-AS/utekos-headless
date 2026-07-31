import assert from 'node:assert/strict'
import test from 'node:test'
import {
  parseCanonicalEvent,
  type ImplementedCanonicalEventName
} from './canonicalEvent'
import { canonicalEventNames, eventCatalog } from './eventCatalog'
import { createCanonicalPageView } from './pageViewEvent'
import { canonicalRefundSchema } from './refundEvent'
import { createCanonicalViewItem } from './viewItemEvent'

const consent = {
  analytics: 'granted' as const,
  marketing: 'denied' as const,
  preferences: 'denied' as const,
  source: 'cookiebot' as const,
  version: '1'
}

test('implemented union covers every active catalog event', () => {
  const implemented = new Set<ImplementedCanonicalEventName>([
    'page_view',
    'view_item',
    'add_to_cart',
    'begin_checkout',
    'purchase',
    'refund',
    'view_item_list',
    'select_item',
    'add_to_wishlist',
    'remove_from_cart',
    'view_cart',
    'search',
    'view_search_results',
    'view_promotion',
    'select_promotion',
    'generate_lead',
    'form_start',
    'form_submit',
    'form_error',
    'filter_apply',
    'sort_apply',
    'variant_select',
    'size_guide_view',
    'scroll_depth',
    'view_category',
    'hero_interact',
    'interact_with_accordion',
    'open_quick_view',
    'video_progress'
  ])

  for (const name of canonicalEventNames.filter(
    eventName => eventCatalog[eventName].lifecycle === 'active'
  )) {
    assert.ok(
      implemented.has(name as ImplementedCanonicalEventName),
      `active catalog event ${name} must be in the implemented union`
    )
  }
})

test('parses supported page_view and view_item events', () => {
  const pageView = createCanonicalPageView({
    environment: 'test',
    eventId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7',
    pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
    eventTime: '2026-07-15T12:34:56.789Z',
    pageUrl: 'https://utekos.no/produkter',
    pageTitle: 'Produkter | Utekos',
    consent
  })
  const viewItem = createCanonicalViewItem({
    environment: 'test',
    eventId: '139b2885-4c04-4afd-8137-029b4f0034a8',
    pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
    eventTime: '2026-07-15T12:34:57.789Z',
    pageUrl: 'https://utekos.no/produkter/utekos-techdown',
    pageTitle: 'Utekos Techdown | Utekos',
    consent,
    commerce: {
      currency: 'NOK',
      value: 100,
      gross_value: 125,
      tax_value: 25,
      items: [
        {
          item_id: 'gid://shopify/ProductVariant/123',
          product_id: 'gid://shopify/Product/456',
          variant_id: 'gid://shopify/ProductVariant/123',
          item_name: 'Utekos Techdown',
          product_handle: 'utekos-techdown',
          quantity: 1,
          unit_price: 100,
          gross_unit_price: 125,
          tax_amount: 25,
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
      ]
    }
  })

  assert.deepEqual(parseCanonicalEvent(pageView), pageView)
  assert.deepEqual(parseCanonicalEvent(viewItem), viewItem)
})

test('rejects blocked_source events without an implemented schema', () => {
  assert.throws(
    () =>
      parseCanonicalEvent({ event_name: 'add_shipping_info' }),
    /Invalid discriminator value/
  )
})

test('parses a legitimate itemless refund without fabricating an item', () => {
  const refund = canonicalRefundSchema.parse({
    schema_version: 1,
    event_name: 'refund',
    event_id: '4fe247d5-d8f8-458f-b09f-a8d8511f2644',
    event_time: '2026-07-22T10:00:00.000Z',
    source: 'webhook',
    environment: 'test',
    consent,
    custom_data: {
      currency: 'NOK',
      value: 49,
      transaction_id: 'shopify_order_555',
      refund_id: 'shopify_refund_900',
      items: []
    }
  })

  assert.deepEqual(refund.custom_data.items, [])
  assert.equal(refund.custom_data.value, 49)
  assert.equal(refund.custom_data.currency, 'NOK')
})
