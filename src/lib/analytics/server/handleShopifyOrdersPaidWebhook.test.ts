import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import { ZodError } from 'zod'

const moduleWithLoad = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const originalLoad = moduleWithLoad._load.bind(Module)

moduleWithLoad._load = (request, parent, isMain) => {
  if (request === 'server-only') {
    return {}
  }

  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { handleShopifyOrdersPaidWebhook } =
  require('./handleShopifyOrdersPaidWebhook.ts') as {
    handleShopifyOrdersPaidWebhook: (
      request: Request,
      dependencies?: {
        acceptPurchase?: (
          input: unknown
        ) => Promise<{
          event_id: string
          status: 'accepted' | 'duplicate'
        }>
        createSourceEvidence?: (input: unknown) => unknown
        mapOrder?: (payload: unknown) => unknown
        notifyPurchase?: (
          purchase: unknown
        ) => Promise<
          | { delivery: 'already_sent' | 'sent'; ok: true }
          | { ok: false; reason: 'provider_rejected' }
        >
        now?: () => Date
        verifyWebhook?: (
          rawBody: string,
          hmac: string
        ) => boolean
        writeLog?: (input: unknown) => Promise<unknown>
      }
    ) => Promise<Response>
  }

const EVENT_ID = 'purchase_evt_test_001'
const ORDER_BODY = JSON.stringify({ id: 12345 })
const SOURCE_EVIDENCE = {
  canonical_event_id: EVENT_ID,
  source_system: 'shopify',
  source_method: 'webhook',
  source_object_type: 'order',
  source_object_id: '12345',
  source_topic: 'orders/paid',
  source_delivery_id: 'order-delivery-1',
  source_event_id: 'order-event-1',
  source_api_version: '2026-04',
  source_triggered_at: '2026-07-21T20:00:00.000Z',
  source_observed_at: '2026-07-21T20:00:01.000Z'
}

function throwIfCalled(name: string) {
  return () => {
    throw new Error(`${name} must not be called`)
  }
}

function createRequest(body: string, hmac = 'valid-hmac') {
  return new Request(
    'https://utekos.no/api/shopify/webhooks/orders-paid',
    {
      method: 'POST',
      headers: {
        'x-shopify-api-version': '2026-04',
        'x-shopify-event-id': 'order-event-1',
        'x-shopify-hmac-sha256': hmac,
        'x-shopify-topic': 'orders/paid',
        'x-shopify-triggered-at': '2026-07-21T20:00:00.000Z',
        'x-shopify-webhook-id': 'order-delivery-1'
      },
      body
    }
  )
}

test('accepted purchase returns 202', async () => {
  const acceptCalls: unknown[] = []

  const response = await handleShopifyOrdersPaidWebhook(
    createRequest(ORDER_BODY),
    {
      verifyWebhook: () => true,
      mapOrder: payload => payload,
      createSourceEvidence: () => SOURCE_EVIDENCE,
      notifyPurchase: async () => ({
        delivery: 'sent',
        ok: true
      }),
      writeLog: async () => ({}),
      acceptPurchase: async input => {
        acceptCalls.push(input)
        return { event_id: EVENT_ID, status: 'accepted' }
      }
    }
  )

  assert.equal(response.status, 202)
  assert.deepEqual(await response.json(), {
    event_id: EVENT_ID,
    status: 'accepted'
  })
  assert.equal(acceptCalls.length, 1)
  assert.deepEqual(
    (acceptCalls[0] as { sourceEvidence: unknown })
      .sourceEvidence,
    SOURCE_EVIDENCE
  )
})

test('duplicate purchase returns 200', async () => {
  const response = await handleShopifyOrdersPaidWebhook(
    createRequest(ORDER_BODY),
    {
      verifyWebhook: () => true,
      mapOrder: payload => payload,
      createSourceEvidence: () => SOURCE_EVIDENCE,
      notifyPurchase: async () => ({
        delivery: 'already_sent',
        ok: true
      }),
      writeLog: async () => ({}),
      acceptPurchase: async () => ({
        event_id: EVENT_ID,
        status: 'duplicate'
      })
    }
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    event_id: EVENT_ID,
    status: 'duplicate'
  })
})

test('notification failure returns 500 after purchase acceptance', async () => {
  const logs: unknown[] = []
  const response = await handleShopifyOrdersPaidWebhook(
    createRequest(ORDER_BODY),
    {
      verifyWebhook: () => true,
      mapOrder: () => ({ event_id: EVENT_ID }),
      createSourceEvidence: () => SOURCE_EVIDENCE,
      acceptPurchase: async () => ({
        event_id: EVENT_ID,
        status: 'accepted'
      }),
      notifyPurchase: async () => ({
        ok: false,
        reason: 'provider_rejected'
      }),
      writeLog: async input => {
        logs.push(input)
        return {}
      }
    }
  )

  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), {
    error: 'purchase_notification_failed'
  })
  assert.deepEqual(logs, [
    {
      event: 'commerce.purchase_notification_failed',
      level: 'ERROR',
      data: {
        eventId: EVENT_ID,
        reasonCode: 'provider_rejected'
      },
      context: {
        requestPath: '/api/shopify/webhooks/orders-paid'
      }
    }
  ])
})

test('invalid HMAC returns 401 and does not map or accept', async () => {
  const response = await handleShopifyOrdersPaidWebhook(
    createRequest(ORDER_BODY, 'bad-hmac'),
    {
      verifyWebhook: () => false,
      createSourceEvidence: throwIfCalled(
        'createSourceEvidence'
      ) as never,
      mapOrder: throwIfCalled('mapOrder') as never,
      acceptPurchase: throwIfCalled('acceptPurchase') as never
    }
  )

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), {
    error: 'invalid_webhook_signature'
  })
})

test('invalid JSON returns 400 and does not accept', async () => {
  const response = await handleShopifyOrdersPaidWebhook(
    createRequest('{not-json'),
    {
      verifyWebhook: () => true,
      createSourceEvidence: throwIfCalled(
        'createSourceEvidence'
      ) as never,
      mapOrder: throwIfCalled('mapOrder') as never,
      acceptPurchase: throwIfCalled('acceptPurchase') as never
    }
  )

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    error: 'invalid_json'
  })
})

test('Zod invalid event returns 400', async () => {
  const response = await handleShopifyOrdersPaidWebhook(
    createRequest(ORDER_BODY),
    {
      verifyWebhook: () => true,
      createSourceEvidence: throwIfCalled(
        'createSourceEvidence'
      ) as never,
      mapOrder: () => {
        throw new ZodError([])
      },
      acceptPurchase: throwIfCalled('acceptPurchase') as never
    }
  )

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    error: 'invalid_event'
  })
})

test('accept failure returns 500', async () => {
  const response = await handleShopifyOrdersPaidWebhook(
    createRequest(ORDER_BODY),
    {
      verifyWebhook: () => true,
      mapOrder: payload => payload,
      createSourceEvidence: () => SOURCE_EVIDENCE,
      acceptPurchase: async () => {
        throw new Error('persist failed')
      }
    }
  )

  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), {
    error: 'internal_error'
  })
})
