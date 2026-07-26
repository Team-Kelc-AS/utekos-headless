import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createCanonicalViewItem,
  type CanonicalViewItem,
  type CanonicalViewItemCommerce
} from '../viewItemEvent'
import { acceptCanonicalViewItem } from './acceptCanonicalViewItem'
import type { CanonicalEventStore } from './canonicalEventStore'
import { handleCanonicalViewItemRequest } from './handleCanonicalViewItemRequest'
import { mapCanonicalPageViewPersistence } from './mapCanonicalPageViewPersistence'
import { normalizeCanonicalViewItem } from './normalizeCanonicalViewItem'

const insertedAcceptance = {
  createdDispatchAttempts: [],
  status: 'inserted' as const
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
} satisfies CanonicalViewItemCommerce

function viewItem(
  consent: {
    analytics: 'denied' | 'granted'
    marketing: 'denied' | 'granted'
  } = { analytics: 'granted', marketing: 'granted' }
) {
  return createCanonicalViewItem({
    browserId: { fbp: 'fb.1.123' },
    clickId: { gclid: 'click-1' },
    commerce,
    consent: {
      analytics: consent.analytics,
      marketing: consent.marketing,
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    environment: 'test',
    eventDeviceInfo: {
      language: 'nb-NO',
      userAgent: 'browser supplied'
    },
    eventId: '11111111-1111-4111-8111-111111111111',
    eventTime: '2026-07-15T12:00:00.000Z',
    externalId: 'customer-1',
    pageTitle: 'Utekos Techdown | Utekos',
    pageUrl: 'https://utekos.no/produkter/utekos-techdown',
    pageViewId: '22222222-2222-4222-8222-222222222222'
  })
}

test('normalizes view_item with trusted request context', () => {
  const event = normalizeCanonicalViewItem(viewItem(), {
    city: 'Oslo',
    clientIpAddress: '198.51.100.42',
    countryCode: 'no',
    regionCode: '03',
    userAgent: 'trusted user agent'
  })

  assert.equal(event.client_ip_address, '198.51.100.42')
  assert.equal(
    event.event_device_info?.user_agent,
    'trusted user agent'
  )
  assert.equal(event.location?.country_code, 'NO')
  assert.equal(event.location?.source, 'ip_geolocation')
  assert.equal(event.browser_id?.fbp, 'fb.1.123')
})

test('removes marketing identifiers without marketing consent', () => {
  const event = normalizeCanonicalViewItem(
    viewItem({ analytics: 'granted', marketing: 'denied' }),
    {
      clientIpAddress: '198.51.100.42',
      userAgent: 'trusted user agent'
    }
  )

  assert.equal(event.browser_id, undefined)
  assert.equal(event.click_id, undefined)
  assert.equal(event.client_ip_address, undefined)
  assert.equal(event.external_id, undefined)
})

test('rejects view_item when all collection purposes are denied', async () => {
  let accepted = false
  const store: CanonicalEventStore = {
    accept: async () => {
      accepted = true
      return insertedAcceptance
    }
  }

  const result = await acceptCanonicalViewItem({
    payload: viewItem({
      analytics: 'denied',
      marketing: 'denied'
    }),
    requestContext: {},
    store
  })

  assert.deepEqual(result, {
    reason: 'consent_denied',
    status: 'rejected'
  })
  assert.equal(accepted, false)
})

test('persists view_item with an event-specific idempotency key', () => {
  const event = viewItem()
  const result = mapCanonicalPageViewPersistence({
    dispatches: [],
    event
  })

  assert.equal(
    result.ledger.idempotency_key,
    `view_item:${event.event_id}`
  )
  assert.equal(result.ledger.event_name, 'view_item')
})

test('accepts a same-origin JSON view_item request', async () => {
  const accepted: CanonicalViewItem[] = []
  const request = new Request(
    'https://utekos.no/api/events/view-item',
    {
      body: JSON.stringify(viewItem()),
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://utekos.no'
      },
      method: 'POST'
    }
  )

  const response = await handleCanonicalViewItemRequest(
    request,
    {
      getRequestContext: () => ({
        userAgent: 'trusted user agent'
      }),
      store: {
        accept: async input => {
          accepted.push(input.event as CanonicalViewItem)
          return insertedAcceptance
        }
      }
    }
  )

  assert.equal(response.status, 202)
  assert.equal(
    response.headers.get('cache-control'),
    'no-store, max-age=0'
  )
  assert.equal(accepted.length, 1)
  assert.equal(accepted[0]?.event_name, 'view_item')
})

test('rejects a cross-origin view_item request', async () => {
  const request = new Request(
    'https://utekos.no/api/events/view-item',
    {
      body: JSON.stringify(viewItem()),
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://example.com'
      },
      method: 'POST'
    }
  )

  const response = await handleCanonicalViewItemRequest(
    request,
    {
      getRequestContext: () => ({}),
      store: { accept: async () => insertedAcceptance }
    }
  )

  assert.equal(response.status, 403)
})
