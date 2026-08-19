import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createCanonicalViewItem,
  type CanonicalViewItemCommerce
} from '../viewItemEvent'
import type {
  CanonicalEventStore,
  CanonicalEventStoreInput
} from './canonicalEventStore'
import { handleCanonicalViewItemRequest } from './handleCanonicalViewItemRequest'

const endpoint = 'https://utekos.no/api/events/view-item'
const insertedAcceptance = {
  createdDispatchAttempts: [],
  status: 'inserted' as const
}
const duplicateAcceptance = {
  createdDispatchAttempts: [],
  status: 'duplicate' as const
}

const commerce: CanonicalViewItemCommerce = {
  currency: 'NOK',
  value: 799.2,
  gross_value: 999,
  tax_value: 199.8,
  items: [
    {
      item_id: 'UTEKOS-TEST-M',
      product_id: 'gid://shopify/Product/1',
      variant_id: 'gid://shopify/ProductVariant/2',
      item_name: 'Utekos Test',
      product_handle: 'utekos-test',
      quantity: 1,
      unit_price: 799.2,
      gross_unit_price: 999,
      tax_amount: 199.8,
      tax_rate: 0.25,
      taxable: true,
      price_includes_tax: true,
      available_for_sale: true,
      currently_not_in_stock: false,
      quantity_available: 10,
      selected_options: [{ name: 'Størrelse', value: 'M' }],
      collection_ids: [],
      collection_titles: []
    }
  ]
}

function viewItem(
  analytics: 'denied' | 'granted' = 'granted',
  marketing: 'denied' | 'granted' = 'granted'
) {
  return {
    ...createCanonicalViewItem({
      browserId: {
        fbp: 'fb.1.123.456',
        ga_client_id: '97245370.1784201643',
        ga_session_id: '1784201643'
      },
      clickId: { fbclid: 'fb-click-1' },
      commerce,
      consent: {
        analytics,
        marketing,
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      },
      environment: 'test',
      eventDeviceInfo: {
        language: 'nb-NO',
        userAgent: 'client-supplied-agent'
      },
      eventId: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
      eventTime: '2026-07-16T10:00:00.000Z',
      externalId: 'utekos-user-1',
      impressionId: 'impression-1',
      pageTitle: 'Utekos Test | Utekos',
      pageUrl: 'https://utekos.no/produkter/utekos-test',
      pageViewId: 'e58460a4-5a60-450c-962a-7f22254c25dd',
      userData: {
        emailSha256: [
          'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        ]
      }
    }),
    client_ip_address: '198.51.100.20',
    region_code: 'client-region'
  }
}

function request(
  body: string,
  headers: Record<string, string> = {}
) {
  return new Request(endpoint, {
    body,
    headers: {
      'content-type': 'application/json',
      'origin': 'https://utekos.no',
      ...headers
    },
    method: 'POST'
  })
}

function dependencies(
  accept: CanonicalEventStore['accept'] = async () =>
    insertedAcceptance
) {
  return {
    getRequestContext: () => ({
      city: 'Oslo',
      clientIpAddress: '203.0.113.10',
      countryCode: 'no',
      postalCode: '0150',
      regionCode: '03',
      userAgent: 'server-observed-agent'
    }),
    store: { accept }
  }
}

test('rejects a request from another origin', async () => {
  const response = await handleCanonicalViewItemRequest(
    request(JSON.stringify(viewItem()), {
      origin: 'https://example.com'
    }),
    dependencies()
  )

  assert.equal(response.status, 403)
  assert.match(
    response.headers.get('cache-control') ?? '',
    /no-store/
  )
})

test('returns a validation error for a non-canonical event', async () => {
  const response = await handleCanonicalViewItemRequest(
    request(JSON.stringify({ event_name: 'view_item' })),
    dependencies()
  )

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    error: 'invalid_event'
  })
})

test('does not persist a fully denied event', async () => {
  let writes = 0
  const response = await handleCanonicalViewItemRequest(
    request(JSON.stringify(viewItem('denied', 'denied'))),
    dependencies(async () => {
      writes += 1
      return insertedAcceptance
    })
  )

  assert.equal(response.status, 204)
  assert.equal(writes, 0)
})

test('strips marketing identifiers without marketing consent', async () => {
  let storedInput: CanonicalEventStoreInput | undefined
  const response = await handleCanonicalViewItemRequest(
    request(JSON.stringify(viewItem('granted', 'denied'))),
    dependencies(async input => {
      storedInput = input
      return insertedAcceptance
    })
  )

  assert.equal(response.status, 202)
  assert.ok(storedInput)
  assert.deepEqual(storedInput.event.browser_id, {
    ga_client_id: '97245370.1784201643',
    ga_session_id: '1784201643'
  })
  assert.equal(storedInput.event.click_id, undefined)
  assert.equal(storedInput.event.external_id, undefined)
  assert.equal(storedInput.event.client_ip_address, undefined)
  assert.equal(storedInput.event.user_data, undefined)
  assert.deepEqual(
    storedInput.dispatches.map(dispatch => dispatch.provider),
    ['google']
  )
})

test('preserves identifiers and replaces client network context', async () => {
  let storedInput: CanonicalEventStoreInput | undefined
  const response = await handleCanonicalViewItemRequest(
    request(JSON.stringify(viewItem())),
    dependencies(async input => {
      storedInput = input
      return insertedAcceptance
    })
  )

  assert.equal(response.status, 202)
  assert.deepEqual(await response.json(), {
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    status: 'accepted'
  })
  assert.ok(storedInput)

  const storedEvent = storedInput.event
  assert.equal(storedEvent.event_name, 'view_item')
  assert.deepEqual(storedEvent.browser_id, {
    fbp: 'fb.1.123.456',
    ga_client_id: '97245370.1784201643',
    ga_session_id: '1784201643'
  })
  assert.deepEqual(storedEvent.click_id, {
    fbclid: 'fb-click-1'
  })
  assert.equal(storedEvent.external_id, 'utekos-user-1')
  assert.equal(storedEvent.client_ip_address, '203.0.113.10')
  assert.equal(
    storedEvent.event_device_info?.user_agent,
    'server-observed-agent'
  )
  assert.equal(storedEvent.location?.country_code, 'NO')
  assert.equal(storedEvent.location?.postal_code, '0150')
  assert.equal(storedEvent.region_code, '03')
  assert.deepEqual(
    storedInput.dispatches.map(dispatch => dispatch.provider),
    ['google', 'meta', 'pinterest']
  )
})

test('returns an idempotent duplicate response', async () => {
  const response = await handleCanonicalViewItemRequest(
    request(JSON.stringify(viewItem())),
    dependencies(async () => duplicateAcceptance)
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    status: 'duplicate'
  })
})

test('redacts persistence failures', async () => {
  const response = await handleCanonicalViewItemRequest(
    request(JSON.stringify(viewItem())),
    dependencies(async () => {
      throw new Error('database credentials')
    })
  )

  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), {
    error: 'internal_error'
  })
})
