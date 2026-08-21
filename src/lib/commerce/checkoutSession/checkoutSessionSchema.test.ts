import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CHECKOUT_SESSION_SCHEMA_NAME,
  checkoutSessionSchema,
  type CheckoutSession
} from './checkoutSessionSchema'

import {
  CHECKOUT_SESSION_EVENT_STREAM_KEY,
  checkoutAttemptIndexKey,
  checkoutBeginEventIndexKey,
  checkoutKlarnaOrderIndexKey,
  checkoutSessionByCartTokenKey,
  checkoutSessionIdIndexKey,
  checkoutShopifyAbandonmentIndexKey,
  checkoutShopifyOrderIndexKey
} from './checkoutSessionKeys'

const SESSION_ID =
  '11111111-1111-4111-8111-111111111111'

const ATTEMPT_ID =
  '22222222-2222-4222-8222-222222222222'

const EVENT_ID =
  '33333333-3333-4333-8333-333333333333'

const NOW = '2026-08-16T15:00:00.000Z'

const EXPIRES_AT =
  '2026-08-30T15:00:00.000Z'

function createValidSession(): CheckoutSession {
  return {
    schema: CHECKOUT_SESSION_SCHEMA_NAME,

    session_id: SESSION_ID,

    revision: 0,

    environment: 'production',

    state: 'active',

    shopify_cart: {
      cart_gid:
        'gid://shopify/Cart/hWNFitvj3hogaYwyfNbKRUId',

      cart_token: 'hWNFitvj3hogaYwyfNbKRUId',

      source: 'storefront_api',

      line_items: [
        {
          line_id: null,

          line_key: null,

          product_id:
            'gid://shopify/Product/9240112693496',

          variant_id:
            'gid://shopify/ProductVariant/46944403915000',

          sku: 'TECHDOWN-HAVDYP-L',

          title: 'Utekos TechDown™',

          variant_title:
            'Havdyp / Stor / Unisex',

          vendor: 'Utekos',

          quantity: 2,

          unit_price: {
            amount: '1790',
            currency_code: 'NOK'
          },

          line_total: {
            amount: '3580',
            currency_code: 'NOK'
          },

          selected_options: [
            {
              name: 'Farge',
              value: 'Havdyp'
            },
            {
              name: 'Størrelse',
              value: 'Stor'
            },
            {
              name: 'Kjønn',
              value: 'Unisex'
            }
          ],

          image_url: null,

          available_for_sale: true,

          taxable: true
        }
      ],

      total_quantity: 2,

      subtotal: {
        amount: '3580',
        currency_code: 'NOK'
      },

      total: {
        amount: '3580',
        currency_code: 'NOK'
      },

      provider_updated_at: null,

      first_observed_at: NOW,

      last_observed_at: NOW
    },

    checkout_attempts: [
      {
        attempt_id: ATTEMPT_ID,

        begin_checkout_event_id: EVENT_ID,

        method: 'shopify_checkout',

        started_at: NOW,

        last_updated_at: NOW,

        milestones: {
          began_at: NOW,
          shipping_info_submitted_at: null,
          payment_info_submitted_at: null,
          completed_at: null
        },

        shopify: {
          status: 'unresolved',

          checkout_token: null,

          private_checkout_url: null,

          checkout_url_fingerprint: null,

          abandoned_checkout_id: null,

          private_abandoned_checkout_url: null,

          abandoned_checkout_created_at: null,

          abandoned_checkout_updated_at: null,

          most_recent_step: null,

          inventory_available: null,

          native_email_state: null,

          customer_has_no_order_since_abandonment:
            null,

          customer_has_no_draft_order_since_abandonment:
            null
        },

        klarna: null
      }
    ],

    active_attempt_id: ATTEMPT_ID,

    conversion: null,

    private_customer: null,

    recovery: {
      status: 'inactive',
      preferred_target: null,
      public_recovery_id: null,
      last_evaluated_at: null,
      suppression_reason: null
    },

    first_seen_at: NOW,

    last_seen_at: NOW,

    expires_at: EXPIRES_AT
  }
}

