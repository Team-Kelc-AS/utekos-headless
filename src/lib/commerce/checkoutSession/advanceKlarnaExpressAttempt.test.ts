import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CHECKOUT_METHOD_HEADER
} from '@/lib/analytics/checkoutMethod'

import {
  checkoutSessionSchema,
  type CheckoutAttempt,
  type CheckoutSession,
  type CheckoutSessionShopifyCart
} from './checkoutSessionSchema'

import {
  createCheckoutSession
} from './createCheckoutSession'

import type {
  CheckoutSessionEvent
} from './checkoutSessionEvent'

import {
  advanceKlarnaExpressAttempt,
  fingerprintKlarnaAuthorizationToken,
  registerCanonicalBeginCheckoutAttempt,
  type CanonicalBeginCheckoutAttemptEventStream,
  type CanonicalBeginCheckoutAttemptStore,
  type MaterializeCheckoutSession
} from './registerCanonicalBeginCheckoutAttempt'

import type {
  Cart
} from 'types/cart'

const EVENT_TIME =
  '2026-08-17T00:00:00.000Z'

const SERVER_TIME =
  '2026-08-17T00:00:05.000Z'

const SESSION_ID =
  '11111111-1111-4111-8111-111111111111'

const EVENT_ID =
  '22222222-2222-4222-8222-222222222222'

const OPERATIONAL_ATTEMPT_ID =
  '33333333-3333-4333-8333-333333333333'

const CART_TOKEN =
  'klarnaCartToken123'

const CART_GID =
  `gid://shopify/Cart/${CART_TOKEN}`

const FULL_CART_GID =
  `${CART_GID}?key=private-cart-secret`

const PRODUCT_ID =
  'gid://shopify/Product/9240112693496'

const VARIANT_ID =
  'gid://shopify/ProductVariant/46944403915000'

const RAW_AUTHORIZATION_TOKEN =
  'klarna-private-authorization-token-123'

const KLARNA_ORDER_ID =
  'klarna-order-123'

const SHOPIFY_ORDER_ID =
  'gid://shopify/Order/123456789'

const PRIVATE_REDIRECT_URL =
  'https://payments.klarna.com/redirect/private-capability?token=very-secret'

function createCart(): Cart {
  return {
    id:
      CART_GID,

    checkoutUrl:
      '/api/cart/checkout',

    totalQuantity:
      1,

    cost: {
      subtotalAmount: {
        amount:
          '1690.00',

        currencyCode:
          'NOK'
      },

      totalAmount: {
        amount:
          '1690.00',

        currencyCode:
          'NOK'
      }
    },

    lines: [
      {
        id:
          'gid://shopify/CartLine/klarna-line',

        quantity:
          1,

        cost: {
          totalAmount: {
            amount:
              '1690.00',

            currencyCode:
              'NOK'
          }
        },

        merchandise: {
          id:
            VARIANT_ID,

          title:
            'Navy / XL',

          availableForSale:
            true,

          price: {
            amount:
              '1690.00',

            currencyCode:
              'NOK'
          },

          image:
            null,

          compareAtPrice:
            null,

          selectedOptions: [
            {
              name:
                'Størrelse',

              value:
                'XL'
            }
          ],

          product: {
            id:
              PRODUCT_ID,

            handle:
              'comfyrobe',

            title:
              'Comfyrobe',

            vendor:
              'Utekos',

            productType:
              'Ytterplagg'
          }
        }
      }
    ]
  }
}

function createRegistryCart():
  CheckoutSessionShopifyCart {
  return {
    cart_gid:
      CART_GID,

    cart_token:
      CART_TOKEN,

    source:
      'storefront_api',

    line_items: [
      {
        line_id:
          'gid://shopify/CartLine/klarna-line',

        line_key:
          null,

        product_id:
          PRODUCT_ID,

        variant_id:
          VARIANT_ID,

        sku:
          null,

        title:
          'Comfyrobe',

        variant_title:
          'Navy / XL',

        vendor:
          'Utekos',

        quantity:
          1,

        unit_price: {
          amount:
            '1690.00',

          currency_code:
            'NOK'
        },

        line_total: {
          amount:
            '1690.00',

          currency_code:
            'NOK'
        },

        selected_options: [
          {
            name:
              'Størrelse',

            value:
              'XL'
          }
        ],

        image_url:
          null,

        available_for_sale:
          true,

        taxable:
          null
      }
    ],

    total_quantity:
      1,

    subtotal: {
      amount:
        '1690.00',

      currency_code:
        'NOK'
    },

    total: {
      amount:
        '1690.00',

      currency_code:
        'NOK'
    },

    provider_updated_at:
      null,

    first_observed_at:
      EVENT_TIME,

    last_observed_at:
      EVENT_TIME
  }
}

