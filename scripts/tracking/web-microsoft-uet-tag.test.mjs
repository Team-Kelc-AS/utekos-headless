import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const html = readFileSync(
  new URL('../../config/gtm/web-microsoft-uet.html', import.meta.url),
  'utf8'
)
const script = html.match(/^<script>\n([\s\S]+)\n<\/script>\n?$/)?.[1]

assert.ok(script, 'Expected one executable script block')

function canonicalEvent(eventName, eventId, customData = {}) {
  return {
    event: eventName,
    event_id: eventId,
    canonical_event: {
      consent: { marketing: 'granted' },
      custom_data: customData,
      event_id: eventId,
      event_name: eventName,
      page_view_id: '11111111-1111-4111-8111-111111111111'
    }
  }
}

function runtime(marketing = true) {
  const calls = []
  const window = {
    Cookiebot: { consent: { marketing } },
    dataLayer: [],
    uetq: {
      push: (...args) => calls.push(args)
    }
  }
  window.window = window

  return {
    context: vm.createContext({ isFinite, window }),
    calls,
    window
  }
}

test('sends the canonical event ID and complete commerce values', () => {
  const current = runtime()
  current.window.dataLayer.push(
    canonicalEvent('add_to_cart', 'event-atc-1', {
      cart_mutation_id: 'mutation-1',
      currency: 'NOK',
      value: 2490,
      items: [
        {
          item_id: 'gid://shopify/ProductVariant/42903234609400',
          quantity: 1
        }
      ]
    })
  )

  vm.runInContext(script, current.context)

  assert.deepEqual(
    JSON.parse(JSON.stringify(current.calls)),
    [
      [
        'event',
        'add_to_cart',
        {
          currency: 'NOK',
          ecomm_pagetype: 'cart',
          ecomm_prodid: ['42903234609400'],
          ecomm_totalvalue: 2490,
          event_category: 'ecommerce',
          event_id: 'event-atc-1',
          event_label: 'mutation-1',
          event_value: 2490,
          revenue_value: 2490
        }
      ]
    ]
  )
})

test('fails closed without current marketing consent', () => {
  const current = runtime(false)
  current.window.dataLayer.push(
    canonicalEvent('begin_checkout', 'event-checkout-1')
  )

  vm.runInContext(script, current.context)

  assert.deepEqual(current.calls, [])
})

test('does not send a mismatched canonical event ID', () => {
  const current = runtime()
  const entry = canonicalEvent('add_to_cart', 'event-atc-1')
  entry.event_id = 'different-event-id'
  current.window.dataLayer.push(entry)

  vm.runInContext(script, current.context)

  assert.deepEqual(current.calls, [])
})

test('suppresses duplicate browser delivery for the same event', () => {
  const current = runtime()
  current.window.dataLayer.push(
    canonicalEvent('begin_checkout', 'event-checkout-1')
  )

  vm.runInContext(script, current.context)
  vm.runInContext(script, current.context)

  assert.equal(current.calls.length, 1)
  assert.equal(current.calls[0][1], 'begin_checkout')
})
