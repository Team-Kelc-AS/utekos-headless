import assert from 'node:assert/strict'
import test from 'node:test'
import type { CanonicalBeginCheckout } from '@/lib/analytics/beginCheckoutEvent'
import { logCanonicalCommerceEvent } from './logCanonicalCommerceEvent'

test('writes a searchable privacy-safe begin_checkout runtime log', async t => {
  const lines: string[] = []
  t.mock.method(console, 'log', (value: unknown) => {
    lines.push(String(value))
  })

  const event = {
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    page_url:
      'https://utekos.no/produkter/utekos-techdown?fbclid=secret',
    custom_data: {
      currency: 'NOK',
      gross_value: 2499,
      items: [{ quantity: 2 }]
    }
  } as unknown as CanonicalBeginCheckout

  await logCanonicalCommerceEvent({
    checkoutMethod: 'klarna_express',
    durationMs: 37,
    event,
    eventName: 'begin_checkout',
    request: new Request(
      'https://utekos.no/api/events/begin-checkout',
      { headers: { 'x-vercel-id': 'arn1::request-1' } }
    ),
    status: 'accepted'
  })

  assert.equal(lines.length, 1)
  const entry = JSON.parse(lines[0] ?? '{}') as {
    adPlatformEvents?: {
      google?: { eventName?: string; parameters?: Record<string, unknown> }
      meta?: { eventName?: string; parameters?: Record<string, unknown> }
      microsoft_uet?: {
        eventName?: string
        parameters?: Record<string, unknown>
      }
      pinterest?: { eventName?: string; parameters?: Record<string, unknown> }
    }
    context: Record<string, unknown>
    data: Record<string, unknown>
    event: string
    eventId?: string
    eventName?: string
    pageUrl?: string
  }

  assert.equal(entry.event, 'commerce.event')
  assert.equal(entry.data.eventName, 'begin_checkout')
  assert.equal(entry.data.checkoutMethod, 'klarna_express')
  assert.equal(entry.data.quantity, 2)
  assert.equal(entry.context.pagePath, '/produkter/utekos-techdown')
  assert.equal(entry.eventId, '61c2ef59-6e6f-4f56-a63a-567ca398f9de')
  assert.equal(entry.eventName, 'begin_checkout')
  assert.equal(entry.pageUrl, '/produkter/utekos-techdown')
  assert.equal(entry.adPlatformEvents?.meta?.eventName, 'InitiateCheckout')
  assert.equal(entry.adPlatformEvents?.google?.eventName, 'begin_checkout')
  assert.equal(entry.adPlatformEvents?.microsoft_uet?.eventName, 'begin_checkout')
  assert.equal(entry.adPlatformEvents?.pinterest?.eventName, 'initiate_checkout')
  assert.equal(entry.adPlatformEvents?.meta?.parameters?.currency, 'NOK')
  assert.equal(entry.adPlatformEvents?.meta?.parameters?.value, 2499)
  assert.equal(
    entry.adPlatformEvents?.meta?.parameters?.event_source_url,
    '/produkter/utekos-techdown'
  )
  assert.equal(entry.adPlatformEvents?.google?.parameters?.value, 2499)
  assert.equal(
    entry.adPlatformEvents?.microsoft_uet?.parameters?.eventCategory,
    'ecommerce'
  )
  assert.equal(JSON.stringify(entry).includes('fbclid'), false)
  assert.equal(JSON.stringify(entry).includes('secret'), false)
  assert.equal(JSON.stringify(entry).includes('user_data'), true)
  assert.equal(
    Object.hasOwn(
      entry.adPlatformEvents?.meta?.parameters ?? {},
      'user_data'
    ),
    false
  )
})

test('fails open when both runtime log transports throw', async t => {
  t.mock.method(console, 'log', () => {
    throw new Error('console.log unavailable')
  })
  t.mock.method(console, 'warn', () => {
    throw new Error('console.warn unavailable')
  })

  const event = {
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    page_url: 'https://utekos.no/cart',
    custom_data: {
      currency: 'NOK',
      gross_value: 2499,
      items: [{ quantity: 1 }]
    }
  } as unknown as CanonicalBeginCheckout

  await assert.doesNotReject(
    logCanonicalCommerceEvent({
      checkoutMethod: 'shopify_checkout',
      durationMs: 12,
      event,
      eventName: 'begin_checkout',
      request: new Request(
        'https://utekos.no/api/events/begin-checkout'
      ),
      status: 'accepted'
    })
  )
})
