import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import vm from 'node:vm'

const PIXEL_PATH = path.join(
  process.cwd(),
  'public/analytics/snapchat-pixel-canonical-v1.js'
)

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem(key: string) {
      return values.get(key) ?? null
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    }
  }
}

function loadPixel() {
  const calls: unknown[][] = []
  const appendedScripts: Array<Record<string, unknown>> = []
  const snaptr = (...args: unknown[]) => calls.push(args)
  const document = {
    cookie: '',
    getElementById: () => ({
      dataset: { pixelId: 'public-pixel-id' }
    }),
    querySelector: () => null,
    createElement: () => ({}),
    head: {
      appendChild(script: Record<string, unknown>) {
        appendedScripts.push(script)
      }
    }
  }
  const window = {
    dataLayer: [] as unknown[],
    document,
    localStorage: memoryStorage(),
    sessionStorage: memoryStorage(),
    snaptr
  }
  const sandbox = { document, window }

  vm.createContext(sandbox)
  vm.runInContext(readFileSync(PIXEL_PATH, 'utf8'), sandbox)

  const processCanonicalEvent = (
    sandbox.window as unknown as {
      __utekosSnapchatCanonical: {
        processCanonicalEvent: (event: unknown) => void
      }
    }
  ).__utekosSnapchatCanonical.processCanonicalEvent

  return {
    appendedScripts,
    calls,
    processCanonicalEvent,
    window
  }
}

function canonicalEvent(eventName: string, marketing = true) {
  return {
    schema_version: 1,
    event_id: `event-${eventName}`,
    event_name: eventName,
    environment: 'production',
    consent: { marketing: marketing ? 'granted' : 'denied' },
    user_data: { email_sha256: ['must-not-be-forwarded'] },
    custom_data: {
      currency: 'NOK',
      value: 1598,
      items: [
        {
          item_id: 'gid://shopify/ProductVariant/123',
          product_id: 'gid://shopify/Product/987654321',
          variant_id: 'gid://shopify/ProductVariant/123',
          quantity: 2
        }
      ]
    }
  }
}

test('does not load or call Snapchat without marketing granted', () => {
  const harness = loadPixel()
  harness.processCanonicalEvent(
    canonicalEvent('view_item', false)
  )

  assert.equal(harness.calls.length, 0)
  assert.equal(harness.appendedScripts.length, 0)
})

test('does not send dataLayer events without marketing granted', () => {
  const harness = loadPixel()
  harness.window.dataLayer.push({
    canonical_event: canonicalEvent('page_view', false)
  })

  assert.equal(harness.calls.length, 0)
})

test('maps the four headless events once with canonical dedupe ids', () => {
  const harness = loadPixel()
  const cases = [
    ['page_view', 'PAGE_VIEW'],
    ['view_item', 'VIEW_CONTENT'],
    ['add_to_cart', 'ADD_CART'],
    ['begin_checkout', 'START_CHECKOUT']
  ] as const

  for (const [canonicalName] of cases) {
    const event = canonicalEvent(canonicalName)
    harness.processCanonicalEvent(event)
    harness.processCanonicalEvent(event)
  }

  assert.equal(
    harness.calls.filter(call => call[0] === 'init').length,
    1
  )
  assert.equal(harness.appendedScripts.length, 1)
  assert.equal(
    harness.appendedScripts[0]?.src,
    'https://sc-static.net/scevent.min.js'
  )

  const trackCalls = harness.calls.filter(
    call => call[0] === 'track'
  )
  assert.deepEqual(
    trackCalls.map(call => call[1]),
    cases.map(([, snapchatName]) => snapchatName)
  )
  assert.deepEqual(
    trackCalls.map(
      call =>
        (call[2] as Record<string, unknown>).client_dedup_id
    ),
    cases.map(([canonicalName]) => `event-${canonicalName}`)
  )
  assert.deepEqual(
    (trackCalls[1]?.[2] as Record<string, unknown>).item_ids,
    ['123']
  )
  assert.equal(
    JSON.stringify(trackCalls).includes('must-not-be-forwarded'),
    false
  )
})

test('ignores checkout-only and non-production events', () => {
  const harness = loadPixel()
  harness.processCanonicalEvent(canonicalEvent('purchase'))
  harness.processCanonicalEvent({
    ...canonicalEvent('page_view'),
    environment: 'preview'
  })

  assert.equal(harness.calls.length, 0)
  assert.equal(harness.appendedScripts.length, 0)
})

test('does not call Snapchat for events without marketing granted', () => {
  const harness = loadPixel()
  harness.processCanonicalEvent(canonicalEvent('view_item', false))

  assert.equal(harness.calls.length, 0)
})
