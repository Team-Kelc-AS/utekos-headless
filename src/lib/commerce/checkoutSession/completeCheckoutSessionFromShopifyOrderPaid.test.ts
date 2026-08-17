import assert from 'node:assert/strict'
import test from 'node:test'

import type {
  CanonicalPurchase
} from '@/lib/analytics/purchaseEvent'

import type {
  OrderPaid
} from 'types/commerce/order/OrderPaid'

import {
  CHECKOUT_SESSION_SCHEMA_NAME,
  type CheckoutSession
} from './checkoutSessionSchema'

import type {
  CheckoutSessionEvent
} from './checkoutSessionEvent'

import {
  completeCheckoutSessionFromShopifyOrderPaid,
  type CompleteCheckoutSessionDependencies
} from './completeCheckoutSessionFromShopifyOrderPaid'

const SESSION_ID =
  '11111111-1111-4111-8111-111111111111'

const ATTEMPT_ID =
  '22222222-2222-4222-8222-222222222222'

const BEGIN_CHECKOUT_EVENT_ID =
  '33333333-3333-4333-8333-333333333333'

const PURCHASE_EVENT_ID =
  '44444444-4444-4444-8444-444444444444'

const CART_TOKEN = 'round-nine-cart-token'

const STARTED_AT = '2026-08-17T08:00:00.000Z'

const PAID_AT = '2026-08-17T08:15:00.000Z'

const EXPIRES_AT = '2026-08-31T08:00:00.000Z'

const SHOPIFY_ORDER_ID = 'gid://shopify/Order/123456789'

function createSession(
  method: 'shopify_checkout' | 'klarna_express'
): CheckoutSession {
  return {
    schema: CHECKOUT_SESSION_SCHEMA_NAME,

    session_id: SESSION_ID,

    revision: 7,

    environment: 'production',

    state: 'active',

    shopify_cart: {
      cart_gid: `gid://shopify/Cart/${CART_TOKEN}`,

      cart_token: CART_TOKEN,

      source: 'storefront_api',

      line_items: [],

      total_quantity: 0,

      subtotal: {
        amount: '0',

        currency_code: 'NOK'
      },

      total: {
        amount: '0',

        currency_code: 'NOK'
      },

      provider_updated_at: null,

      first_observed_at: STARTED_AT,

      last_observed_at: STARTED_AT
    },

    checkout_attempts: [
      {
        attempt_id: ATTEMPT_ID,

        begin_checkout_event_id: BEGIN_CHECKOUT_EVENT_ID,

        method,

        started_at: STARTED_AT,

        last_updated_at: STARTED_AT,

        milestones: {
          began_at: STARTED_AT,

          shipping_info_submitted_at: null,

          payment_info_submitted_at: null,

          completed_at: null
        },

        shopify:
          method === 'shopify_checkout' ?
            {
              status: 'checkout_active',

              checkout_token: 'checkout-token',

              private_checkout_url:
                'https://kasse.utekos.no/checkouts/private?key=secret',

              checkout_url_fingerprint:
                `sha256:${'a'.repeat(64)}`,

              abandoned_checkout_id: null,

              private_abandoned_checkout_url: null,

              abandoned_checkout_created_at: null,

              abandoned_checkout_updated_at: null,

              most_recent_step: null,

              inventory_available: null,

              native_email_state: null,

              customer_has_no_order_since_abandonment: null,

              customer_has_no_draft_order_since_abandonment: null
            }
          : null,

        klarna:
          method === 'klarna_express' ?
            {
              status: 'order_created',

              authorization_token_fingerprint:
                `sha256:${'b'.repeat(64)}`,

              klarna_order_id: 'klarna-order-123',

              fraud_status: 'ACCEPTED',

              shopify_draft_order_id: null,

              shopify_order_id: SHOPIFY_ORDER_ID,

              private_redirect_url: null,

              shipping_address_collected_at: STARTED_AT,

              authorization_completed_at: STARTED_AT,

              order_created_at: STARTED_AT,

              failed_at: null,

              failure_code: null
            }
          : null
      }
    ],

    active_attempt_id: ATTEMPT_ID,

    conversion: null,

    private_customer: null,

    recovery: {
      status: 'eligible',

      preferred_target: 'shopify_native',

      public_recovery_id: 'public-recovery-id-123',

      last_evaluated_at: STARTED_AT,

      suppression_reason: null
    },

    first_seen_at: STARTED_AT,

    last_seen_at: STARTED_AT,

    expires_at: EXPIRES_AT
  }
}

function createPurchase(): CanonicalPurchase {
  return {
    schema_version: 1,

    event_name: 'purchase',

    event_id: PURCHASE_EVENT_ID,

    event_time: PAID_AT,

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

      value: 1690,

      transaction_id: 'shopify_order_123456789',

      order_name: '#1234',

      items: [
        {
          item_id: 'gid://shopify/ProductVariant/46944403915000',

          item_name: 'Comfyrobe',

          quantity: 1,

          unit_price: 1690
        }
      ]
    }
  }
}

