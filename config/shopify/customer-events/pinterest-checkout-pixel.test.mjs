import assert from 'node:assert/strict'
import { createHash, webcrypto } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import { deterministicPurchaseEventId } from '../../../src/lib/analytics/purchaseEvent.ts'

const pixelSource = await readFile(
  new URL('./pinterest-checkout-pixel.js', import.meta.url),
  'utf8'
)

function createHarness(marketingAllowed) {
  const eventSubscribers = new Map()
  let privacySubscriber
  const appendedScripts = []
  const tracked = []
  const pintrk = (...args) => tracked.push(args)
  const window = { crypto: webcrypto, pintrk }
  const document = {
    createElement(name) {
      assert.equal(name, 'script')
      return {}
    },
    getElementsByTagName() {
      return []
    },
    head: {
      appendChild(script) {
        appendedScripts.push(script)
      }
    },
    querySelector() {
      return null
    }
  }
  const context = {
    TextEncoder,
    Uint8Array,
    analytics: {
      subscribe(name, subscriber) {
        eventSubscribers.set(name, subscriber)
      }
    },
    api: {
      customerPrivacy: {
        subscribe(name, subscriber) {
          assert.equal(name, 'visitorConsentCollected')
          privacySubscriber = subscriber
        }
      }
    },
    document,
    init: { customerPrivacy: { marketingAllowed } },
    window
  }

  vm.runInNewContext(pixelSource, context)

  return {
    appendedScripts,
    eventSubscribers,
    grantMarketing() {
      privacySubscriber({
        customerPrivacy: { marketingAllowed: true }
      })
    },
    revokeMarketing() {
      privacySubscriber({
        customerPrivacy: { marketingAllowed: false }
      })
    },
    tracked
  }
}

function checkoutEvent(overrides = {}) {
  return {
    id: 'sh-f4f0a72e',
    data: {
      checkout: {
        currencyCode: 'NOK',
        email: ' Kunde@Example.no ',
        lineItems: [
          {
            finalLinePrice: { amount: '1598.00' },
            id: 'gid://shopify/CheckoutLineItem/987',
            quantity: 2,
            title: 'Comfyrobe',
            variant: {
              id: 'gid://shopify/ProductVariant/48249962135800',
              price: { amount: '899.00' },
              product: { type: 'Ponchoer', vendor: 'Utekos' },
              sku: 'COMFYROBE-M',
              title: 'Fjellnatt / M'
            }
          }
        ],
        order: { id: 'gid://shopify/Order/6968683004152' },
        totalPrice: { amount: '2036.40' },
        ...overrides
      }
    }
  }
}

test('fails closed until Shopify grants marketing consent', async () => {
  const harness = createHarness(false)
  const checkoutCompleted = harness.eventSubscribers.get(
    'checkout_completed'
  )

  await checkoutCompleted(checkoutEvent())

  assert.equal(harness.tracked.length, 0)
  assert.equal(harness.appendedScripts.length, 0)
})

test('sends Pinterest Checkout with deduplication and product context', async () => {
  const harness = createHarness(true)
  const checkoutCompleted = harness.eventSubscribers.get(
    'checkout_completed'
  )
  const event = checkoutEvent()

  await Promise.all([
    checkoutCompleted(event),
    checkoutCompleted(event)
  ])

  const loadCalls = harness.tracked.filter(
    call => call[0] === 'load'
  )
  const checkoutCalls = harness.tracked.filter(
    call => call[0] === 'track' && call[1] === 'Checkout'
  )

  assert.equal(loadCalls.length, 1)
  assert.equal(loadCalls[0][1], '2613489421259')
  assert.equal(
    loadCalls[0][2].em,
    createHash('sha256').update('kunde@example.no').digest('hex')
  )
  assert.equal(checkoutCalls.length, 1)
  assert.equal(
    checkoutCalls[0][2].event_id,
    deterministicPurchaseEventId('6968683004152')
  )
  assert.equal(
    checkoutCalls[0][2].order_id,
    'shopify_order_6968683004152'
  )
  assert.equal(checkoutCalls[0][2].currency, 'NOK')
  assert.equal(checkoutCalls[0][2].value, 2036.4)
  assert.equal(checkoutCalls[0][2].order_quantity, 2)
  assert.deepEqual(
    JSON.parse(JSON.stringify(checkoutCalls[0][2].line_items)),
    [
      {
        product_brand: 'Utekos',
        product_category: 'Ponchoer',
        product_id: '48249962135800',
        product_name: 'Comfyrobe',
        product_price: 799,
        product_quantity: 2
      }
    ]
  )
  assert.equal(
    JSON.stringify(harness.tracked).includes('Kunde@Example.no'),
    false
  )
  assert.equal(
    harness.appendedScripts[0].src,
    'https://s.pinimg.com/ct/core.js'
  )
})

test('does not fabricate unavailable product brand or category', async () => {
  const harness = createHarness(true)
  const checkoutCompleted = harness.eventSubscribers.get(
    'checkout_completed'
  )
  const event = checkoutEvent()

  delete event.data.checkout.lineItems[0].variant.product.vendor
  delete event.data.checkout.lineItems[0].variant.product.type

  await checkoutCompleted(event)

  const lineItem = harness.tracked.find(
    call => call[0] === 'track'
  )[2].line_items[0]

  assert.equal(lineItem.product_brand, undefined)
  assert.equal(lineItem.product_category, undefined)
})

test('rechecks marketing consent after asynchronous hashing', async () => {
  const harness = createHarness(true)
  const checkoutCompleted = harness.eventSubscribers.get(
    'checkout_completed'
  )

  harness.revokeMarketing()
  await checkoutCompleted(checkoutEvent())

  assert.equal(harness.tracked.length, 0)
})
