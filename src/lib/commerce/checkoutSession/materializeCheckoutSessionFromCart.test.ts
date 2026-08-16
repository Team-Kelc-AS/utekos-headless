import assert from 'node:assert/strict'
import test from 'node:test'

import type {
  ShopifyCartSnapshot,
  ShopifyCartSnapshotStore
} from '@/lib/analytics/server/shopifyCartSnapshotStore'

import {
  checkoutSessionSchema,
  type CheckoutSession
} from './checkoutSessionSchema'

import {
  createCheckoutSession
} from './createCheckoutSession'

import type {
  CheckoutSessionEvent
} from './checkoutSessionEvent'

import type {
  CheckoutSessionMaterializationEventStream,
  CheckoutSessionMaterializationStore
} from './materializeCheckoutSessionFromCart'

import {
  materializeCheckoutSessionFromCart
} from './materializeCheckoutSessionFromCart'

import {
  materializeCheckoutSessionCart,
  resolveCheckoutSessionCartToken
} from './materializeCheckoutSessionCart'

import type {
  Cart
} from 'types/cart'

const NOW =
  '2026-08-16T16:00:00.000Z'

const SESSION_ID =
  '11111111-1111-4111-8111-111111111111'

const ATTEMPT_ID =
  '22222222-2222-4222-8222-222222222222'

const BEGIN_CHECKOUT_EVENT_ID =
  '33333333-3333-4333-8333-333333333333'

const CART_TOKEN =
  'hWNFitvj3hogaYwyfNbKRUId'

const CART_GID =
  `gid://shopify/Cart/${CART_TOKEN}`

const TECHDOWN_PRODUCT_ID =
  'gid://shopify/Product/9240112693496'

const TECHDOWN_VARIANT_ID =
  'gid://shopify/ProductVariant/46944403915000'

const COMFYROBE_PRODUCT_ID =
  'gid://shopify/Product/8036341448952'

const COMFYROBE_VARIANT_ID =
  'gid://shopify/ProductVariant/43959919051000'

function createCart(): Cart {
  return {
    id:
      CART_GID,

    checkoutUrl:
      '/api/cart/checkout',

    totalQuantity:
      2,

    cost: {
      subtotalAmount: {
        amount:
          '3580.00',

        currencyCode:
          'NOK'
      },

      totalAmount: {
        amount:
          '3580.00',

        currencyCode:
          'NOK'
      }
    },

    lines: [
      {
        id:
          'gid://shopify/CartLine/line-techdown',

        quantity:
          2,

        cost: {
          totalAmount: {
            amount:
              '3580.00',

            currencyCode:
              'NOK'
          }
        },

        merchandise: {
          id:
            TECHDOWN_VARIANT_ID,

          title:
            'Havdyp / Stor / Unisex',

          availableForSale:
            true,

          price: {
            amount:
              '1790.00',

            currencyCode:
              'NOK'
          },

          image: {
            id:
              'gid://shopify/Image/123',

            url:
              'https://cdn.shopify.com/example-techdown.jpg',

            altText:
              'Utekos TechDown',

            width:
              1200,

            height:
              1200
          },

          compareAtPrice:
            null,

          selectedOptions: [
            {
              name:
                'Farge',

              value:
                'Havdyp'
            },
            {
              name:
                'Størrelse',

              value:
                'Stor'
            },
            {
              name:
                'Kjønn',

              value:
                'Unisex'
            }
          ],

          product: {
            id:
              TECHDOWN_PRODUCT_ID,

            handle:
              'utekos-techdown',

            title:
              'Utekos TechDown™',

            vendor:
              'Utekos',

            productType:
              'Yttertøy'
          }
        }
      }
    ]
  }
}

