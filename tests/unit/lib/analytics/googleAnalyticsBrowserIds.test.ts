import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createCanonicalViewItem,
  type CanonicalViewItem,
  type CanonicalViewItemCommerce
} from '@/lib/analytics/viewItemEvent'
import {
  enrichCanonicalViewItemWithGoogleAnalyticsIds,
  queueGoogleTagGet,
  type GoogleAnalyticsBrowserIdDependencies,
  type GoogleAnalyticsField
} from '@/lib/analytics/googleAnalyticsBrowserIds'

const commerce = {
  currency: 'NOK',
  value: 799.2,
  gross_value: 999,
  tax_value: 199.8,
  items: [
    {
      item_id: 'gid://shopify/ProductVariant/123',
      product_id: 'gid://shopify/Product/456',
      variant_id: 'gid://shopify/ProductVariant/123',
      item_name: 'Comfyrobe™',
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
      selected_options: [],
      collection_ids: [],
      collection_titles: []
    }
  ]
} satisfies CanonicalViewItemCommerce

function viewItem(
  analytics: 'denied' | 'granted'
): CanonicalViewItem {
  return createCanonicalViewItem({
    browserId: {
      ga_cookie: 'GA1.1.97245370.1784201643'
    },
    commerce,
    consent: {
      analytics,
      marketing: 'denied',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    environment: 'test',
    eventId: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    eventTime: '2026-07-16T10:00:00.123Z',
    pageTitle: 'Comfyrobe™ | Utekos',
    pageUrl: 'https://utekos.no/produkter/comfyrobe',
    pageViewId: 'ed4fb82a-f2f2-41f9-978a-3f99cf64ec2f'
  })
}

function dependencies(
  getGoogleTagValue: GoogleAnalyticsBrowserIdDependencies[
    'getGoogleTagValue'
  ],
  timeoutMs = 20
): GoogleAnalyticsBrowserIdDependencies {
  return {
    clearTimer: clearTimeout,
    getGoogleTagValue,
    setTimer: setTimeout,
    timeoutMs
  }
}

test('queues the documented gtag arguments object', () => {
  const dataLayer: unknown[] = []
  const callback = () => {}

  queueGoogleTagGet(dataLayer, 'session_id', callback)

  assert.equal(dataLayer.length, 1)
  assert.equal(Array.isArray(dataLayer[0]), false)
  assert.deepEqual(Array.from(dataLayer[0] as ArrayLike<unknown>), [
    'get',
    'G-FCES3L0M9M',
    'session_id',
    callback
  ])
})

test('adds client_id and ga_session_id after analytics consent', async () => {
  const requested: GoogleAnalyticsField[] = []
  const event = viewItem('granted')

  const enriched =
    await enrichCanonicalViewItemWithGoogleAnalyticsIds(
      event,
      dependencies((field, callback) => {
        requested.push(field)

        callback(
          field === 'client_id' ?
            ' 97245370.1784201643 '
          : 1784201643
        )
      })
    )

  assert.deepEqual(requested.sort(), [
    'client_id',
    'session_id'
  ])
  assert.deepEqual(enriched.browser_id, {
    ga_client_id: '97245370.1784201643',
    ga_cookie: 'GA1.1.97245370.1784201643',
    ga_session_id: '1784201643'
  })
  assert.notEqual(enriched, event)
})

test('does not query Google before analytics consent', async () => {
  const event = viewItem('denied')
  let queryCount = 0

  const enriched =
    await enrichCanonicalViewItemWithGoogleAnalyticsIds(
      event,
      dependencies(() => {
        queryCount += 1
      })
    )

  assert.equal(queryCount, 0)
  assert.equal(enriched, event)
})

test('keeps the event unchanged when the Google tag times out', async () => {
  const event = viewItem('granted')

  const enriched =
    await enrichCanonicalViewItemWithGoogleAnalyticsIds(
      event,
      dependencies(() => {}, 1)
    )

  assert.equal(enriched, event)
})

test('keeps available identifiers when only one field resolves', async () => {
  const event = viewItem('granted')

  const enriched =
    await enrichCanonicalViewItemWithGoogleAnalyticsIds(
      event,
      dependencies((field, callback) => {
        if (field === 'session_id') {
          callback('1784201643')
        }
      }, 1)
    )

  assert.deepEqual(enriched.browser_id, {
    ga_cookie: 'GA1.1.97245370.1784201643',
    ga_session_id: '1784201643'
  })
})
