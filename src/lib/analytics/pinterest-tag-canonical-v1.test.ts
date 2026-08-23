import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import vm from 'node:vm'

const TAG_PATH = path.join(
  process.cwd(),
  'public/analytics/pinterest-tag-canonical-v1.js'
)

const CANONICAL_ITEM_ID =
  'gid://shopify/ProductVariant/123456789'
const PINTEREST_PRODUCT_ID = '123456789'

function loadTag(
  marketing = true,
  hasResponse = marketing
) {
  const tracked: unknown[][] = []
  const listeners = new Map<string, () => void>()
  const pintrk = Object.assign(
    (...args: unknown[]) => {
      tracked.push(args)
    },
    { queue: [] as unknown[], version: '3.0' }
  )
  const document = {
    cookie: '',
    getElementById: () => ({
      dataset: { tagId: '2612345678901' }
    }),
    querySelector: () => ({}),
    createElement: () => ({}),
    getElementsByTagName: () => [
      { parentNode: { insertBefore() {} } }
    ],
    head: { appendChild() {} }
  }
  const window = {
    Cookiebot: { consent: { marketing }, hasResponse },
    pintrk,
    crypto: webcrypto,
    dataLayer: [] as unknown[],
    addEventListener(name: string, listener: () => void) {
      listeners.set(name, listener)
    },
    document
  }
  const sandbox = { TextEncoder, Uint8Array, window, document }

  vm.createContext(sandbox)
  vm.runInContext(readFileSync(TAG_PATH, 'utf8'), sandbox)

  const processCanonicalEvent = (
    sandbox.window as unknown as {
      __utekosPinterestCanonical: {
        processCanonicalEvent: (event: unknown) => void
      }
    }
  ).__utekosPinterestCanonical.processCanonicalEvent

  return { listeners, tracked, processCanonicalEvent, window }
}

function canonicalPageView(marketing = false) {
  return {
    schema_version: 1,
    event_id: 'pending-pinterest-event',
    event_name: 'view_category',
    environment: 'production',
    consent: { marketing: marketing ? 'granted' : 'denied' },
    custom_data: { category_name: 'Uteklær' }
  }
}

test('releases the original pre-consent event after acceptance', async () => {
  const harness = loadTag(false, false)
  harness.window.dataLayer.push({
    canonical_event: canonicalPageView(false)
  })

  assert.equal(harness.tracked.length, 0)

  harness.window.Cookiebot.consent.marketing = true
  harness.window.Cookiebot.hasResponse = true
  harness.listeners.get('CookiebotOnAccept')?.()
  await new Promise(resolve => setImmediate(resolve))

  const trackCall = harness.tracked.find(
    call => call[0] === 'track'
  )
  assert.equal(trackCall?.[1], 'ViewCategory')
  assert.equal(
    (trackCall?.[2] as Record<string, unknown>)?.event_id,
    'pending-pinterest-event'
  )
})

test('does not release an event after explicit rejection', async () => {
  const harness = loadTag(false, true)
  harness.window.dataLayer.push({
    canonical_event: canonicalPageView(false)
  })

  harness.window.Cookiebot.consent.marketing = true
  harness.listeners.get('CookiebotOnAccept')?.()
  await new Promise(resolve => setImmediate(resolve))

  assert.equal(harness.tracked.length, 0)
})

test('Pinterest Tag sends matching product identity and Enhanced Match', async () => {
  const { tracked, processCanonicalEvent } = loadTag()

  await processCanonicalEvent({
    schema_version: 1,
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    event_name: 'view_item',
    environment: 'production',
    consent: { marketing: 'granted' },
    external_id: 'anon_ce5f010a-804c-4bc6-8738-febd9f4eafbf',
    custom_data: {
      currency: 'NOK',
      value: 799.2,
      items: [
        {
          item_id: CANONICAL_ITEM_ID,
          product_id: 'gid://shopify/Product/1',
          variant_id: CANONICAL_ITEM_ID,
          item_name: 'Comfyrobe™',
          item_brand: 'Utekos',
          item_category: 'Ponchoer',
          quantity: 1,
          unit_price: 799.2
        }
      ]
    }
  })

  const trackCall = tracked.find(call => call[0] === 'track')
  const eventData = trackCall?.[2] as {
    line_items?: Array<{
      product_brand?: string
      product_category?: string
      product_id?: string
    }>
  }
  const loadCall = tracked.find(call => call[0] === 'load')

  assert.equal(
    eventData.line_items?.[0]?.product_id,
    PINTEREST_PRODUCT_ID
  )
  assert.equal(eventData.line_items?.[0]?.product_brand, 'Utekos')
  assert.equal(
    eventData.line_items?.[0]?.product_category,
    'Ponchoer'
  )
  assert.equal(
    (loadCall?.[2] as { external_id?: string })?.external_id,
    '8c30895c344721c6a8cb233e551a34673d2c2fa2317395471588a8e17b6ae654'
  )
})

test('Pinterest Tag maps canonical purchase to Checkout with product context', async () => {
  const { tracked, processCanonicalEvent } = loadTag()

  await processCanonicalEvent({
    schema_version: 1,
    event_id: '69143bcb-d302-4881-bca2-a58a381e2ae7',
    event_name: 'purchase',
    environment: 'production',
    consent: { marketing: 'granted' },
    custom_data: {
      currency: 'NOK',
      value: 2036.4,
      transaction_id: 'shopify_order_6968683004152',
      items: [
        {
          item_id: CANONICAL_ITEM_ID,
          item_name: 'Comfyrobe™',
          item_brand: 'Utekos',
          item_category: 'Ponchoer',
          quantity: 2,
          unit_price: 799
        }
      ]
    }
  })

  const checkoutCall = tracked.find(
    call => call[0] === 'track' && call[1] === 'Checkout'
  )
  const eventData = checkoutCall?.[2] as {
    currency?: string
    event_id?: string
    line_items?: Array<Record<string, unknown>>
    order_id?: string
    order_quantity?: number
    value?: number
  }

  assert.equal(
    eventData.event_id,
    '69143bcb-d302-4881-bca2-a58a381e2ae7'
  )
  assert.equal(eventData.currency, 'NOK')
  assert.equal(eventData.value, 2036.4)
  assert.equal(eventData.order_id, 'shopify_order_6968683004152')
  assert.equal(eventData.order_quantity, 2)
  assert.deepEqual(
    JSON.parse(JSON.stringify(eventData.line_items?.[0])),
    {
      product_id: PINTEREST_PRODUCT_ID,
      product_name: 'Comfyrobe™',
      product_brand: 'Utekos',
      product_category: 'Ponchoer',
      product_price: 799,
      product_quantity: 2
    }
  )
})
