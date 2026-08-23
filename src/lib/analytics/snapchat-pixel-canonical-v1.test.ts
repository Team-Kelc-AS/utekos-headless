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

function loadPixel(marketing = false) {
  const calls: unknown[][] = []
  const appendedScripts: Array<Record<string, unknown>> = []
  const listeners = new Map<string, () => void>()
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
    Cookiebot: { consent: { marketing } },
    addEventListener(name: string, listener: () => void) {
      listeners.set(name, listener)
    },
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
    listeners,
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

test('does not load or call Snapchat before marketing consent', () => {
  const harness = loadPixel(false)
  harness.processCanonicalEvent(
    canonicalEvent('view_item', false)
  )

  assert.equal(harness.calls.length, 0)
  assert.equal(harness.appendedScripts.length, 0)
})

test('maps the four headless events once with canonical dedupe ids', () => {
  const harness = loadPixel(true)
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
  const harness = loadPixel(true)
  harness.processCanonicalEvent(canonicalEvent('purchase'))
  harness.processCanonicalEvent({
    ...canonicalEvent('page_view'),
    environment: 'preview'
  })

  assert.equal(harness.calls.length, 0)
  assert.equal(harness.appendedScripts.length, 0)
})

test('stops calls and removes Utekos-owned Snapchat identifiers after consent withdrawal', () => {
  const harness = loadPixel(true)
  harness.window.sessionStorage.setItem(
    'utekos_click_ids',
    JSON.stringify({ gclid: 'keep', sc_click_id: 'remove' })
  )
  harness.window.localStorage.setItem(
    'utekos_click_ids_v1',
    JSON.stringify({
      identifiers: { gclid: 'keep', sc_click_id: 'remove' },
      updatedAt: '2026-08-23T10:00:00.000Z'
    })
  )

  harness.window.Cookiebot.consent.marketing = false
  harness.listeners.get('CookiebotOnDecline')?.()
  harness.processCanonicalEvent(canonicalEvent('view_item'))

  assert.equal(harness.calls.length, 0)
  assert.deepEqual(
    JSON.parse(
      harness.window.sessionStorage.getItem(
        'utekos_click_ids'
      ) || '{}'
    ),
    { gclid: 'keep' }
  )
  assert.deepEqual(
    JSON.parse(
      harness.window.localStorage.getItem(
        'utekos_click_ids_v1'
      ) || '{}'
    ).identifiers,
    { gclid: 'keep' }
  )
})
