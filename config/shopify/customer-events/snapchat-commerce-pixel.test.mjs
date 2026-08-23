import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const pixelSource = await readFile(
  new URL('./snapchat-commerce-pixel.js', import.meta.url),
  'utf8'
)

function createHarness(marketingAllowed) {
  const eventSubscribers = new Map()
  let privacySubscriber
  const appendedScripts = []
  const tracked = []
  const window = { snaptr: (...args) => tracked.push(args) }
  const context = {
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
    document: {
      createElement(name) {
        assert.equal(name, 'script')
        return {}
      },
      head: {
        appendChild(script) {
          appendedScripts.push(script)
        }
      },
      querySelector() {
        return null
      }
    },
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
    id: 'sh-payment-revision-1',
    data: {
      checkout: {
        currencyCode: 'NOK',
        email: 'must-not-be-sent@example.no',
        lineItems: [
          {
            quantity: 2,
            variant: {
              product: { id: 'gid://shopify/Product/987654321' }
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

test('fails closed before marketing consent', () => {
  const harness = createHarness(false)

  harness.eventSubscribers.get('payment_info_submitted')(
    checkoutEvent()
  )
  harness.eventSubscribers.get('checkout_completed')(
    checkoutEvent()
  )

  assert.equal(harness.tracked.length, 0)
  assert.equal(harness.appendedScripts.length, 0)
})

test('sends ADD_BILLING once with Shopify event id deduplication', () => {
  const harness = createHarness(true)
  const paymentInfoSubmitted = harness.eventSubscribers.get(
    'payment_info_submitted'
  )
  const event = checkoutEvent()

  paymentInfoSubmitted(event)
  paymentInfoSubmitted(event)

  const calls = harness.tracked.filter(
    call => call[0] === 'track' && call[1] === 'ADD_BILLING'
  )
  assert.equal(calls.length, 1)
  assert.equal(calls[0][2].client_dedup_id, event.id)
  assert.deepEqual(Array.from(calls[0][2].item_ids), [
    '987654321'
  ])
  assert.equal(calls[0][2].number_items, 2)
  assert.equal(calls[0][2].currency, 'NOK')
  assert.equal(calls[0][2].price, 2036.4)
})

test('sends PURCHASE once with the canonical order dedupe id', () => {
  const harness = createHarness(true)
  const checkoutCompleted = harness.eventSubscribers.get(
    'checkout_completed'
  )
  const event = checkoutEvent()

  checkoutCompleted(event)
  checkoutCompleted(event)

  const initCalls = harness.tracked.filter(
    call => call[0] === 'init'
  )
  const calls = harness.tracked.filter(
    call => call[0] === 'track' && call[1] === 'PURCHASE'
  )
  const transactionId = 'shopify_order_6968683004152'

  assert.equal(initCalls.length, 1)
  assert.equal(initCalls[0].length, 2)
  assert.equal(calls.length, 1)
  assert.equal(calls[0][2].client_dedup_id, transactionId)
  assert.equal(calls[0][2].transaction_id, transactionId)
  assert.equal(
    JSON.stringify(harness.tracked).includes('must-not-be-sent'),
    false
  )
  assert.equal(
    harness.appendedScripts[0].src,
    'https://sc-static.net/scevent.min.js'
  )
})

test('stops checkout calls after marketing consent is revoked', () => {
  const harness = createHarness(true)
  harness.revokeMarketing()

  harness.eventSubscribers.get('payment_info_submitted')(
    checkoutEvent()
  )
  harness.eventSubscribers.get('checkout_completed')(
    checkoutEvent()
  )

  assert.equal(harness.tracked.length, 0)
  assert.equal(harness.appendedScripts.length, 0)
})

test('requires numeric Shopify Product and Order ids', () => {
  const harness = createHarness(true)
  const event = checkoutEvent({
    lineItems: [
      {
        quantity: 1,
        variant: { product: { id: 'invalid-product-id' } }
      }
    ],
    order: { id: 'invalid-order-id' }
  })

  harness.eventSubscribers.get('payment_info_submitted')(event)
  harness.eventSubscribers.get('checkout_completed')(event)

  assert.equal(harness.tracked.length, 0)
})