function createInitialSession():
  CheckoutSession {
  return createCheckoutSession({
    environment:
      'production',

    shopifyCart:
      createRegistryCart(),

    now:
      () =>
        new Date(
          EVENT_TIME
        ),

    sessionIdFactory:
      () =>
        SESSION_ID
  })
}

function createCanonicalKlarnaAttempt():
  CheckoutAttempt {
  return {
    attempt_id:
      EVENT_ID,

    begin_checkout_event_id:
      EVENT_ID,

    method:
      'klarna_express',

    started_at:
      EVENT_TIME,

    last_updated_at:
      SERVER_TIME,

    milestones: {
      began_at:
        EVENT_TIME,

      shipping_info_submitted_at:
        null,

      payment_info_submitted_at:
        null,

      completed_at:
        null
    },

    shopify:
      null,

    klarna: {
      status:
        'started',

      authorization_token_fingerprint:
        null,

      klarna_order_id:
        null,

      fraud_status:
        null,

      shopify_draft_order_id:
        null,

      shopify_order_id:
        null,

      private_redirect_url:
        null,

      shipping_address_collected_at:
        null,

      authorization_completed_at:
        null,

      order_created_at:
        null,

      failed_at:
        null,

      failure_code:
        null
    }
  }
}

function createSessionWithCanonicalKlarnaAttempt():
  CheckoutSession {
  const initial =
    createInitialSession()

  return checkoutSessionSchema.parse({
    ...initial,

    revision:
      1,

    checkout_attempts: [
      createCanonicalKlarnaAttempt()
    ],

    active_attempt_id:
      EVENT_ID,

    last_seen_at:
      SERVER_TIME
  })
}

