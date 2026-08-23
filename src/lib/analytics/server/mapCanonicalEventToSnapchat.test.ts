import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import type { CanonicalEvent } from '../canonicalEvent'
import {
  hasSnapchatRequiredUserIdentity,
  mapCanonicalEventToSnapchat
} from './mapCanonicalEventToSnapchat'

const consent = {
  analytics: 'granted',
  marketing: 'granted',
  preferences: 'denied',
  source: 'cookiebot',
  version: '1'
} as const

function canonicalEvent(
  eventName: CanonicalEvent['event_name'],
  overrides: Record<string, unknown> = {}
): CanonicalEvent {
  return {
    schema_version: 1,
    event_name: eventName,
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    event_time: '2026-08-23T10:00:00.000Z',
    source: 'web',
    environment: 'production',
    page_url:
      'https://utekos.no/produkter/comfyrobe?ScCid=opaque#buy',
    page_title: 'Comfyrobe',
    page_view_id: 'ed4fb82a-f2f2-41f9-978a-3f99cf64ec2f',
    consent,
    client_ip_address: '192.0.2.1',
    event_device_info: { user_agent: 'Utekos test agent' },
    ...overrides
  } as unknown as CanonicalEvent
}

function commerceData(overrides: Record<string, unknown> = {}) {
  return {
    currency: 'NOK',
    value: 1598,
    items: [
      {
        item_id: 'gid://shopify/ProductVariant/123456789',
        product_id: 'gid://shopify/Product/987654321',
        variant_id: 'gid://shopify/ProductVariant/123456789',
        quantity: 2,
        unit_price: 799
      }
    ],
    ...overrides
  }
}

test('maps all six canonical events to Snapchat standard events', () => {
  const cases = [
    ['page_view', 'PAGE_VIEW'],
    ['view_item', 'VIEW_CONTENT'],
    ['add_to_cart', 'ADD_CART'],
    ['begin_checkout', 'START_CHECKOUT'],
    ['add_payment_info', 'ADD_BILLING'],
    ['purchase', 'PURCHASE']
  ] as const

  for (const [canonicalName, snapchatName] of cases) {
    const mapped = mapCanonicalEventToSnapchat(
      canonicalEvent(canonicalName, {
        ...(canonicalName === 'page_view' ?
          {}
        : { custom_data: commerceData() })
      })
    )
    assert.equal(mapped?.event_name, snapchatName)
    assert.equal(mapped?.action_source, 'WEB')
    assert.equal(mapped?.event_time, 1_787_479_200_000)
  }
})

test('uses variant IDs that match the Snapchat catalog', () => {
  const mapped = mapCanonicalEventToSnapchat(
    canonicalEvent('view_item', { custom_data: commerceData() })
  )

  assert.deepEqual(mapped?.custom_data, {
    content_ids: ['123456789'],
    content_type: 'product',
    contents: [
      { id: '123456789', item_price: 799, quantity: 2 }
    ],
    currency: 'NOK',
    num_items: 2,
    value: 1598
  })
  assert.equal(
    JSON.stringify(mapped).includes('987654321'),
    false
  )
})

test('uses payment revision and order transaction dedupe ids', () => {
  const billing = mapCanonicalEventToSnapchat(
    canonicalEvent('add_payment_info', {
      custom_data: commerceData({
        payment_revision: 'sh-payment-revision-1'
      })
    })
  )
  const purchase = mapCanonicalEventToSnapchat(
    canonicalEvent('purchase', {
      page_url: undefined,
      custom_data: commerceData({
        transaction_id: 'shopify_order_6968683004152'
      })
    })
  )

  assert.equal(billing?.event_id, 'sh-payment-revision-1')
  assert.equal(purchase?.event_id, 'shopify_order_6968683004152')
  assert.equal(
    purchase?.custom_data?.order_id,
    'shopify_order_6968683004152'
  )
  assert.equal(
    purchase?.event_source_url,
    'https://kasse.utekos.no/'
  )
})

test('strips query and fragment while forwarding consented match identifiers', () => {
  const externalId = 'anon_opaque_external_id'
  const emailHash = createHash('sha256')
    .update('kunde@example.no')
    .digest('hex')
  const mapped = mapCanonicalEventToSnapchat(
    canonicalEvent('view_item', {
      browser_id: { sc_cookie1: 'snap-cookie-1' },
      click_id: { sc_click_id: 'ScCid-ByteForByte-+/=' },
      external_id: externalId,
      user_data: { email_sha256: [emailHash] },
      custom_data: commerceData()
    })
  )

  assert.equal(
    mapped?.event_source_url,
    'https://utekos.no/produkter/comfyrobe'
  )
  assert.equal(
    mapped?.user_data.sc_click_id,
    'ScCid-ByteForByte-+/='
  )
  assert.equal(mapped?.user_data.sc_cookie1, 'snap-cookie-1')
  assert.deepEqual(mapped?.user_data.em, [emailHash])
  assert.deepEqual(mapped?.user_data.external_id, [
    createHash('sha256').update(externalId).digest('hex')
  ])
})

test('requires hashed email or phone, or IP plus user agent', () => {
  assert.equal(
    hasSnapchatRequiredUserIdentity({ em: ['hash'] }),
    true
  )
  assert.equal(
    hasSnapchatRequiredUserIdentity({ ph: ['hash'] }),
    true
  )
  assert.equal(
    hasSnapchatRequiredUserIdentity({
      client_ip_address: '192.0.2.1',
      client_user_agent: 'agent'
    }),
    true
  )
  assert.equal(
    hasSnapchatRequiredUserIdentity({
      sc_click_id: 'click-only'
    }),
    false
  )
})
