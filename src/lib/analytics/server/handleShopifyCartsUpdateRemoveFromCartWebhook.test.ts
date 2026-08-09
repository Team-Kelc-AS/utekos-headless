import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import type {
  ShopifyCartSnapshot,
  ShopifyCartSnapshotStore
} from './shopifyCartSnapshotStore'

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
const { handleShopifyCartsUpdateRemoveFromCartWebhook } =
  require('./handleShopifyCartsUpdateRemoveFromCartWebhook.ts') as {
    handleShopifyCartsUpdateRemoveFromCartWebhook: (
      request: Request,
      dependencies?: Record<string, unknown>
    ) => Promise<Response>
  }

const CART_TOKEN = 'exampleCartId'
const UPDATED_AT = '2026-07-24T12:00:00.000Z'

function line(quantity: number) {
  return {
    // String IDs: Shopify sample ints exceed Number.MAX_SAFE_INTEGER.
    id: '704912205188288575',
    properties: null,
    quantity,
    variant_id: '704912205188288575',
    key: '704912205188288575:abc',
    discounted_price: '1590.00',
    discounts: [],
    gift_card: false,
    grams: 200,
    line_price: String(1590 * quantity),
    original_line_price: String(1590 * quantity),
    original_price: '1590.00',
    price: '1590.00',
    product_id: '788032119674292922',
    sku: 'example-shirt-s',
    taxable: true,
    title: 'Example T-Shirt - Small',
    total_discount: '0.00',
    vendor: 'Utekos',
    price_set: {
      shop_money: { amount: '1590.00', currency_code: 'NOK' },
      presentment_money: {
        amount: '1590.00',
        currency_code: 'NOK'
      }
    }
  }
}

function cartBody(quantity: number) {
  return JSON.stringify({
    id: CART_TOKEN,
    token: CART_TOKEN,
    line_items: quantity > 0 ? [line(quantity)] : [],
    note: null,
    updated_at: UPDATED_AT,
    created_at: '2026-07-24T11:00:00.000Z'
  })
}

function createRequest(body: string, hmac = 'valid-hmac') {
  return new Request(
    'https://utekos.no/api/shopify/webhooks/remove-from-cart',
    {
      method: 'POST',
      headers: {
        'x-shopify-api-version': '2026-04',
        'x-shopify-event-id': 'cart-event-1',
        'x-shopify-hmac-sha256': hmac,
        'x-shopify-topic': 'carts/update',
        'x-shopify-triggered-at': UPDATED_AT,
        'x-shopify-webhook-id': 'cart-delivery-1'
      },
      body
    }
  )
}

function memorySnapshotStore(
  initial: Map<string, unknown> = new Map()
): ShopifyCartSnapshotStore & { store: Map<string, unknown> } {
  return {
    store: initial,
    async get(cartToken: string) {
      return (initial.get(cartToken) as never) ?? null
    },
    async set(snapshot: ShopifyCartSnapshot) {
      initial.set(snapshot.cart_token, snapshot)
    }
  }
}

test('invalid hmac returns 401', async () => {
  const response =
    await handleShopifyCartsUpdateRemoveFromCartWebhook(
      createRequest(cartBody(1)),
      {
        verifyWebhook: () => false,
        snapshotStore: memorySnapshotStore()
      }
    )

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), {
    error: 'invalid_webhook_signature'
  })
})

test('missing prior cart stores snapshot and invents no removals', async () => {
  const snapshotStore = memorySnapshotStore()
  const acceptCalls: unknown[] = []

  const response =
    await handleShopifyCartsUpdateRemoveFromCartWebhook(
      createRequest(cartBody(2)),
      {
        verifyWebhook: () => true,
        snapshotStore,
        acceptRemoveFromCart: async (input: unknown) => {
          acceptCalls.push(input)
          return { event_id: 'x', status: 'accepted' }
        }
      }
    )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    status: 'prior_cart_missing',
    cart_token: CART_TOKEN,
    snapshot_stored: true,
    removals: []
  })
  assert.equal(acceptCalls.length, 0)
  assert.equal(snapshotStore.store.has(CART_TOKEN), true)
})

