import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import { shopifyPurchaseTransactionId } from '../../../src/lib/analytics/purchaseEvent.ts'
import { mapCanonicalPurchaseToGoogleDataManager } from '../../../src/lib/analytics/server/mapCanonicalPurchaseToGoogleDataManager.ts'

const pixelSource = await readFile(
  new URL('./ga4-commerce-pixel.js', import.meta.url),
  'utf8'
)

function createHarness(analyticsProcessingAllowed) {
  const eventSubscribers = new Map()
  let privacySubscriber
  const appendedScripts = []
  const window = { dataLayer: [] }

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
      }
    },
    init: { customerPrivacy: { analyticsProcessingAllowed } },
    window
  }

  vm.runInNewContext(pixelSource, context)

  return {
    appendedScripts,
    eventSubscribers,
    grantAnalytics() {
      privacySubscriber({
        customerPrivacy: { analyticsProcessingAllowed: true }
      })
    },
    revokeAnalytics() {
      privacySubscriber({
        customerPrivacy: { analyticsProcessingAllowed: false }
      })
    },
    window
  }
}

function checkoutEvent(overrides = {}) {
  return {
    id: 'sh-f4f0a72e',
    context: {
      document: {
        location: {
          href: 'https://kasse.utekos.no/checkouts/abc/thank-you'
        }
      }
    },
    data: {
      checkout: {
        currencyCode: 'NOK',
        lineItems: [
          {
            finalLinePrice: { amount: '1598.00' },
            id: 'gid://shopify/CheckoutLineItem/987',
            quantity: 2,
            title: 'Comfyrobe',
            variant: {
              id: 'gid://shopify/ProductVariant/48249962135800',
              price: { amount: '899.00' },
              sku: 'COMFYROBE-M',
              title: 'Fjellnatt / M'
            }
          }
        ],
        order: { id: 'gid://shopify/Order/6968683004152' },
        shippingLine: { price: { amount: '99.00' } },
        subtotalPrice: { amount: '1598.00' },
        totalTax: { amount: '339.40' },
        ...overrides
      }
    }
  }
}

function commands(harness) {
  return harness.window.dataLayer.map(entry => Array.from(entry))
}

test('fails closed until Shopify grants analytics consent', () => {
  const harness = createHarness(false)
  const checkoutCompleted = harness.eventSubscribers.get(
    'checkout_completed'
  )

  assert.equal(harness.appendedScripts.length, 0)
  checkoutCompleted(checkoutEvent())
  assert.equal(commands(harness).length, 0)

  harness.grantAnalytics()
  assert.equal(harness.appendedScripts.length, 1)
  assert.equal(
    harness.appendedScripts[0].src,
    'https://utekos.no/__sgtm/gtag/js?id=GT-MKRLF5WK'
  )
  assert.deepEqual(commands(harness)[0].slice(0, 2), [
    'consent',
    'default'
  ])
  assert.equal(
    commands(harness)[0][2].analytics_storage,
    'granted'
  )
  assert.equal(commands(harness)[0][2].ad_storage, 'denied')
})

test('sends purchase with the canonical Data Manager transaction id', () => {
  const harness = createHarness(true)
  const checkoutCompleted = harness.eventSubscribers.get(
    'checkout_completed'
  )
  const event = checkoutEvent()

  checkoutCompleted(event)
  checkoutCompleted(event)

  const purchaseCommands = commands(harness).filter(
    command =>
      command[0] === 'event' && command[1] === 'purchase'
  )

  assert.equal(purchaseCommands.length, 1)
  assert.equal(
    purchaseCommands[0][2].transaction_id,
    'shopify_order_6968683004152'
  )
  assert.equal(purchaseCommands[0][2].currency, 'NOK')
  assert.equal(purchaseCommands[0][2].value, 1598)
  assert.equal(purchaseCommands[0][2].tax, 339.4)
  assert.equal(purchaseCommands[0][2].shipping, 99)
  assert.deepEqual(
    JSON.parse(JSON.stringify(purchaseCommands[0][2].items)),
    [
      {
        item_id: '48249962135800',
        item_name: 'Comfyrobe',
        item_sku: 'COMFYROBE-M',
        item_variant: 'Fjellnatt / M',
        price: 799,
        quantity: 2
      }
    ]
  )
})