function createSnapshot(): ShopifyCartSnapshot {
  return {
    cart_token:
      CART_TOKEN,

    line_items: [
      {
        key:
          '46944403915000:techdown-line-key',

        price:
          '1790.00',

        product_id:
          '9240112693496',

        quantity:
          2,

        sku:
          'TECHDOWN-HAVDYP-L',

        taxable:
          true,

        title:
          'Snapshot title that must not override Storefront Cart',

        variant_id:
          '46944403915000',

        vendor:
          'Snapshot Vendor',

        currency_code:
          'NOK'
      },

      /**
       * This line exists only in the historical Redis snapshot.
       *
       * It MUST NOT be materialized because it no longer exists
       * in the current Storefront Cart.
       */
      {
        key:
          '43959919051000:removed-comfyrobe',

        price:
          '990.00',

        product_id:
          '8036341448952',

        quantity:
          1,

        sku:
          'COMFYROBE-FJELLNATT-S',

        taxable:
          true,

        title:
          'Comfyrobe™',

        variant_id:
          '43959919051000',

        vendor:
          'Utekos',

        currency_code:
          'NOK'
      }
    ],

    stored_at:
      '2026-08-16T15:59:59.000Z',

    updated_at:
      '2026-08-16T15:59:58.000Z'
  }
}

class FakeSnapshotStore
  implements ShopifyCartSnapshotStore
{
  constructor(
    private readonly snapshot:
      ShopifyCartSnapshot | null
  ) {}

  readonly requestedTokens:
    string[] = []

  async get(
    cartToken: string
  ): Promise<ShopifyCartSnapshot | null> {
    this.requestedTokens.push(
      cartToken
    )

    return this.snapshot
  }

  async set(): Promise<void> {
    throw new Error(
      'set() is not used by cart materialization'
    )
  }
}

class FakeEventStream
  implements CheckoutSessionMaterializationEventStream
{
  readonly events:
    CheckoutSessionEvent[] = []

  fail =
    false

  async append(
    event: CheckoutSessionEvent
  ) {
    if (this.fail) {
      throw new Error(
        'simulated stream failure'
      )
    }

    this.events.push(
      event
    )

    return {
      stream_id:
        '1786896000000-0',

      event
    }
  }
}

class FakeSessionStore
  implements CheckoutSessionMaterializationStore
{
  current:
    CheckoutSession | null =
      null

  createCalls =
    0

  compareAndSetCalls =
    0

  conflictOnceWith:
    CheckoutSession | null =
      null

  async getByCartToken() {
    return this.current
  }

  async create(
    candidate: CheckoutSession
  ) {
    this.createCalls += 1

    if (this.current) {
      return {
        status:
          'exists' as const,

        current:
          this.current
      }
    }

    this.current =
      candidate

    return {
      status:
        'created' as const,

      session:
        candidate
    }
  }

  async compareAndSet(
    input: {
      cartToken: string
      expectedRevision: number
      nextSession: CheckoutSession
    }
  ) {
    this.compareAndSetCalls +=
      1

    if (
      this.conflictOnceWith
    ) {
      const conflict =
        this.conflictOnceWith

      this.conflictOnceWith =
        null

      this.current =
        conflict

      return {
        status:
          'conflict' as const,

        current:
          conflict
      }
    }

    if (!this.current) {
      return {
        status:
          'missing' as const
      }
    }

    if (
      this.current
        .revision !==
      input.expectedRevision
    ) {
      return {
        status:
          'conflict' as const,

        current:
          this.current
      }
    }

    assert.equal(
      input.cartToken,
      CART_TOKEN
    )

    this.current =
      input.nextSession

    return {
      status:
        'updated' as const,

      session:
        input.nextSession
    }
  }
}

function createExistingSession(): CheckoutSession {
  const cart =
    materializeCheckoutSessionCart({
      cart:
        createCart(),

      snapshot:
        createSnapshot(),

      observedAt:
        new Date(NOW)
    })

  return createCheckoutSession({
    environment:
      'production',

    shopifyCart:
      cart,

    now:
      () =>
        new Date(NOW),

    sessionIdFactory:
      () =>
        SESSION_ID
  })
}

