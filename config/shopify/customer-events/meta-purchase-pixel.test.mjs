import assert from 'node:assert/strict'
import { createHash, webcrypto } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import { deterministicPurchaseEventId } from '../../../src/lib/analytics/purchaseEvent.ts'

const pixelSource = await readFile(
  new URL('./meta-purchase-pixel.js', import.meta.url),
  'utf8'
)

function createHarness(marketingAllowed) {
  const eventSubscribers = new Map()
  let privacySubscriber
  const appendedScripts = []
  const tracked = []
  const fbq = (...args) => tracked.push(args)
  const window = { crypto: webcrypto, fbq }
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
    id: 'sh-checkout-completed-1',
    data: {
      checkout: {
        currencyCode: 'NOK',
        email: ' Kunde@Example.no ',
        lineItems: [
          {
            finalLinePrice: { amount: '1598.00' },
            quantity: 2,
            title: 'Comfyrobe',
            variant: {
              id: 'gid://shopify/ProductVariant/48249962135800',
              price: { amount: '899.00' }
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

  await harness.eventSubscribers.get('checkout_completed')(
    checkoutEvent()
  )

  assert.equal(harness.tracked.length, 0)
  assert.equal(harness.appendedScripts.length, 0)
})

test('sends one deduplicated Meta browser Purchase with catalog context', async () => {
  const harness = createHarness(true)
  const checkoutCompleted = harness.eventSubscribers.get(
    'checkout_completed'
  )
  const event = checkoutEvent()

  await Promise.all([
    checkoutCompleted(event),
    checkoutCompleted(event)
  ])

  const initCalls = harness.tracked.filter(
    call => call[0] === 'init'
  )
  const purchaseCalls = harness.tracked.filter(
    call => call[0] === 'trackSingle' && call[2] === 'Purchase'
  )

  assert.equal(initCalls.length, 1)
  assert.equal(initCalls[0][1], '1092362672918571')
  assert.equal(
    initCalls[0][2].em,
    createHash('sha256').update('kunde@example.no').digest('hex')
  )
  assert.equal(purchaseCalls.length, 1)
  assert.equal(purchaseCalls[0][1], '1092362672918571')
  assert.equal(
    purchaseCalls[0][4].eventID,
    deterministicPurchaseEventId('6968683004152')
  )
  assert.deepEqual(
    JSON.parse(JSON.stringify(purchaseCalls[0][3])),
    {
      content_ids: ['48249962135800'],
      contents: [
        { id: '48249962135800', quantity: 2, item_price: 799 }
      ],
      content_type: 'product',
      currency: 'NOK',
      num_items: 2,
      value: 2036.4
    }
  )
  assert.equal(
    JSON.stringify(harness.tracked).includes('Kunde@Example.no'),
    false
  )
  assert.equal(
    harness.appendedScripts[0].src,
    'https://connect.facebook.net/en_US/fbevents.js'
  )
})

test('stops checkout delivery after marketing consent is revoked', async () => {
  const harness = createHarness(true)
  harness.revokeMarketing()

  await harness.eventSubscribers.get('checkout_completed')(
    checkoutEvent()
  )

  assert.equal(harness.tracked.length, 0)
  assert.equal(harness.appendedScripts.length, 0)
})

test('requires numeric Shopify order and variant IDs', async () => {
  const harness = createHarness(true)

  await harness.eventSubscribers.get('checkout_completed')(
    checkoutEvent({
      lineItems: [
        { quantity: 1, variant: { id: 'invalid-variant-id' } }
      ],
      order: { id: 'invalid-order-id' }
    })
  )

  assert.equal(harness.tracked.length, 0)
  assert.equal(harness.appendedScripts.length, 0)
})
