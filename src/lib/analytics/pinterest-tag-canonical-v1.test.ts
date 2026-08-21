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

function loadTag() {
  const tracked: unknown[][] = []
  const pintrk = Object.assign(
    (...args: unknown[]) => {
      tracked.push(args)
    },
    { queue: [] as unknown[], version: '3.0' }
  )
  const document = {
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
    pintrk,
    crypto: webcrypto,
    dataLayer: [] as unknown[],
    addEventListener() {},
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

  return { tracked, processCanonicalEvent }
}

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