function withShopifyAttempt(
  session: CheckoutSession,
  revision: number
): CheckoutSession {
  return checkoutSessionSchema.parse({
    ...session,

    revision,

    checkout_attempts: [
      {
        attempt_id:
          ATTEMPT_ID,

        begin_checkout_event_id:
          BEGIN_CHECKOUT_EVENT_ID,

        method:
          'shopify_checkout',

        started_at:
          NOW,

        last_updated_at:
          NOW,

        milestones: {
          began_at:
            NOW,

          shipping_info_submitted_at:
            null,

          payment_info_submitted_at:
            null,

          completed_at:
            null
        },

        shopify: {
          status:
            'unresolved',

          checkout_token:
            null,

          private_checkout_url:
            null,

          checkout_url_fingerprint:
            null,

          abandoned_checkout_id:
            null,

          private_abandoned_checkout_url:
            null,

          abandoned_checkout_created_at:
            null,

          abandoned_checkout_updated_at:
            null,

          most_recent_step:
            null,

          inventory_available:
            null,

          native_email_state:
            null,

          customer_has_no_order_since_abandonment:
            null,

          customer_has_no_draft_order_since_abandonment:
            null
        },

        klarna:
          null
      }
    ],

    active_attempt_id:
      ATTEMPT_ID
  })
}

test(
  'resolves the Storefront Cart token from the public Cart GID',
  () => {
    assert.equal(
      resolveCheckoutSessionCartToken(
        createCart()
      ),
      CART_TOKEN
    )
  }
)

test(
  'merges Redis snapshot enrichment without overriding current Storefront cart state',
  () => {
    const result =
      materializeCheckoutSessionCart({
        cart:
          createCart(),

        snapshot:
          createSnapshot(),

        observedAt:
          new Date(NOW)
      })

    assert.equal(
      result.source,
      'merged'
    )

    assert.equal(
      result.line_items.length,
      1
    )

    const line =
      result.line_items[0]

    assert.ok(line)

    assert.equal(
      line.product_id,
      TECHDOWN_PRODUCT_ID
    )

    assert.equal(
      line.variant_id,
      TECHDOWN_VARIANT_ID
    )

    assert.equal(
      line.sku,
      'TECHDOWN-HAVDYP-L'
    )

    assert.equal(
      line.taxable,
      true
    )

    assert.equal(
      line.line_key,
      '46944403915000:techdown-line-key'
    )

    /**
     * Current Storefront data wins.
     */
    assert.equal(
      line.title,
      'Utekos TechDown™'
    )

    assert.equal(
      line.vendor,
      'Utekos'
    )

    assert.equal(
      line.quantity,
      2
    )

    assert.equal(
      line.unit_price.amount,
      '1790.00'
    )

    assert.equal(
      line.line_total?.amount,
      '3580.00'
    )

    assert.equal(
      line.image_url,
      'https://cdn.shopify.com/example-techdown.jpg'
    )

    assert.deepEqual(
      line.selected_options,
      [
        {
          name:
            'Farge',

          value:
            'Havdyp'
        },
        {
          name:
            'Størrelse',

          value:
            'Stor'
        },
        {
          name:
            'Kjønn',

          value:
            'Unisex'
        }
      ]
    )

    /**
     * Historical Comfyrobe snapshot line did not
     * leak back into current Registry state.
     */
    assert.equal(
      result.line_items.some(
        item =>
          item.product_id ===
          COMFYROBE_PRODUCT_ID ||
          item.variant_id ===
          COMFYROBE_VARIANT_ID
      ),
      false
    )

    assert.equal(
      result.provider_updated_at,
      '2026-08-16T15:59:58.000Z'
    )
  }
)

test(
  'does not persist an ambiguous Shopify line key',
  () => {
    const snapshot =
      createSnapshot()

    snapshot.line_items.push({
      key:
        '46944403915000:second-line',

      price:
        '1790.00',

      product_id:
        '9240112693496',

      quantity:
        2,

      sku:
        'TECHDOWN-HAVDYP-L',

      taxable:
        true,

      title:
        'Utekos TechDown™',

      variant_id:
        '46944403915000',

      vendor:
        'Utekos',

      currency_code:
        'NOK'
    })

    const result =
      materializeCheckoutSessionCart({
        cart:
          createCart(),

        snapshot,

        observedAt:
          new Date(NOW)
      })

    const line =
      result.line_items[0]

    assert.ok(line)

    /**
     * SKU/taxable agree across both snapshot rows,
     * so variant-level enrichment remains valid.
     */
    assert.equal(
      line.sku,
      'TECHDOWN-HAVDYP-L'
    )

    assert.equal(
      line.taxable,
      true
    )

    /**
     * line_key is line-specific and ambiguous.
     */
    assert.equal(
      line.line_key,
      null
    )
  }
)

