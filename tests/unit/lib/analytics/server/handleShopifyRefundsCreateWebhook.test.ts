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
const { handleShopifyRefundsCreateWebhook } =
  require('./handleShopifyRefundsCreateWebhook.ts') as {
    handleShopifyRefundsCreateWebhook: (
      request: Request,
      dependencies?: {
        acceptRefund?: (
          input: unknown
        ) => Promise<{
          event_id: string
          status: 'accepted' | 'duplicate'
        }>
        createSourceEvidence?: (input: unknown) => unknown
        mapRefund?: (payload: unknown) => unknown
        now?: () => Date
        verifyWebhook?: (
          rawBody: string,
          hmac: string
        ) => boolean
      }
    ) => Promise<Response>
  }

const EVENT_ID = 'refund_evt_test_001'
const REFUND_BODY = JSON.stringify({ id: 67890 })
const SOURCE_EVIDENCE = {
  canonical_event_id: EVENT_ID,
  source_system: 'shopify',
  source_method: 'webhook',
  source_object_type: 'refund',
  source_object_id: '67890',
  source_topic: 'refunds/create',
  source_delivery_id: 'refund-delivery-1',
  source_event_id: 'refund-event-1',
  source_api_version: '2026-04',
  source_triggered_at: '2026-07-21T21:00:00.000Z',
  source_observed_at: '2026-07-21T21:00:01.000Z'
}

function throwIfCalled(name: string) {
  return () => {
    throw new Error(`${name} must not be called`)
  }
}

function createRequest(body: string, hmac = 'valid-hmac') {
  return new Request(
    'https://utekos.no/api/shopify/webhooks/refunds-create',
    {
      method: 'POST',
      headers: {
        'x-shopify-api-version': '2026-04',
        'x-shopify-event-id': 'refund-event-1',
        'x-shopify-hmac-sha256': hmac,
        'x-shopify-topic': 'refunds/create',
        'x-shopify-triggered-at': '2026-07-21T21:00:00.000Z',
        'x-shopify-webhook-id': 'refund-delivery-1'
      },
      body
    }
  )
}