function createOrder(
  includeBeginCheckoutEventId = true
): OrderPaid {
  return {
    id: 123456789,

    admin_graphql_api_id: SHOPIFY_ORDER_ID,

    cart_token: CART_TOKEN,

    note_attributes:
      includeBeginCheckoutEventId ?
        [
          {
            name: 'utekos_begin_checkout_event_id',

            value: BEGIN_CHECKOUT_EVENT_ID
          }
        ]
      : []
  } as OrderPaid
}

function createDependencies(
  initialSession: CheckoutSession
): CompleteCheckoutSessionDependencies & {
  events: CheckoutSessionEvent[]
  read: () => CheckoutSession
} {
  let current = structuredClone(initialSession)

  const events: CheckoutSessionEvent[] = []

  return {
    events,

    read: () => current,

    eventStream: {
      async append(event) {
        events.push(event)

        return {
          stream_id: '1786935300000-0',

          event
        }
      }
    },

    sessionStore: {
      async getByShopifyOrderId(orderId) {
        return current.checkout_attempts.some(
          attempt =>
            attempt.klarna?.shopify_order_id === orderId
        ) ?
            current
          : null
      },

      async getByBeginCheckoutEventId(eventId) {
        return current.checkout_attempts.some(
          attempt =>
            attempt.begin_checkout_event_id === eventId
        ) ?
            current
          : null
      },

      async getByCartToken(cartToken) {
        return current.shopify_cart.cart_token === cartToken ?
            current
          : null
      },

      async compareAndSet(input) {
        assert.equal(input.expectedRevision, current.revision)

        current = input.nextSession

        return {
          status: 'updated',

          session: current
        }
      }
    }
  }
}

test(
  'closes a hosted Shopify checkout from its begin_checkout correlation',
  async () => {
    const dependencies = createDependencies(
      createSession('shopify_checkout')
    )

    const result =
      await completeCheckoutSessionFromShopifyOrderPaid(
        createOrder(),
        createPurchase(),
        dependencies
      )

    const session = dependencies.read()
    const attempt = session.checkout_attempts[0]!

    assert.equal(result.status, 'updated')
    assert.equal(session.state, 'converted')
    assert.equal(session.active_attempt_id, null)
    assert.equal(session.conversion?.attempt_id, ATTEMPT_ID)
    assert.equal(
      session.conversion?.shopify_order_id,
      SHOPIFY_ORDER_ID
    )
    assert.equal(attempt.milestones.completed_at, PAID_AT)
    assert.equal(attempt.shopify?.status, 'completed')
    assert.equal(session.recovery.status, 'converted')
    assert.equal(
      session.recovery.suppression_reason,
      'purchase_completed'
    )
    assert.deepEqual(
      dependencies.events.map(event => event.event_type),
      [
        'purchase.completed',
        'checkout_session.converted'
      ]
    )
  }
)

test(
  'closes a Klarna Express checkout through the Shopify Order index',
  async () => {
    const dependencies = createDependencies(
      createSession('klarna_express')
    )

    const result =
      await completeCheckoutSessionFromShopifyOrderPaid(
        createOrder(false),
        createPurchase(),
        dependencies
      )

    const session = dependencies.read()
    const attempt = session.checkout_attempts[0]!

    assert.equal(result.status, 'updated')
    assert.equal(session.conversion?.method, 'klarna_express')
    assert.equal(attempt.klarna?.status, 'completed')
    assert.equal(
      attempt.klarna?.shopify_order_id,
      SHOPIFY_ORDER_ID
    )
  }
)

test(
  'is idempotent when Shopify retries the same paid-order webhook',
  async () => {
    const dependencies = createDependencies(
      createSession('shopify_checkout')
    )

    await completeCheckoutSessionFromShopifyOrderPaid(
      createOrder(),
      createPurchase(),
      dependencies
    )

    const firstEventCount = dependencies.events.length

    const duplicate =
      await completeCheckoutSessionFromShopifyOrderPaid(
        createOrder(),
        createPurchase(),
        dependencies
      )

    assert.equal(duplicate.status, 'duplicate')
    assert.equal(dependencies.events.length, firstEventCount)
  }
)

test(
  'converts the cart session without guessing an attempt when correlation is absent',
  async () => {
    const session = createSession('shopify_checkout')

    session.checkout_attempts[0]!.begin_checkout_event_id = null

    const dependencies = createDependencies(session)

    const result =
      await completeCheckoutSessionFromShopifyOrderPaid(
        createOrder(false),
        createPurchase(),
        dependencies
      )

    assert.equal(result.status, 'updated')
    assert.equal(dependencies.read().state, 'converted')
    assert.equal(
      dependencies.read().conversion?.attempt_id,
      null
    )
    assert.equal(
      dependencies.read().checkout_attempts[0]!
        .milestones.completed_at,
      null
    )
  }
)