test(
  'rejects a snapshot from another Shopify cart token',
  () => {
    const snapshot =
      createSnapshot()

    snapshot.cart_token =
      'different-cart-token'

    assert.throws(
      () =>
        materializeCheckoutSessionCart({
          cart:
            createCart(),

          snapshot,

          observedAt:
            new Date(NOW)
        }),
      /different cart token/
    )
  }
)

test(
  'creates a new Registry session from Storefront Cart plus the existing Redis snapshot',
  async () => {
    const sessionStore =
      new FakeSessionStore()

    const snapshotStore =
      new FakeSnapshotStore(
        createSnapshot()
      )

    const eventStream =
      new FakeEventStream()

    const result =
      await materializeCheckoutSessionFromCart(
        {
          cart:
            createCart(),

          environment:
            'production'
        },
        {
          sessionStore,

          snapshotStore,

          eventStream,

          now:
            () =>
              new Date(NOW),

          sessionIdFactory:
            () =>
              SESSION_ID
        }
      )

    assert.equal(
      result.status,
      'created'
    )

    assert.equal(
      result.snapshot_used,
      true
    )

    assert.equal(
      result.journal_status,
      'appended'
    )

    assert.equal(
      result.session
        .session_id,
      SESSION_ID
    )

    assert.equal(
      result.session
        .revision,
      0
    )

    assert.equal(
      result.session
        .shopify_cart
        .source,
      'merged'
    )

    assert.equal(
      result.session
        .shopify_cart
        .line_items[0]
        ?.sku,
      'TECHDOWN-HAVDYP-L'
    )

    assert.deepEqual(
      snapshotStore
        .requestedTokens,
      [CART_TOKEN]
    )

    assert.equal(
      sessionStore
        .createCalls,
      1
    )

    assert.equal(
      eventStream
        .events.length,
      1
    )

    assert.equal(
      eventStream
        .events[0]
        ?.event_type,
      'checkout_session.created'
    )
  }
)

test(
  'updates an existing Registry session and increments revision',
  async () => {
    const sessionStore =
      new FakeSessionStore()

    sessionStore.current =
      createExistingSession()

    const result =
      await materializeCheckoutSessionFromCart(
        {
          cart:
            createCart(),

          environment:
            'production'
        },
        {
          sessionStore,

          snapshotStore:
            new FakeSnapshotStore(
              createSnapshot()
            ),

          eventStream:
            new FakeEventStream(),

          now:
            () =>
              new Date(
                '2026-08-16T16:05:00.000Z'
              )
        }
      )

    assert.equal(
      result.status,
      'updated'
    )

    assert.equal(
      result.session.revision,
      1
    )

    assert.equal(
      result.session
        .first_seen_at,
      NOW
    )

    assert.equal(
      result.session
        .last_seen_at,
      '2026-08-16T16:05:00.000Z'
    )

    assert.equal(
      result.session
        .expires_at,
      '2026-08-30T16:05:00.000Z'
    )
  }
)

test(
  'retries CAS from the newest session and preserves a concurrently added checkout attempt',
  async () => {
    const sessionStore =
      new FakeSessionStore()

    const initial =
      createExistingSession()

    sessionStore.current =
      initial

    const concurrent =
      withShopifyAttempt(
        {
          ...initial,

          revision:
            1,

          last_seen_at:
            '2026-08-16T16:00:30.000Z'
        },
        1
      )

    sessionStore
      .conflictOnceWith =
      concurrent

    const result =
      await materializeCheckoutSessionFromCart(
        {
          cart:
            createCart(),

          environment:
            'production'
        },
        {
          sessionStore,

          snapshotStore:
            new FakeSnapshotStore(
              createSnapshot()
            ),

          eventStream:
            new FakeEventStream(),

          now:
            () =>
              new Date(
                '2026-08-16T16:05:00.000Z'
              )
        }
      )

    assert.equal(
      result.status,
      'updated'
    )

    assert.equal(
      sessionStore
        .compareAndSetCalls,
      2
    )

    assert.equal(
      result.session.revision,
      2
    )

    assert.equal(
      result.session
        .checkout_attempts
        .length,
      1
    )

    assert.equal(
      result.session
        .checkout_attempts[0]
        ?.attempt_id,
      ATTEMPT_ID
    )

    assert.equal(
      result.session
        .active_attempt_id,
      ATTEMPT_ID
    )
  }
)

