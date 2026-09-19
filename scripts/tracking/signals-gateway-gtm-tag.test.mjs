import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const html = readFileSync(
  new URL('./gtm/signals-gateway-canonical-v1.html', import.meta.url),
  'utf8'
)
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1]

assert.ok(script, 'GTM artifact must contain one script block')
assert.match(
  html,
  /ROLLBACK ARTIFACT ONLY — DO NOT PUBLISH OR ENABLE/,
  'Manual cbq bridge must stay marked as a disabled rollback artifact'
)

function canonicalEvent(eventName, eventId, customData = {}) {
  return {
    event: eventName,
    event_id: eventId,
    canonical_event: {
      event_id: eventId,
      event_name: eventName,
      page_url: 'https://utekos.no/produkter/utekos-techdown?fbclid=click-1',
      custom_data: customData,
      consent: { marketing: 'granted' }
    }
  }
}

function createRuntime() {
  const insertedScripts = []
  const intervals = []
  const listeners = new Map()
  const fbqCalls = []
  const document = {
    createElement: () => ({}),
    getElementsByTagName: () => [{
      parentNode: {
        insertBefore: node => insertedScripts.push(node)
      }
    }],
    head: { appendChild: node => insertedScripts.push(node) }
  }
  const window = {
    Boolean,
    URL,
    dataLayer: [],
    document,
    fbq: (...args) => fbqCalls.push(args),
    location: new URL(
      'https://utekos.no/produkter/utekos-techdown?fbclid=click-1'
    ),
    addEventListener: (name, handler) => listeners.set(name, handler),
    setInterval: handler => {
      intervals.push(handler)
      return intervals.length
    }
  }

  window.window = window

  return {
    context: vm.createContext({ document, window }),
    fbqCalls,
    insertedScripts,
    intervals,
    listeners,
    window
  }
}

function queuedCalls(window) {
  return JSON.parse(
    JSON.stringify(
      (window.cbq?.queue ?? []).map(call => Array.from(call))
    )
  )
}

test('sends granted canonical events after the rollback artifact loads', () => {
  const runtime = createRuntime()
  runtime.window.dataLayer.push(
    canonicalEvent('page_view', 'accepted-page')
  )

  vm.runInContext(script, runtime.context)

  assert.deepEqual(
    runtime.insertedScripts.map(item => item.src),
    ['https://signals.utekos.no/sdk/1633085772154426486/events.js']
  )
  const tracks = queuedCalls(runtime.window).filter(
    call => call[0] === 'track' || call[0] === 'trackCustom'
  )

  assert.deepEqual(tracks, [
    ['track', 'PageView', {}, { eventID: 'accepted-page' }]
  ])
})

test('preserves canonical IDs, payloads and standard/custom commands', () => {
  const runtime = createRuntime()
  runtime.window.dataLayer.push(
    canonicalEvent('view_item', 'view-event', {
      currency: 'nok',
      gross_value: 1790,
      value: 1432,
      tax_value: 358,
      items: [{
        variant_id: 'gid://shopify/ProductVariant/47123456789012',
        item_name: 'Utekos TechDown',
        item_category: 'Uteklær',
        quantity: 1,
        gross_unit_price: 1790
      }]
    }),
    canonicalEvent('scroll_depth', 'scroll-event', {
      threshold: 50,
      percent_scrolled: 50,
      document_height: 2400
    })
  )

  vm.runInContext(script, runtime.context)
  vm.runInContext(script, runtime.context)
  runtime.intervals[0]()

  const calls = queuedCalls(runtime.window)
  const eventCalls = calls.filter(
    call => call[0] === 'track' || call[0] === 'trackCustom'
  )

  assert.deepEqual(eventCalls, [
    [
      'track',
      'ViewContent',
      {
        content_ids: ['47123456789012'],
        contents: [{
          id: '47123456789012',
          quantity: 1,
          item_price: 1790
        }],
        content_type: 'product',
        num_items: 1,
        currency: 'NOK',
        value: 1790,
        content_name: 'Utekos TechDown',
        content_category: 'Uteklær',
        gross_value: 1790,
        tax_value: 358,
        net_value: 1432
      },
      { eventID: 'view-event' }
    ],
    [
      'trackCustom',
      'LandingScrollDepth',
      {
        threshold: 50,
        percent_scrolled: 50,
        document_height: 2400
      },
      { eventID: 'scroll-event' }
    ]
  ])
  assert.equal(
    calls.filter(call => call[0] === 'init').length,
    1
  )
  assert.equal(runtime.insertedScripts.length, 1)
  assert.deepEqual(runtime.fbqCalls, [])
})

test('sends no automatic PageView and rejects invalid canonical rows', () => {
  const runtime = createRuntime()
  const mismatched = canonicalEvent('page_view', 'browser-event')
  mismatched.canonical_event.event_id = 'server-event'
  const differentPage = canonicalEvent('page_view', 'different-page')
  differentPage.canonical_event.page_url = 'https://utekos.no/kampanje/julegaver'

  runtime.window.dataLayer.push(mismatched, differentPage)
  vm.runInContext(script, runtime.context)

  assert.deepEqual(
    queuedCalls(runtime.window).filter(
      call => call[0] === 'track' || call[0] === 'trackCustom'
    ),
    []
  )
  assert.deepEqual(runtime.fbqCalls, [])
})
