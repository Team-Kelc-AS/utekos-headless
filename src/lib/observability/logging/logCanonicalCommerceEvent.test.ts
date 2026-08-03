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
    context: Record<string, unknown>
    data: Record<string, unknown>
    event: string
  }

  assert.equal(entry.event, 'commerce.event')
  assert.equal(entry.data.eventName, 'begin_checkout')
  assert.equal(entry.data.checkoutMethod, 'klarna_express')
  assert.equal(entry.data.quantity, 2)
  assert.equal(entry.context.pagePath, '/produkter/utekos-techdown')
  assert.equal(JSON.stringify(entry).includes('fbclid'), false)
  assert.equal(JSON.stringify(entry).includes('secret'), false)
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