test(
  'accepts a valid Shopify checkout session',
  () => {
    const session = createValidSession()

    const result =
      checkoutSessionSchema.safeParse(session)

    assert.equal(result.success, true)
  }
)

test(
  'accepts a Klarna Express attempt without pretending it is a Shopify checkout',
  () => {
    const session = createValidSession()

    session.checkout_attempts = [
      {
        attempt_id: ATTEMPT_ID,

        begin_checkout_event_id: EVENT_ID,

        method: 'klarna_express',

        started_at: NOW,

        last_updated_at: NOW,

        milestones: {
          began_at: NOW,
          shipping_info_submitted_at: null,
          payment_info_submitted_at: null,
          completed_at: null
        },

        shopify: null,

        klarna: {
          status: 'started',

          authorization_token_fingerprint: null,

          klarna_order_id: null,

          fraud_status: null,

          shopify_draft_order_id: null,

          shopify_order_id: null,

          private_redirect_url: null,

          shipping_address_collected_at: null,

          authorization_completed_at: null,

          order_created_at: null,

          failed_at: null,

          failure_code: null
        }
      }
    ]

    const result =
      checkoutSessionSchema.safeParse(session)

    assert.equal(result.success, true)
  }
)

test(
  'rejects Shopify provider state on a Klarna Express attempt',
  () => {
    const session = createValidSession()

    session.checkout_attempts[0] = {
      ...session.checkout_attempts[0]!,
      method: 'klarna_express',
      klarna: {
        status: 'started',
        authorization_token_fingerprint: null,
        klarna_order_id: null,
        fraud_status: null,
        shopify_draft_order_id: null,
        shopify_order_id: null,
        private_redirect_url: null,
        shipping_address_collected_at: null,
        authorization_completed_at: null,
        order_created_at: null,
        failed_at: null,
        failure_code: null
      }
    }

    const result =
      checkoutSessionSchema.safeParse(session)

    assert.equal(result.success, false)
  }
)

test(
  'rejects duplicate checkout attempt IDs',
  () => {
    const session = createValidSession()

    session.checkout_attempts.push({
      ...session.checkout_attempts[0]!
    })

    const result =
      checkoutSessionSchema.safeParse(session)

    assert.equal(result.success, false)
  }
)

test(
  'rejects an active attempt ID that is not part of the session',
  () => {
    const session = createValidSession()

    session.active_attempt_id =
      '44444444-4444-4444-8444-444444444444'

    const result =
      checkoutSessionSchema.safeParse(session)

    assert.equal(result.success, false)
  }
)

test(
  'rejects inconsistent cart total quantity',
  () => {
    const session = createValidSession()

    session.shopify_cart.total_quantity = 3

    const result =
      checkoutSessionSchema.safeParse(session)

    assert.equal(result.success, false)
  }
)

test(
  'rejects a conversion object on an active session',
  () => {
    const session = createValidSession()

    session.conversion = {
      occurred_at: NOW,
      attempt_id: ATTEMPT_ID,
      method: 'shopify_checkout',
      shopify_order_id:
        'gid://shopify/Order/1234567890',
      shopify_order_name: '#1234'
    }

    const result =
      checkoutSessionSchema.safeParse(session)

    assert.equal(result.success, false)
  }
)

