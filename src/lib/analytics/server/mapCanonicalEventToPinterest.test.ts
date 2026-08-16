import assert from 'node:assert/strict'
import test from 'node:test'

import type { CanonicalViewItem } from '../viewItemEvent'
import { mapCanonicalEventToPinterest } from './mapCanonicalEventToPinterest'

const CANONICAL_ITEM_ID =
  'gid://shopify/ProductVariant/123456789'
const CANONICAL_PRODUCT_ID = 'gid://shopify/Product/1'
const CANONICAL_VARIANT_ID =
  'gid://shopify/ProductVariant/123456789'
const PINTEREST_PRODUCT_ID = '123456789'

function viewItem(
  overrides: Partial<CanonicalViewItem> = {}
): CanonicalViewItem {
  return {
    schema_version: 1,
    event_name: 'view_item',
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    page_view_id: 'ed4fb82a-f2f2-41f9-978a-3f99cf64ec2f',
    event_time: '2026-08-16T10:00:00.000Z',
    source: 'web',
    environment: 'test',
    page_url: 'https://utekos.no/produkter/comfyrobe',
    page_title: 'Comfyrobe™ | Utekos',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    custom_data: {
      currency: 'NOK',
      value: 799.2,
      gross_value: 999,
      tax_value: 199.8,
      items: [
        {
          item_id: CANONICAL_ITEM_ID,
          product_id: CANONICAL_PRODUCT_ID,
          variant_id: CANONICAL_VARIANT_ID,
          item_name: 'Comfyrobe™',
          item_brand: 'Utekos',
          product_handle: 'comfyrobe',
          quantity: 1,
          unit_price: 799.2,
          gross_unit_price: 999,
          tax_amount: 199.8,
          tax_rate: 0.25,
          taxable: true,
          price_includes_tax: true,
          available_for_sale: true,
          currently_not_in_stock: false,
          quantity_available: 20,
          selected_options: [
            { name: 'Farge', value: 'Fjellnatt' }
          ],
          collection_ids: [],
          collection_titles: []
        }
      ]
    },
    ...overrides
  }
}

test('maps Canonical GID item_id to Pinterest Catalog product ids', () => {
  const event = viewItem()
  const mapped = mapCanonicalEventToPinterest(event)

  assert.equal(
    event.custom_data.items[0]?.item_id,
    CANONICAL_ITEM_ID
  )
  assert.equal(
    event.custom_data.items[0]?.product_id,
    CANONICAL_PRODUCT_ID
  )
  assert.equal(
    event.custom_data.items[0]?.variant_id,
    CANONICAL_VARIANT_ID
  )
  assert.deepEqual(mapped?.custom_data?.content_ids, [
    PINTEREST_PRODUCT_ID
  ])
  assert.equal(
    mapped?.custom_data?.contents?.[0]?.id,
    PINTEREST_PRODUCT_ID
  )
})

test('does not use Canonical product_id as the Pinterest content id', () => {
  const event = viewItem()
  event.custom_data.items[0]!.product_id =
    'gid://shopify/Product/999'
  event.custom_data.items[0]!.variant_id =
    'gid://shopify/ProductVariant/999'

  const mapped = mapCanonicalEventToPinterest(event)

  assert.equal(
    mapped?.custom_data?.contents?.[0]?.id,
    PINTEREST_PRODUCT_ID
  )
  assert.equal(
    event.custom_data.items[0]?.item_id,
    CANONICAL_ITEM_ID
  )
  assert.equal(
    event.custom_data.items[0]?.product_id,
    'gid://shopify/Product/999'
  )
  assert.equal(
    event.custom_data.items[0]?.variant_id,
    'gid://shopify/ProductVariant/999'
  )
})

test('forwards Canonical epik as Pinterest user_data.click_id', () => {
  const mapped = mapCanonicalEventToPinterest(
    viewItem({
      click_id: { epik: 'PinterestClickId-1' }
    })
  )

  assert.equal(mapped?.user_data.click_id, 'PinterestClickId-1')
})