test('accepted refund returns 202', async () => {
  const acceptCalls: unknown[] = []

  const response = await handleShopifyRefundsCreateWebhook(
    createRequest(REFUND_BODY),
    {
      verifyWebhook: () => true,
      mapRefund: payload => payload,
      createSourceEvidence: () => SOURCE_EVIDENCE,
      acceptRefund: async input => {
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

test('duplicate refund returns 200', async () => {
  const response = await handleShopifyRefundsCreateWebhook(
    createRequest(REFUND_BODY),
    {
      verifyWebhook: () => true,
      mapRefund: payload => payload,
      createSourceEvidence: () => SOURCE_EVIDENCE,
      acceptRefund: async () => ({
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

test('invalid HMAC returns 401 and does not map or accept', async () => {
  const response = await handleShopifyRefundsCreateWebhook(
    createRequest(REFUND_BODY, 'bad-hmac'),
    {
      verifyWebhook: () => false,
      createSourceEvidence: throwIfCalled(
        'createSourceEvidence'
      ) as never,
      mapRefund: throwIfCalled('mapRefund') as never,
      acceptRefund: throwIfCalled('acceptRefund') as never
    }
  )

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), {
    error: 'invalid_webhook_signature'
  })
})

test('invalid JSON returns 400 and does not accept', async () => {
  const response = await handleShopifyRefundsCreateWebhook(
    createRequest('{not-json'),
    {
      verifyWebhook: () => true,
      createSourceEvidence: throwIfCalled(
        'createSourceEvidence'
      ) as never,
      mapRefund: throwIfCalled('mapRefund') as never,
      acceptRefund: throwIfCalled('acceptRefund') as never
    }
  )

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    error: 'invalid_json'
  })
})

test('Zod invalid event returns 400', async () => {
  const response = await handleShopifyRefundsCreateWebhook(
    createRequest(REFUND_BODY),
    {
      verifyWebhook: () => true,
      createSourceEvidence: throwIfCalled(
        'createSourceEvidence'
      ) as never,
      mapRefund: () => {
        throw new ZodError([])
      },
      acceptRefund: throwIfCalled('acceptRefund') as never
    }
  )

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    error: 'invalid_event'
  })
})

test('accept failure returns 500', async () => {
  const response = await handleShopifyRefundsCreateWebhook(
    createRequest(REFUND_BODY),
    {
      verifyWebhook: () => true,
      mapRefund: payload => payload,
      createSourceEvidence: () => SOURCE_EVIDENCE,
      acceptRefund: async () => {
        throw new Error('persist failed')
      }
    }
  )

  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), {
    error: 'internal_error'
  })
})

test('handler module does not import request-path provider dispatch', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(
    new URL(
      './handleShopifyRefundsCreateWebhook.ts',
      import.meta.url
    ),
    'utf8'
  )
  assert.equal(
    /runRegisteredProviderOutboxBatch|dispatchCanonical|send.*Meta|send.*Google|send.*Microsoft/.test(
      source
    ),
    false
  )
})

test('2026-04 numeric subtotal fixture maps then accepts without dispatch', async () => {
  const { shopifyRefundToCanonicalRefund } =
    require('./shopifyRefundToCanonicalRefund.ts') as {
      shopifyRefundToCanonicalRefund: (payload: unknown) => {
        event_id: string
        custom_data: { value: number; currency: string }
      }
    }

  const payload = {
    id: 890088186,
    order_id: 820982911,
    created_at: '2021-12-31T19:00:00-05:00',
    refund_line_items: [
      {
        id: 1,
        line_item_id: 2,
        quantity: 1,
        subtotal: 499.5,
        line_item: {
          id: 2,
          name: 'Utekos TechDown',
          price: '499.50',
          quantity: 1,
          sku: 'UTEKOS-1',
          title: 'Utekos TechDown',
          variant_id: 3
        }
      }
    ],
    transactions: [
      {
        id: 10,
        order_id: 820982911,
        amount: '499.50',
        currency: null,
        kind: 'refund',
        gateway: 'bogus',
        status: 'success',
        created_at: '2021-12-31T19:00:00-05:00'
      },
      {
        id: 11,
        order_id: 820982911,
        amount: '0.00',
        currency: 'NOK',
        kind: 'refund',
        gateway: 'bogus',
        status: 'success',
        created_at: '2021-12-31T19:00:00-05:00'
      }
    ]
  }

  const acceptCalls: Array<{ status: string }> = []
  const body = JSON.stringify(payload)
  const mapped = shopifyRefundToCanonicalRefund(payload)

  const accepted = await handleShopifyRefundsCreateWebhook(
    createRequest(body),
    {
      verifyWebhook: () => true,
      mapRefund: shopifyRefundToCanonicalRefund,
      acceptRefund: async () => {
        acceptCalls.push({ status: 'accepted' })
        return { event_id: mapped.event_id, status: 'accepted' }
      }
    }
  )
  const duplicate = await handleShopifyRefundsCreateWebhook(
    createRequest(body),
    {
      verifyWebhook: () => true,
      mapRefund: shopifyRefundToCanonicalRefund,
      acceptRefund: async () => {
        acceptCalls.push({ status: 'duplicate' })
        return { event_id: mapped.event_id, status: 'duplicate' }
      }
    }
  )

  assert.equal(mapped.custom_data.value, 499.5)
  assert.equal(mapped.custom_data.currency, 'NOK')
  assert.equal(accepted.status, 202)
  assert.equal(duplicate.status, 200)
  assert.deepEqual(
    acceptCalls.map(call => call.status),
    ['accepted', 'duplicate']
  )
})

test('shipping-only webhook accepts then deduplicates the same itemless refund', async () => {
  const { shopifyRefundToCanonicalRefund } =
    require('./shopifyRefundToCanonicalRefund.ts') as {
      shopifyRefundToCanonicalRefund: (payload: unknown) => {
        event_id: string
        custom_data: { items: unknown[]; value: number }
      }
    }
  const payload = {
    id: 890088187,
    order_id: 820982911,
    created_at: '2021-12-31T19:00:00-05:00',
    refund_line_items: [],
    refund_shipping_lines: [
      { id: 1, subtotal_amount: 49, tax_amount: 0 }
    ],
    transactions: [
      {
        id: 21,
        order_id: 820982911,
        amount: '49.00',
        currency: 'NOK',
        kind: 'refund',
        gateway: 'bogus',
        status: 'success',
        created_at: '2021-12-31T19:00:00-05:00'
      }
    ]
  }
  const mapped = shopifyRefundToCanonicalRefund(payload)
  const statuses: Array<'accepted' | 'duplicate'> = []
  const body = JSON.stringify(payload)

  const accepted = await handleShopifyRefundsCreateWebhook(
    createRequest(body),
    {
      verifyWebhook: () => true,
      mapRefund: shopifyRefundToCanonicalRefund,
      acceptRefund: async () => {
        statuses.push('accepted')
        return { event_id: mapped.event_id, status: 'accepted' }
      }
    }
  )
  const duplicate = await handleShopifyRefundsCreateWebhook(
    createRequest(body),
    {
      verifyWebhook: () => true,
      mapRefund: shopifyRefundToCanonicalRefund,
      acceptRefund: async () => {
        statuses.push('duplicate')
        return { event_id: mapped.event_id, status: 'duplicate' }
      }
    }
  )

  assert.deepEqual(mapped.custom_data.items, [])
  assert.equal(mapped.custom_data.value, 49)
  assert.equal(accepted.status, 202)
  assert.equal(duplicate.status, 200)
  assert.deepEqual(statuses, ['accepted', 'duplicate'])
})
