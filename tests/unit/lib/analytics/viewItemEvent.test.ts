import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildViewItemDataLayerEvent,
  createCanonicalViewItem,
  type CanonicalViewItemCommerce
} from '@/lib/analytics/viewItemEvent'

const consent = {
  analytics: 'granted' as const,
  marketing: 'denied' as const,
  preferences: 'denied' as const,
  source: 'cookiebot' as const,
  version: '1'
}

const commerce = {
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
      item_brand: 'Utekos',
      item_variant: 'Marineblå / M',
      item_category: 'Poncho',
      product_handle: 'utekos-techdown',
      product_type: 'Poncho',
      sku: 'UT-TD-NAVY-M',
      gtin: '0700000000001',
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
      selected_options: [
        { name: 'Farge', value: 'Marineblå' },
        { name: 'Størrelse', value: 'M' }
      ],
      collection_ids: ['gid://shopify/Collection/789'],
      collection_titles: ['Ponchoer']
    }
  ]
} satisfies CanonicalViewItemCommerce

test('builds a canonical view_item with commerce and journey context', () => {
  const event = createCanonicalViewItem({
    environment: 'preview',
    eventId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7',
    pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
    eventTime: '2026-07-15T12:34:56.789Z',
    pageUrl:
      'https://utekos.no/produkter/utekos-techdown?variant=123',
    referrerUrl: 'https://utekos.no/produkter',
    pageTitle: 'Utekos Techdown | Utekos',
    consent,
    commerce,
    browserId: { ga_client: 'GA1.1.123.456' },
    clickId: { gclid: 'google-click-1' },
    impressionId: 'impression-1',
    eventDeviceInfo: {
      language: 'nb-NO',
      viewportHeight: 844,
      viewportWidth: 390
    }
  })

  assert.equal(event.event_name, 'view_item')
  assert.equal(event.event_time, '2026-07-15T12:34:56.789Z')
  assert.equal(
    event.page_view_id,
    '0c955d6b-5e9c-47d0-b304-046df7f4bf7f'
  )
  assert.equal(event.custom_data.currency, 'NOK')
  assert.equal(event.custom_data.value, 100)
  assert.equal(event.custom_data.items[0]?.sku, 'UT-TD-NAVY-M')
  assert.deepEqual(event.browser_id, {
    ga_client: 'GA1.1.123.456'
  })
})

test('keeps the dataLayer payload provider-neutral', () => {
  const event = createCanonicalViewItem({
    environment: 'production',
    eventId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7',
    pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
    eventTime: '2026-07-15T12:34:56.789Z',
    pageUrl: 'https://utekos.no/produkter/utekos-techdown',
    pageTitle: 'Utekos Techdown | Utekos',
    consent,
    commerce
  })

  const dataLayerEvent = buildViewItemDataLayerEvent(event)

  assert.equal(dataLayerEvent.event, 'view_item')
  assert.equal(dataLayerEvent.transaction_id, event.event_id)
  assert.equal(dataLayerEvent.commerce, event.custom_data)
  assert.equal(dataLayerEvent.canonical_event, event)
  assert.equal('ecommerce' in dataLayerEvent, false)
})

test('rejects an invalid canonical view_item', () => {
  assert.throws(
    () =>
      createCanonicalViewItem({
        environment: 'production',
        eventId: 'not-a-uuid',
        pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
        eventTime: 'yesterday',
        pageUrl: 'https://utekos.no/produkter/utekos-techdown',
        pageTitle: 'Utekos Techdown | Utekos',
        consent,
        commerce
      }),
    /Invalid/
  )
})