test('quantity decrease accepts remove_from_cart', async () => {
  const snapshotStore = memorySnapshotStore()
  await snapshotStore.set({
    cart_token: CART_TOKEN,
    line_items: [
      {
        price: '1590.00',
        product_id: '788032119674292922',
        quantity: 3,
        title: 'Example T-Shirt - Small',
        variant_id: '704912205188288575',
        currency_code: 'NOK',
        taxable: true,
        vendor: 'Utekos'
      }
    ],
    stored_at: '2026-07-24T11:59:00.000Z',
    updated_at: '2026-07-24T11:59:00.000Z'
  })

  const acceptCalls: unknown[] = []
  const response =
    await handleShopifyCartsUpdateRemoveFromCartWebhook(
      createRequest(cartBody(1)),
      {
        verifyWebhook: () => true,
        snapshotStore,
        createSourceEvidence: () => ({
          canonical_event_id:
            '00000000-0000-4000-8000-000000000001',
          source_system: 'shopify',
          source_method: 'webhook',
          source_object_type: 'cart',
          source_object_id: CART_TOKEN,
          source_topic: 'carts/update',
          source_delivery_id: 'cart-delivery-1',
          source_event_id: 'cart-event-1',
          source_api_version: '2026-04',
          source_triggered_at: UPDATED_AT,
          source_observed_at: UPDATED_AT
        }),
        acceptRemoveFromCart: async (input: unknown) => {
          acceptCalls.push(input)
          return {
            event_id: (
              input as { payload: { event_id: string } }
            ).payload.event_id,
            status: 'accepted'
          }
        }
      }
    )

  assert.equal(response.status, 202)
  const body = await response.json()
  assert.equal(body.status, 'accepted')
  assert.equal(body.removals.length, 1)
  assert.equal(body.removals[0].quantity_removed, 2)
  assert.equal(acceptCalls.length, 1)
})

test('identical cart is noop without accept', async () => {
  const snapshotStore = memorySnapshotStore()
  await snapshotStore.set({
    cart_token: CART_TOKEN,
    line_items: [
      {
        price: '1590.00',
        product_id: '788032119674292922',
        quantity: 2,
        title: 'Example T-Shirt - Small',
        variant_id: '704912205188288575',
        currency_code: 'NOK',
        taxable: true
      }
    ],
    stored_at: '2026-07-24T11:59:00.000Z',
    updated_at: '2026-07-24T11:59:00.000Z'
  })

  let accepted = 0
  const response =
    await handleShopifyCartsUpdateRemoveFromCartWebhook(
      createRequest(cartBody(2)),
      {
        verifyWebhook: () => true,
        snapshotStore,
        acceptRemoveFromCart: async () => {
          accepted += 1
          return { event_id: 'x', status: 'accepted' }
        }
      }
    )

  assert.equal(response.status, 200)
  assert.equal((await response.json()).status, 'noop')
  assert.equal(accepted, 0)
})

test('quantity increase does not emit remove_from_cart', async () => {
  const snapshotStore = memorySnapshotStore()
  await snapshotStore.set({
    cart_token: CART_TOKEN,
    line_items: [
      {
        price: '1590.00',
        product_id: '788032119674292922',
        quantity: 1,
        title: 'Example T-Shirt - Small',
        variant_id: '704912205188288575',
        currency_code: 'NOK',
        taxable: true
      }
    ],
    stored_at: '2026-07-24T11:59:00.000Z',
    updated_at: '2026-07-24T11:59:00.000Z'
  })

  let accepted = 0
  const response =
    await handleShopifyCartsUpdateRemoveFromCartWebhook(
      createRequest(cartBody(3)),
      {
        verifyWebhook: () => true,
        snapshotStore,
        acceptRemoveFromCart: async () => {
          accepted += 1
          return { event_id: 'x', status: 'accepted' }
        }
      }
    )

  assert.equal(response.status, 200)
  assert.equal((await response.json()).status, 'noop')
  assert.equal(accepted, 0)
})