class FakeStore
  implements CanonicalBeginCheckoutAttemptStore
{
  current:
    CheckoutSession

  compareAndSetCalls =
    0

  constructor(
    current:
      CheckoutSession
  ) {
    this.current =
      current
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

    assert.equal(
      input.cartToken,
      CART_TOKEN
    )

    if (
      this.current.revision !==
      input.expectedRevision
    ) {
      return {
        status:
          'conflict' as const,

        current:
          this.current
      }
    }

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

class FakeStream
  implements CanonicalBeginCheckoutAttemptEventStream
{
  readonly events:
    CheckoutSessionEvent[] =
      []

  fail =
    false

  async append(
    event:
      CheckoutSessionEvent
  ) {
    if (this.fail) {
      throw new Error(
        'simulated Klarna journal failure'
      )
    }

    this.events.push(
      event
    )

    return {
      stream_id:
        '1786924800000-0',

      event
    }
  }
}

function createDependencies(
  session:
    CheckoutSession =
      createInitialSession()
) {
  const store =
    new FakeStore(
      session
    )

  const stream =
    new FakeStream()

  const materializeSession:
    MaterializeCheckoutSession =
    async ({
      cart,
      environment
    }) => {
      assert.equal(
        cart.id,
        CART_GID
      )

      assert.equal(
        environment,
        'production'
      )

      return {
        session:
          store.current
      }
    }

  return {
    store,
    stream,
    materializeSession
  }
}

function createCanonicalEvent() {
  return {
    schema_version:
      1 as const,

    event_name:
      'begin_checkout' as const,

    event_id:
      EVENT_ID,

    event_time:
      EVENT_TIME,

    source:
      'web' as const,

    environment:
      'production' as const,

    page_url:
      'https://utekos.no/produkter/comfyrobe',

    page_title:
      'Comfyrobe',

    consent: {
      analytics:
        'granted' as const,

      marketing:
        'granted' as const,

      preferences:
        'denied' as const,

      source:
        'cookiebot' as const,

      version:
        '1'
    },

    custom_data: {
      cart_id:
        CART_GID,

      checkout_id:
        CART_GID,

      creation_revision:
        'checkout_rev_klarna_test',

      currency:
        'NOK',

      value:
        1352,

      gross_value:
        1690,

      tax_value:
        338,

      items: [
        {
          item_id:
            VARIANT_ID,

          product_id:
            PRODUCT_ID,

          variant_id:
            VARIANT_ID,

          item_name:
            'Comfyrobe',

          item_brand:
            'Utekos',

          item_variant:
            'Navy / XL',

          product_handle:
            'comfyrobe',

          product_type:
            'Ytterplagg',

          quantity:
            1,

          unit_price:
            1352,

          gross_unit_price:
            1690,

          tax_amount:
            338,

          tax_rate:
            0.25,

          taxable:
            true,

          price_includes_tax:
            true,

          available_for_sale:
            true,

          currently_not_in_stock:
            false,

          quantity_available:
            null,

          selected_options: [
            {
              name:
                'Størrelse',

              value:
                'XL'
            }
          ],

          collection_ids:
            [],

          collection_titles:
            []
        }
      ]
    }
  }
}

function createCanonicalRequest():
  Request {
  return new Request(
    'https://utekos.no/api/events/begin-checkout',
    {
      method:
        'POST',

      headers: {
        'content-type':
          'application/json',

        origin:
          'https://utekos.no',

        [CHECKOUT_METHOD_HEADER]:
          'klarna_express'
      },

      body:
        JSON.stringify(
          createCanonicalEvent()
        )
    }
  )
}

function getFingerprint():
  string {
  return fingerprintKlarnaAuthorizationToken(
    RAW_AUTHORIZATION_TOKEN
  )
}

test(
  'fingerprints the Klarna authorization token without persisting the raw credential',
  () => {
    const fingerprint =
      getFingerprint()

    assert.match(
      fingerprint,
      /^sha256:[a-f0-9]{64}$/
    )

    assert.equal(
      fingerprint.includes(
        RAW_AUTHORIZATION_TOKEN
      ),
      false
    )
  }
)

test(
  'advances one canonical Klarna attempt through authorization, Klarna order and Shopify order',
  async () => {
    const dependencies =
      createDependencies(
        createSessionWithCanonicalKlarnaAttempt()
      )

    const fingerprint =
      getFingerprint()

    const common = {
      cart:
        createCart(),

      environment:
        'production' as const,

      authorizationTokenFingerprint:
        fingerprint,

      shippingAddressCollected:
        true
    }

    await advanceKlarnaExpressAttempt(
      {
        ...common,

        stage:
          'authorizing'
      },
      {
        materializeSession:
          dependencies
            .materializeSession,

        sessionStore:
          dependencies.store,

        eventStream:
          dependencies.stream,

        now:
          () =>
            new Date(
              '2026-08-17T00:00:06.000Z'
            )
      }
    )

    await advanceKlarnaExpressAttempt(
      {
        ...common,

        stage:
          'authorized'
      },
      {
        materializeSession:
          dependencies
            .materializeSession,

        sessionStore:
          dependencies.store,

        eventStream:
          dependencies.stream,

        now:
          () =>
            new Date(
              '2026-08-17T00:00:07.000Z'
            )
      }
    )

    await advanceKlarnaExpressAttempt(
      {
        ...common,

        stage:
          'order_creating'
      },
      {
        materializeSession:
          dependencies
            .materializeSession,

        sessionStore:
          dependencies.store,

        eventStream:
          dependencies.stream,

        now:
          () =>
            new Date(
              '2026-08-17T00:00:08.000Z'
            )
      }
    )

    await advanceKlarnaExpressAttempt(
      {
        ...common,

        stage:
          'order_created',

        klarnaOrderId:
          KLARNA_ORDER_ID,

        fraudStatus:
          'ACCEPTED',

        privateRedirectUrl:
          PRIVATE_REDIRECT_URL
      },
      {
        materializeSession:
          dependencies
            .materializeSession,

        sessionStore:
          dependencies.store,

        eventStream:
          dependencies.stream,

        now:
          () =>
            new Date(
              '2026-08-17T00:00:09.000Z'
            )
      }
    )

    const final =
      await advanceKlarnaExpressAttempt(
        {
          ...common,

          stage:
            'shopify_order_created',

          klarnaOrderId:
            KLARNA_ORDER_ID,

          shopifyOrderId:
            SHOPIFY_ORDER_ID
        },
        {
          materializeSession:
            dependencies
              .materializeSession,

          sessionStore:
            dependencies.store,

          eventStream:
            dependencies.stream,

          now:
            () =>
              new Date(
                '2026-08-17T00:00:10.000Z'
              )
        }
      )

    assert.equal(
      final.status,
      'advanced'
    )

    if (
      final.status !==
      'advanced'
    ) {
      assert.fail()
    }

    assert.equal(
      final.attempt_id,
      EVENT_ID
    )

    const attempt =
      final.session
        .checkout_attempts
        .find(
          candidate =>
            candidate.attempt_id ===
            EVENT_ID
        )

    assert.ok(attempt)
    assert.ok(attempt.klarna)

    assert.equal(
      attempt.klarna.status,
      'order_created'
    )

    assert.equal(
      attempt.klarna
        .authorization_token_fingerprint,
      fingerprint
    )

    assert.equal(
      attempt.klarna
        .klarna_order_id,
      KLARNA_ORDER_ID
    )

    assert.equal(
      attempt.klarna
        .fraud_status,
      'ACCEPTED'
    )

    assert.equal(
      attempt.klarna
        .private_redirect_url,
      PRIVATE_REDIRECT_URL
    )

    assert.equal(
      attempt.klarna
        .shopify_order_id,
      SHOPIFY_ORDER_ID
    )

    assert.equal(
      attempt.klarna
        .shopify_draft_order_id,
      null
    )

    assert.equal(
      attempt.klarna
        .shipping_address_collected_at,
      '2026-08-17T00:00:06.000Z'
    )

    assert.equal(
      attempt.klarna
        .authorization_completed_at,
      '2026-08-17T00:00:07.000Z'
    )

    assert.equal(
      attempt.klarna
        .order_created_at,
      '2026-08-17T00:00:09.000Z'
    )

    assert.deepEqual(
      dependencies.stream
        .events
        .map(
          event =>
            event.event_type
        ),
      [
        'klarna_express.authorizing',
        'klarna_express.authorized',
        'klarna_express.order_created',
        'shopify_order.created'
      ]
    )
  }
)

test(
  'never puts the raw Klarna authorization token or private redirect URL into journal metadata',
  async () => {
    const dependencies =
      createDependencies(
        createSessionWithCanonicalKlarnaAttempt()
      )

    const fingerprint =
      getFingerprint()

    await advanceKlarnaExpressAttempt(
      {
        cart:
          createCart(),

        environment:
          'production',

        authorizationTokenFingerprint:
          fingerprint,

        shippingAddressCollected:
          true,

        stage:
          'order_created',

        klarnaOrderId:
          KLARNA_ORDER_ID,

        fraudStatus:
          'ACCEPTED',

        privateRedirectUrl:
          PRIVATE_REDIRECT_URL
      },
      {
        materializeSession:
          dependencies
            .materializeSession,

        sessionStore:
          dependencies.store,

        eventStream:
          dependencies.stream,

        now:
          () =>
            new Date(
              '2026-08-17T00:00:09.000Z'
            )
      }
    )

    const serializedJournal =
      JSON.stringify(
        dependencies.stream.events
      )

    assert.equal(
      serializedJournal.includes(
        RAW_AUTHORIZATION_TOKEN
      ),
      false
    )

    assert.equal(
      serializedJournal.includes(
        PRIVATE_REDIRECT_URL
      ),
      false
    )

    assert.equal(
      serializedJournal.includes(
        'very-secret'
      ),
      false
    )

    /**
     * The private URL must still exist in Registry.
     */
    assert.equal(
      dependencies.store
        .current
        .checkout_attempts[0]
        ?.klarna
        ?.private_redirect_url,
      PRIVATE_REDIRECT_URL
    )
  }
)

test(
  'creates an operational Klarna attempt when the provider route beats canonical begin_checkout',
  async () => {
    const dependencies =
      createDependencies()

    const result =
      await advanceKlarnaExpressAttempt(
        {
          cart:
            createCart(),

          environment:
            'production',

          authorizationTokenFingerprint:
            getFingerprint(),

          shippingAddressCollected:
            true,

          stage:
            'authorizing'
        },
        {
          materializeSession:
            dependencies
              .materializeSession,

          sessionStore:
            dependencies.store,

          eventStream:
            dependencies.stream,

          attemptIdFactory:
            () =>
              OPERATIONAL_ATTEMPT_ID,

          now:
            () =>
              new Date(
                '2026-08-17T00:00:05.000Z'
              )
        }
      )

    assert.equal(
      result.status,
      'advanced'
    )

    if (
      result.status !==
      'advanced'
    ) {
      assert.fail()
    }

    assert.equal(
      result.operational_attempt_created,
      true
    )

    assert.equal(
      result.attempt_id,
      OPERATIONAL_ATTEMPT_ID
    )

    assert.equal(
      result.session
        .checkout_attempts
        .length,
      1
    )

    const attempt =
      result.session
        .checkout_attempts[0]

    assert.ok(attempt)

    assert.equal(
      attempt.begin_checkout_event_id,
      null
    )

    assert.equal(
      attempt.method,
      'klarna_express'
    )

    assert.equal(
      attempt.klarna?.status,
      'authorizing'
    )

    assert.match(
      attempt.klarna
        ?.authorization_token_fingerprint ??
        '',
      /^sha256:[a-f0-9]{64}$/
    )
  }
)

test(
  'promotes route-first Klarna attempt when canonical after() arrives later',
  async () => {
    const dependencies =
      createDependencies()

    await advanceKlarnaExpressAttempt(
      {
        cart:
          createCart(),

        environment:
          'production',

        authorizationTokenFingerprint:
          getFingerprint(),

        shippingAddressCollected:
          true,

        stage:
          'authorized'
      },
      {
        materializeSession:
          dependencies
            .materializeSession,

        sessionStore:
          dependencies.store,

        eventStream:
          dependencies.stream,

        attemptIdFactory:
          () =>
            OPERATIONAL_ATTEMPT_ID,

        now:
          () =>
            new Date(
              '2026-08-17T00:00:05.000Z'
            )
      }
    )

    const canonical =
      await registerCanonicalBeginCheckoutAttempt(
        createCanonicalRequest(),
        {
          readCartId:
            async () =>
              FULL_CART_GID,

          fetchCart:
            async ({
              fullCartId
            }) => {
              assert.equal(
                fullCartId,
                FULL_CART_GID
              )

              return createCart()
            },

          materializeSession:
            dependencies
              .materializeSession,

          sessionStore:
            dependencies.store,

          eventStream:
            dependencies.stream,

          now:
            () =>
              new Date(
                '2026-08-17T00:00:06.000Z'
              )
        }
      )

    assert.equal(
      canonical.status,
      'registered'
    )

    if (
      canonical.status !==
      'registered'
    ) {
      assert.fail()
    }

    assert.equal(
      canonical.attempt_id,
      OPERATIONAL_ATTEMPT_ID
    )

    assert.equal(
      canonical.session
        .checkout_attempts
        .length,
      1
    )

    const attempt =
      canonical.session
        .checkout_attempts[0]

    assert.ok(attempt)

    assert.equal(
      attempt.attempt_id,
      OPERATIONAL_ATTEMPT_ID
    )

    assert.equal(
      attempt.begin_checkout_event_id,
      EVENT_ID
    )

    assert.equal(
      attempt.method,
      'klarna_express'
    )

    assert.equal(
      attempt.klarna?.status,
      'authorized'
    )

    assert.equal(
      attempt.klarna
        ?.authorization_token_fingerprint,
      getFingerprint()
    )
  }
)

test(
  'marks Klarna provider state failed with only a safe failure code',
  async () => {
    const dependencies =
      createDependencies(
        createSessionWithCanonicalKlarnaAttempt()
      )

    const result =
      await advanceKlarnaExpressAttempt(
        {
          cart:
            createCart(),

          environment:
            'production',

          authorizationTokenFingerprint:
            getFingerprint(),

          shippingAddressCollected:
            true,

          stage:
            'failed',

          failureCode:
            'klarna_order_creation_failed'
        },
        {
          materializeSession:
            dependencies
              .materializeSession,

          sessionStore:
            dependencies.store,

          eventStream:
            dependencies.stream,

          now:
            () =>
              new Date(
                '2026-08-17T00:00:08.000Z'
              )
        }
      )

    assert.equal(
      result.status,
      'advanced'
    )

    if (
      result.status !==
      'advanced'
    ) {
      assert.fail()
    }

    const attempt =
      result.session
        .checkout_attempts[0]

    assert.ok(attempt?.klarna)

    assert.equal(
      attempt.klarna.status,
      'failed'
    )

    assert.equal(
      attempt.klarna.failure_code,
      'klarna_order_creation_failed'
    )

    assert.equal(
      attempt.klarna.failed_at,
      '2026-08-17T00:00:08.000Z'
    )

    const journal =
      dependencies.stream
        .events
        .at(-1)

    assert.ok(journal)

    assert.equal(
      journal.event_type,
      'klarna_express.failed'
    )

    assert.equal(
      JSON.stringify(
        journal
      ).includes(
        RAW_AUTHORIZATION_TOKEN
      ),
      false
    )
  }
)

test(
  'keeps committed Klarna Registry state when Redis Stream append fails',
  async () => {
    const dependencies =
      createDependencies(
        createSessionWithCanonicalKlarnaAttempt()
      )

    dependencies.stream.fail =
      true

    const result =
      await advanceKlarnaExpressAttempt(
        {
          cart:
            createCart(),

          environment:
            'production',

          authorizationTokenFingerprint:
            getFingerprint(),

          shippingAddressCollected:
            true,

          stage:
            'authorized'
        },
        {
          materializeSession:
            dependencies
              .materializeSession,

          sessionStore:
            dependencies.store,

          eventStream:
            dependencies.stream,

          now:
            () =>
              new Date(
                '2026-08-17T00:00:07.000Z'
              )
        }
      )

    assert.equal(
      result.status,
      'advanced'
    )

    if (
      result.status !==
      'advanced'
    ) {
      assert.fail()
    }

    assert.equal(
      result.journal_status,
      'failed'
    )

    assert.equal(
      dependencies.store
        .current
        .checkout_attempts[0]
        ?.klarna
        ?.status,
      'authorized'
    )

    assert.equal(
      dependencies.store
        .current
        .checkout_attempts[0]
        ?.klarna
        ?.authorization_token_fingerprint,
      getFingerprint()
    )
  }
)

test(
  'does not revive a failed Klarna attempt',
  async () => {
    const dependencies =
      createDependencies(
        createSessionWithCanonicalKlarnaAttempt()
      )

    await advanceKlarnaExpressAttempt(
      {
        cart:
          createCart(),

        environment:
          'production',

        authorizationTokenFingerprint:
          getFingerprint(),

        shippingAddressCollected:
          true,

        stage:
          'failed',

        failureCode:
          'klarna_order_creation_failed'
      },
      {
        materializeSession:
          dependencies
            .materializeSession,

        sessionStore:
          dependencies.store,

        eventStream:
          dependencies.stream,

        now:
          () =>
            new Date(
              '2026-08-17T00:00:08.000Z'
            )
      }
    )

    const revision =
      dependencies.store
        .current.revision

    const result =
      await advanceKlarnaExpressAttempt(
        {
          cart:
            createCart(),

          environment:
            'production',

          authorizationTokenFingerprint:
            getFingerprint(),

          shippingAddressCollected:
            true,

          stage:
            'order_creating'
        },
        {
          materializeSession:
            dependencies
              .materializeSession,

          sessionStore:
            dependencies.store,

          eventStream:
            dependencies.stream,

          now:
            () =>
              new Date(
                '2026-08-17T00:00:09.000Z'
              )
        }
      )

    assert.equal(
      result.status,
      'attempt_terminal'
    )

    assert.equal(
      dependencies.store
        .current.revision,
      revision
    )
  }
)