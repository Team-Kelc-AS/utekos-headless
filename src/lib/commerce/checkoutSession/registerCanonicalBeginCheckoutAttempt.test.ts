import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CHECKOUT_METHOD_HEADER
} from '@/lib/analytics/checkoutMethod'

import {
  checkoutSessionSchema,
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
  captureShopifyCheckoutUrl,
  CheckoutSessionAttemptConflictError,
  registerCanonicalBeginCheckoutAttempt,
  type CanonicalBeginCheckoutAttemptEventStream,
  type CanonicalBeginCheckoutAttemptStore,
  type MaterializeCanonicalBeginCheckoutSession
} from './registerCanonicalBeginCheckoutAttempt'

import type {
  Cart
} from 'types/cart'

const NOW =
  '2026-08-16T16:00:10.000Z'

const EVENT_TIME =
  '2026-08-16T16:00:00.000Z'

const SESSION_ID =
  '11111111-1111-4111-8111-111111111111'

const EVENT_ID =
  '22222222-2222-4222-8222-222222222222'

const FIRST_CONCURRENT_EVENT_ID =
  '33333333-3333-4333-8333-333333333333'

const OPERATIONAL_ATTEMPT_ID =
  '44444444-4444-4444-8444-444444444444'

const CART_TOKEN =
  'hWNFitvj3hogaYwyfNbKRUId'

const CART_GID =
  `gid://shopify/Cart/${CART_TOKEN}`

const FULL_CART_GID =
  `${CART_GID}?key=test-cart-capability-secret`

const PRODUCT_ID =
  'gid://shopify/Product/9240112693496'

const VARIANT_ID =
  'gid://shopify/ProductVariant/46944403915000'

