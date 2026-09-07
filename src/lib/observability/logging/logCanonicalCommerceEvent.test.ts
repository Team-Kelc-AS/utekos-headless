import assert from 'node:assert/strict'
import test from 'node:test'
import type { CanonicalBeginCheckout } from '@/lib/analytics/beginCheckoutEvent'
import type { CanonicalEvent } from '@/lib/analytics/canonicalEvent'
import { logCanonicalCommerceEvent } from './logCanonicalCommerceEvent'

const eventId = '61c2ef59-6e6f-4f56-a63a-567ca398f9de'
const journeyId = 'faa4244b-c4a4-47be-9877-a9b3631aeb6a'
const pageViewId = 'e03c1ecf-92b8-4c2c-8182-79f2bcda2fbb'
const event = {
  event_id: eventId,
  event_name: 'begin_checkout',
  event_time: '2026-09-06T12:00:00.000Z',
  environment: 'test',
  page_url:
    'https://utekos.no/produkter/utekos-techdown?fbclid=secret',
  journey_id: journeyId,
  page_view_id: pageViewId,
  consent: {
    analytics: 'granted',
    marketing: 'denied',
    preferences: 'denied',
    source: 'cookiebot',
    version: '1'
  },
  custom_data: {
    currency: 'NOK',
    gross_value: 2499,
    items: [{ quantity: 2 }],
    cart_id: 'secret',
    checkout_id: 'secret'
  }
} as unknown as CanonicalBeginCheckout

test('distinguishes reported action, persistence and provider delivery with safe linked IDs', async t => {
  const lines: string[] = []
  t.mock.method(console, 'log', (value: unknown) =>
    lines.push(String(value))
  )
  await logCanonicalCommerceEvent({
    checkoutMethod: 'klarna_express',
    durationMs: 37,
    event,
    eventName: 'begin_checkout',
    request: new Request(
      'https://utekos.no/api/events/begin-checkout?secret=123'
    ),
    status: 'accepted'
  })
  const entry = JSON.parse(lines[0] ?? '{}')
  assert.equal(lines.length, 1)
  assert.equal(entry.event, 'commerce.event')
  assert.equal(entry.data.displayName, 'InitiateCheckout')
  assert.equal(entry.data.actionEvidence, 'browser_reported')
  assert.equal(entry.data.persistence, 'persisted')
  assert.equal(
    entry.data.providerDelivery,
    'separate_receipt_required'
  )
  assert.equal(entry.data.trafficClass, 'human_or_unknown')
  assert.equal(entry.data.journeyLinkReason, 'linked')
  assert.equal(entry.data.quantity, 2)
  assert.equal(
    entry.context.pagePath,
    '/produkter/utekos-techdown'
  )
  assert.equal(
    entry.context.requestPath,
    '/api/events/begin-checkout'
  )
  assert.equal(entry.journeyId, journeyId)
  assert.equal(entry.pageViewId, pageViewId)
  assert.equal(entry.adPlatformEvents, undefined)
  assert.equal(
    /fbclid|secret|cart_id|checkout_id|user_data/.test(
      lines[0]!
    ),
    false
  )
})

test('logs every requested name and keeps Shopify progress separate from paid purchase', async t => {
  const lines: string[] = []
  t.mock.method(console, 'log', (value: unknown) =>
    lines.push(String(value))
  )
  const cases = [
    [
      'add_to_cart',
      'AddToCart',
      'browser_collector',
      'browser_reported'
    ],
    [
      'add_to_wishlist',
      'AddToWishlist',
      'browser_collector',
      'browser_reported'
    ],
    [
      'add_shipping_info',
      'AddShippingInfo',
      'shopify_web_pixel',
      'shopify_source_observed'
    ],
    [
      'add_payment_info',
      'AddPaymentInfo',
      'shopify_web_pixel',
      'shopify_source_observed'
    ],
    [
      'generate_lead',
      'Sign Up Utekos Dun',
      'persisted_lead_submission',
      'server_confirmed'
    ],
    [
      'purchase',
      'Purchase',
      'shopify_paid_order_webhook',
      'server_confirmed'
    ]
  ] as const
  for (const [
    eventName,
    displayName,
    source,
    evidence
  ] of cases) {
    const mapped = {
      ...event,
      event_name: eventName,
      custom_data:
        eventName === 'generate_lead' ?
          {
            form_id: 'product_waitlist_utekos_dun',
            submission_id: eventId
          }
        : event.custom_data
    } as unknown as Extract<
      CanonicalEvent,
      { event_name: typeof eventName }
    >
    await logCanonicalCommerceEvent({
      event: mapped,
      eventName,
      source,
      status: 'duplicate'
    })
    const entry = JSON.parse(lines.at(-1) ?? '{}')
    assert.equal(entry.data.displayName, displayName)
    assert.equal(entry.data.actionEvidence, evidence)
    assert.equal(entry.data.persistence, 'duplicate')
    assert.equal(entry.data.source, source)
  }
  assert.equal(lines.length, cases.length)
})

test('denied analytics strips journey, page and checkout linkage even with marketing consent', async t => {
  const lines: string[] = []
  t.mock.method(console, 'log', (value: unknown) =>
    lines.push(String(value))
  )
  await logCanonicalCommerceEvent({
    event: {
      ...event,
      consent: {
        ...event.consent,
        analytics: 'denied',
        marketing: 'granted'
      }
    },
    eventName: 'begin_checkout',
    status: 'accepted'
  })
  const entry = JSON.parse(lines[0] ?? '{}')
  assert.equal(entry.journeyId, undefined)
  assert.equal(entry.pageViewId, undefined)
  assert.equal(entry.data.beginCheckoutEventId, undefined)
  assert.equal(
    entry.data.journeyLinkReason,
    'analytics_consent_not_granted'
  )
})

test('paid order with unresolved consent preserves unknown and explicit missing linkage', async t => {
  const lines: string[] = []
  t.mock.method(console, 'log', (value: unknown) =>
    lines.push(String(value))
  )
  await logCanonicalCommerceEvent({
    event: {
      ...event,
      event_name: 'purchase',
      consent: {
        analytics: 'unknown',
        marketing: 'unknown',
        preferences: 'unknown',
        source: 'shopify_order_attribute',
        version: '1',
        resolution: 'missing'
      }
    } as unknown as Extract<
      CanonicalEvent,
      { event_name: 'purchase' }
    >,
    eventName: 'purchase',
    source: 'shopify_paid_order_webhook',
    status: 'accepted'
  })
  const entry = JSON.parse(lines[0] ?? '{}')
  assert.equal(entry.consent.analytics, 'unknown')
  assert.equal(entry.consent.resolution, 'missing')
  assert.equal(entry.journeyId, undefined)
})

test('fails open when both runtime log transports throw', async t => {
  t.mock.method(console, 'log', () => {
    throw new Error('console unavailable')
  })
  t.mock.method(console, 'warn', () => {
    throw new Error('console unavailable')
  })
  await assert.doesNotReject(
    logCanonicalCommerceEvent({
      event,
      eventName: 'begin_checkout',
      status: 'accepted'
    })
  )
})