test(
  'rejects raw Klarna authorization tokens from provider state',
  () => {
    const session = createValidSession()

    const unsafeKlarnaState = {
      status: 'started',
      authorization_token_fingerprint: null,
      authorization_token:
        'raw-secret-token-that-must-not-be-persisted',
      klarna_order_id: null,
      fraud_status: null,
      shopify_draft_order_id: null,
      shopify_order_id: null,
      private_redirect_url: null,
      shipping_address_collected_at: null,
      authorization_completed_at: null,
      order_created_at: null,
      failed_at: null,
      failure_code: null
    }

    const candidate = {
      ...session,

      checkout_attempts: [
        {
          attempt_id: ATTEMPT_ID,
          begin_checkout_event_id: EVENT_ID,
          method: 'klarna_express',
          started_at: NOW,
          last_updated_at: NOW,

          milestones: {
            began_at: NOW,
            shipping_info_submitted_at: null,
            payment_info_submitted_at: null,
            completed_at: null
          },

          shopify: null,

          klarna: unsafeKlarnaState
        }
      ]
    }

    const result =
      checkoutSessionSchema.safeParse(candidate)

    assert.equal(result.success, false)
  }
)

test(
  'creates deterministic namespaced Redis keys',
  () => {
    assert.equal(
      checkoutSessionByCartTokenKey(
        'hWNFitvj3hogaYwyfNbKRUId'
      ),
      'commerce:checkout_session:v1:cart:hWNFitvj3hogaYwyfNbKRUId'
    )

    assert.equal(
      checkoutSessionIdIndexKey(SESSION_ID),
      `commerce:checkout_session_index:v1:session:${SESSION_ID}`
    )

    assert.equal(
      checkoutAttemptIndexKey(ATTEMPT_ID),
      `commerce:checkout_session_index:v1:attempt:${ATTEMPT_ID}`
    )

    assert.equal(
      checkoutBeginEventIndexKey(EVENT_ID),
      `commerce:checkout_session_index:v1:begin_checkout:${EVENT_ID}`
    )

    assert.equal(
      checkoutKlarnaOrderIndexKey('klarna-order-123'),
      'commerce:checkout_session_index:v1:klarna_order:klarna-order-123'
    )

    assert.equal(
      checkoutShopifyOrderIndexKey(
        'gid://shopify/Order/123'
      ),
      'commerce:checkout_session_index:v1:shopify_order:gid%3A%2F%2Fshopify%2FOrder%2F123'
    )

    assert.equal(
      checkoutShopifyAbandonmentIndexKey(
        'gid://shopify/AbandonedCheckout/39392661831928'
      ),
      'commerce:checkout_session_index:v1:shopify_abandoned_checkout:gid%3A%2F%2Fshopify%2FAbandonedCheckout%2F39392661831928'
    )

    assert.equal(
      CHECKOUT_SESSION_EVENT_STREAM_KEY,
      'commerce:checkout_events:v1'
    )
  }
)

test(
  'rejects empty Redis identity values',
  () => {
    assert.throws(
      () => checkoutSessionByCartTokenKey('   '),
      /cartToken must not be empty/
    )
  }
)

test(
  'preserves an opaque Shopify CartLine ID',
  () => {
    const session =
      createValidSession()

    const lineId =
      'gid://shopify/CartLine/example-line?cart=synthetic-cart-token'

    session
      .shopify_cart
      .line_items[0]!
      .line_id =
        lineId

    const parsed =
      checkoutSessionSchema.parse(
        session
      )

    assert.equal(
      parsed
        .shopify_cart
        .line_items[0]
        ?.line_id,
      lineId
    )
  }
)

test(
  'rejects a non-CartLine Shopify ID as line_id',
  () => {
    const session =
      createValidSession()

    session
      .shopify_cart
      .line_items[0]!
      .line_id =
        'gid://shopify/ProductVariant/46944403915000'

    const result =
      checkoutSessionSchema.safeParse(
        session
      )

    assert.equal(
      result.success,
      false
    )
  }
)

test(
  'rejects an empty Shopify CartLine ID',
  () => {
    const session =
      createValidSession()

    session
      .shopify_cart
      .line_items[0]!
      .line_id =
        'gid://shopify/CartLine/'

    const result =
      checkoutSessionSchema.safeParse(
        session
      )

    assert.equal(
      result.success,
      false
    )
  }
)