const PRIVATE_CHECKOUT_URL =
  'https://kasse.utekos.no/cart/c/test-checkout-token?key=checkout-capability-secret'

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
            VARIANT_ID,

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

          image:
            null,

          compareAtPrice:
            null,

          selectedOptions: [
            {
              name:
                'Farge',

              value:
                'Havdyp'
            }
          ],

          product: {
            id:
              PRODUCT_ID,

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

function createRegistryCart(): CheckoutSessionShopifyCart {
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
          'gid://shopify/CartLine/line-techdown',

        line_key:
          null,

        product_id:
          PRODUCT_ID,

        variant_id:
          VARIANT_ID,

        sku:
          null,

        title:
          'Utekos TechDown™',

        variant_title:
          'Havdyp / Stor / Unisex',

        vendor:
          'Utekos',

        quantity:
          2,

        unit_price: {
          amount:
            '1790.00',

          currency_code:
            'NOK'
        },

        line_total: {
          amount:
            '3580.00',

          currency_code:
            'NOK'
        },

        selected_options: [
          {
            name:
              'Farge',

            value:
              'Havdyp'
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
      2,

    subtotal: {
      amount:
        '3580.00',

      currency_code:
        'NOK'
    },

    total: {
      amount:
        '3580.00',

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

function createSession(): CheckoutSession {
  return createCheckoutSession({
    environment:
      'production',

    shopifyCart:
      createRegistryCart(),

    now: () =>
      new Date(EVENT_TIME),

    sessionIdFactory:
      () =>
        SESSION_ID
  })
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
      'https://utekos.no/products/utekos-techdown',

    page_title:
      'Utekos TechDown™',

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
        'checkout_rev_test',

      currency:
        'NOK',

      value:
        2864,

      gross_value:
        3580,

      tax_value:
        716,

      items: [
        {
          item_id:
            VARIANT_ID,

          product_id:
            PRODUCT_ID,

          variant_id:
            VARIANT_ID,

          item_name:
            'Utekos TechDown™',

          item_brand:
            'Utekos',

          item_variant:
            'Havdyp / Stor / Unisex',

          product_handle:
            'utekos-techdown',

          product_type:
            'Yttertøy',

          quantity:
            2,

          unit_price:
            1432,

          gross_unit_price:
            1790,

          tax_amount:
            358,

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
                'Farge',

              value:
                'Havdyp'
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

function createRequest(
  checkoutMethod:
    'shopify_checkout' |
    'klarna_express' =
      'shopify_checkout'
): Request {
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
          checkoutMethod
      },

      body:
        JSON.stringify(
          createCanonicalEvent()
        )
    }
  )
}

class FakeAttemptStore
  implements CanonicalBeginCheckoutAttemptStore
{
  current:
    CheckoutSession

  compareAndSetCalls =
    0

  conflictOnceWith:
    CheckoutSession | null =
      null

  constructor(
    initial:
      CheckoutSession
  ) {
    this.current =
      initial
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

class FakeAttemptEventStream
  implements CanonicalBeginCheckoutAttemptEventStream
{
  readonly events:
    CheckoutSessionEvent[] =
      []

  fail =
    false

  async append(
    event: CheckoutSessionEvent
  ) {
    if (this.fail) {
      throw new Error(
        'simulated journal failure'
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

function createDependencies(
  input?: {
    session?:
      CheckoutSession

    eventStream?:
      FakeAttemptEventStream
  }
) {
  const session =
    input?.session ??
    createSession()

  const store =
    new FakeAttemptStore(
      session
    )

  const eventStream =
    input?.eventStream ??
    new FakeAttemptEventStream()

  let materializeCalls =
    0

  const materializeSession:
    MaterializeCanonicalBeginCheckoutSession =
    async ({
      cart,
      environment
    }) => {
      materializeCalls +=
        1

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
    eventStream,
    materializeSession,

    get materializeCalls() {
      return materializeCalls
    }
  }
}

function commonCanonicalDependencies(
  dependencies:
    ReturnType<
      typeof createDependencies
    >,
  now: string = NOW
) {
  return {
    readCartId:
      async () =>
        FULL_CART_GID,

    fetchCart:
      async ({
        fullCartId
      }: {
        requestHeaders: Headers
        fullCartId: string
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
      dependencies
        .eventStream,

    now:
      () =>
        new Date(now)
  }
}

test(
  'registers canonical Shopify begin_checkout as one deterministic CheckoutAttempt',
  async () => {
    const dependencies =
      createDependencies()

    const result =
      await registerCanonicalBeginCheckoutAttempt(
        createRequest(
          'shopify_checkout'
        ),
        commonCanonicalDependencies(
          dependencies
        )
      )

    assert.equal(
      result.status,
      'registered'
    )

    if (
      result.status !==
      'registered'
    ) {
      assert.fail(
        'Expected registered result'
      )
    }

    assert.equal(
      result.attempt_id,
      EVENT_ID
    )

    assert.equal(
      result.session.revision,
      1
    )

    assert.equal(
      result.session
        .active_attempt_id,
      EVENT_ID
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
      attempt.attempt_id,
      EVENT_ID
    )

    assert.equal(
      attempt.begin_checkout_event_id,
      EVENT_ID
    )

    assert.equal(
      attempt.method,
      'shopify_checkout'
    )

    assert.equal(
      attempt.shopify?.status,
      'unresolved'
    )

    assert.equal(
      attempt.klarna,
      null
    )
  }
)

test(
  'registers Klarna Express without Shopify checkout provider state',
  async () => {
    const dependencies =
      createDependencies()

    const result =
      await registerCanonicalBeginCheckoutAttempt(
        createRequest(
          'klarna_express'
        ),
        commonCanonicalDependencies(
          dependencies
        )
      )

    assert.equal(
      result.status,
      'registered'
    )

    if (
      result.status !==
      'registered'
    ) {
      assert.fail()
    }

    const attempt =
      result.session
        .checkout_attempts[0]

    assert.ok(attempt)

    assert.equal(
      attempt.method,
      'klarna_express'
    )

    assert.equal(
      attempt.shopify,
      null
    )

    assert.equal(
      attempt.klarna?.status,
      'started'
    )
  }
)

test(
  'is idempotent when the same canonical begin_checkout arrives twice',
  async () => {
    const dependencies =
      createDependencies()

    const common =
      commonCanonicalDependencies(
        dependencies
      )

    const first =
      await registerCanonicalBeginCheckoutAttempt(
        createRequest(),
        common
      )

    assert.equal(
      first.status,
      'registered'
    )

    const revision =
      dependencies.store
        .current.revision

    const second =
      await registerCanonicalBeginCheckoutAttempt(
        createRequest(),
        common
      )

    assert.equal(
      second.status,
      'duplicate'
    )

    assert.equal(
      dependencies.store
        .current.revision,
      revision
    )

    assert.equal(
      dependencies.store
        .current
        .checkout_attempts
        .length,
      1
    )
  }
)

test(
  'rejects changing checkout_method for an existing canonical event',
  async () => {
    const dependencies =
      createDependencies()

    const common =
      commonCanonicalDependencies(
        dependencies
      )

    await registerCanonicalBeginCheckoutAttempt(
      createRequest(
        'shopify_checkout'
      ),
      common
    )

    await assert.rejects(
      () =>
        registerCanonicalBeginCheckoutAttempt(
          createRequest(
            'klarna_express'
          ),
          common
        ),
      CheckoutSessionAttemptConflictError
    )
  }
)

test(
  'rejects authenticated Cart cookie belonging to another cart',
  async () => {
    const dependencies =
      createDependencies()

    let fetchCalls =
      0

    const result =
      await registerCanonicalBeginCheckoutAttempt(
        createRequest(),
        {
          readCartId:
            async () =>
              'gid://shopify/Cart/different-cart?key=secret',

          fetchCart:
            async () => {
              fetchCalls +=
                1

              return createCart()
            },

          materializeSession:
            dependencies
              .materializeSession,

          sessionStore:
            dependencies.store,

          eventStream:
            dependencies
              .eventStream
        }
      )

    assert.equal(
      result.status,
      'cart_identity_mismatch'
    )

    assert.equal(
      fetchCalls,
      0
    )
  }
)

test(
  'preserves a concurrently created CheckoutAttempt during CAS retry',
  async () => {
    const initial =
      createSession()

    const concurrent =
      checkoutSessionSchema.parse({
        ...initial,

        revision:
          1,

        checkout_attempts: [
          {
            attempt_id:
              FIRST_CONCURRENT_EVENT_ID,

            begin_checkout_event_id:
              FIRST_CONCURRENT_EVENT_ID,

            method:
              'klarna_express',

            started_at:
              '2026-08-16T15:59:00.000Z',

            last_updated_at:
              '2026-08-16T15:59:01.000Z',

            milestones: {
              began_at:
                '2026-08-16T15:59:00.000Z',

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
        ],

        active_attempt_id:
          FIRST_CONCURRENT_EVENT_ID,

        last_seen_at:
          '2026-08-16T16:00:05.000Z',

        expires_at:
          '2026-08-30T16:00:05.000Z'
      })

    const dependencies =
      createDependencies({
        session:
          initial
      })

    dependencies.store
      .conflictOnceWith =
      concurrent

    const result =
      await registerCanonicalBeginCheckoutAttempt(
        createRequest(),
        commonCanonicalDependencies(
          dependencies
        )
      )

    assert.equal(
      result.status,
      'registered'
    )

    if (
      result.status !==
      'registered'
    ) {
      assert.fail()
    }

    assert.equal(
      dependencies.store
        .compareAndSetCalls,
      2
    )

    assert.equal(
      result.session
        .checkout_attempts
        .length,
      2
    )

    assert.equal(
      result.session
        .checkout_attempts[1]
        ?.attempt_id,
      EVENT_ID
    )
  }
)

test(
  'captures the complete private Shopify checkout URL on an existing canonical attempt',
  async () => {
    const dependencies =
      createDependencies()

    await registerCanonicalBeginCheckoutAttempt(
      createRequest(),
      commonCanonicalDependencies(
        dependencies
      )
    )

    const result =
      await captureShopifyCheckoutUrl(
        {
          cart:
            createCart(),

          checkoutUrl:
            new URL(
              PRIVATE_CHECKOUT_URL
            ),

          environment:
            'production'
        },
        {
          materializeSession:
            dependencies
              .materializeSession,

          sessionStore:
            dependencies.store,

          eventStream:
            dependencies
              .eventStream,

          now:
            () =>
              new Date(
                '2026-08-16T16:00:11.000Z'
              )
        }
      )

    assert.equal(
      result.status,
      'captured'
    )

    if (
      result.status !==
      'captured'
    ) {
      assert.fail()
    }

    assert.equal(
      result.attempt_id,
      EVENT_ID
    )

    assert.equal(
      result.operational_attempt_created,
      false
    )

    const attempt =
      result.session
        .checkout_attempts
        .find(
          candidate =>
            candidate.attempt_id ===
            EVENT_ID
        )

    assert.ok(attempt)

    assert.equal(
      attempt.shopify
        ?.private_checkout_url,
      PRIVATE_CHECKOUT_URL
    )

    assert.match(
      attempt.shopify
        ?.checkout_url_fingerprint ??
        '',
      /^sha256:[a-f0-9]{64}$/
    )

    assert.equal(
      attempt.shopify?.status,
      'checkout_url_resolved'
    )

    assert.equal(
      result.checkout_host,
      'kasse.utekos.no'
    )
  }
)

test(
  'creates an operational Shopify attempt when checkout route wins the race',
  async () => {
    const dependencies =
      createDependencies()

    const result =
      await captureShopifyCheckoutUrl(
        {
          cart:
            createCart(),

          checkoutUrl:
            new URL(
              PRIVATE_CHECKOUT_URL
            ),

          environment:
            'production'
        },
        {
          materializeSession:
            dependencies
              .materializeSession,

          sessionStore:
            dependencies.store,

          eventStream:
            dependencies
              .eventStream,

          now:
            () =>
              new Date(
                '2026-08-16T16:00:05.000Z'
              ),

          attemptIdFactory:
            () =>
              OPERATIONAL_ATTEMPT_ID
        }
      )

    assert.equal(
      result.status,
      'captured'
    )

    if (
      result.status !==
      'captured'
    ) {
      assert.fail()
    }

    assert.equal(
      result.attempt_id,
      OPERATIONAL_ATTEMPT_ID
    )

    assert.equal(
      result.operational_attempt_created,
      true
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
      'shopify_checkout'
    )

    assert.equal(
      attempt.shopify
        ?.private_checkout_url,
      PRIVATE_CHECKOUT_URL
    )

    assert.equal(
      result.session
        .active_attempt_id,
      OPERATIONAL_ATTEMPT_ID
    )
  }
)

test(
  'promotes route-first operational attempt instead of creating a second canonical attempt',
  async () => {
    const dependencies =
      createDependencies()

    const captured =
      await captureShopifyCheckoutUrl(
        {
          cart:
            createCart(),

          checkoutUrl:
            new URL(
              PRIVATE_CHECKOUT_URL
            ),

          environment:
            'production'
        },
        {
          materializeSession:
            dependencies
              .materializeSession,

          sessionStore:
            dependencies.store,

          eventStream:
            dependencies
              .eventStream,

          now:
            () =>
              new Date(
                '2026-08-16T16:00:05.000Z'
              ),

          attemptIdFactory:
            () =>
              OPERATIONAL_ATTEMPT_ID
        }
      )

    assert.equal(
      captured.status,
      'captured'
    )

    const canonical =
      await registerCanonicalBeginCheckoutAttempt(
        createRequest(),
        commonCanonicalDependencies(
          dependencies,
          NOW
        )
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

    /**
     * Critical race invariant:
     *
     * still ONE attempt.
     */
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

    /**
     * Operational attempt_id stays stable because its
     * Redis secondary index already exists.
     */
    assert.equal(
      attempt.attempt_id,
      OPERATIONAL_ATTEMPT_ID
    )

    assert.equal(
      canonical.attempt_id,
      OPERATIONAL_ATTEMPT_ID
    )

    /**
     * Canonical ledger join is attached here.
     */
    assert.equal(
      attempt.begin_checkout_event_id,
      EVENT_ID
    )

    assert.equal(
      attempt.started_at,
      EVENT_TIME
    )

    assert.equal(
      attempt.milestones.began_at,
      EVENT_TIME
    )

    assert.equal(
      attempt.shopify
        ?.private_checkout_url,
      PRIVATE_CHECKOUT_URL
    )
  }
)

test(
  'is idempotent when the checkout route resolves the same private URL twice',
  async () => {
    const dependencies =
      createDependencies()

    const commonCapture = {
      materializeSession:
        dependencies
          .materializeSession,

      sessionStore:
        dependencies.store,

      eventStream:
        dependencies
          .eventStream,

      now:
        () =>
          new Date(
            '2026-08-16T16:00:05.000Z'
          ),

      attemptIdFactory:
        () =>
          OPERATIONAL_ATTEMPT_ID
    }

    const first =
      await captureShopifyCheckoutUrl(
        {
          cart:
            createCart(),

          checkoutUrl:
            new URL(
              PRIVATE_CHECKOUT_URL
            ),

          environment:
            'production'
        },
        commonCapture
      )

    assert.equal(
      first.status,
      'captured'
    )

    const revision =
      dependencies.store
        .current.revision

    const streamCount =
      dependencies
        .eventStream
        .events.length

    const second =
      await captureShopifyCheckoutUrl(
        {
          cart:
            createCart(),

          checkoutUrl:
            new URL(
              PRIVATE_CHECKOUT_URL
            ),

          environment:
            'production'
        },
        commonCapture
      )

    assert.equal(
      second.status,
      'duplicate'
    )

    assert.equal(
      dependencies.store
        .current.revision,
      revision
    )

    assert.equal(
      dependencies
        .eventStream
        .events.length,
      streamCount
    )
  }
)

test(
  'never puts the raw private checkout URL into Redis Stream metadata',
  async () => {
    const dependencies =
      createDependencies()

    await captureShopifyCheckoutUrl(
      {
        cart:
          createCart(),

        checkoutUrl:
          new URL(
            PRIVATE_CHECKOUT_URL
          ),

        environment:
          'production'
      },
      {
        materializeSession:
          dependencies
            .materializeSession,

        sessionStore:
          dependencies.store,

        eventStream:
          dependencies
            .eventStream,

        now:
          () =>
            new Date(
              '2026-08-16T16:00:05.000Z'
            ),

        attemptIdFactory:
          () =>
            OPERATIONAL_ATTEMPT_ID
      }
    )

    const journalEvent =
      dependencies
        .eventStream
        .events
        .find(
          event =>
            event.event_type ===
            'shopify_checkout.url_resolved'
        )

    assert.ok(journalEvent)

    const serializedMetadata =
      JSON.stringify(
        journalEvent.metadata
      )

    assert.equal(
      serializedMetadata.includes(
        'checkout-capability-secret'
      ),
      false
    )

    assert.equal(
      serializedMetadata.includes(
        PRIVATE_CHECKOUT_URL
      ),
      false
    )

    assert.match(
      String(
        journalEvent.metadata
          .checkout_url_fingerprint
      ),
      /^sha256:[a-f0-9]{64}$/
    )
  }
)

test(
  'creates a new attempt when Shopify resolves a different checkout URL',
  async () => {
    const dependencies =
      createDependencies()

    await captureShopifyCheckoutUrl(
      {
        cart:
          createCart(),

        checkoutUrl:
          new URL(
            PRIVATE_CHECKOUT_URL
          ),

        environment:
          'production'
      },
      {
        materializeSession:
          dependencies
            .materializeSession,

        sessionStore:
          dependencies.store,

        eventStream:
          dependencies
            .eventStream,

        now:
          () =>
            new Date(
              '2026-08-16T16:00:05.000Z'
            ),

        attemptIdFactory:
          () =>
            OPERATIONAL_ATTEMPT_ID
      }
    )

    const SECOND_ATTEMPT_ID =
      '55555555-5555-4555-8555-555555555555'

    const second =
      await captureShopifyCheckoutUrl(
        {
          cart:
            createCart(),

          checkoutUrl:
            new URL(
              'https://kasse.utekos.no/cart/c/another-checkout?key=another-secret'
            ),

          environment:
            'production'
        },
        {
          materializeSession:
            dependencies
              .materializeSession,

          sessionStore:
            dependencies.store,

          eventStream:
            dependencies
              .eventStream,

          now:
            () =>
              new Date(
                '2026-08-16T16:00:15.000Z'
              ),

          attemptIdFactory:
            () =>
              SECOND_ATTEMPT_ID
        }
      )

    assert.equal(
      second.status,
      'captured'
    )

    if (
      second.status !==
      'captured'
    ) {
      assert.fail()
    }

    assert.equal(
      second.operational_attempt_created,
      true
    )

    assert.equal(
      second.session
        .checkout_attempts
        .length,
      2
    )

    assert.equal(
      second.session
        .active_attempt_id,
      SECOND_ATTEMPT_ID
    )
  }
)

test(
  'keeps committed checkout URL state if journal append fails',
  async () => {
    const eventStream =
      new FakeAttemptEventStream()

    eventStream.fail =
      true

    const dependencies =
      createDependencies({
        eventStream
      })

    const result =
      await captureShopifyCheckoutUrl(
        {
          cart:
            createCart(),

          checkoutUrl:
            new URL(
              PRIVATE_CHECKOUT_URL
            ),

          environment:
            'production'
        },
        {
          materializeSession:
            dependencies
              .materializeSession,

          sessionStore:
            dependencies.store,

          eventStream,

          now:
            () =>
              new Date(
                '2026-08-16T16:00:05.000Z'
              ),

          attemptIdFactory:
            () =>
              OPERATIONAL_ATTEMPT_ID
        }
      )

    assert.equal(
      result.status,
      'captured'
    )

    if (
      result.status !==
      'captured'
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
        ?.shopify
        ?.private_checkout_url,
      PRIVATE_CHECKOUT_URL
    )
  }
)

test(
  'does not capture checkout URL into an inactive Registry session',
  async () => {
    const initial =
      createSession()

    const closed =
      checkoutSessionSchema.parse({
        ...initial,

        state:
          'closed'
      })

    const dependencies =
      createDependencies({
        session:
          closed
      })

    const result =
      await captureShopifyCheckoutUrl(
        {
          cart:
            createCart(),

          checkoutUrl:
            new URL(
              PRIVATE_CHECKOUT_URL
            ),

          environment:
            'production'
        },
        {
          materializeSession:
            dependencies
              .materializeSession,

          sessionStore:
            dependencies.store,

          eventStream:
            dependencies
              .eventStream,

          now:
            () =>
              new Date(NOW)
        }
      )

    assert.equal(
      result.status,
      'session_inactive'
    )

    assert.equal(
      dependencies.store
        .compareAndSetCalls,
      0
    )
  }
)