test(
  'carries forward stable Registry enrichment when the legacy snapshot is temporarily unavailable',
  async () => {
    const sessionStore =
      new FakeSessionStore()

    sessionStore.current =
      createExistingSession()

    const result =
      await materializeCheckoutSessionFromCart(
        {
          cart:
            createCart(),

          environment:
            'production'
        },
        {
          sessionStore,

          snapshotStore:
            new FakeSnapshotStore(
              null
            ),

          eventStream:
            new FakeEventStream(),

          now:
            () =>
              new Date(
                '2026-08-16T16:10:00.000Z'
              )
        }
      )

    const line =
      result.session
        .shopify_cart
        .line_items[0]

    assert.ok(line)

    assert.equal(
      result.snapshot_used,
      false
    )

    assert.equal(
      line.sku,
      'TECHDOWN-HAVDYP-L'
    )

    assert.equal(
      line.taxable,
      true
    )

    assert.equal(
      line.line_key,
      '46944403915000:techdown-line-key'
    )

    assert.equal(
      result.session
        .shopify_cart
        .source,
      'merged'
    )
  }
)

test(
  'does not roll back a newer Registry observation timestamp during a CAS retry',
  async () => {
    const sessionStore =
      new FakeSessionStore()

    const initial =
      createExistingSession()

    sessionStore.current =
      initial

    const newerConcurrent =
      checkoutSessionSchema.parse({
        ...initial,

        revision:
          1,

        last_seen_at:
          '2026-08-16T16:20:00.000Z',

        expires_at:
          '2026-08-30T16:20:00.000Z',

        shopify_cart: {
          ...initial.shopify_cart,

          last_observed_at:
            '2026-08-16T16:20:00.000Z'
        }
      })

    sessionStore
      .conflictOnceWith =
      newerConcurrent

    const result =
      await materializeCheckoutSessionFromCart(
        {
          cart:
            createCart(),

          environment:
            'production'
        },
        {
          sessionStore,

          snapshotStore:
            new FakeSnapshotStore(
              createSnapshot()
            ),

          eventStream:
            new FakeEventStream(),

          now:
            () =>
              new Date(
                '2026-08-16T16:05:00.000Z'
              )
        }
      )

    assert.equal(
      result.session
        .last_seen_at,
      '2026-08-16T16:20:00.000Z'
    )

    assert.equal(
      result.session
        .shopify_cart
        .last_observed_at,
      '2026-08-16T16:20:00.000Z'
    )

    assert.equal(
      result.session
        .expires_at,
      '2026-08-30T16:20:00.000Z'
    )
  }
)

test(
  'does not discard committed Registry state when the Stream journal fails',
  async () => {
    const sessionStore =
      new FakeSessionStore()

    const eventStream =
      new FakeEventStream()

    eventStream.fail =
      true

    const result =
      await materializeCheckoutSessionFromCart(
        {
          cart:
            createCart(),

          environment:
            'production'
        },
        {
          sessionStore,

          snapshotStore:
            new FakeSnapshotStore(
              createSnapshot()
            ),

          eventStream,

          now:
            () =>
              new Date(NOW),

          sessionIdFactory:
            () =>
              SESSION_ID
        }
      )

    assert.equal(
      result.status,
      'created'
    )

    assert.equal(
      result.journal_status,
      'failed'
    )

    assert.ok(
      sessionStore.current
    )

    assert.equal(
      sessionStore.current
        .session_id,
      SESSION_ID
    )
  }
)