test('matches the server purchase transaction, value, currency, and items', () => {
  const harness = createHarness(true)
  const checkoutCompleted = harness.eventSubscribers.get(
    'checkout_completed'
  )

  checkoutCompleted(checkoutEvent())

  const browserPurchase = commands(harness).find(
    command =>
      command[0] === 'event' && command[1] === 'purchase'
  )[2]
  const serverPurchase = mapCanonicalPurchaseToGoogleDataManager(
    {
      schema_version: 1,
      event_name: 'purchase',
      event_id: 'a495351a-c370-4e6b-8693-3afb2b5df207',
      event_time: '2026-07-25T10:00:00.000Z',
      source: 'server',
      environment: 'test',
      consent: {
        analytics: 'granted',
        marketing: 'denied',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      },
      browser_id: { ga_client_id: '123456789.1784201643' },
      custom_data: {
        currency: 'NOK',
        value: 1598,
        transaction_id:
          shopifyPurchaseTransactionId('6968683004152'),
        order_name: '#1902',
        items: [
          {
            item_id: '48249962135800',
            item_name: 'Comfyrobe',
            quantity: 2,
            unit_price: 799,
            sku: 'COMFYROBE-M'
          }
        ]
      }
    }
  )
  const serverItem = serverPurchase.cartData.items[0]
  const serverParameters = Object.fromEntries(
    serverItem.additionalItemParameters.map(parameter => [
      parameter.parameterName,
      parameter.value
    ])
  )

  assert.equal(
    browserPurchase.transaction_id,
    serverPurchase.transactionId
  )
  assert.equal(browserPurchase.currency, serverPurchase.currency)
  assert.equal(
    browserPurchase.value,
    serverPurchase.conversionValue
  )
  assert.deepEqual(
    JSON.parse(JSON.stringify(browserPurchase.items)),
    [
      {
        item_id: serverItem.itemId,
        item_name: serverParameters.item_name,
        item_sku: serverParameters.sku,
        item_variant: 'Fjellnatt / M',
        price: serverItem.unitPrice,
        quantity: serverItem.quantity
      }
    ]
  )
})

test('rejects checkout purchases without a Shopify order legacy id', () => {
  const harness = createHarness(true)
  const checkoutCompleted = harness.eventSubscribers.get(
    'checkout_completed'
  )

  checkoutCompleted(
    checkoutEvent({ order: { id: 'not-a-shopify-order-id' } })
  )

  assert.equal(
    commands(harness).filter(
      command => command[1] === 'purchase'
    ).length,
    0
  )
})

test('maps payment_info_submitted to add_payment_info', () => {
  const harness = createHarness(true)
  const paymentInfoSubmitted = harness.eventSubscribers.get(
    'payment_info_submitted'
  )

  paymentInfoSubmitted(checkoutEvent())

  const paymentCommands = commands(harness).filter(
    command =>
      command[0] === 'event' && command[1] === 'add_payment_info'
  )

  assert.equal(paymentCommands.length, 1)
  assert.equal(paymentCommands[0][2].currency, 'NOK')
  assert.equal(
    paymentCommands[0][2].items[0].item_id,
    '48249962135800'
  )
})

test('revoking analytics consent updates the Google tag and blocks events', () => {
  const harness = createHarness(true)
  const paymentInfoSubmitted = harness.eventSubscribers.get(
    'payment_info_submitted'
  )

  harness.revokeAnalytics()
  paymentInfoSubmitted(checkoutEvent())

  const consentUpdates = commands(harness).filter(
    command =>
      command[0] === 'consent' && command[1] === 'update'
  )

  assert.equal(consentUpdates.length, 1)
  assert.equal(consentUpdates[0][2].analytics_storage, 'denied')
  assert.equal(
    commands(harness).filter(command => command[0] === 'event')
      .length,
    0
  )
})
