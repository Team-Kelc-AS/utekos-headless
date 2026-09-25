import assert from 'node:assert/strict'
import test from 'node:test'
import { ServerEvent, UserData } from 'facebook-nodejs-business-sdk'
import { canonicalPurchaseSchema } from '../purchaseEvent'
import { dispatchCanonicalPurchaseToMeta } from './dispatchCanonicalPurchaseToMeta'

const canonicalPurchase = canonicalPurchaseSchema.parse({
  schema_version: 1,
  event_name: 'purchase',
  event_id: '22222222-2222-4222-8222-222222222222',
  event_time: '2026-09-25T12:00:00.000Z',
  source: 'webhook',
  environment: 'production',
  consent: {
    analytics: 'granted',
    marketing: 'granted',
    preferences: 'denied',
    source: 'cookiebot',
    version: '1'
  },
  custom_data: {
    currency: 'NOK',
    value: 1990,
    transaction_id: 'shopify_order_12345',
    order_name: '#12345',
    items: [
      {
        item_id: '48249962135800',
        item_name: 'Utekos TechDown',
        quantity: 1,
        unit_price: 1990
      }
    ]
  }
})

function serverEvent(name: string) {
  return new ServerEvent()
    .setActionSource('website')
    .setEventId(`${name}-id`)
    .setEventName(name)
    .setEventSourceUrl('https://utekos.no/')
    .setEventTime(1_758_801_600)
    .setUserData(
      new UserData().setClientUserAgent('Mozilla/5.0')
    )
}

test('sends Purchase and its qualifying AppendAttribution atomically', async () => {
  const purchaseEvent = serverEvent('Purchase')
  const appendEvent = serverEvent('AppendAttribution')
  let sentEvents: readonly ServerEvent[] = []

  const receipt = await dispatchCanonicalPurchaseToMeta(
    canonicalPurchase,
    {
      mapAppendEvent: (_event, now) => {
        assert.equal(now, 1_758_801_660)
        return appendEvent
      },
      mapEvent: () => purchaseEvent,
      nowUnixSeconds: () => 1_758_801_660,
      readConfig: () => ({
        accessToken: 'token',
        pixelId: 'pixel'
      }),
      sendEvents: async events => {
        sentEvents = events
        return { eventsReceived: 2, messages: [] }
      }
    }
  )

  assert.deepEqual(sentEvents, [purchaseEvent, appendEvent])
  assert.equal(receipt.result.eventsReceived, 2)
})

test('sends only Purchase when the custom attribution rule does not qualify', async () => {
  const purchaseEvent = serverEvent('Purchase')
  let sentEvents: readonly ServerEvent[] = []

  await dispatchCanonicalPurchaseToMeta(canonicalPurchase, {
    mapAppendEvent: () => undefined,
    mapEvent: () => purchaseEvent,
    nowUnixSeconds: () => 1_758_801_660,
    readConfig: () => ({ accessToken: 'token', pixelId: 'pixel' }),
    sendEvents: async events => {
      sentEvents = events
      return { eventsReceived: 1, messages: [] }
    }
  })

  assert.deepEqual(sentEvents, [purchaseEvent])
})
