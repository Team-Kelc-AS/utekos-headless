import assert from 'node:assert/strict'
import test from 'node:test'
import type { ConsentSnapshot } from './pageViewEvent'
import {
  createCanonicalViewItem,
  type CanonicalViewItem,
  type CanonicalViewItemCommerce
} from './viewItemEvent'
import {
  applyViewItemCollectionContext,
  createViewItemCollectorTransport,
  type ResolvedViewItemCollection,
  type ViewItemCollectionContext
} from './viewItemCollectorTransport'

const deniedConsent: ConsentSnapshot = {
  analytics: 'denied',
  marketing: 'denied',
  preferences: 'denied',
  source: 'cookiebot',
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

const baseEvent: CanonicalViewItem = {
  ...createCanonicalViewItem({
    browserId: { fbp: 'old-fbp' },
    clickId: { fbclid: 'old-fbclid' },
    commerce,
    consent: deniedConsent,
    environment: 'test',
    eventDeviceInfo: {
      language: 'nb-NO',
      userAgent: 'browser supplied'
    },
    eventId: '11111111-1111-4111-8111-111111111111',
    eventTime: '2026-07-15T12:00:00.000Z',
    externalId: 'external-1',
    impressionId: 'impression-1',
    location: { city: 'Oslo', source: 'browser_permission' },
    pageTitle: 'Utekos Techdown | Utekos',
    pageUrl:
      'https://utekos.no/produkter/test?fbclid=new-fbclid',
    pageViewId: '22222222-2222-4222-8222-222222222222',
    userData: {
      emailSha256: [
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      ]
    }
  }),
  client_ip_address: '198.51.100.10',
  region_code: '03'
}

function resolveCollection(
  context: ViewItemCollectionContext
): ResolvedViewItemCollection {
  return {
    context,
    event: applyViewItemCollectionContext(baseEvent, context)
  }
}

test('sender straks én gang når analytics-samtykke finnes', () => {
  const sent: CanonicalViewItem[] = []
  let subscriptionCount = 0
  const context: ViewItemCollectionContext = {
    analyticsBrowserId: { ga_cookie: 'GA1.1.1.2' },
    consent: { ...deniedConsent, analytics: 'granted' },
    hasResponse: true
  }
  const start = createViewItemCollectorTransport({
    postEvent: async event => {
      sent.push(event)
    },
    reportError: error => {
      throw error
    },
    resolveCurrentCollection: () => resolveCollection(context),
    subscribeToConsentChanges: () => {
      subscriptionCount += 1
      return () => {}
    }
  })

  start({
    ...baseEvent,
    consent: { ...deniedConsent, analytics: 'granted' }
  })

  assert.equal(sent.length, 1)
  assert.equal(subscriptionCount, 0)

  const sentEvent = sent[0]
  assert.ok(sentEvent)
  assert.deepEqual(sentEvent.browser_id, {
    ga_cookie: 'GA1.1.1.2'
  })
  assert.equal(sentEvent.click_id, undefined)
  assert.equal(sentEvent.client_ip_address, undefined)
  assert.equal(sentEvent.external_id, undefined)
  assert.equal(sentEvent.region_code, undefined)
  assert.equal(sentEvent.user_data, undefined)
  assert.deepEqual(sentEvent.event_device_info, {
    language: 'nb-NO'
  })
})

test('pending view-item is discarded, never subscribed for later replay', () => {
  let sends = 0,
    subscriptions = 0
  const start = createViewItemCollectorTransport({
    postEvent: async () => {
      sends++
    },
    reportError: error => {
      throw error
    },
    resolveCurrentCollection: () =>
      resolveCollection({
        consent: deniedConsent,
        hasResponse: false
      }),
    subscribeToConsentChanges: () => {
      subscriptions++
      return () => {}
    }
  })
  start(baseEvent)
  assert.equal(sends, 0)
  assert.equal(subscriptions, 0)
})

test('avslutter uten sending etter et eksplisitt avslag', () => {
  const sent: CanonicalViewItem[] = []
  let subscriptionCount = 0
  const start = createViewItemCollectorTransport({
    postEvent: async event => {
      sent.push(event)
    },
    reportError: error => {
      throw error
    },
    resolveCurrentCollection: () =>
      resolveCollection({
        consent: deniedConsent,
        hasResponse: true
      }),
    subscribeToConsentChanges: () => {
      subscriptionCount += 1
      return () => {}
    }
  })

  start(baseEvent)

  assert.equal(sent.length, 0)
  assert.equal(subscriptionCount, 0)
})
